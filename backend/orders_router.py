"""
Orders Router - Handles order creation, payment, and management
Phase 1: Razorpay Integration + Order Management
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, StreamingResponse
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
import io

from shiprocket_service import shiprocket_service

# PDF Generation imports
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

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
    seller_id: str = ""
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

class ShippingInfo(BaseModel):
    courier_id: Optional[int] = None
    courier_name: Optional[str] = None
    rate: Optional[float] = None
    estimated_delivery_days: Optional[str] = None

class CouponInfo(BaseModel):
    code: str = ""
    discount_type: str = ""
    discount_value: float = 0
    discount_amount: float = 0

class OrderCreate(BaseModel):
    items: List[OrderItem]
    customer: CustomerInfo
    notes: str = ""
    coupon: Optional[CouponInfo] = None
    discount: float = 0

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    order_number: str  # Human readable order number like ORD-XXXXX
    items: List[OrderItem]
    customer: CustomerInfo
    subtotal: float
    tax: float = 0
    discount: float = 0
    coupon: Optional[dict] = None
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
    discount = order_data.discount or 0
    final_total = max(0, totals["total"] - discount)
    
    # Generate order ID and number
    order_id = str(uuid.uuid4())
    order_number = await generate_order_number()
    
    # Create Razorpay order
    try:
        razorpay_order = razorpay_client.order.create({
            "amount": int(final_total * 100),  # Amount in paise
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
        "discount": discount,
        "coupon": order_data.coupon.model_dump() if order_data.coupon else None,
        "total": final_total,
        "currency": "INR",
        "status": "payment_pending",
        "payment_status": "initiated",
        "razorpay_order_id": razorpay_order["id"],
        "razorpay_payment_id": "",
        "razorpay_signature": "",
        "awb_code": None,
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
        "amount": final_total,
        "amount_paise": int(final_total * 100),
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
    
    # Create Shiprocket shipment (best effort, non-blocking)
    try:
        shiprocket_result = await create_shiprocket_shipment(order)
        if shiprocket_result.get("success"):
            await db.orders.update_one(
                {"razorpay_order_id": verification.razorpay_order_id},
                {"$set": {
                    "shiprocket_order_id": shiprocket_result.get("shiprocket_order_id"),
                    "shiprocket_shipment_id": shiprocket_result.get("shipment_id"),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            logger.info(f"Shiprocket shipment created for order {order['order_number']}")
    except Exception as e:
        logger.error(f"Failed to create Shiprocket shipment: {str(e)}")
    
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


async def create_shiprocket_shipment(order: dict) -> dict:
    """Create a shipment in Shiprocket after payment is confirmed"""
    try:
        customer = order.get("customer", {})
        items = order.get("items", [])
        
        if not customer or not items:
            return {"success": False, "error": "Missing customer or items"}
        
        # Prepare order items for Shiprocket
        shiprocket_items = []
        total_quantity = 0
        for item in items:
            shiprocket_items.append({
                "name": item.get("fabric_name", "Fabric"),
                "sku": item.get("fabric_code") or item.get("fabric_id", "")[:8],
                "units": 1,  # Each order item is 1 unit
                "selling_price": item.get("price_per_meter", 0) * item.get("quantity", 1),
                "hsn": "5407"  # HSN code for fabrics
            })
            total_quantity += item.get("quantity", 1)
        
        # Calculate weight (0.3 kg per meter, min 0.5 kg)
        weight_kg = max(0.5, total_quantity * 0.3)
        
        # Get pickup location from shipping info or default
        pickup_location = "Primary"  # Default pickup location name in Shiprocket
        
        result = await shiprocket_service.create_order(
            order_id=order.get("order_number", order.get("id")),
            order_date=datetime.now().strftime("%Y-%m-%d %H:%M"),
            pickup_location=pickup_location,
            billing_customer_name=customer.get("name", ""),
            billing_phone=customer.get("phone", ""),
            billing_address=customer.get("address", ""),
            billing_city=customer.get("city", ""),
            billing_state=customer.get("state", ""),
            billing_pincode=customer.get("pincode", ""),
            billing_email=customer.get("email", ""),
            shipping_customer_name=customer.get("name", ""),
            shipping_phone=customer.get("phone", ""),
            shipping_address=customer.get("address", ""),
            shipping_city=customer.get("city", ""),
            shipping_state=customer.get("state", ""),
            shipping_pincode=customer.get("pincode", ""),
            order_items=shiprocket_items,
            payment_method="Prepaid",  # Always prepaid since Razorpay handles payment
            sub_total=order.get("subtotal", 0),
            length=40,  # Default package dimensions for fabric
            breadth=30,
            height=15,
            weight=weight_kg
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error creating Shiprocket shipment: {str(e)}")
        return {"success": False, "error": str(e)}

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

# ==================== INVOICE GENERATION ====================

def number_to_words(num: float) -> str:
    """Convert number to words (Indian format)"""
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    
    if num == 0:
        return 'Zero'
    
    num = int(round(num))
    
    def words_under_100(n):
        if n < 20:
            return ones[n]
        return tens[n // 10] + ('' if n % 10 == 0 else ' ' + ones[n % 10])
    
    def words_under_1000(n):
        if n < 100:
            return words_under_100(n)
        return ones[n // 100] + ' Hundred' + ('' if n % 100 == 0 else ' and ' + words_under_100(n % 100))
    
    # Indian numbering: Crores, Lakhs, Thousands, Hundreds
    if num >= 10000000:  # Crores
        crores = num // 10000000
        remainder = num % 10000000
        result = words_under_100(crores) + ' Crore'
        if remainder:
            result += ' ' + number_to_words(remainder)
        return result
    elif num >= 100000:  # Lakhs
        lakhs = num // 100000
        remainder = num % 100000
        result = words_under_100(lakhs) + ' Lakh'
        if remainder:
            result += ' ' + number_to_words(remainder)
        return result
    elif num >= 1000:  # Thousands
        thousands = num // 1000
        remainder = num % 1000
        result = words_under_100(thousands) + ' Thousand'
        if remainder:
            result += ' ' + words_under_1000(remainder)
        return result
    else:
        return words_under_1000(num)

def generate_invoice_pdf(order: dict) -> io.BytesIO:
    """Generate a GST-compliant invoice PDF"""
    buffer = io.BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=TA_CENTER,
        spaceAfter=5*mm,
        textColor=colors.HexColor('#1e40af')
    )
    
    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=11,
        spaceBefore=3*mm,
        spaceAfter=2*mm,
        textColor=colors.HexColor('#1e40af')
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=9,
        leading=12
    )
    
    small_style = ParagraphStyle(
        'Small',
        parent=styles['Normal'],
        fontSize=8,
        leading=10
    )
    
    bold_style = ParagraphStyle(
        'Bold',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        fontName='Helvetica-Bold'
    )
    
    # Header - Company Name
    elements.append(Paragraph("LOCOFAST", title_style))
    elements.append(Paragraph("B2B Fabric Sourcing Platform", ParagraphStyle(
        'Subtitle', parent=styles['Normal'], fontSize=10, alignment=TA_CENTER, textColor=colors.grey
    )))
    elements.append(Spacer(1, 5*mm))
    
    # Tax Invoice Title
    elements.append(Paragraph("TAX INVOICE", ParagraphStyle(
        'InvoiceTitle', parent=styles['Heading1'], fontSize=14, alignment=TA_CENTER, 
        textColor=colors.white, backColor=colors.HexColor('#1e40af'), 
        borderPadding=5, spaceBefore=2*mm, spaceAfter=5*mm
    )))
    
    # Invoice Details Table
    customer = order.get('customer', {})
    invoice_date = order.get('paid_at') or order.get('created_at', '')
    if invoice_date:
        try:
            invoice_date = invoice_date[:10]  # Extract YYYY-MM-DD
        except:
            invoice_date = datetime.now().strftime('%Y-%m-%d')
    
    invoice_details = [
        ['Invoice No:', order.get('order_number', 'N/A'), 'Invoice Date:', invoice_date],
        ['Order ID:', order.get('id', 'N/A')[:8] + '...', 'Payment Status:', order.get('payment_status', 'N/A').upper()],
    ]
    
    invoice_table = Table(invoice_details, colWidths=[25*mm, 55*mm, 30*mm, 50*mm])
    invoice_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#1e40af')),
    ]))
    elements.append(invoice_table)
    elements.append(Spacer(1, 5*mm))
    
    # Seller and Buyer Details Side by Side
    seller_info = """<b>Sold By:</b><br/>
    LOCOFAST ONLINE SERVICES PRIVATE LIMITED<br/>
    First Floor, Khasra No 385, Deskconnect<br/>
    100 Feet Road, Opp. Corporation Bank<br/>
    Ghitorni, New Delhi - 110030<br/>
    <b>GSTIN:</b> 07AADCL8794N1ZM<br/>
    <b>Email:</b> mail@locofast.com<br/>
    <b>Phone:</b> +91-8920392418"""
    
    buyer_info = f"""<b>Bill To:</b><br/>
    {customer.get('name', 'N/A')}<br/>
    {customer.get('company', '') + '<br/>' if customer.get('company') else ''}
    {customer.get('address', 'N/A')}<br/>
    {customer.get('city', '')}, {customer.get('state', '')}<br/>
    PIN: {customer.get('pincode', 'N/A')}<br/>
    <b>Phone:</b> {customer.get('phone', 'N/A')}<br/>
    <b>Email:</b> {customer.get('email', 'N/A')}"""
    
    address_table = Table([
        [Paragraph(seller_info, small_style), Paragraph(buyer_info, small_style)]
    ], colWidths=[90*mm, 90*mm])
    address_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (0, 0), 0.5, colors.HexColor('#e5e7eb')),
        ('BOX', (1, 0), (1, 0), 0.5, colors.HexColor('#e5e7eb')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(address_table)
    elements.append(Spacer(1, 5*mm))
    
    # Items Table
    elements.append(Paragraph("Order Items", heading_style))
    
    # Table Header - Added Lead Time column
    items_data = [
        ['#', 'Description', 'HSN', 'Qty (m)', 'Rate (₹/m)', 'Lead Time', 'Amount (₹)']
    ]
    
    # Table Rows
    items = order.get('items', [])
    has_bulk_items = False
    
    for idx, item in enumerate(items, 1):
        qty = item.get('quantity', 0)
        rate = item.get('price_per_meter', 0)
        amount = qty * rate
        order_type = item.get('order_type', '').lower()
        
        description = f"{item.get('fabric_name', 'Fabric')}"
        if item.get('fabric_code'):
            description += f"\nCode: {item.get('fabric_code')}"
        if order_type:
            description += f"\nType: {order_type.title()}"
        
        # Determine lead time based on order type
        if order_type == 'sample':
            lead_time = "Ready Stock"
        else:
            # Bulk order - check for dispatch_timeline or use default
            has_bulk_items = True
            dispatch_timeline = item.get('dispatch_timeline')
            if dispatch_timeline:
                lead_time = dispatch_timeline
            else:
                # Default lead time for bulk production
                lead_time = "15-20 days"
        
        items_data.append([
            str(idx),
            Paragraph(description, small_style),
            '5407',  # HSN code for fabrics
            str(qty),
            f"₹{rate:,.2f}",
            lead_time,
            f"₹{amount:,.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[8*mm, 58*mm, 15*mm, 18*mm, 24*mm, 25*mm, 28*mm])
    items_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        # Body
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # #
        ('ALIGN', (2, 1), (2, -1), 'CENTER'),  # HSN
        ('ALIGN', (3, 1), (3, -1), 'CENTER'),  # Qty
        ('ALIGN', (4, 1), (4, -1), 'RIGHT'),   # Rate
        ('ALIGN', (5, 1), (5, -1), 'CENTER'),  # Lead Time
        ('ALIGN', (6, 1), (6, -1), 'RIGHT'),   # Amount
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 3*mm))
    
    # Add bulk production note if there are bulk items
    if has_bulk_items:
        bulk_note = """<b>Note:</b> Lead time for bulk production items is estimated from the date of order confirmation 
        and payment. Actual delivery may vary based on production schedules and material availability. 
        You will receive tracking details once the order is dispatched."""
        elements.append(Paragraph(bulk_note, ParagraphStyle(
            'BulkNote', parent=styles['Normal'], fontSize=7, textColor=colors.HexColor('#b45309'),
            backColor=colors.HexColor('#fef3c7'), borderPadding=5, leading=9
        )))
        elements.append(Spacer(1, 3*mm))
    
    elements.append(Spacer(1, 2*mm))
    
    # Totals Table
    subtotal = order.get('subtotal', 0)
    tax = order.get('tax', 0)
    discount = order.get('discount', 0)
    total = order.get('total', 0)
    
    # GST split (CGST + SGST for intra-state, IGST for inter-state)
    cgst = tax / 2
    sgst = tax / 2
    
    totals_data = [
        ['Subtotal:', f"₹{subtotal:,.2f}"],
        ['CGST (2.5%):', f"₹{cgst:,.2f}"],
        ['SGST (2.5%):', f"₹{sgst:,.2f}"],
        ['Logistics:', 'FREE (Included)'],
    ]
    
    if discount > 0:
        coupon = order.get('coupon', {})
        coupon_code = coupon.get('code', 'DISCOUNT') if coupon else 'DISCOUNT'
        totals_data.append([f'Coupon ({coupon_code}):', f"-₹{discount:,.2f}"])
    
    totals_data.append(['TOTAL:', f"₹{total:,.2f}"])
    
    totals_table = Table(totals_data, colWidths=[130*mm, 46*mm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#1e40af')),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor('#1e40af')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 3*mm))
    
    # Amount in Words
    amount_words = number_to_words(total)
    elements.append(Paragraph(
        f"<b>Amount in Words:</b> {amount_words} Rupees Only",
        ParagraphStyle('AmountWords', parent=styles['Normal'], fontSize=9, 
                      backColor=colors.HexColor('#f0f9ff'), borderPadding=5)
    ))
    elements.append(Spacer(1, 5*mm))
    
    # Terms and Conditions
    elements.append(Paragraph("Terms & Conditions", heading_style))
    terms = """
    1. Goods once sold will not be taken back or exchanged.<br/>
    2. All disputes are subject to Delhi jurisdiction only.<br/>
    3. Payment must be made in full before dispatch of goods.<br/>
    4. Delivery timelines are estimates and may vary based on availability.<br/>
    5. E&OE (Errors and Omissions Excepted).<br/>
    6. This is a computer-generated invoice and does not require a physical signature.<br/><br/>
    <b>For any queries, contact us at:</b><br/>
    Email: mail@locofast.com | Phone: +91-8920392418
    """
    elements.append(Paragraph(terms, ParagraphStyle(
        'Terms', parent=styles['Normal'], fontSize=7, textColor=colors.grey, leading=10
    )))
    
    elements.append(Spacer(1, 10*mm))
    
    # Footer
    elements.append(Paragraph(
        "Thank you for your business! | www.locofast.com | mail@locofast.com | +91-8920392418",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER, textColor=colors.grey)
    ))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

@router.get("/{order_id}/invoice")
async def get_invoice(order_id: str):
    """Generate and download invoice PDF for an order"""
    # Find order
    order = await db.orders.find_one(
        {"$or": [{"id": order_id}, {"order_number": order_id}]},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Only allow invoice for paid orders
    if order.get('payment_status') != 'paid':
        raise HTTPException(status_code=400, detail="Invoice available only for paid orders")
    
    # Generate PDF
    try:
        pdf_buffer = generate_invoice_pdf(order)
        
        # Return as downloadable file
        filename = f"Invoice_{order.get('order_number', order_id)}.pdf"
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/pdf"
            }
        )
    except Exception as e:
        logger.error(f"Failed to generate invoice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate invoice: {str(e)}")
