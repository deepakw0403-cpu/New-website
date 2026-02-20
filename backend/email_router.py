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
                        <td style="padding: 5px 0; color: #64748b;">GST (18%)</td>
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
    """Send order confirmation email to customer"""
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
    
    # Send customer confirmation
    try:
        customer_params = {
            "from": SENDER_EMAIL,
            "to": [customer_email],
            "subject": f"Order Confirmed - {order.get('order_number', '')} | Locofast",
            "html": get_order_confirmation_email(order)
        }
        
        customer_result = await asyncio.to_thread(resend.Emails.send, customer_params)
        logger.info(f"Order confirmation email sent to {customer_email}")
        
        # Send admin notification (best effort)
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@locofast.com')
        try:
            admin_params = {
                "from": SENDER_EMAIL,
                "to": [admin_email],
                "subject": f"New Order Received - {order.get('order_number', '')}",
                "html": get_order_received_admin_email(order)
            }
            await asyncio.to_thread(resend.Emails.send, admin_params)
            logger.info(f"Admin notification sent to {admin_email}")
        except Exception as e:
            logger.warning(f"Failed to send admin notification: {str(e)}")
        
        return {
            "success": True,
            "message": f"Order confirmation sent to {customer_email}",
            "email_id": customer_result.get("id")
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
