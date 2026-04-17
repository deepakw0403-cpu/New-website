from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import shutil

# Load environment variables FIRST before importing modules that need them
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Now import modules that depend on environment variables
from tools_router import router as tools_router
from seo_router import router as seo_router
from blog_router import router as blog_router
from supplier_router import router as supplier_router
import orders_router
import email_router
import vendor_router
import coupon_router
import cloudinary_router
import rfq_router
import supplier_profile_router

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable is required")
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class AdminCreate(BaseModel):
    email: str
    password: str
    name: str

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str

class TokenResponse(BaseModel):
    token: str
    admin: AdminResponse

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str = ""
    image_url: str = ""
    created_at: str

# Composition Item Model
class CompositionItem(BaseModel):
    material: str
    percentage: int

# Seller Models
class SellerCreate(BaseModel):
    name: str
    company_name: str
    description: Optional[str] = ""
    logo_url: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    contact_email: str  # Required for notifications
    contact_phone: str  # Required
    category_ids: List[str] = []
    is_active: bool = True
    password: Optional[str] = ""  # For vendor portal login
    # Additional fields
    established_year: Optional[int] = None
    monthly_capacity: Optional[str] = ""
    employee_count: Optional[str] = ""
    factory_size: Optional[str] = ""
    turnover_range: Optional[str] = ""
    certifications: Optional[List[str]] = []
    export_markets: Optional[List[str]] = []
    gst_number: Optional[str] = ""

class SellerUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    category_ids: Optional[List[str]] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    # Additional fields
    established_year: Optional[int] = None
    monthly_capacity: Optional[str] = None
    employee_count: Optional[str] = None
    factory_size: Optional[str] = None
    turnover_range: Optional[str] = None
    certifications: Optional[List[str]] = None
    export_markets: Optional[List[str]] = None
    gst_number: Optional[str] = None

class Seller(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    seller_code: str = ""
    name: str
    company_name: str
    description: str = ""
    logo_url: str = ""
    city: str = ""
    state: str = ""
    contact_email: str = ""
    contact_phone: str = ""
    category_ids: List[str] = []
    category_names: List[str] = []
    is_active: bool = True
    created_at: str
    # Additional fields
    established_year: Optional[int] = None
    monthly_capacity: str = ""
    employee_count: str = ""
    factory_size: str = ""
    turnover_range: str = ""
    certifications: List[str] = []
    export_markets: List[str] = []
    gst_number: str = ""

class FabricCreate(BaseModel):
    name: str
    category_id: str
    seller_id: Optional[str] = ""
    article_id: Optional[str] = ""  # Parent article for color variants
    fabric_type: str  # woven / knitted / non-woven
    pattern: str = "Solid"  # Solid / Print / None
    composition: List[CompositionItem] = []
    gsm: Optional[int] = None  # GSM value
    ounce: Optional[str] = ""  # Ounce value (alternative to GSM)
    weight_unit: str = "gsm"  # "gsm" or "ounce"
    width: str
    warp_count: Optional[str] = ""  # For non-polyester: ply/count format (e.g., "2/40")
    weft_count: Optional[str] = ""  # For non-polyester: ply/count format (e.g., "1/30")
    yarn_count: Optional[str] = ""  # Yarn count (e.g., 40s, 60s, 2/40)
    denier: Optional[int] = None  # For polyester: denier value (1-100)
    color: str
    finish: Optional[str] = ""  # Bio, Double bio, Silicon, etc.
    moq: str
    starting_price: Optional[str] = ""
    availability: List[str] = []  # Sample, Bulk, On Request
    stock_type: str = "ready_stock"  # ready_stock or made_to_order
    description: str
    tags: List[str] = []
    images: List[str] = []
    videos: List[str] = []
    # Inventory fields
    quantity_available: Optional[int] = None
    rate_per_meter: Optional[float] = None
    dispatch_timeline: Optional[str] = ""  # Legacy field
    sample_delivery_days: Optional[str] = ""  # e.g., "1-3", "3-5", etc.
    bulk_delivery_days: Optional[str] = ""  # e.g., "15-17", "17-19", etc.
    is_bookable: bool = False  # Whether this fabric can be directly ordered
    # Pricing fields
    sample_price: Optional[float] = None  # Price per meter for samples (1-5m)
    pricing_tiers: List[dict] = []  # [{min_qty, max_qty, price_per_meter}, ...]
    # Denim-specific fields
    weft_shrinkage: Optional[float] = None  # Percentage
    stretch_percentage: Optional[float] = None  # Percentage
    # Seller's unique serial number for this SKU
    seller_sku: Optional[str] = ""
    hsn_code: Optional[str] = ""  # 6-digit HSN code for invoicing

class FabricUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    seller_id: Optional[str] = None
    article_id: Optional[str] = None
    fabric_type: Optional[str] = None
    pattern: Optional[str] = None
    composition: Optional[List[CompositionItem]] = None
    gsm: Optional[int] = None
    ounce: Optional[str] = None
    weight_unit: Optional[str] = None
    width: Optional[str] = None
    warp_count: Optional[str] = None
    weft_count: Optional[str] = None
    yarn_count: Optional[str] = None
    denier: Optional[int] = None
    color: Optional[str] = None
    finish: Optional[str] = None
    moq: Optional[str] = None
    starting_price: Optional[str] = None
    availability: Optional[List[str]] = None
    stock_type: Optional[str] = None  # ready_stock or made_to_order
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    images: Optional[List[str]] = None
    videos: Optional[List[str]] = None
    # Inventory fields
    quantity_available: Optional[int] = None
    rate_per_meter: Optional[float] = None
    dispatch_timeline: Optional[str] = None
    sample_delivery_days: Optional[str] = None
    bulk_delivery_days: Optional[str] = None
    is_bookable: Optional[bool] = None
    # Pricing fields
    sample_price: Optional[float] = None
    pricing_tiers: Optional[List[dict]] = None
    # Denim-specific fields
    weft_shrinkage: Optional[float] = None
    stretch_percentage: Optional[float] = None
    seller_sku: Optional[str] = None
    hsn_code: Optional[str] = None  # 6-digit HSN code for invoicing
    status: Optional[str] = None  # pending, approved, rejected

class Fabric(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    fabric_code: str = ""  # Unique ID like LF-XXXXX
    name: str
    category_id: str
    category_name: str = ""
    seller_id: str = ""
    seller_name: str = ""
    seller_company: str = ""
    seller_code: str = ""  # Seller's unique code
    article_id: str = ""  # Parent article for color variants
    fabric_type: str
    pattern: str = "Solid"
    composition: List[CompositionItem] = []
    gsm: Optional[int] = None
    ounce: str = ""
    weight_unit: str = "gsm"
    width: str
    warp_count: str = ""
    weft_count: str = ""
    yarn_count: str = ""
    denier: Optional[int] = None
    color: str
    finish: str = ""
    moq: str
    starting_price: str = ""
    availability: List[str] = []
    stock_type: str = "ready_stock"  # ready_stock or made_to_order
    description: str
    tags: List[str] = []
    images: List[str] = []
    videos: List[str] = []
    # Inventory fields
    quantity_available: Optional[int] = None
    rate_per_meter: Optional[float] = None
    dispatch_timeline: str = ""
    sample_delivery_days: str = ""
    bulk_delivery_days: str = ""
    is_bookable: bool = False
    # Pricing fields
    sample_price: Optional[float] = None
    pricing_tiers: List[dict] = []
    # Denim-specific fields
    weft_shrinkage: Optional[float] = None
    stretch_percentage: Optional[float] = None
    seller_sku: str = ""
    status: Optional[str] = None  # pending, approved, rejected (None for legacy/admin fabrics)
    created_at: str

class EnquiryCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    company: Optional[str] = ""
    message: str
    fabric_id: Optional[str] = None
    fabric_name: Optional[str] = None
    fabric_code: Optional[str] = None
    enquiry_type: Optional[str] = "general"  # general, rfq, sample_order, bulk_order, supplier_signup
    source: Optional[str] = "website"  # homepage, supplier_signup, rfq, contact, fabric_detail, assisted_sourcing

class Enquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    phone: str = ""
    company: str = ""
    message: str
    fabric_id: Optional[str] = None
    fabric_name: Optional[str] = None
    fabric_code: Optional[str] = None
    enquiry_type: Optional[str] = "general"
    source: Optional[str] = "website"
    status: str = "new"
    created_at: str

# Collection Models (for marketing ranges/occasions)
class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    fabric_ids: List[str] = []
    is_featured: bool = False

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    fabric_ids: Optional[List[str]] = None
    is_featured: Optional[bool] = None

class Collection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str = ""
    image_url: str = ""
    fabric_ids: List[str] = []
    fabric_count: int = 0
    is_featured: bool = False
    created_at: str

# Article Model (for grouping color variants under one article)
class ArticleCreate(BaseModel):
    name: str
    base_fabric_id: Optional[str] = ""  # The main/reference fabric
    description: Optional[str] = ""
    seller_id: Optional[str] = ""
    category_id: Optional[str] = ""

class ArticleUpdate(BaseModel):
    name: Optional[str] = None
    base_fabric_id: Optional[str] = None
    description: Optional[str] = None
    seller_id: Optional[str] = None
    category_id: Optional[str] = None

class Article(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    article_code: str = ""  # Unique code like ART-XXXXX
    name: str
    base_fabric_id: str = ""
    description: str = ""
    seller_id: str = ""
    seller_name: str = ""
    category_id: str = ""
    category_name: str = ""
    variant_count: int = 0  # Number of color variants
    created_at: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(admin_id: str) -> str:
    payload = {
        'sub': admin_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        admin_id = payload.get('sub')
        admin = await db.admins.find_one({'id': admin_id}, {'_id': 0})
        if not admin:
            raise HTTPException(status_code=401, detail='Invalid token')
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register_admin(data: AdminCreate):
    existing = await db.admins.find_one({'email': data.email})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    
    admin_id = str(uuid.uuid4())
    admin_doc = {
        'id': admin_id,
        'email': data.email,
        'password': hash_password(data.password),
        'name': data.name,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin_doc)
    token = create_token(admin_id)
    return TokenResponse(
        token=token,
        admin=AdminResponse(id=admin_id, email=data.email, name=data.name)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login_admin(data: AdminLogin):
    admin = await db.admins.find_one({'email': data.email})
    if not admin or not verify_password(data.password, admin['password']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    token = create_token(admin['id'])
    return TokenResponse(
        token=token,
        admin=AdminResponse(id=admin['id'], email=admin['email'], name=admin['name'])
    )

@api_router.get("/auth/me", response_model=AdminResponse)
async def get_me(admin=Depends(get_current_admin)):
    return AdminResponse(id=admin['id'], email=admin['email'], name=admin['name'])

# ==================== CATEGORY ROUTES ====================

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {'_id': 0}).to_list(100)
    return categories

@api_router.get("/categories/{category_id}", response_model=Category)
async def get_category(category_id: str):
    category = await db.categories.find_one({'id': category_id}, {'_id': 0})
    if not category:
        raise HTTPException(status_code=404, detail='Category not found')
    return category

@api_router.post("/categories", response_model=Category)
async def create_category(data: CategoryCreate, admin=Depends(get_current_admin)):
    category_id = str(uuid.uuid4())
    category_doc = {
        'id': category_id,
        'name': data.name,
        'description': data.description or "",
        'image_url': data.image_url or "",
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(category_doc)
    return Category(**category_doc)

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, data: CategoryUpdate, admin=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail='No data to update')
    
    result = await db.categories.update_one({'id': category_id}, {'$set': update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Category not found')
    
    category = await db.categories.find_one({'id': category_id}, {'_id': 0})
    return Category(**category)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, admin=Depends(get_current_admin)):
    result = await db.categories.delete_one({'id': category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Category not found')
    return {'message': 'Category deleted'}

# ==================== SELLER ROUTES ====================

@api_router.get("/sellers", response_model=List[Seller])
async def get_sellers(include_inactive: bool = Query(False)):
    query = {} if include_inactive else {'is_active': {'$ne': False}}
    sellers = await db.sellers.find(query, {'_id': 0}).sort('created_at', -1).to_list(100)
    
    # Get all category IDs needed
    all_cat_ids = []
    for seller in sellers:
        all_cat_ids.extend(seller.get('category_ids', []))
    all_cat_ids = list(set(all_cat_ids))
    
    # Fetch categories
    categories = await db.categories.find({'id': {'$in': all_cat_ids}}, {'_id': 0}).to_list(100) if all_cat_ids else []
    cat_map = {c['id']: c['name'] for c in categories}
    
    # Add category names to each seller
    for seller in sellers:
        seller['category_names'] = [cat_map.get(cid, '') for cid in seller.get('category_ids', []) if cat_map.get(cid)]
        if 'category_ids' not in seller:
            seller['category_ids'] = []
        if 'city' not in seller:
            seller['city'] = seller.get('location', '')
        if 'state' not in seller:
            seller['state'] = ''
        if 'is_active' not in seller:
            seller['is_active'] = True
        if 'seller_code' not in seller:
            seller['seller_code'] = ''
        if 'created_at' not in seller:
            seller['created_at'] = datetime.now(timezone.utc).isoformat()
        if 'description' not in seller:
            seller['description'] = ''
        if 'logo_url' not in seller:
            seller['logo_url'] = ''
        if 'contact_email' not in seller:
            seller['contact_email'] = ''
        if 'contact_phone' not in seller:
            seller['contact_phone'] = ''
        if 'company_name' not in seller:
            seller['company_name'] = seller.get('name', '')
    
    return sellers

@api_router.get("/sellers/{seller_id}", response_model=Seller)
async def get_seller(seller_id: str):
    seller = await db.sellers.find_one({'id': seller_id}, {'_id': 0})
    if not seller:
        raise HTTPException(status_code=404, detail='Seller not found')
    
    # Get category names
    category_names = []
    if seller.get('category_ids'):
        categories = await db.categories.find({'id': {'$in': seller['category_ids']}}, {'_id': 0}).to_list(100)
        category_names = [c['name'] for c in categories]
    seller['category_names'] = category_names
    
    # Handle legacy fields
    if 'category_ids' not in seller:
        seller['category_ids'] = []
    if 'city' not in seller:
        seller['city'] = seller.get('location', '')
    if 'state' not in seller:
        seller['state'] = ''
    if 'is_active' not in seller:
        seller['is_active'] = True
    if 'seller_code' not in seller:
        seller['seller_code'] = ''
    if 'created_at' not in seller:
        seller['created_at'] = datetime.now(timezone.utc).isoformat()
    if 'description' not in seller:
        seller['description'] = ''
    if 'logo_url' not in seller:
        seller['logo_url'] = ''
    if 'contact_email' not in seller:
        seller['contact_email'] = ''
    if 'contact_phone' not in seller:
        seller['contact_phone'] = ''
    if 'company_name' not in seller:
        seller['company_name'] = seller.get('name', '')
    
    return seller

@api_router.post("/sellers", response_model=Seller)
async def create_seller(data: SellerCreate, admin=Depends(get_current_admin)):
    seller_id = str(uuid.uuid4())
    seller_code = await generate_seller_code()
    
    # Get category names for response
    category_names = []
    if data.category_ids:
        categories = await db.categories.find({'id': {'$in': data.category_ids}}, {'_id': 0}).to_list(100)
        category_names = [c['name'] for c in categories]
    
    # Hash password if provided
    hashed_password = ""
    if data.password:
        hashed_password = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    seller_doc = {
        'id': seller_id,
        'seller_code': seller_code,
        'name': data.name,
        'company_name': data.company_name,
        'description': data.description or "",
        'logo_url': data.logo_url or "",
        'city': data.city or "",
        'state': data.state or "",
        'contact_email': data.contact_email,
        'contact_phone': data.contact_phone,
        'category_ids': data.category_ids or [],
        'is_active': data.is_active,
        'password_hash': hashed_password,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'established_year': data.established_year,
        'monthly_capacity': data.monthly_capacity or "",
        'employee_count': data.employee_count or "",
        'factory_size': data.factory_size or "",
        'turnover_range': data.turnover_range or "",
        'certifications': data.certifications or [],
        'export_markets': data.export_markets or [],
        'gst_number': data.gst_number or "",
    }
    await db.sellers.insert_one(seller_doc)
    
    response_doc = {**seller_doc, 'category_names': category_names}
    return Seller(**response_doc)

@api_router.put("/sellers/{seller_id}", response_model=Seller)
async def update_seller(seller_id: str, data: SellerUpdate, admin=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None and k != 'password'}
    
    # Hash password if provided
    if data.password:
        update_data['password_hash'] = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    if not update_data:
        raise HTTPException(status_code=400, detail='No data to update')
    
    result = await db.sellers.update_one({'id': seller_id}, {'$set': update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Seller not found')
    
    seller = await db.sellers.find_one({'id': seller_id}, {'_id': 0})
    
    # Get category names
    category_names = []
    if seller.get('category_ids'):
        categories = await db.categories.find({'id': {'$in': seller['category_ids']}}, {'_id': 0}).to_list(100)
        category_names = [c['name'] for c in categories]
    seller['category_names'] = category_names
    
    # Handle legacy fields
    if 'category_ids' not in seller:
        seller['category_ids'] = []
    if 'city' not in seller:
        seller['city'] = seller.get('location', '')
    if 'state' not in seller:
        seller['state'] = ''
    if 'is_active' not in seller:
        seller['is_active'] = True
    if 'seller_code' not in seller:
        seller['seller_code'] = ''
    if 'created_at' not in seller:
        seller['created_at'] = datetime.now(timezone.utc).isoformat()
    if 'description' not in seller:
        seller['description'] = ''
    if 'logo_url' not in seller:
        seller['logo_url'] = ''
    if 'contact_email' not in seller:
        seller['contact_email'] = ''
    if 'contact_phone' not in seller:
        seller['contact_phone'] = ''
    if 'company_name' not in seller:
        seller['company_name'] = seller.get('name', '')
    
    return Seller(**seller)

@api_router.delete("/sellers/{seller_id}")
async def delete_seller(seller_id: str, admin=Depends(get_current_admin)):
    result = await db.sellers.delete_one({'id': seller_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Seller not found')
    return {'message': 'Seller deleted'}

# ==================== FABRIC ROUTES ====================

def normalize_fabric(fabric: dict) -> dict:
    """Normalize legacy fabric data to current schema"""
    import re
    # Handle legacy string composition - convert to list format
    if isinstance(fabric.get('composition'), str):
        comp_str = fabric['composition']
        parsed = []
        matches = re.findall(r'(\d+)%\s*([^,]+)', comp_str)
        if matches:
            for percentage, material in matches:
                parsed.append({'material': material.strip(), 'percentage': int(percentage)})
            fabric['composition'] = parsed
        else:
            fabric['composition'] = [{'material': comp_str, 'percentage': 100}] if comp_str else []
    elif not fabric.get('composition'):
        fabric['composition'] = []
    
    # Handle tags - must be a list
    if not isinstance(fabric.get('tags'), list):
        raw = fabric.get('tags', '')
        if isinstance(raw, str) and raw:
            fabric['tags'] = [t.strip() for t in raw.split(',') if t.strip()]
        else:
            fabric['tags'] = []

    # Handle missing new fields
    if 'pattern' not in fabric:
        fabric['pattern'] = 'Solid'
    if 'starting_price' not in fabric:
        fabric['starting_price'] = ''
    if 'videos' not in fabric:
        fabric['videos'] = []
    elif not isinstance(fabric.get('videos'), list):
        fabric['videos'] = []
    if 'warp_count' not in fabric:
        fabric['warp_count'] = ''
    if 'weft_count' not in fabric:
        fabric['weft_count'] = ''
    if 'yarn_count' not in fabric:
        fabric['yarn_count'] = ''
    if 'ounce' not in fabric:
        fabric['ounce'] = ''
    if 'weight_unit' not in fabric:
        fabric['weight_unit'] = 'gsm'
    if 'gsm' not in fabric:
        fabric['gsm'] = None
    if 'fabric_code' not in fabric or not fabric['fabric_code']:
        fabric['fabric_code'] = ''
    if 'availability' not in fabric:
        fabric['availability'] = []
    elif not isinstance(fabric.get('availability'), list):
        fabric['availability'] = []
    # Inventory fields
    if 'quantity_available' not in fabric:
        fabric['quantity_available'] = None
    if 'rate_per_meter' not in fabric:
        fabric['rate_per_meter'] = None
    if 'dispatch_timeline' not in fabric:
        fabric['dispatch_timeline'] = ''
    if 'is_bookable' not in fabric:
        fabric['is_bookable'] = False
    # Denim fields
    if 'weft_shrinkage' not in fabric:
        fabric['weft_shrinkage'] = None
    if 'stretch_percentage' not in fabric:
        fabric['stretch_percentage'] = None
    # Seller SKU
    if 'seller_sku' not in fabric:
        fabric['seller_sku'] = ''
    # Article ID
    if 'article_id' not in fabric:
        fabric['article_id'] = ''
    # Pricing fields
    if 'sample_price' not in fabric:
        fabric['sample_price'] = None
    if 'pricing_tiers' not in fabric:
        fabric['pricing_tiers'] = []
    # Stock type and delivery fields
    if 'stock_type' not in fabric:
        fabric['stock_type'] = 'ready_stock'
    if 'sample_delivery_days' not in fabric:
        fabric['sample_delivery_days'] = ''
    if 'bulk_delivery_days' not in fabric:
        fabric['bulk_delivery_days'] = ''
    # Images must be a list
    if not isinstance(fabric.get('images'), list):
        fabric['images'] = []
    # Status field (legacy fabrics don't have it)
    if 'status' not in fabric or fabric.get('status') is None:
        fabric['status'] = None
    
    return fabric

async def generate_fabric_code() -> str:
    """Generate a unique fabric code like LF-XXXXX"""
    import random
    import string
    while True:
        # Generate code like LF-A1B2C
        code = 'LF-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        # Check if it exists
        existing = await db.fabrics.find_one({'fabric_code': code})
        if not existing:
            return code

async def generate_seller_code() -> str:
    """Generate a unique seller code like LS-XXXXX"""
    import random
    import string
    while True:
        code = 'LS-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        existing = await db.sellers.find_one({'seller_code': code})
        if not existing:
            return code

async def generate_article_code() -> str:
    """Generate a unique article code like ART-XXXXX"""
    import random
    import string
    while True:
        code = 'ART-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        existing = await db.articles.find_one({'article_code': code})
        if not existing:
            return code

@api_router.get("/fabrics", response_model=List[Fabric])
async def get_fabrics(
    category_id: Optional[str] = Query(None),
    seller_id: Optional[str] = Query(None),
    article_id: Optional[str] = Query(None),
    fabric_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    min_gsm: Optional[int] = Query(None),
    max_gsm: Optional[int] = Query(None),
    pattern: Optional[str] = Query(None),
    color: Optional[str] = Query(None),
    width: Optional[str] = Query(None),
    min_weight_oz: Optional[float] = Query(None),
    max_weight_oz: Optional[float] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    bookable_only: Optional[bool] = Query(None),
    sample_available: Optional[bool] = Query(None),
    instant_bookable: Optional[bool] = Query(None),
    enquiry_only: Optional[bool] = Query(None),
    status: Optional[str] = Query(None),
    include_pending: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=1000)  # Increased max limit for admin dropdown
):
    # Build query using $and to avoid $or conflicts
    and_conditions = []
    query = {}

    # Status filter: public view only shows approved + legacy (no status) fabrics
    if status:
        and_conditions.append({'status': status})
    elif include_pending:
        pass  # Show all statuses
    else:
        and_conditions.append({'$or': [
            {'status': 'approved'},
            {'status': {'$exists': False}},
            {'status': None}
        ]})

    if category_id:
        query['category_id'] = category_id
    if seller_id:
        query['seller_id'] = seller_id
    if article_id:
        query['article_id'] = article_id
    if fabric_type:
        query['fabric_type'] = fabric_type
    if bookable_only:
        query['is_bookable'] = True
        query['quantity_available'] = {'$gt': 0}
    if sample_available:
        query['is_bookable'] = True
        and_conditions.append({'$or': [
            {'sample_price': {'$gt': 0}},
            {'rate_per_meter': {'$gt': 0}}
        ]})
    if instant_bookable:
        query['is_bookable'] = True
        and_conditions.append({'$or': [
            {'sample_price': {'$gt': 0}},
            {'rate_per_meter': {'$gt': 0}},
            {'quantity_available': {'$gt': 0}}
        ]})
    if enquiry_only:
        and_conditions.append({'$or': [
            {'is_bookable': {'$ne': True}},
            {'$and': [
                {'sample_price': {'$in': [None, 0]}},
                {'rate_per_meter': {'$in': [None, 0]}},
                {'quantity_available': {'$in': [None, 0]}}
            ]}
        ]})
    if min_gsm is not None or max_gsm is not None:
        gsm_q = {}
        if min_gsm is not None:
            gsm_q['$gte'] = min_gsm
        if max_gsm is not None:
            gsm_q['$lte'] = max_gsm
        if gsm_q:
            query['gsm'] = gsm_q

    if pattern:
        query['pattern'] = {'$regex': f'^{pattern}$', '$options': 'i'}
    if color:
        query['color'] = {'$regex': color, '$options': 'i'}
    if width:
        query['width'] = {'$regex': width, '$options': 'i'}
    if min_weight_oz is not None or max_weight_oz is not None:
        # Filter ounce field — stored as strings like "12", "6.50 OZ", "11.5"
        # Use regex + post-filter via aggregation is complex, so use $expr with numeric extraction
        # Simpler approach: filter ounce as string regex for range
        oz_conditions = []
        if min_weight_oz is not None:
            oz_conditions.append({'ounce': {'$exists': True, '$ne': ''}})
        if max_weight_oz is not None:
            oz_conditions.append({'ounce': {'$exists': True, '$ne': ''}})
        if oz_conditions:
            and_conditions.extend(oz_conditions)
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q['$gte'] = min_price
        if max_price is not None:
            price_q['$lte'] = max_price
        if price_q:
            query['rate_per_meter'] = price_q

    if search:
        and_conditions.append({
            '$or': [
                {'name': {'$regex': search, '$options': 'i'}},
                {'tags': {'$regex': search, '$options': 'i'}},
                {'color': {'$regex': search, '$options': 'i'}},
                {'fabric_code': {'$regex': search, '$options': 'i'}},
                {'seller_sku': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]
        })

    # Combine all conditions
    if and_conditions:
        query['$and'] = and_conditions
    
    # Calculate skip for pagination
    skip = (page - 1) * limit
    
    # Use aggregation for priority-based sorting:
    # Priority 1: Both Bulk AND Sample bookable (is_bookable + quantity > 0 + sample_price > 0)
    # Priority 2: Bulk only bookable (is_bookable + quantity > 0)
    # Priority 3: Sample only bookable (is_bookable + sample_price > 0)
    # Priority 4: Enquiry only (not bookable or no stock/pricing)
    
    pipeline = [
        {'$match': query},
        {'$addFields': {
            'booking_priority': {
                '$switch': {
                    'branches': [
                        # Priority 1: Both Bulk AND Sample bookable
                        {
                            'case': {
                                '$and': [
                                    {'$eq': ['$is_bookable', True]},
                                    {'$gt': [{'$ifNull': ['$quantity_available', 0]}, 0]},
                                    {'$gt': [{'$ifNull': ['$sample_price', 0]}, 0]}
                                ]
                            },
                            'then': 1
                        },
                        # Priority 2: Bulk only bookable
                        {
                            'case': {
                                '$and': [
                                    {'$eq': ['$is_bookable', True]},
                                    {'$gt': [{'$ifNull': ['$quantity_available', 0]}, 0]}
                                ]
                            },
                            'then': 2
                        },
                        # Priority 3: Sample only bookable
                        {
                            'case': {
                                '$and': [
                                    {'$eq': ['$is_bookable', True]},
                                    {'$gt': [{'$ifNull': ['$sample_price', 0]}, 0]}
                                ]
                            },
                            'then': 3
                        }
                    ],
                    # Priority 4: Enquiry only (default)
                    'default': 4
                }
            }
        }},
        {'$sort': {'booking_priority': 1, 'created_at': -1}},
        {'$skip': skip},
        {'$limit': limit},
        {'$project': {'_id': 0, 'booking_priority': 0}}
    ]
    
    fabrics = await db.fabrics.aggregate(pipeline).to_list(limit)
    
    # Get category names
    category_ids = list(set(f['category_id'] for f in fabrics))
    categories = await db.categories.find({'id': {'$in': category_ids}}, {'_id': 0}).to_list(100)
    cat_map = {c['id']: c['name'] for c in categories}
    
    # Get seller info (only active sellers unless specifically filtered)
    seller_ids = list(set(f.get('seller_id', '') for f in fabrics if f.get('seller_id')))
    sellers = await db.sellers.find({'id': {'$in': seller_ids}}, {'_id': 0}).to_list(100) if seller_ids else []
    seller_map = {s['id']: s for s in sellers}
    
    for fabric in fabrics:
        normalize_fabric(fabric)
        fabric['category_name'] = cat_map.get(fabric['category_id'], '')
        seller = seller_map.get(fabric.get('seller_id', ''))
        fabric['seller_name'] = seller['name'] if seller else ''
        fabric['seller_company'] = seller['company_name'] if seller else ''
        fabric['seller_code'] = seller.get('seller_code', '') if seller else ''
        if 'seller_id' not in fabric:
            fabric['seller_id'] = ''
    
    return fabrics

@api_router.get("/fabrics/count")
async def get_fabrics_count(
    category_id: Optional[str] = Query(None),
    seller_id: Optional[str] = Query(None),
    article_id: Optional[str] = Query(None),
    fabric_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    min_gsm: Optional[int] = Query(None),
    max_gsm: Optional[int] = Query(None),
    pattern: Optional[str] = Query(None),
    color: Optional[str] = Query(None),
    width: Optional[str] = Query(None),
    min_weight_oz: Optional[float] = Query(None),
    max_weight_oz: Optional[float] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    bookable_only: Optional[bool] = Query(None),
    sample_available: Optional[bool] = Query(None),
    instant_bookable: Optional[bool] = Query(None),
    enquiry_only: Optional[bool] = Query(None),
    status: Optional[str] = Query(None),
    include_pending: Optional[bool] = Query(None)
):
    """Get total count of fabrics matching filters (for pagination)"""
    and_conditions = []
    query = {}

    if status:
        and_conditions.append({'status': status})
    elif include_pending:
        pass
    else:
        and_conditions.append({'$or': [
            {'status': 'approved'},
            {'status': {'$exists': False}},
            {'status': None}
        ]})

    if category_id:
        query['category_id'] = category_id
    if seller_id:
        query['seller_id'] = seller_id
    if article_id:
        query['article_id'] = article_id
    if fabric_type:
        query['fabric_type'] = fabric_type
    if bookable_only:
        query['is_bookable'] = True
        query['quantity_available'] = {'$gt': 0}
    if sample_available:
        query['is_bookable'] = True
        and_conditions.append({'$or': [
            {'sample_price': {'$gt': 0}},
            {'rate_per_meter': {'$gt': 0}}
        ]})
    if instant_bookable:
        query['is_bookable'] = True
        and_conditions.append({'$or': [
            {'sample_price': {'$gt': 0}},
            {'rate_per_meter': {'$gt': 0}},
            {'quantity_available': {'$gt': 0}}
        ]})
    if enquiry_only:
        and_conditions.append({'$or': [
            {'is_bookable': {'$ne': True}},
            {'$and': [
                {'sample_price': {'$in': [None, 0]}},
                {'rate_per_meter': {'$in': [None, 0]}},
                {'quantity_available': {'$in': [None, 0]}}
            ]}
        ]})
    if min_gsm is not None or max_gsm is not None:
        gsm_q = {}
        if min_gsm is not None:
            gsm_q['$gte'] = min_gsm
        if max_gsm is not None:
            gsm_q['$lte'] = max_gsm
        if gsm_q:
            query['gsm'] = gsm_q
    if pattern:
        query['pattern'] = {'$regex': f'^{pattern}$', '$options': 'i'}
    if color:
        query['color'] = {'$regex': color, '$options': 'i'}
    if width:
        query['width'] = {'$regex': width, '$options': 'i'}
    if min_weight_oz is not None or max_weight_oz is not None:
        oz_conditions = []
        if min_weight_oz is not None:
            oz_conditions.append({'ounce': {'$exists': True, '$ne': ''}})
        if max_weight_oz is not None:
            oz_conditions.append({'ounce': {'$exists': True, '$ne': ''}})
        if oz_conditions:
            and_conditions.extend(oz_conditions)
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q['$gte'] = min_price
        if max_price is not None:
            price_q['$lte'] = max_price
        if price_q:
            query['rate_per_meter'] = price_q
    if search:
        and_conditions.append({
            '$or': [
                {'name': {'$regex': search, '$options': 'i'}},
                {'tags': {'$regex': search, '$options': 'i'}},
                {'color': {'$regex': search, '$options': 'i'}},
                {'fabric_code': {'$regex': search, '$options': 'i'}},
                {'seller_sku': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]
        })

    if and_conditions:
        query['$and'] = and_conditions
    
    count = await db.fabrics.count_documents(query)
    return {'count': count}

@api_router.get("/fabrics/{fabric_id}", response_model=Fabric)
async def get_fabric(fabric_id: str):
    fabric = await db.fabrics.find_one({'id': fabric_id}, {'_id': 0})
    if not fabric:
        raise HTTPException(status_code=404, detail='Fabric not found')
    
    normalize_fabric(fabric)
    
    category = await db.categories.find_one({'id': fabric['category_id']}, {'_id': 0})
    fabric['category_name'] = category['name'] if category else ''
    
    # Get seller info
    if fabric.get('seller_id'):
        seller = await db.sellers.find_one({'id': fabric['seller_id']}, {'_id': 0})
        fabric['seller_name'] = seller['name'] if seller else ''
        fabric['seller_company'] = seller['company_name'] if seller else ''
        fabric['seller_code'] = seller.get('seller_code', '') if seller else ''
    else:
        fabric['seller_id'] = ''
        fabric['seller_name'] = ''
        fabric['seller_company'] = ''
        fabric['seller_code'] = ''
    
    return fabric

@api_router.post("/fabrics", response_model=Fabric)
async def create_fabric(data: FabricCreate, admin=Depends(get_current_admin)):
    # Verify category exists
    category = await db.categories.find_one({'id': data.category_id}, {'_id': 0})
    if not category:
        raise HTTPException(status_code=400, detail='Category not found')
    
    # Get seller info if provided
    seller = None
    if data.seller_id:
        seller = await db.sellers.find_one({'id': data.seller_id}, {'_id': 0})
    
    fabric_id = str(uuid.uuid4())
    fabric_code = await generate_fabric_code()
    
    fabric_doc = {
        'id': fabric_id,
        'fabric_code': fabric_code,
        **data.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.fabrics.insert_one(fabric_doc)
    
    fabric_doc['category_name'] = category['name']
    fabric_doc['seller_name'] = seller['name'] if seller else ''
    fabric_doc['seller_company'] = seller['company_name'] if seller else ''
    return Fabric(**fabric_doc)

@api_router.put("/fabrics/{fabric_id}", response_model=Fabric)
async def update_fabric(fabric_id: str, data: FabricUpdate, admin=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail='No data to update')
    
    if 'category_id' in update_data:
        category = await db.categories.find_one({'id': update_data['category_id']}, {'_id': 0})
        if not category:
            raise HTTPException(status_code=400, detail='Category not found')
    
    result = await db.fabrics.update_one({'id': fabric_id}, {'$set': update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Fabric not found')
    
    fabric = await db.fabrics.find_one({'id': fabric_id}, {'_id': 0})
    normalize_fabric(fabric)
    category = await db.categories.find_one({'id': fabric['category_id']}, {'_id': 0})
    fabric['category_name'] = category['name'] if category else ''
    
    # Get seller info
    if fabric.get('seller_id'):
        seller = await db.sellers.find_one({'id': fabric['seller_id']}, {'_id': 0})
        fabric['seller_name'] = seller['name'] if seller else ''
        fabric['seller_company'] = seller['company_name'] if seller else ''
        fabric['seller_code'] = seller.get('seller_code', '') if seller else ''
    else:
        fabric['seller_id'] = ''
        fabric['seller_name'] = ''
        fabric['seller_company'] = ''
        fabric['seller_code'] = ''
    
    return fabric

@api_router.delete("/fabrics/{fabric_id}")
async def delete_fabric(fabric_id: str, admin=Depends(get_current_admin)):
    result = await db.fabrics.delete_one({'id': fabric_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Fabric not found')
    return {'message': 'Fabric deleted'}

@api_router.post("/fabrics/bulk-assign-seller")
async def bulk_assign_seller(data: dict, admin=Depends(get_current_admin)):
    """Assign all unallocated fabrics to a specific seller"""
    seller_id = data.get('seller_id')
    if not seller_id:
        raise HTTPException(status_code=400, detail='seller_id is required')
    
    seller = await db.sellers.find_one({'id': seller_id}, {'_id': 0})
    if not seller:
        raise HTTPException(status_code=404, detail='Seller not found')
    
    # Find unallocated fabrics (no seller_id or empty seller_id)
    result = await db.fabrics.update_many(
        {'$or': [
            {'seller_id': {'$exists': False}},
            {'seller_id': None},
            {'seller_id': ''}
        ]},
        {'$set': {
            'seller_id': seller_id,
            'seller_name': seller.get('name', ''),
            'seller_company': seller.get('company_name', '')
        }}
    )
    
    return {
        'message': f'Assigned {result.modified_count} fabrics to {seller.get("company_name", seller.get("name", ""))}',
        'modified_count': result.modified_count
    }

@api_router.post("/fabrics/reassign-seller")
async def reassign_fabric_seller(data: dict, admin=Depends(get_current_admin)):
    """Reassign specific fabrics to a different seller"""
    fabric_ids = data.get('fabric_ids', [])
    seller_id = data.get('seller_id')
    
    if not fabric_ids or not seller_id:
        raise HTTPException(status_code=400, detail='fabric_ids and seller_id are required')
    
    seller = await db.sellers.find_one({'id': seller_id}, {'_id': 0})
    if not seller:
        raise HTTPException(status_code=404, detail='Seller not found')
    
    result = await db.fabrics.update_many(
        {'id': {'$in': fabric_ids}},
        {'$set': {
            'seller_id': seller_id,
            'seller_name': seller.get('name', ''),
            'seller_company': seller.get('company_name', '')
        }}
    )
    
    return {
        'message': f'Reassigned {result.modified_count} fabrics to {seller.get("company_name", seller.get("name", ""))}',
        'modified_count': result.modified_count
    }

# ==================== IMAGE UPLOAD ====================

@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...), admin=Depends(get_current_admin)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail='File must be an image')
    
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    with open(filepath, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    
    return {'url': f'/api/uploads/{filename}'}

@api_router.post("/upload/video")
async def upload_video(file: UploadFile = File(...), admin=Depends(get_current_admin)):
    """Upload video files up to 150MB"""
    allowed_types = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail='File must be a video (MP4, WebM, MOV, AVI, MPEG)')
    
    # Check file size (150MB max)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Seek back to start
    
    max_size = 150 * 1024 * 1024  # 150MB
    if file_size > max_size:
        raise HTTPException(status_code=400, detail='Video file too large. Maximum size is 150MB')
    
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'mp4'
    filename = f"video_{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    # Write file in chunks to handle large files
    chunk_size = 1024 * 1024  # 1MB chunks
    with open(filepath, 'wb') as f:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            f.write(chunk)
    
    return {'url': f'/api/uploads/{filename}', 'filename': filename, 'size': file_size}

# ==================== ARTICLE ROUTES (Color Variant Grouping) ====================

@api_router.get("/articles", response_model=List[Article])
async def get_articles(seller_id: Optional[str] = Query(None), category_id: Optional[str] = Query(None)):
    query = {}
    if seller_id:
        query['seller_id'] = seller_id
    if category_id:
        query['category_id'] = category_id
    
    articles = await db.articles.find(query, {'_id': 0}).sort('created_at', -1).to_list(500)
    
    # Get seller names
    seller_ids = list(set(a.get('seller_id', '') for a in articles if a.get('seller_id')))
    sellers = await db.sellers.find({'id': {'$in': seller_ids}}, {'_id': 0}).to_list(100) if seller_ids else []
    seller_map = {s['id']: s['name'] for s in sellers}
    
    # Get category names
    cat_ids = list(set(a.get('category_id', '') for a in articles if a.get('category_id')))
    categories = await db.categories.find({'id': {'$in': cat_ids}}, {'_id': 0}).to_list(100) if cat_ids else []
    cat_map = {c['id']: c['name'] for c in categories}
    
    # Count variants for each article
    article_ids = [a['id'] for a in articles]
    variant_counts = {}
    for aid in article_ids:
        count = await db.fabrics.count_documents({'article_id': aid})
        variant_counts[aid] = count
    
    for article in articles:
        article['seller_name'] = seller_map.get(article.get('seller_id', ''), '')
        article['category_name'] = cat_map.get(article.get('category_id', ''), '')
        article['variant_count'] = variant_counts.get(article['id'], 0)
        if 'article_code' not in article:
            article['article_code'] = ''
    
    return articles

@api_router.get("/articles/{article_id}", response_model=Article)
async def get_article(article_id: str):
    article = await db.articles.find_one({'id': article_id}, {'_id': 0})
    if not article:
        raise HTTPException(status_code=404, detail='Article not found')
    
    # Get seller name
    if article.get('seller_id'):
        seller = await db.sellers.find_one({'id': article['seller_id']}, {'_id': 0})
        article['seller_name'] = seller['name'] if seller else ''
    else:
        article['seller_name'] = ''
    
    # Get category name
    if article.get('category_id'):
        category = await db.categories.find_one({'id': article['category_id']}, {'_id': 0})
        article['category_name'] = category['name'] if category else ''
    else:
        article['category_name'] = ''
    
    # Count variants
    article['variant_count'] = await db.fabrics.count_documents({'article_id': article_id})
    
    if 'article_code' not in article:
        article['article_code'] = ''
    
    return article

@api_router.get("/articles/{article_id}/variants", response_model=List[Fabric])
async def get_article_variants(article_id: str):
    """Get all color variants (fabrics) for an article"""
    article = await db.articles.find_one({'id': article_id}, {'_id': 0})
    if not article:
        raise HTTPException(status_code=404, detail='Article not found')
    
    fabrics = await db.fabrics.find({'article_id': article_id}, {'_id': 0}).to_list(100)
    
    # Enrich with category/seller info
    category_ids = list(set(f['category_id'] for f in fabrics))
    categories = await db.categories.find({'id': {'$in': category_ids}}, {'_id': 0}).to_list(100) if category_ids else []
    cat_map = {c['id']: c['name'] for c in categories}
    
    seller_ids = list(set(f.get('seller_id', '') for f in fabrics if f.get('seller_id')))
    sellers = await db.sellers.find({'id': {'$in': seller_ids}}, {'_id': 0}).to_list(100) if seller_ids else []
    seller_map = {s['id']: s for s in sellers}
    
    for fabric in fabrics:
        normalize_fabric(fabric)
        fabric['category_name'] = cat_map.get(fabric['category_id'], '')
        seller = seller_map.get(fabric.get('seller_id', ''))
        fabric['seller_name'] = seller['name'] if seller else ''
        fabric['seller_company'] = seller['company_name'] if seller else ''
        fabric['seller_code'] = seller.get('seller_code', '') if seller else ''
        if 'seller_id' not in fabric:
            fabric['seller_id'] = ''
    
    return fabrics

@api_router.post("/articles", response_model=Article)
async def create_article(data: ArticleCreate, admin=Depends(get_current_admin)):
    article_id = str(uuid.uuid4())
    article_code = await generate_article_code()
    
    article_doc = {
        'id': article_id,
        'article_code': article_code,
        'name': data.name,
        'base_fabric_id': data.base_fabric_id or "",
        'description': data.description or "",
        'seller_id': data.seller_id or "",
        'category_id': data.category_id or "",
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.articles.insert_one(article_doc)
    
    # Get seller/category names
    seller_name = ""
    category_name = ""
    if data.seller_id:
        seller = await db.sellers.find_one({'id': data.seller_id}, {'_id': 0})
        seller_name = seller['name'] if seller else ''
    if data.category_id:
        category = await db.categories.find_one({'id': data.category_id}, {'_id': 0})
        category_name = category['name'] if category else ''
    
    article_doc['seller_name'] = seller_name
    article_doc['category_name'] = category_name
    article_doc['variant_count'] = 0
    
    return Article(**article_doc)

@api_router.put("/articles/{article_id}", response_model=Article)
async def update_article(article_id: str, data: ArticleUpdate, admin=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail='No data to update')
    
    result = await db.articles.update_one({'id': article_id}, {'$set': update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Article not found')
    
    article = await db.articles.find_one({'id': article_id}, {'_id': 0})
    
    # Get seller/category names
    if article.get('seller_id'):
        seller = await db.sellers.find_one({'id': article['seller_id']}, {'_id': 0})
        article['seller_name'] = seller['name'] if seller else ''
    else:
        article['seller_name'] = ''
    
    if article.get('category_id'):
        category = await db.categories.find_one({'id': article['category_id']}, {'_id': 0})
        article['category_name'] = category['name'] if category else ''
    else:
        article['category_name'] = ''
    
    article['variant_count'] = await db.fabrics.count_documents({'article_id': article_id})
    
    if 'article_code' not in article:
        article['article_code'] = ''
    
    return Article(**article)

@api_router.delete("/articles/{article_id}")
async def delete_article(article_id: str, admin=Depends(get_current_admin)):
    # Check if there are fabrics linked to this article
    fabric_count = await db.fabrics.count_documents({'article_id': article_id})
    if fabric_count > 0:
        # Unlink fabrics from article
        await db.fabrics.update_many({'article_id': article_id}, {'$set': {'article_id': ''}})
    
    result = await db.articles.delete_one({'id': article_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Article not found')
    return {'message': 'Article deleted'}

@api_router.get("/fabrics/{fabric_id}/other-sellers")
async def get_other_sellers_for_fabric(fabric_id: str):
    """Get other vendor listings for the same product (via shared article_id)."""
    fabric = await db.fabrics.find_one({'id': fabric_id}, {'_id': 0})
    if not fabric:
        raise HTTPException(status_code=404, detail='Fabric not found')
    
    article_id = fabric.get('article_id', '')
    if not article_id:
        return []
    
    # Find other approved fabrics with the same article_id, excluding current
    others = await db.fabrics.find(
        {'article_id': article_id, 'id': {'$ne': fabric_id}, 'status': 'approved'},
        {'_id': 0}
    ).to_list(20)
    
    # Enrich with seller info
    for f in others:
        if f.get('seller_id'):
            seller = await db.sellers.find_one({'id': f['seller_id']}, {'_id': 0})
            if seller:
                f['seller_name'] = seller.get('name', '')
                f['seller_company'] = seller.get('company_name', '')
                f['seller_city'] = seller.get('city', '')
                f['seller_state'] = seller.get('state', '')
    
    # Sort by price (cheapest first)
    others.sort(key=lambda x: x.get('rate_per_meter') or 999999)
    
    return others


# ==================== CREDIT / WALLET ROUTES ====================

@api_router.post("/credit/apply")
async def apply_for_credit(data: dict):
    """Submit a credit application. Requires 2Cr+ annual turnover."""
    name = data.get('name', '')
    email = data.get('email', '')
    phone = data.get('phone', '')
    company = data.get('company', '')
    turnover = data.get('turnover', '')
    gst_number = data.get('gst_number', '')
    message = data.get('message', '')

    if not name or not email or not phone or not company:
        raise HTTPException(status_code=400, detail='Name, email, phone, and company are required')

    application_id = str(uuid.uuid4())
    app_doc = {
        'id': application_id,
        'name': name,
        'email': email,
        'phone': phone,
        'company': company,
        'turnover': turnover,
        'gst_number': gst_number,
        'message': message,
        'status': 'pending',  # pending, approved, rejected
        'credit_limit': 0,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.credit_applications.insert_one(app_doc)

    # Also push as a lead to campaigns
    try:
        import httpx as httpx_client
        async with httpx_client.AsyncClient(timeout=10) as client:
            await client.post('https://campaigns.locofast.com/api/leads', json={
                'name': name,
                'company': company,
                'email': email,
                'phone': phone,
                'company_type': 'Credit Application',
                'message': f"Turnover: {turnover}\nGST: {gst_number}\n{message}",
                'campaign': 'Credit Application',
            })
    except Exception as e:
        logging.warning(f"Failed to push credit application to campaigns: {str(e)}")

    return {'message': 'Credit application submitted successfully', 'id': application_id}

@api_router.get("/credit/balance")
async def get_credit_balance(email: str = Query(...)):
    """Check credit wallet balance for a customer by email."""
    wallet = await db.credit_wallets.find_one({'email': email}, {'_id': 0})
    if not wallet:
        return {'email': email, 'credit_limit': 0, 'balance': 0, 'has_credit': False}
    return {
        'email': email,
        'credit_limit': wallet.get('credit_limit', 0),
        'balance': wallet.get('balance', 0),
        'has_credit': wallet.get('balance', 0) > 0
    }

@api_router.get("/credit/applications")
async def get_credit_applications(admin=Depends(get_current_admin)):
    """Admin: list all credit applications."""
    apps = await db.credit_applications.find({}, {'_id': 0}).sort('created_at', -1).to_list(500)
    return apps

@api_router.put("/credit/applications/{app_id}/approve")
async def approve_credit_application(app_id: str, data: dict, admin=Depends(get_current_admin)):
    """Admin: approve a credit application and set credit limit."""
    credit_limit = data.get('credit_limit', 0)
    if credit_limit <= 0:
        raise HTTPException(status_code=400, detail='Credit limit must be positive')

    app = await db.credit_applications.find_one({'id': app_id}, {'_id': 0})
    if not app:
        raise HTTPException(status_code=404, detail='Application not found')

    await db.credit_applications.update_one({'id': app_id}, {'$set': {'status': 'approved', 'credit_limit': credit_limit}})

    # Create or update wallet
    await db.credit_wallets.update_one(
        {'email': app['email']},
        {'$set': {
            'email': app['email'],
            'name': app['name'],
            'company': app['company'],
            'credit_limit': credit_limit,
            'balance': credit_limit,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )

    return {'message': f'Credit of ₹{credit_limit:,} approved for {app["company"]}'}


@api_router.put("/credit/applications/{app_id}/reject")
async def reject_credit_application(app_id: str, data: dict, admin=Depends(get_current_admin)):
    """Admin: reject a credit application."""
    reason = data.get('reason', 'Application does not meet criteria')
    result = await db.credit_applications.update_one(
        {'id': app_id},
        {'$set': {'status': 'rejected', 'rejection_reason': reason, 'updated_at': datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Application not found')
    return {'message': 'Application rejected'}




# ==================== ENQUIRY ROUTES ====================

@api_router.post("/enquiries", response_model=Enquiry)
async def create_enquiry(data: EnquiryCreate):
    enquiry_id = str(uuid.uuid4())
    enquiry_doc = {
        'id': enquiry_id,
        **data.model_dump(),
        'status': 'new',
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.enquiries.insert_one(enquiry_doc)
    
    # Send email notifications (best effort - don't block on failure)
    try:
        from email_router import send_enquiry_emails
        import asyncio
        asyncio.create_task(send_enquiry_emails(enquiry_doc))
    except Exception as e:
        logging.warning(f"Failed to queue enquiry emails: {str(e)}")
    
    # Send to Zapier webhook (best effort - don't block on failure)
    try:
        from zapier_webhook import send_enquiry_to_zapier
        import asyncio
        asyncio.create_task(send_enquiry_to_zapier(enquiry_doc))
    except Exception as e:
        logging.warning(f"Failed to send to Zapier: {str(e)}")
    
    # Push supplier queries to campaigns.locofast.com
    try:
        import httpx as httpx_client
        campaign_name = 'Vendor Signup' if enquiry_doc.get('enquiry_type') == 'supplier_signup' else 'Website RFQ'
        # Extract company_type from enquiry data
        company_type = enquiry_doc.get('company_type', '')
        if not company_type:
            # Try to extract fabric categories from message for supplier signups
            msg = enquiry_doc.get('message', '')
            if 'Fabric Categories:' in msg:
                cat_line = [l for l in msg.split('\n') if 'Fabric Categories:' in l]
                if cat_line:
                    company_type = cat_line[0].split('Fabric Categories:')[-1].strip()
            if not company_type:
                company_type = 'Supplier' if enquiry_doc.get('enquiry_type') == 'supplier_signup' else 'Buyer'
        async with httpx_client.AsyncClient(timeout=10) as client:
            await client.post('https://campaigns.locofast.com/api/leads', json={
                'name': enquiry_doc.get('name', ''),
                'company': enquiry_doc.get('company', ''),
                'email': enquiry_doc.get('email', ''),
                'phone': enquiry_doc.get('phone', ''),
                'company_type': company_type,
                'message': enquiry_doc.get('message', ''),
                'campaign': campaign_name,
            })
            logging.info(f"Enquiry pushed to campaigns admin: {enquiry_doc.get('name', '')} ({campaign_name})")
    except Exception as e:
        logging.warning(f"Failed to push enquiry to campaigns: {str(e)}")
    
    return Enquiry(**enquiry_doc)

@api_router.get("/enquiries", response_model=List[Enquiry])
async def get_enquiries(admin=Depends(get_current_admin)):
    enquiries = await db.enquiries.find({}, {'_id': 0}).sort('created_at', -1).to_list(500)
    return enquiries

@api_router.put("/enquiries/{enquiry_id}/status")
async def update_enquiry_status(enquiry_id: str, status: str = Query(...), admin=Depends(get_current_admin)):
    result = await db.enquiries.update_one({'id': enquiry_id}, {'$set': {'status': status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Enquiry not found')
    return {'message': 'Status updated'}

@api_router.delete("/enquiries/{enquiry_id}")
async def delete_enquiry(enquiry_id: str, admin=Depends(get_current_admin)):
    """Delete an enquiry"""
    result = await db.enquiries.delete_one({'id': enquiry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Enquiry not found')
    return {'message': 'Enquiry deleted'}

# ==================== REVIEWS CMS ====================

@api_router.post("/reviews")
async def create_review(data: dict, admin=Depends(get_current_admin)):
    """Admin creates a review for a seller (from ERP data)"""
    required = ['seller_id', 'customer_name', 'rating']
    for field in required:
        if not data.get(field):
            raise HTTPException(status_code=400, detail=f'{field} is required')

    rating = data['rating']
    if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail='Rating must be between 1 and 5')

    seller = await db.sellers.find_one({'id': data['seller_id']}, {'_id': 0, 'company_name': 1})
    if not seller:
        raise HTTPException(status_code=404, detail='Seller not found')

    review = {
        'id': str(uuid.uuid4())[:8],
        'seller_id': data['seller_id'],
        'seller_name': seller.get('company_name', ''),
        'customer_name': data['customer_name'],
        'customer_company': data.get('customer_company', ''),
        'customer_location': data.get('customer_location', ''),
        'rating': int(rating),
        'review_text': data.get('review_text', ''),
        'review_date': data.get('review_date', datetime.now(timezone.utc).strftime('%Y-%m-%d')),
        'is_verified': data.get('is_verified', True),
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(review)
    review.pop('_id', None)
    return review

@api_router.get("/reviews")
async def get_reviews(seller_id: str = Query(None), admin=Depends(get_current_admin)):
    """Get all reviews, optionally filtered by seller_id"""
    query = {}
    if seller_id:
        query['seller_id'] = seller_id
    reviews = await db.reviews.find(query, {'_id': 0}).sort('created_at', -1).to_list(500)
    return reviews

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, admin=Depends(get_current_admin)):
    """Delete a review"""
    result = await db.reviews.delete_one({'id': review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Review not found')
    return {'message': 'Review deleted'}

# ==================== GST VERIFICATION ====================

@api_router.post("/gst/verify")
async def verify_gst(data: dict):
    """Verify GST number using Sandbox.co.in API and return company details"""
    import httpx
    
    gstin = (data.get('gstin') or '').strip().upper()
    if not gstin or len(gstin) != 15:
        raise HTTPException(status_code=400, detail='Invalid GSTIN - must be 15 characters')
    
    sandbox_key = os.environ.get('SANDBOX_API_KEY')
    sandbox_secret = os.environ.get('SANDBOX_API_SECRET')
    
    if not sandbox_key or not sandbox_secret:
        raise HTTPException(status_code=503, detail='GST verification service not configured')
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Step 1: Authenticate
            auth_resp = await client.post(
                'https://api.sandbox.co.in/authenticate',
                headers={
                    'x-api-key': sandbox_key,
                    'x-api-secret': sandbox_secret,
                }
            )
            auth_data = auth_resp.json()
            token = auth_data.get('access_token', '')
            
            if not token:
                raise HTTPException(status_code=502, detail='Failed to authenticate with GST service')
            
            # Step 2: Search GSTIN
            gst_resp = await client.post(
                'https://api.sandbox.co.in/gst/compliance/public/gstin/search',
                headers={
                    'Authorization': token,
                    'x-api-key': sandbox_key,
                    'Content-Type': 'application/json'
                },
                json={'gstin': gstin}
            )
            gst_data = gst_resp.json()
            
            if gst_data.get('code') != 200:
                return {
                    'valid': False,
                    'message': gst_data.get('message', 'GST verification failed'),
                    'gstin': gstin
                }
            
            info = gst_data.get('data', {}).get('data', {})
            addr = info.get('pradr', {}).get('addr', {})
            
            return {
                'valid': True,
                'gstin': gstin,
                'legal_name': info.get('lgnm', ''),
                'trade_name': info.get('tradeNam', ''),
                'business_type': info.get('ctb', ''),
                'gst_status': info.get('sts', ''),
                'registration_date': info.get('rgdt', ''),
                'city': addr.get('dst', ''),
                'state': addr.get('stcd', ''),
                'pincode': addr.get('pncd', ''),
                'address': f"{addr.get('bno', '')} {addr.get('flno', '')} {addr.get('st', '')} {addr.get('loc', '')}".strip(),
            }
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail='GST verification timed out')
    except Exception as e:
        logging.error(f"GST verification error: {str(e)}")
        raise HTTPException(status_code=500, detail='GST verification failed')

@api_router.post("/enquiries/rfq-lead")
async def create_rfq_lead(data: dict):
    """Handle RFQ form submission from homepage - sends email to marketing@locofast.com"""
    import httpx
    
    name = data.get('name', '')
    phone = data.get('phone', '')
    gst_number = data.get('gst_number', '')
    company_name = data.get('company_name', '')
    email = data.get('email', '')
    fabric_type = data.get('fabric_type', '')
    fabric_url = data.get('fabric_url', '')
    fabric_name = data.get('fabric_name', '')
    location = data.get('location', '')
    # GST-verified fields (auto-populated from frontend)
    gst_legal_name = data.get('gst_legal_name', '')
    gst_trade_name = data.get('gst_trade_name', '')
    gst_status = data.get('gst_status', '')
    gst_city = data.get('gst_city', '')
    gst_state = data.get('gst_state', '')
    gst_address = data.get('gst_address', '')
    
    if not name or not email or not phone:
        raise HTTPException(status_code=400, detail='Name, email, and phone are required')
    
    # Save as enquiry in DB
    enquiry_id = str(uuid.uuid4())
    enquiry_doc = {
        'id': enquiry_id,
        'name': name,
        'email': email,
        'phone': phone,
        'company': company_name,
        'gst_number': gst_number,
        'gst_legal_name': gst_legal_name,
        'gst_trade_name': gst_trade_name,
        'gst_status': gst_status,
        'gst_city': gst_city,
        'gst_state': gst_state,
        'gst_address': gst_address,
        'fabric_type': fabric_type,
        'fabric_url': fabric_url,
        'fabric_name': fabric_name,
        'message': f"{'Fabric URL: ' + fabric_url if fabric_url else 'Fabric Type: ' + fabric_type}\nCompany: {company_name}\nLocation: {location}\nGST: {gst_number}\nGST Legal Name: {gst_legal_name}\nGST Status: {gst_status}",
        'type': 'rfq_lead',
        'source': 'SKU Page RFQ' if fabric_url else 'Homepage RFQ Form',
        'location': location,
        'status': 'new',
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.enquiries.insert_one(enquiry_doc)
    
    # Send email to marketing@locofast.com
    try:
        from email_router import send_rfq_lead_email
        asyncio.create_task(send_rfq_lead_email(enquiry_doc))
    except Exception as e:
        logging.warning(f"Failed to send RFQ lead email: {str(e)}")
    
    # Send to Zapier webhook
    try:
        from zapier_webhook import send_enquiry_to_zapier
        asyncio.create_task(send_enquiry_to_zapier(enquiry_doc))
    except Exception as e:
        logging.warning(f"Failed to send to Zapier: {str(e)}")
    
    # Push to campaigns.locofast.com admin
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post('https://campaigns.locofast.com/api/leads', json={
                'name': name,
                'company': company_name,
                'email': email,
                'phone': phone,
                'company_type': fabric_type if fabric_type else 'Buyer',
                'gst_info': {
                    'legal_name': gst_legal_name,
                    'trade_name': gst_trade_name,
                    'status': gst_status,
                    'city': gst_city,
                    'state': gst_state,
                    'address': gst_address,
                    'fabric_type': fabric_type,
                } if gst_legal_name else None,
                'campaign': 'Website RFQ',
            })
            logging.info(f"RFQ lead pushed to campaigns admin: {name}")
    except Exception as e:
        logging.warning(f"Failed to push to campaigns: {str(e)}")
    
    return {'message': 'Quote request submitted successfully', 'id': enquiry_id}

# ==================== COLLECTION ROUTES ====================

@api_router.get("/collections", response_model=List[Collection])
async def get_collections():
    collections = await db.collections.find({}, {'_id': 0}).sort('created_at', -1).to_list(100)
    for coll in collections:
        coll['fabric_count'] = len(coll.get('fabric_ids', []))
    return collections

@api_router.get("/collections/featured", response_model=List[Collection])
async def get_featured_collections():
    collections = await db.collections.find({'is_featured': True}, {'_id': 0}).sort('created_at', -1).to_list(10)
    for coll in collections:
        coll['fabric_count'] = len(coll.get('fabric_ids', []))
    return collections

@api_router.get("/collections/{collection_id}", response_model=Collection)
async def get_collection(collection_id: str):
    collection = await db.collections.find_one({'id': collection_id}, {'_id': 0})
    if not collection:
        raise HTTPException(status_code=404, detail='Collection not found')
    collection['fabric_count'] = len(collection.get('fabric_ids', []))
    return collection

@api_router.get("/collections/{collection_id}/fabrics", response_model=List[Fabric])
async def get_collection_fabrics(collection_id: str):
    collection = await db.collections.find_one({'id': collection_id}, {'_id': 0})
    if not collection:
        raise HTTPException(status_code=404, detail='Collection not found')
    
    fabric_ids = collection.get('fabric_ids', [])
    if not fabric_ids:
        return []
    
    fabrics = await db.fabrics.find({'id': {'$in': fabric_ids}}, {'_id': 0}).to_list(100)
    
    # Get category and seller info
    category_ids = list(set(f['category_id'] for f in fabrics))
    categories = await db.categories.find({'id': {'$in': category_ids}}, {'_id': 0}).to_list(100)
    cat_map = {c['id']: c['name'] for c in categories}
    
    seller_ids = list(set(f.get('seller_id', '') for f in fabrics if f.get('seller_id')))
    sellers = await db.sellers.find({'id': {'$in': seller_ids}}, {'_id': 0}).to_list(100) if seller_ids else []
    seller_map = {s['id']: s for s in sellers}
    
    for fabric in fabrics:
        normalize_fabric(fabric)
        fabric['category_name'] = cat_map.get(fabric['category_id'], '')
        seller = seller_map.get(fabric.get('seller_id', ''))
        fabric['seller_name'] = seller['name'] if seller else ''
        fabric['seller_company'] = seller['company_name'] if seller else ''
        if 'seller_id' not in fabric:
            fabric['seller_id'] = ''
    
    return fabrics

@api_router.post("/collections", response_model=Collection)
async def create_collection(data: CollectionCreate, admin=Depends(get_current_admin)):
    collection_id = str(uuid.uuid4())
    collection_doc = {
        'id': collection_id,
        'name': data.name,
        'description': data.description or "",
        'image_url': data.image_url or "",
        'fabric_ids': data.fabric_ids or [],
        'is_featured': data.is_featured,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.collections.insert_one(collection_doc)
    collection_doc['fabric_count'] = len(collection_doc['fabric_ids'])
    return Collection(**collection_doc)

@api_router.put("/collections/{collection_id}", response_model=Collection)
async def update_collection(collection_id: str, data: CollectionUpdate, admin=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail='No data to update')
    
    result = await db.collections.update_one({'id': collection_id}, {'$set': update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Collection not found')
    
    collection = await db.collections.find_one({'id': collection_id}, {'_id': 0})
    collection['fabric_count'] = len(collection.get('fabric_ids', []))
    return Collection(**collection)

@api_router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str, admin=Depends(get_current_admin)):
    result = await db.collections.delete_one({'id': collection_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Collection not found')
    return {'message': 'Collection deleted'}

# ==================== STATS ====================

@api_router.get("/stats")
async def get_stats(admin=Depends(get_current_admin)):
    fabrics_count = await db.fabrics.count_documents({})
    categories_count = await db.categories.count_documents({})
    sellers_count = await db.sellers.count_documents({})
    active_sellers_count = await db.sellers.count_documents({'is_active': {'$ne': False}})
    collections_count = await db.collections.count_documents({})
    articles_count = await db.articles.count_documents({})
    enquiries_count = await db.enquiries.count_documents({})
    new_enquiries = await db.enquiries.count_documents({'status': 'new'})
    bookable_fabrics = await db.fabrics.count_documents({'is_bookable': True})
    
    return {
        'fabrics': fabrics_count,
        'categories': categories_count,
        'sellers': sellers_count,
        'active_sellers': active_sellers_count,
        'collections': collections_count,
        'articles': articles_count,
        'enquiries': enquiries_count,
        'new_enquiries': new_enquiries,
        'bookable_fabrics': bookable_fabrics
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    # Check if data exists
    existing = await db.categories.count_documents({})
    if existing > 0:
        return {'message': 'Data already seeded'}
    
    # Seed categories
    categories = [
        {'id': 'cat-cotton', 'name': 'Cotton Fabrics', 'description': 'Woven and knitted cotton fabrics', 'image_url': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400', 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'cat-polyester', 'name': 'Polyester Fabrics', 'description': 'Polyester wovens and knits', 'image_url': 'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=400', 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'cat-blended', 'name': 'Blended Fabrics', 'description': 'Poly-cotton and other blends', 'image_url': 'https://images.unsplash.com/photo-1558171814-05506ed68369?w=400', 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'cat-knits', 'name': 'Knits', 'description': 'Jersey, interlock, and rib knits', 'image_url': 'https://images.unsplash.com/photo-1647699926980-b7d360761521?w=400', 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'cat-denim', 'name': 'Denim', 'description': 'Denim fabrics in various weights', 'image_url': 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400', 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': 'cat-sustainable', 'name': 'Sustainable Fabrics', 'description': 'Organic, recycled, and eco-certified fabrics', 'image_url': 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400', 'created_at': datetime.now(timezone.utc).isoformat()},
    ]
    await db.categories.insert_many(categories)
    
    # Seed fabrics
    fabrics = [
        {'id': str(uuid.uuid4()), 'name': 'Cotton Poplin 40x60', 'category_id': 'cat-cotton', 'fabric_type': 'woven', 'composition': '100% Cotton', 'gsm': 120, 'width': '58 inches', 'color': 'White', 'finish': 'Mercerized', 'moq': '500 meters', 'price_range': 'On enquiry', 'availability': ['Sample', 'Bulk'], 'description': 'Plain weave cotton poplin. Count: 40x60. Construction: 76x68. Suitable for shirts, blouses, and lining applications.', 'tags': ['cotton', 'poplin', 'shirting', 'plain weave'], 'images': ['https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800', 'https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?w=800'], 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': str(uuid.uuid4()), 'name': 'Organic Cotton Canvas', 'category_id': 'cat-cotton', 'fabric_type': 'woven', 'composition': '100% Organic Cotton', 'gsm': 280, 'width': '60 inches', 'color': 'Natural', 'finish': 'Enzyme Washed', 'moq': '300 meters', 'price_range': 'On enquiry', 'availability': ['Sample', 'Bulk'], 'description': 'Heavy canvas weave. GOTS certified organic cotton. Applications: bags, workwear, upholstery.', 'tags': ['organic', 'canvas', 'gots', 'heavy'], 'images': ['https://images.unsplash.com/photo-1594761051656-153e3be6a9a3?w=800'], 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': str(uuid.uuid4()), 'name': 'Cotton Single Jersey', 'category_id': 'cat-knits', 'fabric_type': 'knitted', 'composition': '95% Cotton, 5% Elastane', 'gsm': 180, 'width': '72 inches (tubular)', 'color': 'Multiple colors available', 'finish': 'Bio-polished', 'moq': '400 meters', 'price_range': 'On enquiry', 'availability': ['Sample', 'Bulk'], 'description': 'Single jersey knit with elastane. Bio-polish finish reduces pilling. Suitable for t-shirts and casual wear.', 'tags': ['jersey', 'stretch', 'tshirt', 'knit'], 'images': ['https://images.unsplash.com/photo-1647699926980-b7d360761521?w=800'], 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': str(uuid.uuid4()), 'name': 'PC Blend Twill 65/35', 'category_id': 'cat-blended', 'fabric_type': 'woven', 'composition': '65% Polyester, 35% Cotton', 'gsm': 220, 'width': '58 inches', 'color': 'Khaki', 'finish': 'Wrinkle-resistant', 'moq': '600 meters', 'price_range': 'On enquiry', 'availability': ['Bulk'], 'description': '2/1 twill weave. Poly-cotton blend. Wrinkle-resistant finish. Applications: uniforms, workwear, institutional fabrics.', 'tags': ['twill', 'uniform', 'workwear', 'blend'], 'images': ['https://images.unsplash.com/photo-1558171814-05506ed68369?w=800'], 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': str(uuid.uuid4()), 'name': 'Stretch Denim 10oz', 'category_id': 'cat-denim', 'fabric_type': 'woven', 'composition': '98% Cotton, 2% Spandex', 'gsm': 340, 'width': '56 inches', 'color': 'Indigo', 'finish': 'Stone Washed', 'moq': '500 meters', 'price_range': 'On enquiry', 'availability': ['On Request'], 'description': '3/1 right hand twill denim. Weight: 10oz. Stone wash finish available. Stretch for comfort fit.', 'tags': ['denim', 'stretch', 'jeans', 'indigo'], 'images': ['https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800', 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800'], 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': str(uuid.uuid4()), 'name': 'Recycled Polyester Taffeta', 'category_id': 'cat-sustainable', 'fabric_type': 'woven', 'composition': '100% Recycled Polyester', 'gsm': 150, 'width': '60 inches', 'color': 'Black', 'finish': 'Water-repellent', 'moq': '400 meters', 'price_range': 'On enquiry', 'availability': ['Sample', 'Bulk'], 'description': 'Taffeta weave from recycled PET. GRS certified. Water-repellent finish available. Applications: outerwear, bags.', 'tags': ['recycled', 'grs', 'outerwear', 'taffeta'], 'images': ['https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=800'], 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': str(uuid.uuid4()), 'name': 'Polyester Interlock', 'category_id': 'cat-polyester', 'fabric_type': 'knitted', 'composition': '100% Polyester', 'gsm': 200, 'width': '70 inches', 'color': 'Navy', 'finish': 'Moisture-wicking', 'moq': '350 meters', 'price_range': 'On enquiry', 'availability': ['Sample', 'Bulk'], 'description': 'Double knit interlock construction. Moisture-wicking treatment. Applications: sportswear, activewear, athleisure.', 'tags': ['sports', 'activewear', 'interlock', 'performance'], 'images': ['https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=800'], 'created_at': datetime.now(timezone.utc).isoformat()},
        {'id': str(uuid.uuid4()), 'name': 'Tencel Lyocell Sateen', 'category_id': 'cat-sustainable', 'fabric_type': 'woven', 'composition': '100% Tencel Lyocell', 'gsm': 160, 'width': '58 inches', 'color': 'Sage Green', 'finish': 'Sateen', 'moq': '250 meters', 'price_range': 'On enquiry', 'availability': ['Sample'], 'description': 'Sateen weave Tencel Lyocell. FSC certified. Applications: dresses, blouses, bedding.', 'tags': ['tencel', 'lyocell', 'sateen', 'fsc'], 'images': ['https://images.unsplash.com/photo-1560258632-fb994fd2bd44?w=800'], 'created_at': datetime.now(timezone.utc).isoformat()},
    ]
    await db.fabrics.insert_many(fabrics)
    
    # Create default admin
    admin_doc = {
        'id': str(uuid.uuid4()),
        'email': 'admin@locofast.com',
        'password': hash_password('admin123'),
        'name': 'Locofast Admin',
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin_doc)
    
    return {'message': 'Data seeded successfully', 'admin_email': 'admin@locofast.com', 'admin_password': 'admin123'}

# ==================== SITEMAP ====================

from fastapi.responses import Response

def parse_date_string(date_str: str) -> str:
    """Parse ISO date string and return YYYY-MM-DD format"""
    try:
        if isinstance(date_str, str):
            # Parse ISO format string like "2024-12-01T10:30:00+00:00"
            return date_str[:10]  # Extract YYYY-MM-DD part
        return datetime.now(timezone.utc).strftime('%Y-%m-%d')
    except:
        return datetime.now(timezone.utc).strftime('%Y-%m-%d')

async def generate_sitemap_xml():
    """Generate dynamic sitemap.xml content"""
    import re as re_mod
    base_url = "https://locofast.com"
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    # Get all fabrics
    fabrics = await db.fabrics.find({'status': 'approved'}, {'id': 1, 'created_at': 1}).to_list(length=10000)
    
    # Get all collections
    collections = await db.collections.find({}, {'id': 1, 'created_at': 1}).to_list(length=100)
    
    # Get all blog posts
    posts = await db.posts.find({'status': 'published'}, {'slug': 1, 'updated_at': 1}).to_list(length=500)
    
    # Get all categories
    categories = await db.categories.find({}, {'_id': 0}).to_list(length=100)
    
    # Get all active sellers
    sellers = await db.sellers.find(
        {'is_active': {'$ne': False}},
        {'_id': 0, 'id': 1, 'company_name': 1, 'name': 1, 'state': 1, 'category_ids': 1}
    ).to_list(length=500)
    cat_map = {c['id']: c['name'] for c in categories}
    
    # Static pages
    static_pages = [
        {'loc': '/', 'priority': '1.0', 'changefreq': 'weekly'},
        {'loc': '/fabrics', 'priority': '0.9', 'changefreq': 'daily'},
        {'loc': '/collections', 'priority': '0.8', 'changefreq': 'weekly'},
        {'loc': '/suppliers', 'priority': '0.8', 'changefreq': 'weekly'},
        {'loc': '/sell', 'priority': '0.7', 'changefreq': 'monthly'},
        {'loc': '/about-us', 'priority': '0.6', 'changefreq': 'monthly'},
        {'loc': '/customers', 'priority': '0.6', 'changefreq': 'monthly'},
        {'loc': '/how-it-works', 'priority': '0.6', 'changefreq': 'monthly'},
        {'loc': '/assisted-sourcing', 'priority': '0.7', 'changefreq': 'monthly'},
        {'loc': '/contact', 'priority': '0.5', 'changefreq': 'monthly'},
        {'loc': '/faq', 'priority': '0.5', 'changefreq': 'monthly'},
        {'loc': '/blog', 'priority': '0.7', 'changefreq': 'weekly'},
        {'loc': '/tools', 'priority': '0.6', 'changefreq': 'monthly'},
        {'loc': '/tools/gst-calculator', 'priority': '0.5', 'changefreq': 'monthly'},
        {'loc': '/tools/profit-margin-calculator', 'priority': '0.5', 'changefreq': 'monthly'},
        {'loc': '/tools/gsm-calculator', 'priority': '0.5', 'changefreq': 'monthly'},
        {'loc': '/tools/cbm-calculator', 'priority': '0.5', 'changefreq': 'monthly'},
    ]
    
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    # Add static pages
    for page in static_pages:
        xml_content += f'''  <url>
    <loc>{base_url}{page['loc']}</loc>
    <changefreq>{page['changefreq']}</changefreq>
    <priority>{page['priority']}</priority>
  </url>\n'''
    
    # Add fabric pages
    for fabric in fabrics:
        last_mod = parse_date_string(fabric.get('created_at', ''))
        xml_content += f'''  <url>
    <loc>{base_url}/fabrics/{fabric['id']}</loc>
    <lastmod>{last_mod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n'''
    
    # Add collection pages
    for collection in collections:
        xml_content += f'''  <url>
    <loc>{base_url}/collections/{collection['id']}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n'''
    
    # Add blog posts
    for post in posts:
        last_mod = parse_date_string(post.get('updated_at', ''))
        xml_content += f'''  <url>
    <loc>{base_url}/blog/{post['slug']}</loc>
    <lastmod>{last_mod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n'''
    
    # Add category pages
    for cat in categories:
        xml_content += f'''  <url>
    <loc>{base_url}/fabrics?category={cat['id']}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>\n'''
    
    # Add supplier profile pages
    def _slugify(text):
        s = text.lower().strip()
        s = re_mod.sub(r'[^a-z0-9\s-]', '', s)
        s = re_mod.sub(r'[\s_]+', '-', s)
        s = re_mod.sub(r'-+', '-', s)
        return s.strip('-')
    
    for seller in sellers:
        company = seller.get('company_name') or seller.get('name', '')
        state = seller.get('state', '')
        s_cat_ids = seller.get('category_ids', [])
        if not company or not state:
            continue
        company_slug = _slugify(company)
        state_slug = _slugify(state)
        cat_name = cat_map.get(s_cat_ids[0], 'fabrics') if s_cat_ids else 'fabrics'
        cat_slug = _slugify(cat_name)
        xml_content += f'''  <url>
    <loc>{base_url}/suppliers/{cat_slug}/{state_slug}/{company_slug}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n'''
    
    xml_content += '</urlset>'
    
    return xml_content

# Root-level sitemap endpoint (served at /sitemap.xml via ingress routing)
@api_router.get("/sitemap.xml", response_class=Response)
async def get_sitemap():
    """Generate dynamic sitemap.xml - accessible at /api/sitemap.xml"""
    xml_content = await generate_sitemap_xml()
    return Response(content=xml_content, media_type="application/xml")

# ==================== SETUP ====================

# Initialize orders and email routers with database
orders_router.set_db(db)
orders_router.init_razorpay()
email_router.set_db(db)
cloudinary_router.set_db(db)
cloudinary_router.init_cloudinary()
rfq_router.set_db(db)

app.include_router(api_router)
app.include_router(tools_router)
app.include_router(seo_router)
app.include_router(blog_router)
app.include_router(supplier_router)
app.include_router(orders_router.router)
app.include_router(email_router.router)
app.include_router(vendor_router.router)
app.include_router(coupon_router.router, prefix="/api")
app.include_router(cloudinary_router.router)
app.include_router(rfq_router.router)
app.include_router(supplier_profile_router.router)

import prerender_router
app.include_router(prerender_router.router)

import customer_router
customer_router.set_db(db)
app.include_router(customer_router.router)

# Serve uploaded files
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bot prerender middleware: serves pre-rendered HTML to search engine bots
from bot_prerender_middleware import BotPrerenderMiddleware
app.add_middleware(BotPrerenderMiddleware)

@app.on_event("startup")
async def startup_create_default_admin():
    """Create or reset default admin on startup"""
    try:
        # Always ensure admin@locofast.com exists with password admin123
        existing = await db.admins.find_one({'email': 'admin@locofast.com'})
        
        if existing:
            # Reset password to admin123
            await db.admins.update_one(
                {'email': 'admin@locofast.com'},
                {'$set': {'password': hash_password('admin123')}}
            )
            logger.info("Admin password reset to: admin123")
        else:
            # Create new admin
            admin_doc = {
                'id': str(uuid.uuid4()),
                'email': 'admin@locofast.com',
                'password': hash_password('admin123'),
                'name': 'Locofast Admin',
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            await db.admins.insert_one(admin_doc)
            logger.info("Default admin created: admin@locofast.com / admin123")
    except Exception as e:
        logger.error(f"Error with admin setup: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
