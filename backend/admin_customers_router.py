"""
Admin Customers — list, search, drill-down view of registered customers.

Aggregates RFQ counts, order counts, and lifetime spend per customer so
the admin can quickly see who the heavy hitters are vs cold leads.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
import auth_helpers

router = APIRouter(prefix="/api/admin/customers", tags=["Admin · Customers"])

db = None


def set_db(database):
    global db
    db = database


@router.get("/")
async def list_customers(
    q: Optional[str] = Query(None, description="Search across name, email, phone, company"),
    source: Optional[str] = Query(None, description="Filter by created_via (e.g. external_api, whatsapp_otp)"),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    admin=Depends(auth_helpers.get_current_admin),
):
    """Paginated customer list with RFQ/order aggregates."""
    query: dict = {}
    if q:
        regex = {"$regex": q, "$options": "i"}
        query["$or"] = [
            {"name": regex},
            {"email": regex},
            {"phone": regex},
            {"company": regex},
            {"gstin": regex},
        ]
    if source:
        query["created_via"] = source

    total = await db.customers.count_documents(query)

    cursor = db.customers.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    customers = await cursor.to_list(length=limit)

    # Enrich with RFQ + order counts (single aggregation per page is cheap;
    # we don't precompute since totals are tiny here)
    for c in customers:
        cid = c.get("id")
        email = c.get("email")
        c["rfq_count"] = await db.rfq_submissions.count_documents(
            {"$or": [{"customer_id": cid}, {"email": email}]}
        )
        c["order_count"] = await db.orders.count_documents(
            {"$or": [{"customer_id": cid}, {"customer_email": email}]}
        )

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "customers": customers,
    }


@router.get("/stats")
async def customer_stats(admin=Depends(auth_helpers.get_current_admin)):
    """Top-line counts for the customer page header."""
    total = await db.customers.count_documents({})
    via_external_api = await db.customers.count_documents({"created_via": "external_api"})
    via_whatsapp = await db.customers.count_documents({"created_via": "whatsapp_otp"})
    via_email = await db.customers.count_documents({"created_via": "email_otp"})
    with_gst = await db.customers.count_documents({"gstin": {"$nin": [None, ""]}})
    return {
        "total": total,
        "via_external_api": via_external_api,
        "via_whatsapp_otp": via_whatsapp,
        "via_email_otp": via_email,
        "with_gst": with_gst,
    }


@router.get("/{customer_id}")
async def get_customer_detail(
    customer_id: str,
    admin=Depends(auth_helpers.get_current_admin),
):
    """Full customer profile + linked RFQs + linked orders."""
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    email = customer.get("email") or ""
    rfqs = await db.rfq_submissions.find(
        {"$or": [{"customer_id": customer_id}, {"email": email}]},
        {"_id": 0, "rfq_number": 1, "category": 1, "status": 1, "lead_source": 1,
         "ingested_via": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(length=200)

    orders = await db.orders.find(
        {"$or": [{"customer_id": customer_id}, {"customer_email": email}]},
        {"_id": 0, "order_number": 1, "status": 1, "total_amount": 1,
         "currency": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(length=200)

    return {"customer": customer, "rfqs": rfqs, "orders": orders}
