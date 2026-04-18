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
    # Multi-color variant support
    has_multiple_colors: bool = False
    color_variants: List[dict] = []  # [{color_name, color_hex, image_url, quantity_available}]

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
    has_multiple_colors: Optional[bool] = None
    color_variants: Optional[List[dict]] = None

class Fabric(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    slug: str = ""
    fabric_code: str = ""
    name: str = ""
    category_id: str = ""
    category_name: str = ""
    seller_id: str = ""
    seller_name: str = ""
    seller_company: str = ""
    seller_code: str = ""
    article_id: str = ""
    fabric_type: str = ""
    pattern: str = "Solid"
    composition: List[CompositionItem] = []
    gsm: Optional[int] = None
    ounce: str = ""
    weight_unit: str = "gsm"
    width: str = ""
    warp_count: str = ""
    weft_count: str = ""
    yarn_count: str = ""
    denier: Optional[int] = None
    color: str = ""
    finish: str = ""
    moq: str = ""
    starting_price: str = ""
    availability: List[str] = []
    stock_type: str = "ready_stock"
    description: str = ""
    tags: List[str] = []
    images: List[str] = []
    videos: List[str] = []
    quantity_available: Optional[int] = None
    rate_per_meter: Optional[float] = None
    dispatch_timeline: str = ""
    sample_delivery_days: str = ""
    bulk_delivery_days: str = ""
    is_bookable: bool = False
    sample_price: Optional[float] = None
    pricing_tiers: List[dict] = []
    weft_shrinkage: Optional[float] = None
    stretch_percentage: Optional[float] = None
    seller_sku: str = ""
    hsn_code: str = ""
    has_multiple_colors: bool = False
    color_variants: List[dict] = []
    status: Optional[str] = None
    created_at: str = ""

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

# ==================== CATEGORY ROUTES (extracted to category_router.py) ====================

# ==================== SELLER ROUTES (extracted to seller_router.py) ====================

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
    # Fabric type
    if 'fabric_type' not in fabric:
        fabric['fabric_type'] = ''
    # HSN code
    if 'hsn_code' not in fabric:
        fabric['hsn_code'] = ''
    # Multi-color fields
    if 'has_multiple_colors' not in fabric:
        fabric['has_multiple_colors'] = False
    if 'color_variants' not in fabric:
        fabric['color_variants'] = []
    # Color, moq, description, width defaults
    if 'color' not in fabric:
        fabric['color'] = ''
    if 'moq' not in fabric:
        fabric['moq'] = ''
    if 'description' not in fabric:
        fabric['description'] = ''
    if 'width' not in fabric:
        fabric['width'] = ''
    if 'finish' not in fabric:
        fabric['finish'] = ''
    if 'created_at' not in fabric:
        fabric['created_at'] = ''
    # Slug field — use stored slug or fall back to fabric ID (never generate random)
    if 'slug' not in fabric or not fabric.get('slug'):
        fabric['slug'] = fabric.get('id', '')
    
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


@api_router.get("/fabrics/filter-options")
async def get_fabric_filter_options():
    """Return distinct values for color, pattern, width, composition from approved fabrics — used to populate filter dropdowns."""
    import re as re_mod
    fabrics = await db.fabrics.find(
        {'status': 'approved'},
        {'_id': 0, 'color': 1, 'name': 1, 'pattern': 1, 'width': 1, 'composition': 1, 'category_name': 1}
    ).to_list(5000)
    
    colors = set()
    patterns = set()
    widths = set()
    compositions = set()
    has_denim = False
    
    for f in fabrics:
        # Colors: from color field + extract "Color: XXX" from name
        c = (f.get('color') or '').strip()
        if c:
            colors.add(c)
        match = re_mod.search(r'Color:\s*([^,]+)', f.get('name', ''))
        if match:
            colors.add(match.group(1).strip())
        # Patterns
        p = (f.get('pattern') or '').strip()
        if p:
            patterns.add(p)
        # Widths
        w = (f.get('width') or '').strip()
        if w:
            widths.add(w)
        # Compositions — extract material names
        comp = f.get('composition')
        if isinstance(comp, list):
            for item in comp:
                mat = (item.get('material') or '').strip()
                if mat:
                    compositions.add(mat)
        elif isinstance(comp, str) and comp.strip():
            # Parse "65% Polyester, 35% Cotton" style strings
            for part in comp.split(','):
                mat = re_mod.sub(r'\d+%?\s*', '', part).strip()
                if mat:
                    compositions.add(mat)
        # Check if denim category exists
        cat = (f.get('category_name') or '').lower()
        if 'denim' in cat:
            has_denim = True
    
    return {
        'colors': sorted(colors, key=str.lower),
        'patterns': sorted(patterns, key=str.lower),
        'widths': sorted(widths, key=str.lower),
        'compositions': sorted(compositions, key=str.lower),
        'has_denim': has_denim,
    }


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
    composition: Optional[str] = Query(None),
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
        # Search color field OR fabric name (color data often embedded in name)
        and_conditions.append({
            '$or': [
                {'color': {'$regex': color, '$options': 'i'}},
                {'name': {'$regex': color, '$options': 'i'}}
            ]
        })
    if width:
        query['width'] = {'$regex': width, '$options': 'i'}
    if min_weight_oz is not None or max_weight_oz is not None:
        # ounce is stored as messy strings ("6.50 OZ", "4.5 OZS", "9.5(+-3%)")
        # Just require ounce field exists; we post-filter in Python after the query
        and_conditions.append({'ounce': {'$exists': True, '$ne': ''}})
    _oz_min = min_weight_oz
    _oz_max = max_weight_oz
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q['$gte'] = min_price
        if max_price is not None:
            price_q['$lte'] = max_price
        if price_q:
            query['rate_per_meter'] = price_q

    if composition:
        and_conditions.append({
            '$or': [
                {'composition': {'$elemMatch': {'material': {'$regex': composition, '$options': 'i'}}}},
                {'composition': {'$regex': composition, '$options': 'i'}}
            ]
        })

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
    ]
    
    # Add oz numeric filter as pipeline stage if needed
    if _oz_min is not None or _oz_max is not None:
        pipeline.append({'$addFields': {
            '_oz_match': {'$regexFind': {'input': {'$ifNull': ['$ounce', '0']}, 'regex': r'^[\d.]+'}}
        }})
        pipeline.append({'$addFields': {
            '_oz_num': {'$convert': {'input': '$_oz_match.match', 'to': 'double', 'onError': 0, 'onNull': 0}}
        }})
        oz_cond = {}
        if _oz_min is not None:
            oz_cond['$gte'] = _oz_min
        if _oz_max is not None:
            oz_cond['$lte'] = _oz_max
        pipeline.append({'$match': {'_oz_num': oz_cond}})
    
    pipeline.extend([
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
        {'$project': {'_id': 0, 'booking_priority': 0, '_oz_match': 0, '_oz_num': 0}}
    ])
    
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
    composition: Optional[str] = Query(None),
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
        # Search color field OR fabric name (color data often embedded in name)
        and_conditions.append({
            '$or': [
                {'color': {'$regex': color, '$options': 'i'}},
                {'name': {'$regex': color, '$options': 'i'}}
            ]
        })
    if width:
        query['width'] = {'$regex': width, '$options': 'i'}
    if min_weight_oz is not None or max_weight_oz is not None:
        and_conditions.append({'ounce': {'$exists': True, '$ne': ''}})
    _count_oz_min = min_weight_oz
    _count_oz_max = max_weight_oz
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q['$gte'] = min_price
        if max_price is not None:
            price_q['$lte'] = max_price
        if price_q:
            query['rate_per_meter'] = price_q
    if composition:
        and_conditions.append({
            '$or': [
                {'composition': {'$elemMatch': {'material': {'$regex': composition, '$options': 'i'}}}},
                {'composition': {'$regex': composition, '$options': 'i'}}
            ]
        })
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
    
    # Use aggregation if oz filter is active (need regex parsing)
    if _count_oz_min is not None or _count_oz_max is not None:
        count_pipeline = [{'$match': query}]
        count_pipeline.append({'$addFields': {
            '_oz_match': {'$regexFind': {'input': {'$ifNull': ['$ounce', '0']}, 'regex': r'^[\d.]+'}}
        }})
        count_pipeline.append({'$addFields': {
            '_oz_num': {'$convert': {'input': '$_oz_match.match', 'to': 'double', 'onError': 0, 'onNull': 0}}
        }})
        oz_cond = {}
        if _count_oz_min is not None:
            oz_cond['$gte'] = _count_oz_min
        if _count_oz_max is not None:
            oz_cond['$lte'] = _count_oz_max
        count_pipeline.append({'$match': {'_oz_num': oz_cond}})
        count_pipeline.append({'$count': 'total'})
        result = await db.fabrics.aggregate(count_pipeline).to_list(1)
        count = result[0]['total'] if result else 0
    else:
        count = await db.fabrics.count_documents(query)
    return {'count': count}

@api_router.get("/fabrics/{fabric_id_or_slug}", response_model=Fabric)
async def get_fabric(fabric_id_or_slug: str):
    # Try by ID first, then by exact slug
    fabric = await db.fabrics.find_one({'id': fabric_id_or_slug}, {'_id': 0})
    if not fabric:
        fabric = await db.fabrics.find_one({'slug': fabric_id_or_slug}, {'_id': 0})
    # Fallback: partial slug match (strip last 6-char suffix and regex match)
    if not fabric and len(fabric_id_or_slug) > 7 and '-' in fabric_id_or_slug:
        slug_prefix = fabric_id_or_slug.rsplit('-', 1)[0]
        if slug_prefix:
            fabric = await db.fabrics.find_one({'slug': {'$regex': f'^{slug_prefix}'}}, {'_id': 0})
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
    
    # Generate SEO-friendly slug
    from slug_utils import generate_slug
    slug = generate_slug(data.name, fabric_id)
    
    fabric_doc = {
        'id': fabric_id,
        'fabric_code': fabric_code,
        'slug': slug,
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
    
    # Regenerate slug if name changed
    if 'name' in update_data:
        from slug_utils import generate_slug
        update_data['slug'] = generate_slug(update_data['name'], fabric_id)
    
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


# Credit routes moved to credit_router.py


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
    bin_number = data.get('bin_number', '')
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
        'bin_number': bin_number,
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
            campaign_payload = {
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
            }
            # Include BIN for Bangladesh leads
            if bin_number:
                campaign_payload['bin'] = bin_number
            await client.post('https://campaigns.locofast.com/api/leads', json=campaign_payload)
            logging.info(f"RFQ lead pushed to campaigns admin: {name}")
    except Exception as e:
        logging.warning(f"Failed to push to campaigns: {str(e)}")
    
    return {'message': 'Quote request submitted successfully', 'id': enquiry_id}

# ==================== COLLECTION ROUTES (extracted to collection_router.py) ====================

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


@api_router.post("/migrate/slugs")
async def migrate_slugs(admin=Depends(get_current_admin)):
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
        return None, f"no known material in composition"
    # Name fallback
    low = (name or "").lower()
    best, best_pos = None, 10**9
    for key, target in _BLENDED_MAT_MAP:
        pos = low.find(key)
        if pos != -1 and pos < best_pos:
            best, best_pos = target, pos
    if best:
        return best, f"(inferred from name)"
    return None, "no composition + no hint in name"


@api_router.post("/migrate/blended")
async def migrate_blended(apply: bool = Query(False), admin=Depends(get_current_admin)):
    """Dissolve the 'Blended Fabrics' category.
    - GET-like dry run: POST /api/migrate/blended (apply=false) → returns the plan.
    - Apply:            POST /api/migrate/blended?apply=true   → runs and deletes Blended.
    Idempotent — safe to re-run.
    """
    cats = await db.categories.find({}, {"_id": 0}).to_list(length=500)
    by_name = {c["name"]: c for c in cats}
    blended = by_name.get("Blended Fabrics")
    if not blended:
        return {
            "apply": apply,
            "status": "noop",
            "message": "No 'Blended Fabrics' category present — nothing to migrate.",
            "plan": [],
            "summary": {},
        }

    # Ensure Linen exists (create only on apply)
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
    fabrics = await db.fabrics.find(
        {"category_id": blended_id}, {"_id": 0}
    ).to_list(length=5000)

    plan = []
    summary = {}
    stays = 0
    for f in fabrics:
        target_name, reason = _dominant_target(f.get("composition"), f.get("name", ""))
        target = by_name.get(target_name) if target_name and target_name != "Blended Fabrics" else None
        plan.append({
            "id": f["id"],
            "name": f.get("name", ""),
            "target": target_name if target else "-- stays --",
            "reason": reason,
            "target_exists": bool(target),
        })
        if target:
            summary[target_name] = summary.get(target_name, 0) + 1
        else:
            stays += 1
    summary["__stays_in_blended"] = stays

    if not apply:
        return {
            "apply": False,
            "status": "dry_run",
            "blended_fabrics_total": len(fabrics),
            "summary": summary,
            "linen_will_be_created": "Linen" not in [c["name"] for c in cats],
            "plan": plan,
        }

    # APPLY
    updated = 0
    for f in fabrics:
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

    # Refresh fabric_count on affected categories
    counts_after = {}
    for cat_name in list(summary.keys()) + ["Blended Fabrics"]:
        if cat_name.startswith("__"):
            continue
        cat = by_name.get(cat_name)
        if not cat:
            continue
        c = await db.fabrics.count_documents({"category_id": cat["id"]})
        await db.categories.update_one(
            {"id": cat["id"]}, {"$set": {"fabric_count": c}}
        )
        counts_after[cat_name] = c

    deleted_blended = False
    remaining = await db.fabrics.count_documents({"category_id": blended_id})
    if remaining == 0:
        r = await db.categories.delete_one({"id": blended_id})
        deleted_blended = bool(r.deleted_count)

    return {
        "apply": True,
        "status": "applied",
        "blended_fabrics_total": len(fabrics),
        "reassigned": updated,
        "linen_created": linen_created,
        "summary": summary,
        "counts_after": counts_after,
        "blended_deleted": deleted_blended,
        "blended_remaining": remaining,
    }


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
    fabrics = await db.fabrics.find({'status': 'approved'}, {'_id': 0, 'id': 1, 'slug': 1, 'created_at': 1}).to_list(length=10000)
    
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
    
    # Add fabric pages (use slug if available, fallback to id)
    for fabric in fabrics:
        last_mod = parse_date_string(fabric.get('created_at', ''))
        fabric_path = fabric.get('slug') or fabric['id']
        xml_content += f'''  <url>
    <loc>{base_url}/fabrics/{fabric_path}</loc>
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

import agent_router
agent_router.set_db(db)
app.include_router(agent_router.router)

import commission_router
commission_router.set_db(db)
app.include_router(commission_router.router)

import category_router
category_router.set_db(db)
app.include_router(category_router.router)

import seller_router
seller_router.set_db(db)
app.include_router(seller_router.router)

import collection_router
collection_router.set_db(db, normalize_fn=normalize_fabric)
app.include_router(collection_router.router)

import credit_router
credit_router.set_db(db)
app.include_router(credit_router.router, prefix="/api")

import auth_helpers
auth_helpers.set_db(db)

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
