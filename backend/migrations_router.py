"""
One-off migration endpoints. All are idempotent and admin-only.

Moved out of server.py on 2026-02 to keep the entrypoint lean.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
import auth_helpers

router = APIRouter(prefix="/api", tags=["migrations"])
db = None


def set_db(database):
    global db
    db = database


@router.post("/migrate/slugs")
async def migrate_slugs(admin=Depends(auth_helpers.get_current_admin)):
    """One-time migration: generate slugs for all fabrics that don't have one."""
    from slug_utils import generate_slug
    fabrics = await db.fabrics.find(
        {'$or': [{'slug': {'$exists': False}}, {'slug': ''}, {'slug': None}]},
        {'_id': 0, 'id': 1, 'name': 1}
    ).to_list(10000)
    count = 0
    for f in fabrics:
        slug = generate_slug(f.get('name', 'fabric'), f['id'])
        await db.fabrics.update_one({'id': f['id']}, {'$set': {'slug': slug}})
        count += 1
    return {'migrated': count}


# ==================== MIGRATION: Dissolve "Blended Fabrics" ====================
# Reassigns every fabric in the Blended category to the category whose material
# has the highest percentage in its composition. Falls back to parsing the
# fabric name when composition is empty. Deletes Blended when empty.

_BLENDED_MAT_MAP = [
    ("cotton",    "Cotton Fabrics"),
    ("coitton",   "Cotton Fabrics"),       # seen typo in prod/preview
    ("org cotton","Cotton Fabrics"),
    ("polyester", "Polyester Fabrics"),
    ("poly",      "Polyester Fabrics"),
    ("pc blend",  "Polyester Fabrics"),    # P/C → Polyester is dominant
    ("p/c",       "Polyester Fabrics"),
    ("viscose",   "Viscose"),
    ("rayon",     "Viscose"),
    ("linen",     "Linen"),
    ("hemp",      "Sustainable Fabrics"),
    ("recycled",  "Sustainable Fabrics"),
    ("organic",   "Sustainable Fabrics"),
]


def _route_material(material: str):
    m = (material or "").strip().lower()
    if not m:
        return None
    for key, target in _BLENDED_MAT_MAP:
        if key in m:
            return target
    return None


def _dominant_target(comp, name: str):
    """Return (target_category_name, reason_str)."""
    if isinstance(comp, list) and comp:
        ranked = sorted(comp, key=lambda x: float(x.get("percentage") or 0), reverse=True)
        for item in ranked:
            mat = item.get("material") or ""
            tgt = _route_material(mat)
            if tgt:
                return tgt, f"{mat.strip()} {item.get('percentage')}%"
        return None, "no known material in composition"
    # Name fallback
    low = (name or "").lower()
    best, best_pos = None, 10**9
    for key, target in _BLENDED_MAT_MAP:
        pos = low.find(key)
        if pos != -1 and pos < best_pos:
            best, best_pos = target, pos
    if best:
        return best, "(inferred from name)"
    return None, "no composition + no hint in name"


@router.post("/migrate/blended")
async def migrate_blended(
    apply: bool = Query(False),
    mode: str = Query("smart", description="'smart' (auto-route by material) or 'all_to_linen' (bulk move)"),
    admin=Depends(auth_helpers.get_current_admin),
):
    """Dissolve the 'Blended Fabrics' category.
    - Dry run: POST /api/migrate/blended (apply=false) → returns the plan.
    - Apply:   POST /api/migrate/blended?apply=true   → runs and deletes Blended.
    - mode=all_to_linen: bulk-move every blended fabric to Linen.
    Idempotent — safe to re-run.
    """
    cats = await db.categories.find({}, {"_id": 0}).to_list(length=500)
    by_name = {c["name"]: c for c in cats}
    blended = by_name.get("Blended Fabrics")
    if not blended:
        return {
            "apply": apply, "mode": mode, "status": "noop",
            "message": "No 'Blended Fabrics' category present — nothing to migrate.",
            "plan": [], "summary": {},
        }

    linen_created = False
    if "Linen" not in by_name:
        linen_doc = {
            "id": "cat-linen",
            "name": "Linen",
            "slug": "linen",
            "description": "Natural linen fabrics — breathable, durable, elegant.",
            "image_url": "",
            "fabric_count": 0,
        }
        if apply:
            await db.categories.insert_one(linen_doc.copy())
            linen_created = True
        by_name["Linen"] = linen_doc

    blended_id = blended["id"]
    fabrics = await db.fabrics.find({"category_id": blended_id}, {"_id": 0}).to_list(length=5000)

    plan, summary, stays = [], {}, 0
    for f in fabrics:
        if mode == "all_to_linen":
            target_name = "Linen"
            reason = "bulk-move (all_to_linen mode)"
        else:
            target_name, reason = _dominant_target(f.get("composition"), f.get("name", ""))
        target = by_name.get(target_name) if target_name and target_name != "Blended Fabrics" else None
        plan.append({
            "id": f["id"], "name": f.get("name", ""),
            "target": target_name if target else "-- stays --",
            "reason": reason, "target_exists": bool(target),
        })
        if target:
            summary[target_name] = summary.get(target_name, 0) + 1
        else:
            stays += 1
    summary["__stays_in_blended"] = stays

    if not apply:
        return {
            "apply": False, "status": "dry_run",
            "blended_fabrics_total": len(fabrics),
            "summary": summary,
            "linen_will_be_created": "Linen" not in [c["name"] for c in cats],
            "plan": plan,
        }

    updated = 0
    for f in fabrics:
        if mode == "all_to_linen":
            target_name = "Linen"
        else:
            target_name, _ = _dominant_target(f.get("composition"), f.get("name", ""))
        if not target_name or target_name == "Blended Fabrics":
            continue
        target = by_name.get(target_name)
        if not target:
            continue
        res = await db.fabrics.update_one(
            {"id": f["id"]},
            {"$set": {"category_id": target["id"], "category_name": target_name}},
        )
        if res.modified_count:
            updated += 1

    counts_after = {}
    for cat_name in list(summary.keys()) + ["Blended Fabrics"]:
        if cat_name.startswith("__"):
            continue
        cat = by_name.get(cat_name)
        if not cat:
            continue
        c = await db.fabrics.count_documents({"category_id": cat["id"]})
        await db.categories.update_one({"id": cat["id"]}, {"$set": {"fabric_count": c}})
        counts_after[cat_name] = c

    deleted_blended = False
    remaining = await db.fabrics.count_documents({"category_id": blended_id})
    if remaining == 0:
        r = await db.categories.delete_one({"id": blended_id})
        deleted_blended = bool(r.deleted_count)

    return {
        "apply": True, "status": "applied",
        "blended_fabrics_total": len(fabrics),
        "reassigned": updated, "linen_created": linen_created,
        "summary": summary, "counts_after": counts_after,
        "blended_deleted": deleted_blended, "blended_remaining": remaining,
    }


@router.post("/migrate/knits")
async def migrate_knits(
    apply: bool = Query(False),
    admin=Depends(auth_helpers.get_current_admin),
):
    """Dissolve the 'Knits' category → moves fabrics to 'Polyester Fabrics', then deletes Knits."""
    cats = await db.categories.find({}, {"_id": 0}).to_list(length=500)
    by_name = {c["name"]: c for c in cats}
    knits = by_name.get("Knits")
    if not knits:
        return {"apply": apply, "status": "noop", "message": "No 'Knits' category present.",
                "knits_fabrics_total": 0, "reassigned": 0, "knits_deleted": False}

    polyester = by_name.get("Polyester Fabrics")
    if not polyester:
        raise HTTPException(status_code=400, detail="Target category 'Polyester Fabrics' not found.")

    knits_id = knits["id"]
    polyester_id = polyester["id"]
    fabrics = await db.fabrics.find({"category_id": knits_id}, {"_id": 0}).to_list(length=5000)

    if not apply:
        return {"apply": False, "status": "dry_run",
                "knits_fabrics_total": len(fabrics),
                "target": "Polyester Fabrics",
                "plan": [{"id": f["id"], "name": f.get("name", ""), "target": "Polyester Fabrics"} for f in fabrics]}

    res = await db.fabrics.update_many(
        {"category_id": knits_id},
        {"$set": {"category_id": polyester_id, "category_name": "Polyester Fabrics"}},
    )
    updated = res.modified_count

    poly_count = await db.fabrics.count_documents({"category_id": polyester_id})
    await db.categories.update_one({"id": polyester_id}, {"$set": {"fabric_count": poly_count}})
    knits_remaining = await db.fabrics.count_documents({"category_id": knits_id})

    deleted_knits = False
    if knits_remaining == 0:
        r = await db.categories.delete_one({"id": knits_id})
        deleted_knits = bool(r.deleted_count)

    return {"apply": True, "status": "applied",
            "knits_fabrics_total": len(fabrics), "reassigned": updated,
            "polyester_count_after": poly_count,
            "knits_remaining": knits_remaining, "knits_deleted": deleted_knits}


@router.post("/migrate/greige")
async def migrate_greige(
    apply: bool = Query(False),
    admin=Depends(auth_helpers.get_current_admin),
):
    """Delete the 'Greige' category (now used as a pattern, not a category).

    Will refuse to delete if any fabrics still reference it — returns the list
    so the admin can re-classify them before re-running with ?apply=true.
    """
    greige = await db.categories.find_one({"name": "Greige"}, {"_id": 0})
    if not greige:
        return {"apply": apply, "status": "noop",
                "message": "No 'Greige' category present.", "greige_deleted": False}

    greige_id = greige["id"]
    fabrics = await db.fabrics.find(
        {"category_id": greige_id}, {"_id": 0, "id": 1, "name": 1}
    ).to_list(length=5000)

    if not apply:
        return {"apply": False, "status": "dry_run",
                "greige_id": greige_id,
                "fabrics_in_greige": len(fabrics),
                "fabrics": fabrics[:20],
                "deletable": len(fabrics) == 0,
                "message": ("Safe to delete — no fabrics in Greige."
                            if len(fabrics) == 0
                            else f"{len(fabrics)} fabric(s) still in Greige. Re-classify them first.")}

    if len(fabrics) > 0:
        raise HTTPException(status_code=400,
            detail=f"Cannot delete Greige — {len(fabrics)} fabric(s) still reference it.")

    r = await db.categories.delete_one({"id": greige_id})
    return {"apply": True, "status": "applied", "greige_deleted": bool(r.deleted_count)}
