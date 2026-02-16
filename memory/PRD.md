# Locofast - Fabric Catalog CMS

## Original Problem Statement
Build a CMS-driven fabric catalog website for Locofast - a B2B fabric sourcing platform. The website allows the Locofast team to upload fabric swatches and related information, and allows customers to browse fabrics easily on the frontend.

**Recent Evolution**: Platform expanding to full B2B marketplace with seller inventory management, direct booking, and order management.

## User Personas
1. **Admin (Locofast Team)** - Manages fabrics, categories, sellers, articles, orders and views customer enquiries
2. **Customer (Frontend User)** - Browses fabrics by category, views details, submits enquiries, and can place orders for bookable fabrics
3. **Seller (Future)** - Manages their own inventory, prices, and dispatch timelines

## Core Requirements (Static)
- Admin panel with JWT authentication
- Fabric management (CRUD with images, specs, tags)
- Category management
- Seller management with location, category specializations, and activation controls
- Article management (color variant grouping)
- Fabric browsing with search & filters
- Enquiry submission system
- Static pages (About, How It Works, Contact)

## User Choices
- Authentication: JWT email/password
- Enquiry: Store in DB (email integration deferred)
- Image Storage: Local uploads (Cloudinary integration deferred)
- Branding: Locofast brand colors (#2563EB blue) and logo
- Demo Data: Seeded with 8 fabrics, 6 categories

## Brand Language Guidelines Applied
- **Tone**: Clear, confident, professional, operational
- **Audience**: B2B buyers and suppliers in textile sourcing
- **Avoided**: Marketing hype, buzzwords, exaggerated claims
- **CTAs**: Neutral, functional ("Browse Fabrics", "Request Information", "Submit Enquiry")
- **Descriptions**: Factual, specification-led (GSM, composition, width, MOQ)
- **Positioning**: Locofast as facilitator, not seller

## What's Been Implemented

### Feb 16, 2026 - Phase 1: B2B Marketplace Foundation
- **Seller Enhancements**:
  - Unique seller codes (LS-XXXXX format) auto-generated on creation
  - Seller activation/deactivation (is_active field)
  - "Show inactive" toggle on admin sellers page
  - Visual indicators for inactive sellers
- **Article System (Color Variant Grouping)**:
  - New Article model with article_code (ART-XXXXX format)
  - Article CRUD endpoints and admin page
  - Fabrics can be linked to articles via article_id
  - Variant count displayed on article cards
- **Fabric Inventory Fields**:
  - quantity_available (meters in stock)
  - rate_per_meter (price per meter)
  - dispatch_timeline (e.g., "7-10 days")
  - is_bookable (toggle for direct ordering)
  - seller_sku (seller's unique identifier)
- **Denim-Specific Fields**:
  - weft_shrinkage (percentage)
  - stretch_percentage (percentage)
  - Conditionally displayed when Denim category selected
- **Dashboard Enhancements**:
  - 7 stat cards: Fabrics, Articles, Categories, Active Sellers, Collections, Bookable, Enquiries
  - New stats: articles, active_sellers, bookable_fabrics

### Feb 9, 2026 - Collections Feature
- **Collections System**: Full CRUD for marketing collections/ranges
  - Admin can create, edit, delete collections
  - Add/remove fabrics from collections
  - Upload collection cover images
  - Mark collections as "Featured" for homepage display
- **Public Collections Page**: Browse all collections at /collections
- **Collection Detail Page**: View all fabrics in a collection at /collections/{id}
- **Navigation**: Added "Collections" link to main nav and admin sidebar
- **Dashboard**: Added collections count to admin stats

### Feb 9, 2026 - Seven New Features
- **Header Logo Link**: Links to www.locofast.com in new tab
- **Seller-Category Linking**: Sellers can select multiple category specializations
- **Seller Location Fields**: City and State fields (replaced single Location field)
- **Fabric Composition Editor**: Up to 3 materials with percentage inputs, validates total = 100%
- **Pattern Dropdown**: Solid, Print, Stripes, Checks, Floral, Geometric, Digital, Random, Others
- **Starting Price Field**: Text field for fabric pricing (e.g., "₹150/meter" or "On enquiry")
- **Video Support**: Add video URLs (YouTube, Vimeo, direct links) to fabrics

### Feb 6, 2026 - MVP & Features
- **Backend (FastAPI + MongoDB)**
  - JWT authentication for admin
  - Categories CRUD API
  - Fabrics CRUD API with image upload
  - Sellers CRUD API with city/state/categories
  - Enquiries API
  - Stats endpoint for dashboard
  - Seed data endpoint

- **Frontend (React + Tailwind)**
  - Homepage with hero, categories grid, featured fabrics
  - Fabric listing page with search, filters (category, type, GSM)
  - Fabric detail page with image gallery, specs, enquiry modal
  - Contact page with form
  - About & How It Works static pages
  - Admin login, dashboard, fabrics/categories/sellers/enquiries management

- **Design**
  - Locofast brand identity (blue #2563EB)
  - Inter font for body text
  - Light theme with professional B2B aesthetic
  - Mobile responsive

### Footer & Static Pages
- **Footer**: Replicated locofast.com footer structure
  - Offices section with all 6 locations
  - Company links (About, Customers, Suppliers, Media)
  - Resources links (Careers, FAQs, Privacy Policy, Terms)
  - Social links (LinkedIn, Facebook, Instagram, YouTube)
  - Contact info with phone and email
- **Static Pages**: FAQs, Privacy Policy, Terms of Use, Customers, Suppliers, Media & Awards, Life at Locofast

## Prioritized Backlog

### P0 (Completed)
- [x] Core fabric catalog
- [x] Admin panel
- [x] Enquiry system
- [x] Brand language alignment
- [x] Seller management with city/state
- [x] Seller-category linking
- [x] Fabric composition editor (3 materials)
- [x] Pattern dropdown (9 options)
- [x] Starting price field
- [x] Video URL support
- [x] Collections feature
- [x] Seller codes (LS-XXXXX) and activation
- [x] Article system for color variants (ART-XXXXX)
- [x] Fabric inventory fields
- [x] Denim-specific fields

### P1 (In Progress - B2B Marketplace Phase 2)
- [ ] Seller Admin Portal (separate login for sellers to manage their inventory)
- [ ] Order Management (admin panel to track orders by seller)
- [ ] Razorpay Payment Integration (advance + full payment options)
- [ ] Invoice generation after payment

### P2 (Future)
- [ ] Cloudinary integration for images
- [ ] Email notifications for enquiries (SendGrid/Resend)
- [ ] Seller profiles public page
- [ ] Price visibility controls
- [ ] Buyer login/accounts
- [ ] RFQ workflows
- [ ] Sample request tracking

## Technical Stack
- Frontend: React 19, Tailwind CSS, React Router, Sonner
- Backend: FastAPI, Motor (async MongoDB)
- Database: MongoDB
- Auth: JWT with bcrypt

## Data Models

### Article (NEW)
```json
{
  "id": "string",
  "article_code": "string (ART-XXXXX)",
  "name": "string",
  "base_fabric_id": "string",
  "description": "string",
  "seller_id": "string",
  "category_id": "string",
  "variant_count": "int",
  "created_at": "datetime"
}
```

### Collection
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "image_url": "string",
  "fabric_ids": ["string"],
  "fabric_count": "int",
  "is_featured": "boolean",
  "created_at": "datetime"
}
```

### Seller (UPDATED)
```json
{
  "id": "string",
  "seller_code": "string (LS-XXXXX)",
  "name": "string",
  "company_name": "string",
  "description": "string",
  "logo_url": "string",
  "city": "string",
  "state": "string",
  "contact_email": "string",
  "contact_phone": "string",
  "category_ids": ["string"],
  "category_names": ["string"],
  "is_active": "boolean",
  "created_at": "datetime"
}
```

### Fabric (UPDATED)
```json
{
  "id": "string",
  "fabric_code": "string (LF-XXXXX)",
  "name": "string",
  "category_id": "string",
  "seller_id": "string",
  "seller_code": "string",
  "article_id": "string",
  "fabric_type": "woven|knitted|non-woven",
  "pattern": "Solid|Print|Stripes|Checks|Floral|Geometric|Digital|Random|Others",
  "composition": [
    {"material": "string", "percentage": "int"}
  ],
  "gsm": "int",
  "ounce": "string",
  "weight_unit": "gsm|ounce",
  "width": "string",
  "warp_count": "string (EPI)",
  "weft_count": "string (PPI)",
  "yarn_count": "string",
  "color": "string",
  "finish": "string",
  "moq": "string",
  "starting_price": "string",
  "availability": ["Sample", "Bulk", "On Request"],
  "description": "string",
  "tags": ["string"],
  "images": ["string"],
  "videos": ["string"],
  "quantity_available": "int",
  "rate_per_meter": "float",
  "dispatch_timeline": "string",
  "is_bookable": "boolean",
  "weft_shrinkage": "float",
  "stretch_percentage": "float",
  "seller_sku": "string",
  "created_at": "datetime"
}
```

## Admin Credentials
- Email: admin@locofast.com
- Password: admin123

## Key API Endpoints
- `POST /api/auth/login` - Admin login
- `GET /api/categories` - List categories
- `GET /api/fabrics` - List/search fabrics (supports article_id, bookable_only filters)
- `GET /api/fabrics/{id}` - Get fabric details
- `GET /api/sellers` - List sellers (default: only active, ?include_inactive=true for all)
- `POST /api/sellers` - Create seller with city/state/category_ids/is_active
- `GET /api/articles` - List articles
- `GET /api/articles/{id}` - Get article details
- `GET /api/articles/{id}/variants` - Get all fabrics linked to an article
- `POST /api/articles` - Create article
- `PUT /api/articles/{id}` - Update article
- `DELETE /api/articles/{id}` - Delete article
- `GET /api/collections` - List all collections
- `GET /api/collections/featured` - Get featured collections
- `GET /api/collections/{id}` - Get collection details
- `GET /api/collections/{id}/fabrics` - Get fabrics in a collection
- `POST /api/collections` - Create collection
- `PUT /api/collections/{id}` - Update collection
- `DELETE /api/collections/{id}` - Delete collection
- `POST /api/enquiries` - Submit enquiry
- `GET /api/stats` - Dashboard statistics (includes articles, active_sellers, bookable_fabrics)
