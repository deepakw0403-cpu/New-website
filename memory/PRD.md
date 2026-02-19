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

### Feb 19, 2026 - Bug Fix: SEO Content Generation Limit
- **Fixed**: Admin SEO Manager was only showing 100 fabrics
- **Change**: Updated `AdminFabricSEO.js` to fetch up to 1000 fabrics
- **Result**: All 191 fabrics now visible for SEO content generation

### Feb 19, 2026 - Inventory Page (Bookable Fabrics)
- **New Page**: `/inventory` - Dedicated page for bookable fabrics with pricing and ordering
- **Features**:
  - Shows only fabrics marked as "bookable" with confirmed stock
  - Displays price per meter, dispatch timeline, MOQ, quantity available
  - Search and category filter
  - Sort by: Price (low/high), Stock (high), Newest
  - "Place Order" button opens enquiry modal with fabric summary
  - "Details" link to full fabric page
- **Navigation**: Added "Inventory" link to main navbar
- **Files Created**: `frontend/src/pages/InventoryPage.js`
- **Files Updated**: `App.js` (route), `Navbar.js` (nav link)

### Feb 19, 2026 - Unified Fabrics & Inventory Experience
- **Merged Fabrics and Inventory** into a single streamlined listing
- **Contextual Action Buttons** on each fabric card:
  - **Book Bulk Now** (green) - shows if fabric has inventory (`is_bookable` + `quantity_available > 0`)
  - **Book Sample** (blue) - shows if fabric has sample pricing configured
  - **Send Enquiry** (outline) - always available on all fabrics
- **In Stock Badge** - shows on cards with available inventory
- **Removed Inventory from navbar** - single "Fabrics" entry now covers all
- **Redirect**: `/inventory` now redirects to `/fabrics`
- **Seller name** displayed on all fabric cards ("by [Company Name]")
- **Sample price** shown on cards when available
- **Files Updated**: `FabricsPage.js` (complete rewrite), `Navbar.js`, `App.js`

### Feb 19, 2026 - Tiered Pricing System
- **Sample Pricing**: Fixed price for sample orders (1-5 meters dropdown)
- **Bulk Pricing Tiers**: Configurable quantity brackets with different prices
  - Admin can define 6+ tiers (e.g., 6-100m, 101-500m, 501-1000m, etc.)
  - Each tier has min_qty, max_qty, and price_per_meter
- **Admin UI**: 
  - Sample price input in Inventory & Booking section
  - Bulk Pricing Tiers manager with add/remove functionality
- **Order Modal**:
  - Toggle between "Sample Order" (1-5m dropdown) and "Bulk Order" (quantity input)
  - Shows all available pricing tiers for bulk orders
  - Real-time cart value calculation based on selected tier
- **Backend**: Added `sample_price` and `pricing_tiers` fields to fabric model
- **Files Updated**: `server.py`, `AdminFabrics.js`, `InventoryPage.js`

### Feb 17, 2026 - SEO Content Layer (AI-Powered)
- **SEO Admin Manager** at /admin/seo - Full CRUD for SEO content per fabric
- **AI Content Generation** using GPT-4o via Emergent LLM Key:
  - SEO H1 (auto-format: "[Name] – [Weight] [Type] | Bulk Supply in India")
  - AI Intro (120-160 words, B2B commercial tone)
  - Applications/Use Cases (inferred from category, tags, specs)
  - Bulk Order Details (MOQ, Lead Time, Sampling, Dispatch)
  - "Why This Fabric" bullets (AI-generated from specs)
  - FAQ (5 questions from GSM, MOQ, lead time, export, sampling)
- **SEO Meta Fields**: Meta Title (60 chars), Meta Description (160 chars), Canonical URL, Index/Noindex
- **Auto/Manual Toggle**: Each block can be set to auto-update or manual edit
- **SEO Preview Panel**: Alerts for missing content, word count validation
- **Schema Markup**: Breadcrumb, Product, FAQPage schemas via react-helmet-async
- **Batch Slug Generation**: Auto-generates SEO-friendly slugs for all fabrics
- **Related Fabrics**: Auto-linked by category and similar GSM (+/- 20)
- **Internal Linking**: Links to category pages, /fabrics/ hub, /assisted-sourcing

### Feb 17, 2026 - SEO Landing Pages (21 Pages)
- **Fabrics Hub Page** at /fabrics/ - Main landing page with category overview
- **Denim Category** at /fabrics/denim/ - Category page with all denim specifications
- **10 Denim SEO Pages**:
  - /fabrics/denim/8-oz/ - Lightweight denim for shirts
  - /fabrics/denim/10-oz/ - Versatile mid-weight denim
  - /fabrics/denim/12-oz/ - Heavy-weight workwear denim
  - /fabrics/denim/stretch/ - Comfort stretch denim
  - /fabrics/denim/rigid/ - 100% cotton non-stretch
  - /fabrics/denim/indigo-dyed/ - Classic rope-dyed indigo
  - /fabrics/denim/for-jeans-manufacturers/ - Production-ready denim
  - /fabrics/denim/bulk-suppliers-india/ - High-volume sourcing
  - /fabrics/denim/denim-fabric-manufacturers-in-india/ - Connect with mills
- **Poly Knit Category** at /fabrics/poly-knit-fabrics/ - Category page with specifications
- **10 Poly Knit SEO Pages**:
  - /fabrics/poly-knit-fabrics/180-gsm/ - Lightweight performance fabric
  - /fabrics/poly-knit-fabrics/220-gsm/ - Mid-weight sports fabric
  - /fabrics/poly-knit-fabrics/240-gsm/ - Heavy-weight winter activewear
  - /fabrics/poly-knit-fabrics/interlock/ - Double-knit smooth both sides
  - /fabrics/poly-knit-fabrics/jersey/ - Single-knit for t-shirts
  - /fabrics/poly-knit-fabrics/moisture-wicking/ - Performance sweat management
  - /fabrics/poly-knit-fabrics/for-sportswear/ - Technical athletic fabrics
  - /fabrics/poly-knit-fabrics/bulk-suppliers-india/ - High-volume sourcing
  - /fabrics/poly-knit-fabrics/polyester-knit-fabric-manufacturers-in-india/ - Connect with mills
- **Shared SEO Layout** - Reusable component with breadcrumbs, specs table, use cases, pricing, CTAs
- **Footer Update** - New "Fabrics" section with links to category pages
- **Internal Linking** - Related fabrics links on each page, breadcrumb navigation

### Feb 17, 2026 - Free Tools Suite (SEO-Friendly)
- **10 Free Tools** at individual SEO-friendly URLs (/tools/*)
- **Calculator Tools**:
  - GST Calculator - Calculate GST, CGST, SGST for Indian businesses
  - Profit Margin Calculator - Calculate margins and selling prices
  - Discount Calculator - Calculate bulk order discounts
  - GSM Calculator - Convert fabric weight (GSM ↔ oz/sq yard)
  - CBM Calculator - Calculate cargo volume for shipping
  - Volumetric Weight Calculator - Calculate dimensional weight
- **AI-Powered Tools** (GPT-4o via Emergent LLM key):
  - Product Description Generator - AI fabric descriptions with tone selection
  - Product Title Generator - SEO-friendly product titles
- **Utility Tools**:
  - Barcode Generator - CODE128, EAN-13, UPC-A, CODE39 barcodes with PNG download
- **Tools Hub Page** at /tools with categorized tool cards
- **Navigation**: Added "Free Tools" link to navbar
- **Backend API**: New /api/tools/* endpoints for all calculators

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
- [x] **Free Tools Suite (10 tools with AI integration)**
- [x] **SEO Landing Pages (21 pages for Denim & Poly Knit)**
- [x] **SEO Content Layer (AI-powered H1, intro, FAQ, schema markup)**

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
