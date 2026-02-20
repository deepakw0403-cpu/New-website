"""
Orders Router - Handles order creation, payment, and management
Phase 1: Razorpay Integration + Order Management
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import razorpay
import hmac
import hashlib
import uuid
import os
import asyncio
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/orders", tags=["orders"])

# MongoDB connection (will be set from main server)
db = None

# Razorpay client
razorpay_client = None

def init_razorpay():
    """Initialize Razorpay client"""
    global razorpay_client
    key_id = os.environ.get('RAZORPAY_KEY_ID')
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET')
    
    if key_id and key_secret:
        razorpay_client = razorpay.Client(auth=(key_id, key_secret))
        logger.info("Razorpay client initialized successfully")
    else:
        logger.warning("Razorpay credentials not found - payment features will be disabled")

def set_db(database):
    """Set database reference from main server"""
    global db
    db = database

# ==================== MODELS ====================

class OrderItem(BaseModel):
    fabric_id: str
    fabric_name: str
    fabric_code: str = ""
    category_name: str = ""
    seller_company: str = ""
    quantity: int  # in meters
    price_per_meter: float
    order_type: str = "bulk"  # "sample" or "bulk"
    image_url: str = ""

class CustomerInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str
    company: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""

class OrderCreate(BaseModel):
    items: List[OrderItem]
    customer: CustomerInfo
    notes: str = ""

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    order_number: str  # Human readable order number like ORD-XXXXX
    items: List[OrderItem]
    customer: CustomerInfo
    subtotal: float
    tax: float = 0
    total: float
    currency: str = "INR"
    status: str = "pending"  # pending, payment_pending, paid, confirmed, processing, shipped, delivered, cancelled
    payment_status: str = "pending"  # pending, initiated, paid, failed, refunded
    razorpay_order_id: str = ""
    razorpay_payment_id: str = ""
    razorpay_signature: str = ""
    notes: str = ""
    created_at: str
    updated_at: str = ""
    paid_at: str = ""

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# ==================== HELPER FUNCTIONS ====================

async def generate_order_number() -> str:
    """Generate unique order number like ORD-XXXXX"""
    import random
    import string
    while True:
        number = 'ORD-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        existing = await db.orders.find_one({'order_number': number})
        if not existing:
            return number

def calculate_totals(items: List[OrderItem]) -> dict:
    """Calculate order totals"""
    subtotal = sum(item.quantity * item.price_per_meter for item in items)
    # GST 5% for fabrics
    tax = round(subtotal * 0.05, 2)
    total = round(subtotal + tax, 2)
    return {
        "subtotal": round(subtotal, 2),
        "tax": tax,
        "total": total
    }

def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify Razorpay payment signature"""
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
    
    # Create signature verification string
    msg = f"{order_id}|{payment_id}"
    
    # Generate expected signature
    expected_signature = hmac.new(
        key_secret.encode('utf-8'),
        msg.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)

# ==================== ORDER ENDPOINTS ====================

@router.post("/create", response_model=dict)
async def create_order(order_data: OrderCreate):
    """Create a new order and initiate Razorpay payment"""
    if not razorpay_client:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    # Calculate totals
    totals = calculate_totals(order_data.items)
    
    # Generate order ID and number
    order_id = str(uuid.uuid4())
    order_number = await generate_order_number()
    
    # Create Razorpay order
    try:
        razorpay_order = razorpay_client.order.create({
            "amount": int(totals["total"] * 100),  # Amount in paise
            "currency": "INR",
            "receipt": order_number,
            "notes": {
                "order_id": order_id,
                "customer_email": order_data.customer.email,
                "customer_name": order_data.customer.name
            }
        })
    except Exception as e:
        logger.error(f"Failed to create Razorpay order: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment initialization failed: {str(e)}")
    
    # Create order document
    now = datetime.now(timezone.utc).isoformat()
    order_doc = {
        "id": order_id,
        "order_number": order_number,
        "items": [item.model_dump() for item in order_data.items],
        "customer": order_data.customer.model_dump(),
        "subtotal": totals["subtotal"],
        "tax": totals["tax"],
        "total": totals["total"],
        "currency": "INR",
        "status": "payment_pending",
        "payment_status": "initiated",
        "razorpay_order_id": razorpay_order["id"],
        "razorpay_payment_id": "",
        "razorpay_signature": "",
        "notes": order_data.notes,
        "created_at": now,
        "updated_at": now,
        "paid_at": ""
    }
    
    await db.orders.insert_one(order_doc)
    
    # Return order details with Razorpay info for frontend
    return {
        "order_id": order_id,
        "order_number": order_number,
        "razorpay_order_id": razorpay_order["id"],
        "razorpay_key_id": os.environ.get('RAZORPAY_KEY_ID'),
        "amount": totals["total"],
        "amount_paise": int(totals["total"] * 100),
        "currency": "INR",
        "customer": order_data.customer.model_dump()
    }

@router.post("/verify-payment")
async def verify_payment(verification: PaymentVerification):
    """Verify Razorpay payment and update order status"""
    # Find order by Razorpay order ID
    order = await db.orders.find_one(
        {"razorpay_order_id": verification.razorpay_order_id},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Verify signature
    is_valid = verify_razorpay_signature(
        verification.razorpay_order_id,
        verification.razorpay_payment_id,
        verification.razorpay_signature
    )
    
    if not is_valid:
        # Update order as failed
        await db.orders.update_one(
            {"razorpay_order_id": verification.razorpay_order_id},
            {"$set": {
                "payment_status": "failed",
                "status": "payment_failed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Update order as paid
    now = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one(
        {"razorpay_order_id": verification.razorpay_order_id},
        {"$set": {
            "razorpay_payment_id": verification.razorpay_payment_id,
            "razorpay_signature": verification.razorpay_signature,
            "payment_status": "paid",
            "status": "confirmed",
            "updated_at": now,
            "paid_at": now
        }}
    )
    
    # Deduct inventory (best effort)
    try:
        for item in order["items"]:
            await db.fabrics.update_one(
                {"id": item["fabric_id"], "quantity_available": {"$gte": item["quantity"]}},
                {"$inc": {"quantity_available": -item["quantity"]}}
            )
    except Exception as e:
        logger.error(f"Failed to update inventory: {str(e)}")
    
    # Get updated order
    updated_order = await db.orders.find_one(
        {"razorpay_order_id": verification.razorpay_order_id},
        {"_id": 0}
    )
    
    return {
        "success": True,
        "message": "Payment verified successfully",
        "order": updated_order
    }

@router.get("/{order_id}")
async def get_order(order_id: str):
    """Get order by ID or order number"""
    order = await db.orders.find_one(
        {"$or": [{"id": order_id}, {"order_number": order_id}]},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

@router.get("/by-razorpay/{razorpay_order_id}")
async def get_order_by_razorpay_id(razorpay_order_id: str):
    """Get order by Razorpay order ID"""
    order = await db.orders.find_one(
        {"razorpay_order_id": razorpay_order_id},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

@router.get("")
async def list_orders(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """List all orders (admin endpoint)"""
    query = {}
    if status:
        query["status"] = status
    if payment_status:
        query["payment_status"] = payment_status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    
    return {
        "orders": orders,
        "total": total,
        "limit": limit,
        "skip": skip
    }

@router.put("/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    """Update order status (admin endpoint)"""
    valid_statuses = ["pending", "payment_pending", "paid", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.orders.update_one(
        {"$or": [{"id": order_id}, {"order_number": order_id}]},
        {"$set": {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"success": True, "message": f"Order status updated to {status}"}

@router.get("/stats/summary")
async def get_order_stats():
    """Get order statistics"""
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "payment_pending"})
    paid_orders = await db.orders.count_documents({"payment_status": "paid"})
    confirmed_orders = await db.orders.count_documents({"status": "confirmed"})
    shipped_orders = await db.orders.count_documents({"status": "shipped"})
    delivered_orders = await db.orders.count_documents({"status": "delivered"})
    
    # Calculate total revenue
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    return {
        "total_orders": total_orders,
        "pending_payment": pending_orders,
        "paid": paid_orders,
        "confirmed": confirmed_orders,
        "shipped": shipped_orders,
        "delivered": delivered_orders,
        "total_revenue": round(total_revenue, 2)
    }

# ==================== WEBHOOK ENDPOINT ====================

@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhook events"""
    try:
        payload = await request.body()
        signature = request.headers.get('X-Razorpay-Signature', '')
        webhook_secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')
        
        # Verify webhook signature if secret is configured
        if webhook_secret:
            expected_signature = hmac.new(
                webhook_secret.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(expected_signature, signature):
                logger.warning("Invalid webhook signature")
                raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Parse payload
        import json
        data = json.loads(payload)
        event = data.get('event', '')
        
        if event == 'payment.captured':
            payment = data.get('payload', {}).get('payment', {}).get('entity', {})
            razorpay_order_id = payment.get('order_id')
            razorpay_payment_id = payment.get('id')
            
            if razorpay_order_id:
                await db.orders.update_one(
                    {"razorpay_order_id": razorpay_order_id},
                    {"$set": {
                        "razorpay_payment_id": razorpay_payment_id,
                        "payment_status": "paid",
                        "status": "confirmed",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                        "paid_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                logger.info(f"Order {razorpay_order_id} marked as paid via webhook")
        
        elif event == 'payment.failed':
            payment = data.get('payload', {}).get('payment', {}).get('entity', {})
            razorpay_order_id = payment.get('order_id')
            
            if razorpay_order_id:
                await db.orders.update_one(
                    {"razorpay_order_id": razorpay_order_id},
                    {"$set": {
                        "payment_status": "failed",
                        "status": "payment_failed",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                logger.info(f"Order {razorpay_order_id} marked as failed via webhook")
        
        return {"status": "ok"}
    
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return JSONResponse(status_code=200, content={"status": "error", "message": str(e)})
