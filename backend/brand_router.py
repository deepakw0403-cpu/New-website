"""
Brand Router — B2B Brand portal (enterprise customers aged 10-100Cr).
Slice 1 (this file at launch): Brands, Brand Users, Filtered Catalog, Auth.
Slice 2 (to come): Credit lines (multi-lender + OTP), payments, FIFO order-debit, ledger.
Slice 3 (to come): Sample credits + Razorpay self-serve top-up.
"""
import os
import secrets
import string
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
import resend
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from pymongo import ReturnDocument
import auth_helpers  # for get_current_admin
import uuid

router = APIRouter(tags=["brand"])
db = None
security = HTTPBearer(auto_error=False)

JWT_SECRET = os.environ.get("JWT_SECRET", "default-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
SITE_URL = os.environ.get("SITE_URL", "https://locofast.com")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def set_db(database):
    global db
    db = database


# ───── Pydantic models ─────
class BrandCreate(BaseModel):
    name: str
    gst: Optional[str] = ""
    address: Optional[str] = ""
    phone: Optional[str] = ""
    logo_url: Optional[str] = ""
    allowed_category_ids: List[str] = []
    # Initial admin user for the brand
    admin_user_email: EmailStr
    admin_user_name: str
    admin_user_designation: Optional[str] = "Management"


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    gst: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    logo_url: Optional[str] = None
    allowed_category_ids: Optional[List[str]] = None
    status: Optional[str] = None


# Job titles surfaced in the invite-user dropdown. Permission level is still
# controlled by `role` (brand_admin | brand_user) — designation is display-only.
BRAND_DESIGNATIONS = [
    "Management",
    "Procurement Manager",
    "Fabric Merchandiser",
    "Merchandiser",
]


class BrandUserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str = "brand_user"  # brand_admin | brand_user
    designation: Optional[str] = "Merchandiser"


class BrandLoginRequest(BaseModel):
    email: EmailStr
    password: str


class BrandPasswordReset(BaseModel):
    current_password: str
    new_password: str


# ───── Helpers ─────
def _gen_password(length: int = 12) -> str:
    """Cryptographically random alphanumeric password (no ambiguous chars)."""
    alphabet = string.ascii_letters.replace("l", "").replace("O", "").replace("I", "") + "23456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _hash(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def _verify(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def _brand_user_token(user: dict) -> str:
    payload = {
        "brand_user_id": user["id"],
        "brand_id": user["brand_id"],
        "email": user["email"],
        "role": user.get("role", "brand_user"),
        "type": "brand",
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_brand_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "brand":
            raise HTTPException(status_code=401, detail="Invalid brand token")
        user = await db.brand_users.find_one({"id": payload.get("brand_user_id"), "status": "active"}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Brand user not found or inactive")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _build_welcome_email(brand_name: str, user_name: str, email: str, password: str, login_url: str) -> str:
    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background:#fff;">
      <div style="background: #059669; color: #fff; padding: 24px 28px; border-radius: 10px 10px 0 0;">
        <h2 style="margin:0; font-size: 20px;">Welcome to Locofast, {user_name}</h2>
        <p style="margin: 6px 0 0 0; opacity: 0.9;">Your <strong>{brand_name}</strong> account is ready.</p>
      </div>
      <div style="padding: 28px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size:15px; color:#334155; margin: 0 0 18px 0;">
          You've been invited to source fabric on Locofast's brand portal. Use the credentials below to sign in.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px 0; background: #f8fafc; border-radius: 6px;">
          <tr><td style="padding: 12px 14px; color: #64748b; width: 130px; font-size: 13px;">Login URL</td><td style="padding: 12px 14px; color: #0f172a; font-size: 13px;"><a href="{login_url}" style="color: #2563eb;">{login_url}</a></td></tr>
          <tr><td style="padding: 12px 14px; color: #64748b; font-size: 13px;">Email</td><td style="padding: 12px 14px; color: #0f172a; font-size: 14px;"><strong>{email}</strong></td></tr>
          <tr><td style="padding: 12px 14px; color: #64748b; font-size: 13px;">Temporary Password</td><td style="padding: 12px 14px; color: #0f172a; font-size: 14px; font-family: monospace; background: #fff; border-left: 3px solid #059669;"><strong>{password}</strong></td></tr>
        </table>
        <p style="font-size: 13px; color: #64748b; margin: 0;">
          For security, you'll be asked to reset your password on first login. This email contains your only copy of the temporary password — save it now.
        </p>
        <p style="font-size: 12px; color: #94a3b8; margin: 22px 0 0 0;">
          Didn't expect this email? Reply and let us know — we'll disable the account immediately.
        </p>
      </div>
    </div>
    """


async def _send_welcome_email(brand_name: str, user_name: str, email: str, password: str):
    if not RESEND_API_KEY:
        logging.warning(f"RESEND_API_KEY not set — welcome email to {email} skipped. Temp password: {password}")
        return
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": f"Your Locofast Brand Portal Account — {brand_name}",
            "html": _build_welcome_email(brand_name, user_name, email, password, f"{SITE_URL}/brand/login"),
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Welcome email sent to {email}")
    except Exception as e:
        logging.error(f"Failed to send welcome email to {email}: {e}")


# ───── ADMIN ENDPOINTS — Brand CRUD ─────
@router.post("/admin/brands")
async def create_brand(data: BrandCreate, admin=Depends(auth_helpers.get_current_admin)):
    # Ensure initial admin user's email is not already used
    existing = await db.brand_users.find_one({"email": data.admin_user_email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail=f"Email {data.admin_user_email} is already registered")

    brand_id = str(uuid.uuid4())
    brand_doc = {
        "id": brand_id,
        "name": data.name,
        "gst": data.gst or "",
        "address": data.address or "",
        "phone": data.phone or "",
        "logo_url": data.logo_url or "",
        "allowed_category_ids": data.allowed_category_ids or [],
        "status": "active",
        "sample_credits_total": 0,
        "sample_credits_used": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin.get("id"),
    }
    await db.brands.insert_one(brand_doc)

    # Create the first brand_admin user
    temp_pw = _gen_password()
    user_doc = {
        "id": str(uuid.uuid4()),
        "brand_id": brand_id,
        "email": data.admin_user_email.lower(),
        "name": data.admin_user_name,
        "designation": data.admin_user_designation or "Management",
        "password_hash": _hash(temp_pw),
        "role": "brand_admin",
        "status": "active",
        "must_reset_password": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin.get("id"),
        "last_login": None,
    }
    await db.brand_users.insert_one(user_doc)

    # Send welcome email with temporary password (async, best-effort)
    asyncio.create_task(_send_welcome_email(data.name, data.admin_user_name, data.admin_user_email, temp_pw))

    return {
        "id": brand_id,
        "message": "Brand created. Welcome email sent to brand admin.",
        "admin_user_id": user_doc["id"],
        # Return temp password in response ONLY so admin can copy if email fails
        "temporary_password_for_reference": temp_pw,
    }


@router.get("/admin/brands")
async def list_brands(admin=Depends(auth_helpers.get_current_admin)):
    brands = await db.brands.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=500)
    # Attach user count per brand
    for b in brands:
        b["user_count"] = await db.brand_users.count_documents({"brand_id": b["id"]})
    return brands


@router.get("/admin/brands/{brand_id}")
async def get_brand(brand_id: str, admin=Depends(auth_helpers.get_current_admin)):
    brand = await db.brands.find_one({"id": brand_id}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    users = await db.brand_users.find({"brand_id": brand_id}, {"_id": 0, "password_hash": 0}).to_list(length=200)
    return {"brand": brand, "users": users}


@router.put("/admin/brands/{brand_id}")
async def update_brand(brand_id: str, data: BrandUpdate, admin=Depends(auth_helpers.get_current_admin)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.brands.update_one({"id": brand_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {"message": "Brand updated"}


@router.delete("/admin/brands/{brand_id}")
async def delete_brand(brand_id: str, admin=Depends(auth_helpers.get_current_admin)):
    # Soft-delete the brand + suspend all its users. Preserves audit/ledger data.
    await db.brands.update_one({"id": brand_id}, {"$set": {"status": "deleted"}})
    await db.brand_users.update_many({"brand_id": brand_id}, {"$set": {"status": "suspended"}})
    return {"message": "Brand soft-deleted and users suspended"}


# ───── ADMIN ENDPOINTS — Brand Users ─────
@router.post("/admin/brands/{brand_id}/users")
async def admin_add_brand_user(brand_id: str, data: BrandUserCreate, admin=Depends(auth_helpers.get_current_admin)):
    return await _add_brand_user_internal(brand_id, data, actor_id=admin.get("id"))


@router.delete("/admin/brands/{brand_id}/users/{user_id}")
async def admin_remove_brand_user(brand_id: str, user_id: str, admin=Depends(auth_helpers.get_current_admin)):
    res = await db.brand_users.update_one({"id": user_id, "brand_id": brand_id}, {"$set": {"status": "suspended"}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User suspended"}


async def _add_brand_user_internal(brand_id: str, data: BrandUserCreate, actor_id: str):
    brand = await db.brands.find_one({"id": brand_id, "status": "active"}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found or inactive")

    existing = await db.brand_users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail=f"Email {data.email} is already registered")

    if data.role not in ("brand_admin", "brand_user"):
        raise HTTPException(status_code=400, detail="Invalid role")
    if data.designation and data.designation not in BRAND_DESIGNATIONS:
        raise HTTPException(status_code=400, detail=f"Invalid designation. Must be one of {BRAND_DESIGNATIONS}")

    temp_pw = _gen_password()
    user_doc = {
        "id": str(uuid.uuid4()),
        "brand_id": brand_id,
        "email": data.email.lower(),
        "name": data.name,
        "designation": data.designation or "Merchandiser",
        "password_hash": _hash(temp_pw),
        "role": data.role,
        "status": "active",
        "must_reset_password": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": actor_id,
        "last_login": None,
    }
    await db.brand_users.insert_one(user_doc)
    asyncio.create_task(_send_welcome_email(brand["name"], data.name, data.email, temp_pw))
    return {
        "id": user_doc["id"],
        "message": "User created. Welcome email sent.",
        "temporary_password_for_reference": temp_pw,
    }


# ───── BRAND AUTH ─────
@router.post("/brand/login")
async def brand_login(data: BrandLoginRequest):
    user = await db.brand_users.find_one({"email": data.email.lower(), "status": "active"}, {"_id": 0})
    if not user or not _verify(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    brand = await db.brands.find_one({"id": user["brand_id"], "status": "active"}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=403, detail="Your brand account is inactive. Contact Locofast support.")

    token = _brand_user_token(user)
    await db.brand_users.update_one({"id": user["id"]}, {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}})
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "designation": user.get("designation", ""),
            "brand_id": user["brand_id"],
            "brand_name": brand["name"],
            "brand_logo_url": brand.get("logo_url", ""),
            "must_reset_password": user.get("must_reset_password", False),
        },
    }


@router.post("/brand/reset-password")
async def brand_reset_password(data: BrandPasswordReset, user=Depends(get_current_brand_user)):
    full_user = await db.brand_users.find_one({"id": user["id"]}, {"_id": 0})
    if not _verify(data.current_password, full_user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    await db.brand_users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": _hash(data.new_password), "must_reset_password": False}},
    )
    return {"message": "Password updated"}


@router.get("/brand/me")
async def brand_me(user=Depends(get_current_brand_user)):
    brand = await db.brands.find_one({"id": user["brand_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {"user": user, "brand": brand}


# ───── BRAND-FACING — Users (brand_admin can manage) ─────
@router.get("/brand/users")
async def brand_list_users(user=Depends(get_current_brand_user)):
    users = await db.brand_users.find({"brand_id": user["brand_id"], "status": {"$ne": "deleted"}}, {"_id": 0, "password_hash": 0}).to_list(length=200)
    return users


@router.post("/brand/users")
async def brand_add_user(data: BrandUserCreate, user=Depends(get_current_brand_user)):
    if user["role"] != "brand_admin":
        raise HTTPException(status_code=403, detail="Only brand admins can add users")
    return await _add_brand_user_internal(user["brand_id"], data, actor_id=user["id"])


@router.delete("/brand/users/{user_id}")
async def brand_remove_user(user_id: str, user=Depends(get_current_brand_user)):
    if user["role"] != "brand_admin":
        raise HTTPException(status_code=403, detail="Only brand admins can remove users")
    if user_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")
    res = await db.brand_users.update_one(
        {"id": user_id, "brand_id": user["brand_id"]},
        {"$set": {"status": "suspended"}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User suspended"}


@router.get("/brand/designations")
async def brand_list_designations():
    return {"options": list(BRAND_DESIGNATIONS)}


# ───── BRAND-FACING — Filtered Catalog ─────
@router.get("/brand/fabrics")
async def brand_list_fabrics(
    user=Depends(get_current_brand_user),
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    fabric_type: Optional[str] = None,
    composition: Optional[str] = None,
    pattern: Optional[str] = None,
    color: Optional[str] = None,
    width: Optional[str] = None,
    gsm_min: Optional[int] = None,
    gsm_max: Optional[int] = None,
    availability: Optional[str] = None,  # bookable | sample | instant | enquiry
):
    brand = await db.brands.find_one({"id": user["brand_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    allowed = brand.get("allowed_category_ids") or []
    if not allowed:
        return []  # No categories unlocked yet

    # Build filter: scope ALWAYS stays inside brand's allowed categories
    scope_cat_ids = allowed
    if category_id and category_id in allowed:
        scope_cat_ids = [category_id]

    query = {"category_id": {"$in": scope_cat_ids}, "status": {"$ne": "draft"}}
    if fabric_type:
        query["fabric_type"] = fabric_type
    if pattern:
        query["pattern"] = pattern
    if color:
        query["color"] = {"$regex": f"^{color}$", "$options": "i"}
    if width:
        query["width"] = width
    if gsm_min is not None or gsm_max is not None:
        gsm_q = {}
        if gsm_min is not None:
            gsm_q["$gte"] = gsm_min
        if gsm_max is not None:
            gsm_q["$lte"] = gsm_max
        query["gsm"] = gsm_q
    if composition:
        query["composition.material"] = composition
    if search:
        safe = search.replace("\\", "\\\\").replace(".", "\\.").replace("*", "\\*")
        query["$or"] = [
            {"name": {"$regex": safe, "$options": "i"}},
            {"fabric_code": {"$regex": safe, "$options": "i"}},
        ]
    if availability == "bookable":
        query["is_bookable"] = True
        query["quantity_available"] = {"$gt": 0}
    elif availability == "sample":
        query["sample_price"] = {"$gt": 0}
    elif availability == "instant":
        query["is_bookable"] = True
        query["quantity_available"] = {"$gt": 0}
        query["sample_price"] = {"$gt": 0}
    elif availability == "enquiry":
        # Prefer fabrics without numeric pricing (quote-driven)
        query["$or"] = [{"rate_per_meter": {"$in": [None, 0]}}, {"rate_per_meter": {"$exists": False}}]

    fabrics = await db.fabrics.find(query, {"_id": 0}).sort("created_at", -1).to_list(length=1000)

    # Attach category names
    cats = await db.categories.find({"id": {"$in": allowed}}, {"_id": 0}).to_list(length=50)
    cat_map = {c["id"]: c["name"] for c in cats}
    for f in fabrics:
        f["category_name"] = cat_map.get(f.get("category_id"), "")
    return fabrics


@router.get("/brand/fabrics/filter-options")
async def brand_filter_options(user=Depends(get_current_brand_user)):
    """Categories + filter facets scoped to the brand's allowed catalog."""
    brand = await db.brands.find_one({"id": user["brand_id"]}, {"_id": 0})
    allowed = brand.get("allowed_category_ids") or []
    if not allowed:
        return {"categories": [], "colors": [], "patterns": [], "widths": [], "compositions": [], "fabric_types": []}

    cats = await db.categories.find({"id": {"$in": allowed}}, {"_id": 0, "id": 1, "name": 1, "slug": 1}).to_list(length=50)
    fabrics = await db.fabrics.find(
        {"category_id": {"$in": allowed}, "status": {"$ne": "draft"}},
        {"_id": 0, "color": 1, "pattern": 1, "width": 1, "composition": 1, "fabric_type": 1},
    ).to_list(length=2000)

    from composition_utils import CANONICAL_COMPOSITIONS, normalize_material
    colors, patterns, widths, compositions, fabric_types = set(), set(), set(), set(), set()
    for f in fabrics:
        if f.get("color"):
            colors.add(str(f["color"]).strip())
        if f.get("pattern"):
            patterns.add(str(f["pattern"]).strip())
        if f.get("width"):
            widths.add(str(f["width"]).strip())
        if f.get("fabric_type"):
            fabric_types.add(str(f["fabric_type"]).strip())
        comp = f.get("composition")
        if isinstance(comp, list):
            for item in comp:
                mat = (item.get("material") or "").strip()
                if mat:
                    compositions.add(normalize_material(mat))

    canon = set(CANONICAL_COMPOSITIONS)
    compositions = {c for c in compositions if c in canon}

    return {
        "categories": cats,
        "colors": sorted(colors, key=str.lower),
        "patterns": sorted(patterns, key=str.lower),
        "widths": sorted(widths, key=str.lower),
        "compositions": sorted(compositions, key=str.lower),
        "fabric_types": sorted(fabric_types, key=str.lower),
    }


@router.get("/brand/fabrics/{fabric_id_or_slug}")
async def brand_get_fabric(fabric_id_or_slug: str, user=Depends(get_current_brand_user)):
    brand = await db.brands.find_one({"id": user["brand_id"]}, {"_id": 0})
    allowed = brand.get("allowed_category_ids") or []
    f = await db.fabrics.find_one({"$or": [{"id": fabric_id_or_slug}, {"slug": fabric_id_or_slug}]}, {"_id": 0})
    if not f or f.get("category_id") not in allowed:
        raise HTTPException(status_code=404, detail="Fabric not available for your brand")
    # Attach category name
    cat = await db.categories.find_one({"id": f.get("category_id")}, {"_id": 0, "name": 1})
    if cat:
        f["category_name"] = cat.get("name", "")
    return f


# ════════════════════════════════════════════════════════════════════
# SLICE 2 — Credit Lines (multi-lender), OTP, Ledger, FIFO Debit
# SLICE 3 — Sample Credits + Razorpay Top-up
# ════════════════════════════════════════════════════════════════════

LENDER_OPTIONS = {"Stride", "Muthoot", "Mintifi"}


class BrandCreditOtpRequest(BaseModel):
    lender_name: str
    amount_inr: float
    note: Optional[str] = ""


class BrandCreditLineCreate(BaseModel):
    otp_request_id: str
    otp_code: str
    lender_name: str
    amount_inr: float
    screenshot_url: Optional[str] = ""
    note: Optional[str] = ""


class SampleCreditAdjust(BaseModel):
    delta: int  # positive to add, negative to remove
    note: Optional[str] = ""


class BrandOrderItemIn(BaseModel):
    fabric_id: str
    quantity: int
    color_name: Optional[str] = ""
    color_hex: Optional[str] = ""


class BrandOrderCreate(BaseModel):
    items: List[BrandOrderItemIn]
    order_type: str  # "sample" | "bulk"
    notes: Optional[str] = ""
    ship_to_address: Optional[str] = ""
    ship_to_city: Optional[str] = ""
    ship_to_state: Optional[str] = ""
    ship_to_pincode: Optional[str] = ""


class BrandTopupCreate(BaseModel):
    amount_inr: int  # must be whole rupees (1 rupee = 1 credit)


class BrandTopupVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ───── Helpers ─────
async def _write_ledger(brand_id: str, entry_type: str, amount: float, actor_id: str, **extra):
    doc = {
        "id": str(uuid.uuid4()),
        "brand_id": brand_id,
        "type": entry_type,
        "amount": round(float(amount), 2),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": actor_id,
        **extra,
    }
    await db.brand_credit_ledger.insert_one(doc)
    return doc


def _send_otp_email_sync(to_email: str, code: str, brand_name: str, amount_inr: float, lender_name: str):
    if not RESEND_API_KEY:
        logging.warning(f"RESEND_API_KEY missing — OTP for {to_email}: {code}")
        return
    html = f"""
      <div style="font-family:-apple-system,Segoe UI,Helvetica,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background:#111827;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0;">
          <h2 style="margin:0;font-size:18px;">Confirm credit line payment upload</h2>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;">
          <p style="color:#374151;font-size:14px;margin:0 0 16px 0;">
            You're recording a <strong>₹{amount_inr:,.2f}</strong> payment from <strong>{lender_name}</strong> to brand <strong>{brand_name}</strong>.
          </p>
          <p style="font-size:13px;color:#64748b;margin:0 0 8px 0;">Enter this OTP to confirm:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:6px;color:#059669;background:#ecfdf5;padding:14px 0;text-align:center;border-radius:8px;font-family:monospace;">
            {code}
          </div>
          <p style="font-size:12px;color:#94a3b8;margin:16px 0 0 0;">
            This code expires in 10 minutes. If you didn't initiate this, ignore the email and report it to security@locofast.com.
          </p>
        </div>
      </div>
    """
    try:
        resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": f"OTP: Confirm ₹{amount_inr:,.0f} credit line for {brand_name}",
            "html": html,
        })
    except Exception as e:
        logging.error(f"OTP email failed to {to_email}: {e}")


# ───── ADMIN — Credit Line OTP + Upload ─────
@router.post("/admin/brands/{brand_id}/credit-lines/otp")
async def request_credit_line_otp(brand_id: str, data: BrandCreditOtpRequest, admin=Depends(auth_helpers.get_current_admin)):
    if data.lender_name not in LENDER_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Lender must be one of {sorted(LENDER_OPTIONS)}")
    if data.amount_inr <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    brand = await db.brands.find_one({"id": brand_id, "status": "active"}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found or inactive")

    code = "".join(secrets.choice(string.digits) for _ in range(6))
    otp_id = str(uuid.uuid4())
    otp_doc = {
        "id": otp_id,
        "admin_id": admin.get("id"),
        "admin_email": admin.get("email"),
        "purpose": "brand_credit_upload",
        "brand_id": brand_id,
        "lender_name": data.lender_name,
        "amount_inr": float(data.amount_inr),
        "code_hash": _hash(code),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
        "consumed": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.admin_otps.insert_one(otp_doc)
    await asyncio.to_thread(_send_otp_email_sync, admin.get("email"), code, brand["name"], data.amount_inr, data.lender_name)
    return {"otp_request_id": otp_id, "sent_to": admin.get("email"), "expires_in_minutes": 10}


@router.post("/admin/brands/{brand_id}/credit-lines")
async def create_credit_line(brand_id: str, data: BrandCreditLineCreate, admin=Depends(auth_helpers.get_current_admin)):
    if data.lender_name not in LENDER_OPTIONS:
        raise HTTPException(status_code=400, detail=f"Lender must be one of {sorted(LENDER_OPTIONS)}")
    if data.amount_inr <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    otp = await db.admin_otps.find_one({
        "id": data.otp_request_id,
        "admin_id": admin.get("id"),
        "purpose": "brand_credit_upload",
        "brand_id": brand_id,
        "consumed": False,
    }, {"_id": 0})
    if not otp:
        raise HTTPException(status_code=400, detail="Invalid OTP request")
    if datetime.now(timezone.utc) > datetime.fromisoformat(otp["expires_at"]):
        raise HTTPException(status_code=400, detail="OTP expired — request a new one")
    if abs(float(otp["amount_inr"]) - float(data.amount_inr)) > 0.01 or otp["lender_name"] != data.lender_name:
        raise HTTPException(status_code=400, detail="OTP does not match this lender/amount — request a new one")
    if not _verify(data.otp_code, otp["code_hash"]):
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    line_id = str(uuid.uuid4())
    line_doc = {
        "id": line_id,
        "brand_id": brand_id,
        "lender_name": data.lender_name,
        "amount_inr": round(float(data.amount_inr), 2),
        "utilized_inr": 0.0,
        "status": "active",
        "screenshot_url": data.screenshot_url or "",
        "note": data.note or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin.get("id"),
        "created_by_email": admin.get("email"),
    }
    await db.brand_credit_lines.insert_one(line_doc)
    await db.admin_otps.update_one({"id": otp["id"]}, {"$set": {"consumed": True, "consumed_at": datetime.now(timezone.utc).isoformat()}})
    await _write_ledger(
        brand_id, "credit_allocated", data.amount_inr, admin.get("id"),
        line_id=line_id, lender_name=data.lender_name, screenshot_url=data.screenshot_url or "", note=data.note or "",
    )
    return {"id": line_id, "message": "Credit line created"}


@router.get("/admin/brands/{brand_id}/credit-lines")
async def list_credit_lines(brand_id: str, admin=Depends(auth_helpers.get_current_admin)):
    lines = await db.brand_credit_lines.find({"brand_id": brand_id}, {"_id": 0}).sort("created_at", 1).to_list(length=200)
    return lines


@router.get("/admin/brands/{brand_id}/ledger")
async def admin_list_ledger(brand_id: str, admin=Depends(auth_helpers.get_current_admin)):
    entries = await db.brand_credit_ledger.find({"brand_id": brand_id}, {"_id": 0}).sort("created_at", -1).to_list(length=500)
    return entries


@router.post("/admin/brands/{brand_id}/sample-credits")
async def admin_adjust_sample_credits(brand_id: str, data: SampleCreditAdjust, admin=Depends(auth_helpers.get_current_admin)):
    brand = await db.brands.find_one({"id": brand_id}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    new_total = int(brand.get("sample_credits_total", 0)) + int(data.delta)
    if new_total < int(brand.get("sample_credits_used", 0)):
        raise HTTPException(status_code=400, detail="Cannot reduce below already-used credits")
    await db.brands.update_one({"id": brand_id}, {"$set": {"sample_credits_total": new_total}})
    await _write_ledger(
        brand_id,
        "sample_credit_added" if data.delta >= 0 else "sample_credit_removed",
        abs(int(data.delta)), admin.get("id"),
        note=data.note or "Admin adjustment",
    )
    return {"sample_credits_total": new_total}


# ───── BRAND — Credit Summary + Ledger ─────
@router.get("/brand/credit-summary")
async def brand_credit_summary(user=Depends(get_current_brand_user)):
    brand = await db.brands.find_one({"id": user["brand_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    lines = await db.brand_credit_lines.find({"brand_id": user["brand_id"], "status": "active"}, {"_id": 0}).sort("created_at", 1).to_list(length=200)
    total_allocated = sum(float(l.get("amount_inr", 0)) for l in lines)
    total_utilized = sum(float(l.get("utilized_inr", 0)) for l in lines)
    available = round(total_allocated - total_utilized, 2)
    sample_total = int(brand.get("sample_credits_total", 0))
    sample_used = int(brand.get("sample_credits_used", 0))
    return {
        "credit": {
            "total_allocated": round(total_allocated, 2),
            "total_utilized": round(total_utilized, 2),
            "available": available,
            "lines": lines,
        },
        "sample_credits": {
            "total": sample_total,
            "used": sample_used,
            "available": sample_total - sample_used,
        },
    }


@router.get("/brand/ledger")
async def brand_ledger(user=Depends(get_current_brand_user)):
    entries = await db.brand_credit_ledger.find({"brand_id": user["brand_id"]}, {"_id": 0}).sort("created_at", -1).to_list(length=500)
    return entries


# ───── BRAND — Order Placement with FIFO debit ─────
async def _debit_credit_fifo(brand_id: str, amount: float, order_id: str, actor_id: str):
    """Debit brand's credit lines FIFO (oldest first). Raises if insufficient."""
    lines = await db.brand_credit_lines.find({"brand_id": brand_id, "status": "active"}, {"_id": 0}).sort("created_at", 1).to_list(length=200)
    total_avail = sum(float(l.get("amount_inr", 0)) - float(l.get("utilized_inr", 0)) for l in lines)
    if total_avail + 0.01 < amount:
        raise HTTPException(status_code=400, detail=f"Insufficient credit: available ₹{total_avail:,.2f}, required ₹{amount:,.2f}")
    remaining = float(amount)
    debits = []
    for line in lines:
        if remaining <= 0.001:
            break
        avail = float(line["amount_inr"]) - float(line["utilized_inr"])
        if avail <= 0:
            continue
        take = round(min(avail, remaining), 2)
        await db.brand_credit_lines.update_one({"id": line["id"]}, {"$inc": {"utilized_inr": take}})
        debits.append({"line_id": line["id"], "lender_name": line["lender_name"], "amount": take})
        remaining = round(remaining - take, 2)
    await _write_ledger(
        brand_id, "debit_order", amount, actor_id,
        order_id=order_id, debits=debits,
    )
    return debits


async def _debit_sample_credits(brand_id: str, amount: int, order_id: str, actor_id: str):
    brand = await db.brands.find_one({"id": brand_id}, {"_id": 0})
    avail = int(brand.get("sample_credits_total", 0)) - int(brand.get("sample_credits_used", 0))
    if avail < amount:
        raise HTTPException(status_code=400, detail=f"Insufficient sample credits: available {avail}, required {amount}")
    await db.brands.update_one({"id": brand_id}, {"$inc": {"sample_credits_used": int(amount)}})
    await _write_ledger(
        brand_id, "sample_credit_used", amount, actor_id,
        order_id=order_id,
    )


@router.post("/brand/orders")
async def brand_create_order(data: BrandOrderCreate, user=Depends(get_current_brand_user)):
    if data.order_type not in ("sample", "bulk"):
        raise HTTPException(status_code=400, detail="order_type must be 'sample' or 'bulk'")
    if not data.items:
        raise HTTPException(status_code=400, detail="No items")

    brand = await db.brands.find_one({"id": user["brand_id"], "status": "active"}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=403, detail="Brand inactive")
    allowed = brand.get("allowed_category_ids") or []

    # Load fabrics + validate catalogue rules
    priced_items = []
    subtotal = 0.0
    for it in data.items:
        if it.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be > 0")
        f = await db.fabrics.find_one({"id": it.fabric_id}, {"_id": 0})
        if not f:
            raise HTTPException(status_code=404, detail=f"Fabric {it.fabric_id} not found")
        if f.get("category_id") not in allowed:
            raise HTTPException(status_code=403, detail=f"Fabric '{f.get('name')}' not available for your brand")
        if data.order_type == "sample":
            sample_price = float(f.get("sample_price") or 100)
            line_total = sample_price * it.quantity
            price_per_unit = sample_price
        else:
            rate = float(f.get("rate_per_meter") or f.get("price_per_meter") or 0)
            if rate <= 0:
                raise HTTPException(status_code=400, detail=f"Fabric '{f.get('name')}' has no price")
            # MOQ can be an int or a string like "500 meters" / "1500MTR" — extract leading digits
            moq_raw = f.get("moq")
            moq = 1
            if isinstance(moq_raw, (int, float)):
                moq = int(moq_raw)
            elif isinstance(moq_raw, str):
                import re as _re
                m = _re.match(r"\s*(\d+)", moq_raw)
                if m:
                    moq = int(m.group(1))
            if it.quantity < moq:
                raise HTTPException(status_code=400, detail=f"{f.get('name')}: qty {it.quantity} below MOQ {moq}")
            line_total = rate * it.quantity
            price_per_unit = rate
        subtotal += line_total
        priced_items.append({
            "fabric_id": it.fabric_id,
            "fabric_name": f.get("name", ""),
            "fabric_code": f.get("fabric_code", ""),
            "category_name": f.get("category_name", ""),
            "seller_company": f.get("seller_company", ""),
            "seller_id": f.get("seller_id", ""),
            "quantity": it.quantity,
            "price_per_meter": price_per_unit,
            "order_type": data.order_type,
            "image_url": (f.get("images") or [""])[0] if f.get("images") else "",
            "hsn_code": f.get("hsn_code", ""),
            "color_name": it.color_name or "",
            "color_hex": it.color_hex or "",
            "line_total": round(line_total, 2),
        })

    # Charges
    tax = round(subtotal * 0.05, 2)
    if data.order_type == "bulk":
        packaging_charge = sum(it["quantity"] * 1 for it in priced_items)  # ₹1/m
        logistics_total = max(round(subtotal * 0.03, 2), 3000.0)
        logistics_only = round(logistics_total - packaging_charge, 2)
        if logistics_only < 0:
            logistics_only = 0
            logistics_total = packaging_charge
    else:
        packaging_charge = 0
        logistics_only = 0
        logistics_total = 100.0  # flat ₹100 for samples
    total = round(subtotal + tax + logistics_total, 2)

    # Debit BEFORE creating order; on failure nothing is committed
    order_id = str(uuid.uuid4())
    if data.order_type == "sample":
        # Sample credits equate to INR (1 rupee = 1 credit)
        await _debit_sample_credits(user["brand_id"], int(round(total)), order_id, user["id"])
    else:
        await _debit_credit_fifo(user["brand_id"], total, order_id, user["id"])

    # Order number
    counter = await db.counters.find_one_and_update(
        {"_id": "invoice_number"}, {"$inc": {"seq": 1}}, upsert=True, return_document=ReturnDocument.AFTER
    )
    seq = counter.get("seq", 1)
    order_number = f"LF/ORD/{seq:03d}"

    order_doc = {
        "id": order_id,
        "order_number": order_number,
        "items": priced_items,
        "customer": {
            "name": user["name"],
            "email": user["email"],
            "phone": brand.get("phone", ""),
            "company": brand["name"],
            "gst_number": brand.get("gst", ""),
            "address": data.ship_to_address or brand.get("address", ""),
            "city": data.ship_to_city or "",
            "state": data.ship_to_state or "",
            "pincode": data.ship_to_pincode or "",
        },
        "subtotal": round(subtotal, 2),
        "tax": tax,
        "discount": 0,
        "total": total,
        "currency": "INR",
        "logistics_charge": logistics_total,
        "packaging_charge": packaging_charge,
        "logistics_only_charge": logistics_only,
        "status": "paid",
        "payment_status": "paid",
        "payment_method": "brand_credit" if data.order_type == "bulk" else "sample_credit",
        "booking_type": "brand",
        "brand_id": user["brand_id"],
        "brand_name": brand["name"],
        "brand_user_id": user["id"],
        "brand_user_email": user["email"],
        "order_type": data.order_type,
        "notes": data.notes or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "paid_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(order_doc)
    order_doc.pop("_id", None)
    return {
        "id": order_id,
        "order_number": order_number,
        "total": total,
        "message": "Order placed via brand credit",
    }


@router.get("/brand/orders")
async def brand_list_orders(user=Depends(get_current_brand_user)):
    orders = await db.orders.find(
        {"brand_id": user["brand_id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=200)
    return orders


# ───── BRAND — Razorpay sample-credit top-up (Slice 3) ─────
def _razorpay_client():
    try:
        import razorpay
        key_id = os.environ.get("RAZORPAY_KEY_ID")
        key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
        if not key_id or not key_secret:
            return None
        return razorpay.Client(auth=(key_id, key_secret))
    except Exception:
        return None


@router.post("/brand/sample-credits/topup/create-order")
async def brand_sample_topup_create(data: BrandTopupCreate, user=Depends(get_current_brand_user)):
    if data.amount_inr < 100:
        raise HTTPException(status_code=400, detail="Minimum top-up is ₹100")
    client = _razorpay_client()
    if not client:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")
    rp_order = await asyncio.to_thread(client.order.create, {
        "amount": int(data.amount_inr) * 100,
        "currency": "INR",
        "notes": {
            "brand_id": user["brand_id"],
            "brand_user_id": user["id"],
            "purpose": "sample_credit_topup",
        },
    })
    return {
        "razorpay_order_id": rp_order["id"],
        "amount_inr": int(data.amount_inr),
        "amount_paise": int(data.amount_inr) * 100,
        "currency": "INR",
        "key_id": os.environ.get("RAZORPAY_KEY_ID", ""),
    }


@router.post("/brand/sample-credits/topup/verify")
async def brand_sample_topup_verify(data: BrandTopupVerify, user=Depends(get_current_brand_user)):
    # Verify signature
    import hmac, hashlib
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    expected = hmac.new(key_secret.encode(), f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, data.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    client = _razorpay_client()
    if not client:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")
    rp_order = await asyncio.to_thread(client.order.fetch, data.razorpay_order_id)
    if rp_order.get("notes", {}).get("brand_id") != user["brand_id"]:
        raise HTTPException(status_code=403, detail="Order does not belong to your brand")
    credits = int(rp_order["amount"]) // 100  # ₹1 = 1 credit
    await db.brands.update_one({"id": user["brand_id"]}, {"$inc": {"sample_credits_total": credits}})
    await _write_ledger(
        user["brand_id"], "sample_credit_added", credits, user["id"],
        razorpay_order_id=data.razorpay_order_id,
        razorpay_payment_id=data.razorpay_payment_id,
        note="Self-serve Razorpay top-up",
    )
    return {"message": f"Added {credits} sample credits", "credits": credits}
