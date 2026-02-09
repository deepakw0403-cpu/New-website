# Locofast - Fabric Catalog CMS

## Original Problem Statement
Build a CMS-driven fabric catalog website for Locofast - a B2B fabric sourcing platform. The website allows the Locofast team to upload fabric swatches and related information, and allows customers to browse fabrics easily on the frontend.

## User Personas
1. **Admin (Locofast Team)** - Manages fabrics, categories, sellers and views customer enquiries
2. **Customer (Frontend User)** - Browses fabrics by category, views details, and submits enquiries

## Core Requirements (Static)
- Admin panel with JWT authentication
- Fabric management (CRUD with images, specs, tags)
- Category management
- Seller management with location and category specializations
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

### P1 (Next Phase)
- [ ] Cloudinary integration for images
- [ ] Email notifications for enquiries (SendGrid/Resend)
- [ ] Pagination for fabric listing
- [ ] SEO meta tags for fabric pages

### P2 (Future)
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

### Seller
```json
{
  "id": "string",
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
  "created_at": "datetime"
}
```

### Fabric
```json
{
  "id": "string",
  "name": "string",
  "category_id": "string",
  "seller_id": "string",
  "fabric_type": "woven|knitted|non-woven",
  "pattern": "Solid|Print|Stripes|Checks|Floral|Geometric|Digital|Random|Others",
  "composition": [
    {"material": "string", "percentage": "int"}
  ],
  "gsm": "int",
  "width": "string",
  "color": "string",
  "finish": "string",
  "moq": "string",
  "starting_price": "string",
  "availability": ["Sample", "Bulk", "On Request"],
  "description": "string",
  "tags": ["string"],
  "images": ["string"],
  "videos": ["string"],
  "created_at": "datetime"
}
```

## Admin Credentials
- Email: admin@locofast.com
- Password: admin123

## Key API Endpoints
- `POST /api/auth/login` - Admin login
- `GET /api/categories` - List categories
- `GET /api/fabrics` - List/search fabrics
- `GET /api/fabrics/{id}` - Get fabric details
- `GET /api/sellers` - List sellers with category_names
- `POST /api/sellers` - Create seller with city/state/category_ids
- `GET /api/collections` - List all collections
- `GET /api/collections/featured` - Get featured collections
- `GET /api/collections/{id}` - Get collection details
- `GET /api/collections/{id}/fabrics` - Get fabrics in a collection
- `POST /api/collections` - Create collection
- `PUT /api/collections/{id}` - Update collection
- `DELETE /api/collections/{id}` - Delete collection
- `POST /api/enquiries` - Submit enquiry
- `GET /api/stats` - Dashboard statistics (includes collections count)
