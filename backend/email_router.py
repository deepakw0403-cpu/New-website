"""
Email Router - Handles email notifications using Resend
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
import asyncio
import logging
import resend

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/email", tags=["email"])

# Database reference (set from main server)
db = None

def set_db(database):
    """Set database reference from main server"""
    global db
    db = database

# Initialize Resend
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_NOTIFICATION_EMAIL = "deepakw0403@gmail.com"

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
    logger.info("Resend API initialized successfully")
else:
    logger.warning("Resend API key not found - email features will be disabled")

# ==================== MODELS ====================

class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str

# ==================== EMAIL TEMPLATES ====================

def get_order_confirmation_email(order: dict) -> str:
    """Generate order confirmation email HTML"""
    items_html = ""
    for item in order.get("items", []):
        items_html += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <strong>{item.get('fabric_name', 'Fabric')}</strong><br>
                <span style="color: #666; font-size: 14px;">{item.get('category_name', '')}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
                {item.get('quantity', 0)} m
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
                ₹{item.get('price_per_meter', 0):,.2f}/m
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
                ₹{(item.get('quantity', 0) * item.get('price_per_meter', 0)):,.2f}
            </td>
        </tr>
        """
    
    customer = order.get("customer", {})
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #2563EB 0%, #1e3a8a 100%); border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Thank you for your order</p>
        </div>
        
        <!-- Order Info -->
        <div style="background: #f8fafc; padding: 20px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
            <table style="width: 100%;">
                <tr>
                    <td>
                        <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">Order Number</strong><br>
                        <span style="font-size: 18px; font-weight: 600; color: #2563EB;">{order.get('order_number', '')}</span>
                    </td>
                    <td style="text-align: right;">
                        <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">Order Date</strong><br>
                        <span style="font-size: 14px;">{order.get('created_at', '')[:10]}</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- Order Items -->
        <div style="background: white; padding: 20px; border: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 15px 0; font-size: 16px; color: #1e293b;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; font-size: 13px;">Item</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #475569; font-size: 13px;">Qty</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #475569; font-size: 13px;">Price</th>
                        <th style="padding: 12px; text-align: right; font-weight: 600; color: #475569; font-size: 13px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
            
            <!-- Totals -->
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 5px 0; color: #64748b;">Subtotal</td>
                        <td style="padding: 5px 0; text-align: right;">₹{order.get('subtotal', 0):,.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #64748b;">GST (5%)</td>
                        <td style="padding: 5px 0; text-align: right;">₹{order.get('tax', 0):,.2f}</td>
                    </tr>
                    <tr style="font-size: 18px; font-weight: 600;">
                        <td style="padding: 15px 0 5px 0; border-top: 1px solid #e2e8f0;">Total Paid</td>
                        <td style="padding: 15px 0 5px 0; text-align: right; color: #059669; border-top: 1px solid #e2e8f0;">₹{order.get('total', 0):,.2f}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <!-- Shipping Info -->
        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #475569;">Shipping Details</h3>
            <p style="margin: 0; color: #1e293b;">
                <strong>{customer.get('name', '')}</strong><br>
                {customer.get('company', '')}<br>
                {customer.get('address', '')}<br>
                {customer.get('city', '')}{', ' + customer.get('state', '') if customer.get('state') else ''} {customer.get('pincode', '')}<br>
                <br>
                <strong>Phone:</strong> {customer.get('phone', '')}<br>
                <strong>Email:</strong> {customer.get('email', '')}
            </p>
        </div>
        
        <!-- Next Steps -->
        <div style="background: #ecfdf5; padding: 20px; border: 1px solid #d1fae5; border-radius: 0 0 12px 12px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #065f46;">What's Next?</h3>
            <ol style="margin: 0; padding-left: 20px; color: #047857;">
                <li style="margin-bottom: 8px;">Our team will verify your order and stock availability</li>
                <li style="margin-bottom: 8px;">You'll receive a confirmation call within 24 hours</li>
                <li style="margin-bottom: 8px;">Dispatch within the timeline mentioned on the product page</li>
                <li>Tracking details will be shared via SMS/Email</li>
            </ol>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 30px 0; color: #64748b; font-size: 13px;">
            <p style="margin: 0 0 10px 0;">Questions about your order?</p>
            <p style="margin: 0;">
                <a href="mailto:support@locofast.com" style="color: #2563EB; text-decoration: none;">support@locofast.com</a> | 
                <a href="tel:+919876543210" style="color: #2563EB; text-decoration: none;">+91 98765 43210</a>
            </p>
            <p style="margin: 20px 0 0 0; color: #94a3b8;">
                Locofast - Reliable Fabric Sourcing for Brands & Manufacturers
            </p>
        </div>
        
    </body>
    </html>
    """

def get_order_received_admin_email(order: dict) -> str:
    """Generate admin notification email for new order"""
    items_summary = "\n".join([
        f"• {item.get('fabric_name')} - {item.get('quantity')}m @ ₹{item.get('price_per_meter')}/m"
        for item in order.get("items", [])
    ])
    
    customer = order.get("customer", {})
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #333;">
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
            <strong style="color: #92400e;">New Order Received!</strong>
        </div>
        
        <h2 style="margin: 0 0 20px 0;">Order #{order.get('order_number', '')}</h2>
        
        <table style="width: 100%; margin-bottom: 20px;">
            <tr>
                <td style="padding: 8px 0;"><strong>Customer:</strong></td>
                <td>{customer.get('name', '')} ({customer.get('company', 'N/A')})</td>
            </tr>
            <tr>
                <td style="padding: 8px 0;"><strong>Email:</strong></td>
                <td>{customer.get('email', '')}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0;"><strong>Phone:</strong></td>
                <td>{customer.get('phone', '')}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0;"><strong>Location:</strong></td>
                <td>{customer.get('city', '')}, {customer.get('state', '')}</td>
            </tr>
        </table>
        
        <h3 style="margin: 20px 0 10px 0;">Order Items:</h3>
        <pre style="background: #f1f5f9; padding: 15px; border-radius: 8px; white-space: pre-wrap;">{items_summary}</pre>
        
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <strong style="font-size: 18px; color: #059669;">Total: ₹{order.get('total', 0):,.2f}</strong>
            <span style="color: #047857; margin-left: 10px;">(Payment: {order.get('payment_status', 'pending').upper()})</span>
        </div>
        
        <p style="margin-top: 30px; color: #64748b; font-size: 13px;">
            <a href="https://locofast.com/admin/orders" style="color: #2563EB;">View in Admin Panel →</a>
        </p>
        
    </body>
    </html>
    """

def get_seller_order_notification_email(order: dict, items: list, seller: dict) -> str:
    """Generate order notification email for seller/supplier"""
    items_html = ""
    total_quantity = 0
    for item in items:
        total_quantity += item.get('quantity', 0)
        items_html += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <strong>{item.get('fabric_name', 'Fabric')}</strong><br>
                <span style="color: #666; font-size: 14px;">{item.get('fabric_code', '')}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
                <span style="background: {'#dbeafe' if item.get('order_type') == 'sample' else '#d1fae5'}; color: {'#1e40af' if item.get('order_type') == 'sample' else '#065f46'}; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    {'Sample' if item.get('order_type') == 'sample' else 'Bulk'}
                </span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
                {item.get('quantity', 0)} meters
            </td>
        </tr>
        """
    
    customer = order.get('customer', {})
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Order Booking!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Please prepare goods for pickup</p>
        </div>
        
        <!-- Order Info -->
        <div style="background: #ecfdf5; padding: 20px; border-left: 1px solid #d1fae5; border-right: 1px solid #d1fae5;">
            <table style="width: 100%;">
                <tr>
                    <td>
                        <strong style="color: #065f46; font-size: 12px; text-transform: uppercase;">Order Number</strong><br>
                        <span style="font-size: 20px; font-weight: 600; color: #059669;">{order.get('order_number', '')}</span>
                    </td>
                    <td style="text-align: right;">
                        <strong style="color: #065f46; font-size: 12px; text-transform: uppercase;">Total Quantity</strong><br>
                        <span style="font-size: 20px; font-weight: 600;">{total_quantity} meters</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- Action Required -->
        <div style="background: #fef3c7; padding: 15px 20px; border-left: 4px solid #f59e0b;">
            <strong style="color: #92400e;">Action Required:</strong>
            <p style="margin: 5px 0 0 0; color: #78350f;">Please keep the following items ready for pickup. Our logistics partner will contact you for collection.</p>
        </div>
        
        <!-- Items -->
        <div style="background: white; padding: 20px; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1e293b;">Items to Prepare</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 12px; text-align: left; font-weight: 600; color: #475569; font-size: 13px;">Fabric</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #475569; font-size: 13px;">Type</th>
                        <th style="padding: 12px; text-align: center; font-weight: 600; color: #475569; font-size: 13px;">Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
        </div>
        
        <!-- Shipping To -->
        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #475569;">Shipping To</h3>
            <p style="margin: 0; color: #1e293b;">
                <strong>{customer.get('name', '')}</strong><br>
                {customer.get('company', '')}<br>
                {customer.get('address', '')}<br>
                {customer.get('city', '')}, {customer.get('state', '')} {customer.get('pincode', '')}<br>
                <br>
                <strong>Phone:</strong> {customer.get('phone', '')}
            </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 30px 0; color: #64748b; font-size: 13px;">
            <p style="margin: 0 0 10px 0;">Questions about this order?</p>
            <p style="margin: 0;">
                <a href="mailto:b2c@locofast.com" style="color: #059669; text-decoration: none;">b2c@locofast.com</a>
            </p>
            <p style="margin: 20px 0 0 0; color: #94a3b8;">
                Locofast - Reliable Fabric Sourcing for Brands & Manufacturers
            </p>
        </div>
        
    </body>
    </html>
    """

def get_enquiry_notification_email(enquiry: dict) -> str:
    """Generate enquiry notification email for admin"""
    enquiry_type = enquiry.get('enquiry_type', 'general')
    type_label = {
        'general': 'General Enquiry',
        'sample_order': 'Sample Order Request',
        'bulk_order': 'Bulk Order Request'
    }.get(enquiry_type, 'Enquiry')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #333;">
        
        <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 20px;">
            <strong style="color: #1e40af;">New {type_label}</strong>
        </div>
        
        <h2 style="margin: 0 0 20px 0;">{enquiry.get('fabric_name', 'Unknown Fabric')}</h2>
        
        <table style="width: 100%; margin-bottom: 20px;">
            <tr>
                <td style="padding: 8px 0; width: 120px;"><strong>Customer:</strong></td>
                <td>{enquiry.get('name', '')} {f"({enquiry.get('company')})" if enquiry.get('company') else ''}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0;"><strong>Email:</strong></td>
                <td><a href="mailto:{enquiry.get('email', '')}">{enquiry.get('email', '')}</a></td>
            </tr>
            <tr>
                <td style="padding: 8px 0;"><strong>Phone:</strong></td>
                <td><a href="tel:{enquiry.get('phone', '')}">{enquiry.get('phone', '')}</a></td>
            </tr>
            <tr>
                <td style="padding: 8px 0;"><strong>Type:</strong></td>
                <td><span style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-size: 12px;">{type_label}</span></td>
            </tr>
            {f'<tr><td style="padding: 8px 0;"><strong>Quantity:</strong></td><td>{enquiry.get("quantity_required", "")}</td></tr>' if enquiry.get('quantity_required') else ''}
        </table>
        
        <h3 style="margin: 20px 0 10px 0;">Message:</h3>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            {enquiry.get('message', 'No message provided')}
        </div>
        
        <p style="margin-top: 30px; color: #64748b; font-size: 13px;">
            <a href="https://locofast.com/admin/enquiries" style="color: #2563EB;">View in Admin Panel →</a>
        </p>
        
    </body>
    </html>
    """

def get_customer_enquiry_confirmation_email(enquiry: dict) -> str:
    """Generate enquiry confirmation email for customer"""
    enquiry_type = enquiry.get('enquiry_type', 'general')
    type_label = {
        'general': 'enquiry',
        'sample_order': 'sample order request',
        'bulk_order': 'bulk order request'
    }.get(enquiry_type, 'enquiry')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #2563EB 0%, #1e3a8a 100%); border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">We've Received Your Request!</h1>
        </div>
        
        <!-- Content -->
        <div style="background: #f8fafc; padding: 30px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
            <p style="margin: 0 0 20px 0;">Hi {enquiry.get('name', 'there').split()[0]},</p>
            
            <p style="margin: 0 0 20px 0;">
                Thank you for your {type_label} regarding <strong>{enquiry.get('fabric_name', 'our fabric')}</strong>. 
                Our team has received your request and will get back to you within 24 hours.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #64748b; text-transform: uppercase;">Your Request Summary</h3>
                <p style="margin: 0 0 8px 0;"><strong>Fabric:</strong> {enquiry.get('fabric_name', 'N/A')}</p>
                {f'<p style="margin: 0 0 8px 0;"><strong>Quantity:</strong> {enquiry.get("quantity_required", "")}</p>' if enquiry.get('quantity_required') else ''}
                <p style="margin: 0;"><strong>Message:</strong> {enquiry.get('message', 'N/A')[:100]}{'...' if len(enquiry.get('message', '')) > 100 else ''}</p>
            </div>
            
            <p style="margin: 0; color: #64748b; font-size: 14px;">
                If you have any urgent questions, feel free to reach out to us at 
                <a href="mailto:b2c@locofast.com" style="color: #2563EB;">b2c@locofast.com</a>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; background: #1e293b; border-radius: 0 0 12px 12px;">
            <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                Locofast - Reliable Fabric Sourcing for Brands & Manufacturers
            </p>
        </div>
        
    </body>
    </html>
    """

# ==================== EMAIL ENDPOINTS ====================

@router.post("/send")
async def send_email(request: EmailRequest):
    """Send a custom email"""
    if not RESEND_API_KEY:
        raise HTTPException(status_code=503, detail="Email service not configured")
    
    params = {
        "from": SENDER_EMAIL,
        "to": [request.recipient_email],
        "subject": request.subject,
        "html": request.html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {
            "success": True,
            "message": f"Email sent to {request.recipient_email}",
            "email_id": email.get("id")
        }
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/order-confirmation/{order_id}")
async def send_order_confirmation(order_id: str):
    """Send order confirmation email to customer and notify sellers"""
    if not RESEND_API_KEY:
        logger.warning("Email service not configured - skipping order confirmation email")
        return {"success": False, "message": "Email service not configured"}
    
    # Get order
    order = await db.orders.find_one(
        {"$or": [{"id": order_id}, {"order_number": order_id}]},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    customer_email = order.get("customer", {}).get("email")
    if not customer_email:
        raise HTTPException(status_code=400, detail="Customer email not found")
    
    results = {"customer_sent": False, "admin_sent": False, "sellers_notified": []}
    
    # Send customer confirmation
    try:
        customer_params = {
            "from": SENDER_EMAIL,
            "to": [customer_email],
            "subject": f"Order Confirmed - {order.get('order_number', '')} | Locofast",
            "html": get_order_confirmation_email(order)
        }
        
        customer_result = await asyncio.to_thread(resend.Emails.send, customer_params)
        results["customer_sent"] = True
        logger.info(f"Order confirmation email sent to {customer_email}")
        
        # Send admin notification (best effort)
        try:
            admin_params = {
                "from": SENDER_EMAIL,
                "to": [ADMIN_NOTIFICATION_EMAIL],
                "subject": f"New Order Received - {order.get('order_number', '')}",
                "html": get_order_received_admin_email(order)
            }
            await asyncio.to_thread(resend.Emails.send, admin_params)
            results["admin_sent"] = True
            logger.info(f"Admin notification sent to {ADMIN_NOTIFICATION_EMAIL}")
        except Exception as e:
            logger.warning(f"Failed to send admin notification: {str(e)}")
        
        # Send seller notifications (best effort)
        items = order.get("items", [])
        seller_items = {}  # Group items by seller
        
        for item in items:
            fabric_id = item.get("fabric_id")
            if fabric_id:
                fabric = await db.fabrics.find_one({"id": fabric_id}, {"_id": 0, "seller_id": 1})
                if fabric and fabric.get("seller_id"):
                    seller_id = fabric["seller_id"]
                    if seller_id not in seller_items:
                        seller_items[seller_id] = []
                    seller_items[seller_id].append(item)
        
        for seller_id, seller_order_items in seller_items.items():
            try:
                seller = await db.sellers.find_one({"id": seller_id}, {"_id": 0})
                if seller and seller.get("contact_email"):
                    seller_params = {
                        "from": SENDER_EMAIL,
                        "to": [seller["contact_email"]],
                        "subject": f"New Order Booking - {order.get('order_number', '')} | Prepare for Pickup",
                        "html": get_seller_order_notification_email(order, seller_order_items, seller)
                    }
                    await asyncio.to_thread(resend.Emails.send, seller_params)
                    results["sellers_notified"].append(seller["contact_email"])
                    logger.info(f"Seller notification sent to {seller['contact_email']}")
            except Exception as e:
                logger.warning(f"Failed to send seller notification to {seller_id}: {str(e)}")
        
        return {
            "success": True,
            "message": f"Order confirmation sent to {customer_email}",
            "email_id": customer_result.get("id"),
            **results
        }
        
    except Exception as e:
        logger.error(f"Failed to send order confirmation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/test")
async def send_test_email(recipient: EmailStr):
    """Send a test email to verify configuration"""
    if not RESEND_API_KEY:
        raise HTTPException(status_code=503, detail="Email service not configured")
    
    params = {
        "from": SENDER_EMAIL,
        "to": [recipient],
        "subject": "Test Email from Locofast",
        "html": """
        <div style="font-family: sans-serif; padding: 20px;">
            <h1 style="color: #2563EB;">Test Email Successful!</h1>
            <p>Your email configuration is working correctly.</p>
            <p style="color: #666;">- Locofast Team</p>
        </div>
        """
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {
            "success": True,
            "message": f"Test email sent to {recipient}",
            "email_id": email.get("id")
        }
    except Exception as e:
        logger.error(f"Failed to send test email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/enquiry-notification")
async def send_enquiry_notification(enquiry: dict):
    """Send enquiry notification to admin and confirmation to customer"""
    results = {"admin_sent": False, "customer_sent": False}
    
    if not RESEND_API_KEY:
        logger.warning("Email service not configured - skipping enquiry notification")
        return {"success": False, "message": "Email service not configured", **results}
    
    customer_email = enquiry.get('email')
    enquiry_type = enquiry.get('enquiry_type', 'general')
    fabric_name = enquiry.get('fabric_name', 'Fabric')
    
    type_label = {
        'general': 'Enquiry',
        'sample_order': 'Sample Order Request',
        'bulk_order': 'Bulk Order Request'
    }.get(enquiry_type, 'Enquiry')
    
    # Send admin notification
    try:
        admin_params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_NOTIFICATION_EMAIL],
            "subject": f"New {type_label} - {fabric_name} | Locofast",
            "html": get_enquiry_notification_email(enquiry)
        }
        await asyncio.to_thread(resend.Emails.send, admin_params)
        results["admin_sent"] = True
        logger.info(f"Enquiry notification sent to {ADMIN_NOTIFICATION_EMAIL}")
    except Exception as e:
        logger.error(f"Failed to send admin notification: {str(e)}")
    
    # Send customer confirmation
    if customer_email:
        try:
            customer_params = {
                "from": SENDER_EMAIL,
                "to": [customer_email],
                "subject": f"We've Received Your {type_label} | Locofast",
                "html": get_customer_enquiry_confirmation_email(enquiry)
            }
            await asyncio.to_thread(resend.Emails.send, customer_params)
            results["customer_sent"] = True
            logger.info(f"Enquiry confirmation sent to {customer_email}")
        except Exception as e:
            logger.error(f"Failed to send customer confirmation: {str(e)}")
    
    return {
        "success": results["admin_sent"] or results["customer_sent"],
        "message": f"Admin: {'sent' if results['admin_sent'] else 'failed'}, Customer: {'sent' if results['customer_sent'] else 'failed'}",
        **results
    }

async def send_enquiry_emails(enquiry: dict):
    """Helper function to send enquiry emails - can be called from other modules"""
    if not RESEND_API_KEY:
        logger.warning("Email service not configured - skipping enquiry emails")
        return False
    
    customer_email = enquiry.get('email')
    enquiry_type = enquiry.get('enquiry_type', 'general')
    fabric_name = enquiry.get('fabric_name', 'Fabric')
    
    type_label = {
        'general': 'Enquiry',
        'sample_order': 'Sample Order Request',
        'bulk_order': 'Bulk Order Request'
    }.get(enquiry_type, 'Enquiry')
    
    # Send admin notification
    try:
        admin_params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_NOTIFICATION_EMAIL],
            "subject": f"New {type_label} - {fabric_name} | Locofast",
            "html": get_enquiry_notification_email(enquiry)
        }
        await asyncio.to_thread(resend.Emails.send, admin_params)
        logger.info(f"Enquiry notification sent to {ADMIN_NOTIFICATION_EMAIL}")
    except Exception as e:
        logger.error(f"Failed to send admin notification: {str(e)}")
    
    # Send customer confirmation
    if customer_email:
        try:
            customer_params = {
                "from": SENDER_EMAIL,
                "to": [customer_email],
                "subject": f"We've Received Your {type_label} | Locofast",
                "html": get_customer_enquiry_confirmation_email(enquiry)
            }
            await asyncio.to_thread(resend.Emails.send, customer_params)
            logger.info(f"Enquiry confirmation sent to {customer_email}")
        except Exception as e:
            logger.error(f"Failed to send customer confirmation: {str(e)}")
    
    return True



# ==================== RFQ EMAIL NOTIFICATION ====================

def get_rfq_notification_email(rfq: dict) -> str:
    """Generate RFQ notification email for admin"""
    category = rfq.get('category', '').upper()
    
    # Build details based on category
    details_html = f"<p><strong>Category:</strong> {category}</p>"
    
    if rfq.get('category') in ['cotton', 'viscose']:
        if rfq.get('fabric_requirement_type'):
            details_html += f"<p><strong>Fabric Type:</strong> {rfq.get('fabric_requirement_type')}</p>"
        if rfq.get('quantity_meters'):
            details_html += f"<p><strong>Quantity:</strong> {rfq.get('quantity_meters').replace('_', ' - ').replace('plus', '+')} meters</p>"
    elif rfq.get('category') == 'knits':
        if rfq.get('knit_quality'):
            details_html += f"<p><strong>Quality:</strong> {rfq.get('knit_quality')}</p>"
        if rfq.get('quantity_kg'):
            details_html += f"<p><strong>Quantity:</strong> {rfq.get('quantity_kg').replace('_', ' - ').replace('plus', '+')} kg</p>"
    elif rfq.get('category') == 'denim':
        if rfq.get('denim_specification'):
            details_html += f"<p><strong>Specification:</strong> {rfq.get('denim_specification')}</p>"
        if rfq.get('quantity_meters'):
            details_html += f"<p><strong>Quantity:</strong> {rfq.get('quantity_meters').replace('_', ' - ').replace('plus', '+')} meters</p>"
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }}
            .rfq-number {{ font-size: 24px; font-weight: bold; margin: 10px 0; }}
            .category-badge {{ display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 5px 12px; border-radius: 20px; font-weight: bold; }}
            .details {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .contact {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>New RFQ Received</h2>
                <div class="rfq-number">{rfq.get('rfq_number', 'N/A')}</div>
                <div class="category-badge">{category}</div>
            </div>
            <div class="content">
                <div class="details">
                    <h3>Requirement Details</h3>
                    {details_html}
                    {f"<p><strong>GST Number:</strong> {rfq.get('gst_number')}</p>" if rfq.get('gst_number') else ""}
                    {f"<p><strong>Additional Notes:</strong> {rfq.get('message')}</p>" if rfq.get('message') else ""}
                </div>
                <div class="contact">
                    <h3>Contact Information</h3>
                    <p><strong>Name:</strong> {rfq.get('full_name', 'N/A')}</p>
                    <p><strong>Email:</strong> <a href="mailto:{rfq.get('email')}">{rfq.get('email', 'N/A')}</a></p>
                    <p><strong>Phone:</strong> <a href="tel:{rfq.get('phone')}">{rfq.get('phone', 'N/A')}</a></p>
                    {f"<p><strong>Website:</strong> <a href='{rfq.get('website')}'>{rfq.get('website')}</a></p>" if rfq.get('website') else ""}
                </div>
            </div>
        </div>
    </body>
    </html>
    """

async def send_rfq_notification(rfq: dict):
    """Send RFQ notification email to admin"""
    if not RESEND_API_KEY:
        logger.warning("Resend not configured - skipping RFQ notification")
        return False
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_NOTIFICATION_EMAIL],
            "subject": f"New RFQ: {rfq.get('rfq_number')} - {rfq.get('category', '').upper()} | Locofast",
            "html": get_rfq_notification_email(rfq)
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"RFQ notification sent: {rfq.get('rfq_number')}")
        return True
    except Exception as e:
        logger.error(f"Failed to send RFQ notification: {str(e)}")
        return False


async def send_rfq_lead_email(lead: dict):
    """Send RFQ lead notification to marketing@locofast.com"""
    if not RESEND_API_KEY:
        logger.warning("Resend API key not configured - skipping RFQ lead email")
        return False
    
    name = lead.get('name', '')
    email = lead.get('email', '')
    phone = lead.get('phone', '')
    company = lead.get('company', '')
    gst = lead.get('gst_number', '')
    fabric_type = lead.get('fabric_type', '')
    
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: linear-gradient(135deg, #2563EB, #1d4ed8); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">New Quote Request</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">From Homepage RFQ Form</p>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px 0; font-weight: bold; width: 140px; color: #64748b;">Name</td><td style="padding: 10px 0;">{name}</td></tr>
                <tr style="background: #f8fafc;"><td style="padding: 10px 0; font-weight: bold; color: #64748b;">Email</td><td style="padding: 10px 0;"><a href="mailto:{email}" style="color: #2563EB;">{email}</a></td></tr>
                <tr><td style="padding: 10px 0; font-weight: bold; color: #64748b;">Phone</td><td style="padding: 10px 0;"><a href="tel:+91{phone}" style="color: #2563EB;">+91 {phone}</a></td></tr>
                <tr style="background: #f8fafc;"><td style="padding: 10px 0; font-weight: bold; color: #64748b;">Company</td><td style="padding: 10px 0;">{company}</td></tr>
                <tr><td style="padding: 10px 0; font-weight: bold; color: #64748b;">GST Number</td><td style="padding: 10px 0; font-family: monospace;">{gst}</td></tr>
                <tr style="background: #f8fafc;"><td style="padding: 10px 0; font-weight: bold; color: #64748b;">Fabric Type</td><td style="padding: 10px 0;"><strong style="color: #2563EB;">{fabric_type}</strong></td></tr>
            </table>
        </div>
        <div style="text-align: center; padding: 16px; background: #f8fafc; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">Locofast RFQ Lead System</p>
        </div>
    </body>
    </html>
    """
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": ["marketing@locofast.com"],
            "subject": f"[RFQ Lead] {name} - {company} - {fabric_type}",
            "html": html,
            "reply_to": email
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"RFQ lead email sent to marketing@locofast.com for {name}")
        return True
    except Exception as e:
        logger.error(f"Failed to send RFQ lead email: {str(e)}")
        return False
