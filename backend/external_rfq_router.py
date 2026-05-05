"""
External RFQ Lead-Ingest API
============================

Server-to-server endpoint for pushing RFQ leads from any external system
(CRM, marketing automation, partner site, ad platforms, etc.) into
Locofast's RFQ pipeline.

  • Auth: static API key in `X-API-Key` header (rotate via env)
  • Path: POST /api/external/rfq
  • One endpoint, four category-specific payload shapes (cotton, knits,
    denim, viscose) — schema declared with Pydantic discriminator so
    OpenAPI (/api/docs) renders all four contracts neatly.

Once created, the RFQ:
  - Gets a Locofast RFQ number (RFQ-XXXXXX)
  - Lands in the same vendor fan-out + admin dashboard as a customer-form
    RFQ (no separate workflow)
  - Carries `lead_source` + `external_id` so admins can trace it back
    to the originating CRM record
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Annotated, Literal, Optional, Union
import logging
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/external", tags=["External Lead Ingest"])

db = None


def set_db(database):
    global db
    db = database


# ──────────────────────────────────────────────────────────────────────────
# Auth — API key in X-API-Key header
# ──────────────────────────────────────────────────────────────────────────
def require_ingest_key(x_api_key: Annotated[str, Header(alias="X-API-Key")] = ""):
    expected = os.environ.get("LOCOFAST_INGEST_API_KEY", "")
    if not expected:
        raise HTTPException(status_code=503, detail="Ingest API not configured")
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True


# ──────────────────────────────────────────────────────────────────────────
# Enums — locked vocabularies that match the customer-facing RFQ form so
# admin filters and vendor routing keep working uniformly.
# ──────────────────────────────────────────────────────────────────────────
class FabricRequirementType(str, Enum):
    GREIGE = "Greige"
    DYED = "Dyed"
    RFD = "RFD"
    PRINTED = "Printed"


class CottonViscoseQuantity(str, Enum):
    """Meter buckets for cotton & viscose."""
    Q1 = "1000_5000"
    Q2 = "5000_20000"
    Q3 = "20000_50000"
    Q4 = "50000_plus"


class DenimQuantity(str, Enum):
    """Meter buckets for denim."""
    Q1 = "1000_2500"
    Q2 = "2500_7500"
    Q3 = "7500_25000"
    Q4 = "25000_plus"


class KnitsQuantity(str, Enum):
    """Kilogram buckets for knits."""
    Q1 = "less_than_200"
    Q2 = "200_500"
    Q3 = "500_1000"
    Q4 = "1000_plus"


# ──────────────────────────────────────────────────────────────────────────
# Shared contact / metadata block — every category uses this
# ──────────────────────────────────────────────────────────────────────────
class ContactMeta(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=120,
        description="Buyer's full name. Mandatory.",
        examples=["Aarav Sharma"],
    )
    email: EmailStr = Field(
        ...,
        description="Buyer's email — used for quote notifications. Mandatory.",
        examples=["aarav@acmegarments.in"],
    )
    phone: str = Field(
        ...,
        min_length=10,
        max_length=15,
        description="Buyer's mobile (E.164 OR 10-digit Indian). Mandatory.",
        examples=["+919876543210"],
    )
    company: Optional[str] = Field(
        "", max_length=200,
        description="Buyer's company name. Optional but strongly recommended.",
        examples=["Acme Garments Pvt Ltd"],
    )
    gst_number: Optional[str] = Field(
        "", max_length=20,
        description="Buyer's GSTIN (15 chars). Optional. If provided, will be "
                    "shown on resulting quotes/invoices.",
        examples=["27AAACR5055K1ZP"],
    )
    website: Optional[str] = Field(
        "", max_length=200,
        description="Buyer's company website. Optional.",
        examples=["https://acmegarments.in"],
    )
    message: Optional[str] = Field(
        "", max_length=2000,
        description="Free-text additional notes from the buyer. Optional.",
        examples=["Need swatches before 15 Mar; bulk dispatch by 30 Apr"],
    )
    target_price_per_meter: Optional[float] = Field(
        None, ge=0, le=10000,
        description="Buyer's target price per meter in INR. Optional — passed to vendors.",
        examples=[185.0],
    )
    dispatch_required_by: Optional[str] = Field(
        None,
        description="Required dispatch date in ISO 8601 format (YYYY-MM-DD). Optional.",
        examples=["2026-04-30"],
    )
    delivery_pincode: Optional[str] = Field(
        "", min_length=0, max_length=10,
        description="Delivery PIN/postal code. Optional.",
        examples=["110001"],
    )
    delivery_city: Optional[str] = Field(
        "", max_length=100,
        description="Delivery city. Optional.",
        examples=["New Delhi"],
    )
    delivery_state: Optional[str] = Field(
        "", max_length=100,
        description="Delivery state. Optional.",
        examples=["Delhi"],
    )

    # Lead-tracking fields — for CRM/agency attribution
    lead_source: Optional[str] = Field(
        "", max_length=100,
        description="Where this lead originated. Free-form. Optional.",
        examples=["HubSpot", "Meta Ads · Cotton Q2 Campaign", "Partner Portal"],
    )
    external_id: Optional[str] = Field(
        "", max_length=100,
        description="The lead ID in your source system. Used for de-duplication "
                    "if the same lead is pushed twice. Optional.",
        examples=["hubspot-deal-184729"],
    )
    campaign: Optional[str] = Field(
        "", max_length=100,
        description="Marketing campaign / UTM tag. Optional.",
        examples=["winter-25-cotton"],
    )


# ──────────────────────────────────────────────────────────────────────────
# Per-category payload shapes (Pydantic discriminator on `category`)
# ──────────────────────────────────────────────────────────────────────────
class CottonRFQ(ContactMeta):
    """Cotton RFQ — quantity in meters, fabric requirement type required."""
    category: Literal["cotton"] = Field(..., description="Must be 'cotton'.")
    fabric_requirement_type: FabricRequirementType = Field(
        ...,
        description="Mandatory for cotton. One of: Greige, Dyed, RFD, Printed.",
        examples=["Dyed"],
    )
    quantity_meters: CottonViscoseQuantity = Field(
        ...,
        description="Mandatory. Bucketed quantity in meters.",
        examples=["5000_20000"],
    )


class ViscoseRFQ(ContactMeta):
    """Viscose RFQ — quantity in meters, fabric requirement type required."""
    category: Literal["viscose"] = Field(..., description="Must be 'viscose'.")
    fabric_requirement_type: FabricRequirementType = Field(
        ...,
        description="Mandatory for viscose. One of: Greige, Dyed, RFD, Printed.",
        examples=["Printed"],
    )
    quantity_meters: CottonViscoseQuantity = Field(
        ...,
        description="Mandatory. Bucketed quantity in meters.",
        examples=["1000_5000"],
    )


class DenimRFQ(ContactMeta):
    """Denim RFQ — quantity in meters, free-text spec required."""
    category: Literal["denim"] = Field(..., description="Must be 'denim'.")
    denim_specification: str = Field(
        ..., min_length=5, max_length=500,
        description="Mandatory. Free-text denim spec (composition, weight, finish).",
        examples=["65% Cotton / 35% Poly · 11 oz · Stretch · Indigo · Dry-process washed"],
    )
    quantity_meters: DenimQuantity = Field(
        ...,
        description="Mandatory. Bucketed quantity in meters.",
        examples=["7500_25000"],
    )


class KnitsRFQ(ContactMeta):
    """Knits RFQ — quantity in kg, knit quality required."""
    category: Literal["knits"] = Field(..., description="Must be 'knits'.")
    knit_quality: str = Field(
        ..., min_length=5, max_length=200,
        description="Mandatory. Knit quality / GSM specification.",
        examples=["4 Way Lycra 220-230 GSM"],
    )
    quantity_kg: KnitsQuantity = Field(
        ...,
        description="Mandatory. Bucketed quantity in kilograms.",
        examples=["500_1000"],
    )


# Discriminated union — FastAPI auto-generates 4 payload examples in OpenAPI
RFQPayload = Annotated[
    Union[CottonRFQ, ViscoseRFQ, DenimRFQ, KnitsRFQ],
    Field(discriminator="category"),
]


class RFQIngestResponse(BaseModel):
    success: bool = True
    rfq_id: str = Field(..., examples=["a3a3a51b-7b3b-4a65-9a8e-9b4f4e1c1b7a"])
    rfq_number: str = Field(..., examples=["RFQ-AB12CD"])
    status: Literal["new"] = "new"
    message: str = "RFQ ingested"
    deduplicated: bool = Field(
        False,
        description="True when an existing RFQ with the same `external_id` "
                    "was returned instead of a new one being created.",
    )


# ──────────────────────────────────────────────────────────────────────────
# Endpoint
# ──────────────────────────────────────────────────────────────────────────
@router.post(
    "/rfq",
    response_model=RFQIngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest an RFQ lead",
    description=(
        "Push an RFQ lead from any external system (CRM, ad platform, partner site, etc.).\n\n"
        "Requires `X-API-Key` header. Choose the schema for your `category`:\n"
        "- `cotton` / `viscose` → meters + `fabric_requirement_type`\n"
        "- `denim` → meters + `denim_specification`\n"
        "- `knits` → kg + `knit_quality`\n\n"
        "If `external_id` matches a previously-ingested RFQ, the existing one is returned "
        "(no duplicate created)."
    ),
    responses={
        201: {"description": "RFQ created successfully"},
        200: {"description": "Existing RFQ returned (de-duplicated by external_id)"},
        401: {"description": "Missing or invalid X-API-Key"},
        422: {"description": "Validation error — see `detail` for field-level issues"},
    },
)
async def ingest_rfq(payload: RFQPayload, _auth: bool = Depends(require_ingest_key)):
    # De-dupe: if external_id is set and we've seen it before, return the
    # original RFQ. This makes the endpoint idempotent against CRM retries.
    if payload.external_id:
        existing = await db.rfq_submissions.find_one(
            {"external_id": payload.external_id},
            {"_id": 0, "id": 1, "rfq_number": 1, "status": 1},
        )
        if existing:
            return RFQIngestResponse(
                rfq_id=existing["id"],
                rfq_number=existing["rfq_number"],
                status=existing.get("status", "new"),
                message="Existing RFQ returned (deduplicated by external_id)",
                deduplicated=True,
            )

    rfq_id = str(uuid.uuid4())
    rfq_number = await _generate_rfq_number()

    # Flatten the discriminated payload into a single Mongo doc using the
    # exact same schema as customer-form RFQs so admin/vendor flows are
    # unchanged.
    base = payload.model_dump()
    category = base["category"]

    rfq_doc = {
        "id": rfq_id,
        "rfq_number": rfq_number,
        "customer_id": "",  # external leads have no logged-in customer
        "category": category,
        "fabric_requirement_type": base.get("fabric_requirement_type", "") or "",
        "quantity_meters": base.get("quantity_meters", "") or "",
        "quantity_kg": base.get("quantity_kg", "") or "",
        "knit_quality": base.get("knit_quality", "") or "",
        "denim_specification": base.get("denim_specification", "") or "",
        "full_name": base["full_name"],
        "email": base["email"],
        "phone": base["phone"],
        "company": base.get("company") or "",
        "gst_number": base.get("gst_number") or "",
        "website": base.get("website") or "",
        "message": base.get("message") or "",
        "target_price_per_meter": base.get("target_price_per_meter"),
        "dispatch_required_by": base.get("dispatch_required_by") or "",
        "delivery_pincode": base.get("delivery_pincode") or "",
        "delivery_city": base.get("delivery_city") or "",
        "delivery_state": base.get("delivery_state") or "",
        "lead_source": base.get("lead_source") or "",
        "external_id": base.get("external_id") or "",
        "campaign": base.get("campaign") or "",
        "ingested_via": "external_api",
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.rfq_submissions.insert_one(rfq_doc)

    # Mirror to enquiries collection so admin /enquiries dashboard sees it
    await db.enquiries.insert_one({
        "id": str(uuid.uuid4()),
        "name": rfq_doc["full_name"],
        "email": rfq_doc["email"],
        "phone": rfq_doc["phone"],
        "company": rfq_doc["company"] or rfq_doc["website"],
        "message": _format_enquiry_message(rfq_doc),
        "enquiry_type": "rfq",
        "source": rfq_doc["lead_source"] or "external_api",
        "rfq_id": rfq_id,
        "rfq_number": rfq_number,
        "status": "new",
        "created_at": rfq_doc["created_at"],
    })

    # Vendor fan-out + admin email — fire-and-forget
    try:
        import asyncio
        from email_router import send_rfq_notification, send_rfq_vendor_fanout
        asyncio.create_task(send_rfq_notification(rfq_doc))
        asyncio.create_task(send_rfq_vendor_fanout(rfq_doc))
    except Exception as e:
        logger.warning(f"External RFQ {rfq_number} email queue failed: {e}")

    logger.info(f"External RFQ ingested: {rfq_number} · category={category} · source={rfq_doc['lead_source']}")

    return RFQIngestResponse(
        rfq_id=rfq_id,
        rfq_number=rfq_number,
        status="new",
        message="RFQ ingested",
        deduplicated=False,
    )


# ──────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────
async def _generate_rfq_number() -> str:
    import random
    import string
    while True:
        n = "RFQ-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not await db.rfq_submissions.find_one({"rfq_number": n}, {"_id": 1}):
            return n


def _format_enquiry_message(d: dict) -> str:
    parts = [f"**RFQ #{d['rfq_number']}** (External · {d.get('lead_source') or 'API'})"]
    parts.append(f"Category: {d['category'].upper()}")
    if d["category"] in ("cotton", "viscose"):
        parts.append(f"Type: {d['fabric_requirement_type']}  |  Qty: {d['quantity_meters']} m")
    elif d["category"] == "denim":
        parts.append(f"Spec: {d['denim_specification']}  |  Qty: {d['quantity_meters']} m")
    elif d["category"] == "knits":
        parts.append(f"Quality: {d['knit_quality']}  |  Qty: {d['quantity_kg']} kg")
    if d.get("target_price_per_meter"):
        parts.append(f"Target ₹{d['target_price_per_meter']}/m")
    if d.get("dispatch_required_by"):
        parts.append(f"Dispatch by: {d['dispatch_required_by']}")
    if d.get("gst_number"):
        parts.append(f"GST: {d['gst_number']}")
    if d.get("external_id"):
        parts.append(f"External ID: {d['external_id']}")
    if d.get("message"):
        parts.append(f"\nNotes: {d['message']}")
    return "\n".join(parts)


# ──────────────────────────────────────────────────────────────────────────
# Public docs page — serves the markdown spec with curl examples
# ──────────────────────────────────────────────────────────────────────────
DOC_PATH = Path(__file__).parent.parent / "EXTERNAL_RFQ_API.md"


@router.get(
    "/rfq/docs",
    summary="Markdown integration guide",
    description="Returns the human-readable API docs (markdown). Pair with /api/docs (OpenAPI/Swagger).",
)
async def serve_docs():
    if DOC_PATH.exists():
        return FileResponse(str(DOC_PATH), media_type="text/markdown")
    raise HTTPException(status_code=404, detail="Docs file not found")
