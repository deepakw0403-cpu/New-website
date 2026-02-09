from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'locofast-secret-key-2024')
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
    contact_email: Optional[str] = ""
    contact_phone: Optional[str] = ""
    category_ids: List[str] = []

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

class Seller(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
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
    created_at: str

class FabricCreate(BaseModel):
    name: str
    category_id: str
    seller_id: Optional[str] = ""
    fabric_type: str  # woven / knitted / non-woven
    pattern: str = "Solid"  # Solid / Print / None
    composition: List[CompositionItem] = []
    gsm: int
    width: str
    color: str
    finish: Optional[str] = ""
    moq: str
    starting_price: Optional[str] = ""
    availability: List[str] = []  # Sample, Bulk, On Request
    description: str
    tags: List[str] = []
    images: List[str] = []
    videos: List[str] = []

class FabricUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    seller_id: Optional[str] = None
    fabric_type: Optional[str] = None
    pattern: Optional[str] = None
    composition: Optional[List[CompositionItem]] = None
    gsm: Optional[int] = None
    width: Optional[str] = None
    color: Optional[str] = None
    finish: Optional[str] = None
    moq: Optional[str] = None
    starting_price: Optional[str] = None
    availability: Optional[List[str]] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    images: Optional[List[str]] = None
    videos: Optional[List[str]] = None

class Fabric(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category_id: str
    category_name: str = ""
    seller_id: str = ""
    seller_name: str = ""
    seller_company: str = ""
    fabric_type: str
    pattern: str = "Solid"
    composition: List[CompositionItem] = []
    gsm: int
    width: str
    color: str
    finish: str = ""
    moq: str
    starting_price: str = ""
    availability: List[str] = []
    description: str
    tags: List[str] = []
    images: List[str] = []
    videos: List[str] = []
    created_at: str

class EnquiryCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    company: Optional[str] = ""
    message: str
    fabric_id: Optional[str] = None
    fabric_name: Optional[str] = None

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
async def get_sellers():
    sellers = await db.sellers.find({}, {'_id': 0}).sort('created_at', -1).to_list(100)
    
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
        # Handle legacy location field
        if 'city' not in seller:
            seller['city'] = seller.get('location', '')
        if 'state' not in seller:
            seller['state'] = ''
    
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
    
    return seller

@api_router.post("/sellers", response_model=Seller)
async def create_seller(data: SellerCreate, admin=Depends(get_current_admin)):
    seller_id = str(uuid.uuid4())
    
    # Get category names for response
    category_names = []
    if data.category_ids:
        categories = await db.categories.find({'id': {'$in': data.category_ids}}, {'_id': 0}).to_list(100)
        category_names = [c['name'] for c in categories]
    
    seller_doc = {
        'id': seller_id,
        'name': data.name,
        'company_name': data.company_name,
        'description': data.description or "",
        'logo_url': data.logo_url or "",
        'city': data.city or "",
        'state': data.state or "",
        'contact_email': data.contact_email or "",
        'contact_phone': data.contact_phone or "",
        'category_ids': data.category_ids or [],
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.sellers.insert_one(seller_doc)
    
    response_doc = {**seller_doc, 'category_names': category_names}
    return Seller(**response_doc)

@api_router.put("/sellers/{seller_id}", response_model=Seller)
async def update_seller(seller_id: str, data: SellerUpdate, admin=Depends(get_current_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
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
        # Parse legacy format like "100% Cotton" or "65% Polyester, 35% Cotton"
        # Try to extract percentages and materials from the string
        parsed = []
        # Match patterns like "100% Cotton" or "65% Polyester"
        matches = re.findall(r'(\d+)%\s*([^,]+)', comp_str)
        if matches:
            for percentage, material in matches:
                parsed.append({'material': material.strip(), 'percentage': int(percentage)})
            fabric['composition'] = parsed
        else:
            # No percentage found, assume 100% of the material name
            fabric['composition'] = [{'material': comp_str, 'percentage': 100}]
    elif not fabric.get('composition'):
        fabric['composition'] = []
    
    # Handle missing new fields
    if 'pattern' not in fabric:
        fabric['pattern'] = 'Solid'
    if 'starting_price' not in fabric:
        fabric['starting_price'] = ''
    if 'videos' not in fabric:
        fabric['videos'] = []
    if 'availability' not in fabric:
        fabric['availability'] = []
    elif not isinstance(fabric.get('availability'), list):
        fabric['availability'] = []
    
    return fabric

@api_router.get("/fabrics", response_model=List[Fabric])
async def get_fabrics(
    category_id: Optional[str] = Query(None),
    seller_id: Optional[str] = Query(None),
    fabric_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    min_gsm: Optional[int] = Query(None),
    max_gsm: Optional[int] = Query(None)
):
    query = {}
    if category_id:
        query['category_id'] = category_id
    if seller_id:
        query['seller_id'] = seller_id
    if fabric_type:
        query['fabric_type'] = fabric_type
    if min_gsm is not None or max_gsm is not None:
        query['gsm'] = {}
        if min_gsm is not None:
            query['gsm']['$gte'] = min_gsm
        if max_gsm is not None:
            query['gsm']['$lte'] = max_gsm
        if not query['gsm']:
            del query['gsm']
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'tags': {'$regex': search, '$options': 'i'}},
            {'composition': {'$regex': search, '$options': 'i'}},
            {'color': {'$regex': search, '$options': 'i'}}
        ]
    
    fabrics = await db.fabrics.find(query, {'_id': 0}).sort('created_at', -1).to_list(500)
    
    # Get category names
    category_ids = list(set(f['category_id'] for f in fabrics))
    categories = await db.categories.find({'id': {'$in': category_ids}}, {'_id': 0}).to_list(100)
    cat_map = {c['id']: c['name'] for c in categories}
    
    # Get seller info
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
    else:
        fabric['seller_id'] = ''
        fabric['seller_name'] = ''
        fabric['seller_company'] = ''
    
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
    fabric_doc = {
        'id': fabric_id,
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
    category = await db.categories.find_one({'id': fabric['category_id']}, {'_id': 0})
    fabric['category_name'] = category['name'] if category else ''
    
    # Get seller info
    if fabric.get('seller_id'):
        seller = await db.sellers.find_one({'id': fabric['seller_id']}, {'_id': 0})
        fabric['seller_name'] = seller['name'] if seller else ''
        fabric['seller_company'] = seller['company_name'] if seller else ''
    else:
        fabric['seller_id'] = ''
        fabric['seller_name'] = ''
        fabric['seller_company'] = ''
    
    return Fabric(**fabric)

@api_router.delete("/fabrics/{fabric_id}")
async def delete_fabric(fabric_id: str, admin=Depends(get_current_admin)):
    result = await db.fabrics.delete_one({'id': fabric_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Fabric not found')
    return {'message': 'Fabric deleted'}

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

# ==================== STATS ====================

@api_router.get("/stats")
async def get_stats(admin=Depends(get_current_admin)):
    fabrics_count = await db.fabrics.count_documents({})
    categories_count = await db.categories.count_documents({})
    sellers_count = await db.sellers.count_documents({})
    enquiries_count = await db.enquiries.count_documents({})
    new_enquiries = await db.enquiries.count_documents({'status': 'new'})
    
    return {
        'fabrics': fabrics_count,
        'categories': categories_count,
        'sellers': sellers_count,
        'enquiries': enquiries_count,
        'new_enquiries': new_enquiries
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

# ==================== SETUP ====================

app.include_router(api_router)

# Serve uploaded files
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
