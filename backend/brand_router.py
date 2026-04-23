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
    allowed_category_ids: List[str] = []
    # Initial admin user for the brand
    admin_user_email: EmailStr
    admin_user_name: str


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    gst: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    allowed_category_ids: Optional[List[str]] = None
    status: Optional[str] = None


class BrandUserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str = "brand_user"  # brand_admin | brand_user


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

    temp_pw = _gen_password()
    user_doc = {
        "id": str(uuid.uuid4()),
        "brand_id": brand_id,
        "email": data.email.lower(),
        "name": data.name,
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
            "brand_id": user["brand_id"],
            "brand_name": brand["name"],
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


# ───── BRAND-FACING — Filtered Catalog ─────
@router.get("/brand/fabrics")
async def brand_list_fabrics(user=Depends(get_current_brand_user)):
    brand = await db.brands.find_one({"id": user["brand_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    allowed = brand.get("allowed_category_ids") or []
    if not allowed:
        return []  # No categories unlocked yet

    fabrics = await db.fabrics.find(
        {"category_id": {"$in": allowed}, "status": {"$ne": "draft"}},
        {"_id": 0},
    ).to_list(length=1000)

    # Attach category names
    cats = await db.categories.find({"id": {"$in": allowed}}, {"_id": 0}).to_list(length=50)
    cat_map = {c["id"]: c["name"] for c in cats}
    for f in fabrics:
        f["category_name"] = cat_map.get(f.get("category_id"), "")
    return fabrics


@router.get("/brand/fabrics/{fabric_id_or_slug}")
async def brand_get_fabric(fabric_id_or_slug: str, user=Depends(get_current_brand_user)):
    brand = await db.brands.find_one({"id": user["brand_id"]}, {"_id": 0})
    allowed = brand.get("allowed_category_ids") or []
    f = await db.fabrics.find_one({"$or": [{"id": fabric_id_or_slug}, {"slug": fabric_id_or_slug}]}, {"_id": 0})
    if not f or f.get("category_id") not in allowed:
        raise HTTPException(status_code=404, detail="Fabric not available for your brand")
    return f
