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
- Image Storage: Cloudinary (cloud_name: dqmk2qiy) - LIVE
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

### Mar 2, 2026 - Query Source & Order Type + Cloudinary Integration
- **Query Origination (Source) Field**: All enquiries now track their source
  - Sources: `homepage`, `rfq_page`, `supplier_signup_page`, `contact_page`, `fabric_detail_page`
  - Backend model updated with `source` field (line 276 server.py)
  - Frontend forms send source: FabricDetailPage, RFQPage, ContactPage, SellOnLocofast
  - Admin Enquiries shows Source column with colored badges:
    - Purple: Supplier Signup
    - Blue: RFQ
    - Gray: Contact
    - Green: Fabric Page
    - Default: Website
- **Order Type Badges**: Admin orders panel now shows Sample/Bulk distinction
  - Type column displays SAMPLE (amber) or BULK (emerald) badges
  - Derived from `order.items[0].order_type` field
  - Visible in both orders table and detail modal
- **Cloudinary Integration**: Cloud image storage for persistence across deployments
  - Backend: `cloudinary_router.py` with signed upload endpoints
  - Endpoints: GET `/api/cloudinary/signature`, GET `/api/cloudinary/config`, DELETE `/api/cloudinary/delete`
  - Frontend: `uploadToCloudinary()` and `uploadVideoToCloudinary()` functions in api.js
  - AdminFabrics updated to use Cloudinary for image/video uploads
  - Cloud name: `dqmk2qiy`
  - Images now persist in Cloudinary CDN instead of local storage
- **RFQ Backend Logic**: New dedicated RFQ router with category-specific fields
  - Backend: `rfq_router.py` with endpoints `/api/rfq/submit`, `/api/rfq/list`, `/api/rfq/{id}`
  - Stores category-specific data: fabric_requirement_type, knit_quality, denim_specification
  - Quantity fields: quantity_meters (cotton/denim/viscose), quantity_kg (knits)
  - Generates unique RFQ numbers (e.g., RFQ-VUX3N9)
  - Auto-creates enquiry record for unified admin tracking
  - Email notification to admin on new RFQ submission
- **Admin RFQ Management Page**: Full-featured RFQ dashboard at `/admin/rfq`
  - Stats cards: New, Contacted, Quoted, Won, Lost counts
  - Table with: RFQ #, Category (colored badges), Requirements (category-specific), Contact, Date, Status, Actions
  - Filters: By category (Cotton, Knits, Denim, Viscose) and status
  - Detail modal: Full requirement details, contact info, status update dropdown
  - Status workflow: New → Contacted → Quoted → Won/Lost/Closed
- **Email Flow Verified**: Test email sent successfully via Resend (mail@locofast.com)
- **Status**: COMPLETED (tested with 100% pass rate)

### Feb 27, 2026 - SEO Improvements
- **Dynamic Meta Tags**: Added Helmet with dynamic title/description to:
  - FabricsPage: Title changes based on filters (category, type, search)
  - FabricDetailPage: Shows fabric name, weight, composition
  - CollectionsPage: Dedicated SEO meta tags
  - AboutPage: Company story meta tags
  - ContactPage: Contact-specific SEO
- **Enhanced Product Schema**: Added comprehensive schema.org Product markup:
  - Price and currency (INR)
  - Availability status (InStock/PreOrder)
  - SKU from fabric code
  - Material, color, weight, width
  - Manufacturer/brand information
  - Price validity dates
- **Image Alt Tags**: Descriptive alt text for all fabric images
  - Format: "[Fabric Name] - [Materials] fabric in [Color], [GSM] GSM"
  - Thumbnails include position indicators
- **Lazy Loading**: Added `loading="lazy"` to fabric catalog images
- **ARIA Attributes**: Added accessibility labels to image navigation buttons
- **Status**: COMPLETED

### Feb 27, 2026 - Unit System & Navigation Update
- **Knitted Fabrics Unit (kg)**: Updated measuring unit system for knitted fabrics
  - Knitted fabrics now display "kg" instead of "meters" throughout the platform
  - Affects: FabricsPage, FabricDetailPage, CheckoutPage
  - Pricing tiers show "100-500kg: ₹150/kg" for knits vs "100-500m: ₹150/m" for woven
  - Helper function `getUnit(fabric)` determines unit based on `fabric.fabric_type`
  - Woven and non-woven fabrics continue using meters
- **Sellers Sign Up Header Link**: Added navigation link to attract suppliers
  - "Sellers sign up" link in main header navigation
  - Highlighted in blue (#2563EB) to stand out
  - Links to `/suppliers` seller acquisition page
  - Works on both desktop and mobile menus
  - File: `frontend/src/components/Navbar.js`
- **Footer Duplication Fix**: Removed duplicate footer from HomePage
  - Homepage was rendering Footer twice (in App.js and HomePage.js)
  - Removed redundant `<Footer />` from HomePage.js
  - Now only one footer displays correctly
- **Fabric Video Display**: Added video support to FabricDetailPage
  - Videos section displays below image thumbnails when available
  - Supports YouTube, Vimeo embeds and direct video files
  - Responsive aspect-video containers
- **Status**: COMPLETED

### Feb 26, 2026 - Additional Features
- **WhatsApp Live Chat**: Floating WhatsApp button on all pages (bottom-right corner)
  - Opens WhatsApp with pre-filled message to +91-8920392418
  - Shows "Chat with us" on hover
  - File: `frontend/src/components/WhatsAppChat.js`
  
- **Greige Category**: New fabric category added with full SEO metadata
  - Name: Greige (raw unfinished fabrics)
  - SEO optimized description and keywords
  
- **Count Fields Update**:
  - For non-polyester fabrics: Warp Count and Weft Count in Ply/Count format
    - Ply: 1 or 2
    - Count: 1-100
    - Format: "2/40" means 2-ply, 40 count
  - For polyester fabrics: Denier field (1-100)
  - Backend schema updated with `denier` field
  - Admin form shows conditional fields based on composition
  - Files: `backend/server.py`, `frontend/src/pages/admin/AdminFabrics.js`

### Feb 26, 2026 - v1.0 Release Ready: Logistics & Coupon Engine
- **Simplified Logistics**: Removed Shiprocket integration, showing "Free Delivery - Logistics included in price"
- **Coupon Engine**: Complete discount code system
  - Admin panel: Create, edit, delete coupons at `/admin/coupons`
  - Coupon types: Percentage or fixed amount discount
  - Validations: Min order value, max discount cap, usage limits, validity dates
  - Checkout: Apply coupon with real-time discount calculation
- **Backend**: `POST /api/coupons/validate`, CRUD endpoints for coupon management
- **Files Added**: `backend/coupon_router.py`, `frontend/src/pages/admin/AdminCoupons.js`
- **Files Updated**: `CheckoutPage.js`, `orders_router.py`, `AdminLayout.js`, `App.js`, `api.js`
- **Status**: COMPLETED

### Feb 26, 2026 - Admin Fabric Search & Filters
- **Feature**: Added comprehensive search and filter functionality to Admin Fabrics page
- **Search Fields**: Name, composition, color, seller company, category, SKU, fabric code, tags
- **Filter Options**:
  - Category dropdown
  - Seller dropdown
  - Availability (Sample/Bulk/On Request)
- **UI Elements**:
  - Search input with magnifying glass icon
  - Filter dropdowns in a row
  - "Clear all" button when filters active
  - Results count indicator (e.g., "Showing 13 of 191 fabrics")
- **Files Updated**: `frontend/src/pages/admin/AdminFabrics.js`
- **Status**: COMPLETED

### Feb 24, 2026 - Invoice Generation Feature
- **GST-Compliant PDF Invoice**: Complete invoice generation system implemented
- **Features**:
  - Professional PDF layout with Locofast branding
  - GST breakdown (CGST 2.5% + SGST 2.5%)
  - Amount in words (Indian numbering: Lakhs, Crores)
  - HSN code for fabrics (5407)
  - Customer and seller details
  - Order items with quantity and rate
  - Shipping details (if available)
  - Terms and conditions
- **Access Points**:
  - Customer: Order Confirmation page - "Download Invoice" button (visible only for paid orders)
  - Admin: Orders panel - Invoice icon in table + "Download Invoice" in order detail modal
- **Backend**: `GET /api/orders/{order_id}/invoice` - Returns PDF with proper headers
- **Library**: reportlab (Python PDF generation)
- **Files Updated**:
  - `backend/orders_router.py` - Invoice generation endpoint
  - `frontend/src/pages/OrderConfirmationPage.js` - Customer download button
  - `frontend/src/pages/admin/AdminOrders.js` - Admin download button
  - `frontend/src/lib/api.js` - downloadInvoice helper
  - `frontend/src/index.css` - Fixed CSS selector hiding API links
- **Status**: COMPLETED

### Feb 20, 2026 - Sitemap XML Fix
- **Fixed**: `/sitemap.xml` was returning HTML (frontend's index.html) instead of XML
- **Root Cause**: Sitemap endpoint was at `/api/sitemap.xml` but robots.txt pointed to `/sitemap.xml`
- **Solution**: 
  - Updated `robots.txt` to point to `/api/sitemap.xml` (correct backend endpoint)
  - Fixed datetime handling - dates stored as ISO strings, not datetime objects
  - Added `parse_date_string()` helper to extract YYYY-MM-DD from ISO strings
- **Files Updated**: `backend/server.py`, `frontend/public/robots.txt`
- **Verification**: `curl /api/sitemap.xml` now returns proper `application/xml` content
- **Status**: COMPLETED

### Feb 20, 2026 - Shiprocket Shipping Integration
- **Shiprocket API Integration**: Full shipping solution integrated
  - Rate calculator endpoint: `/api/shipping/rates`
  - Create shipment: `/api/shipping/create-shipment`
  - AWB assignment: `/api/shipping/assign-awb`
  - Label generation: `/api/shipping/generate-label/{shipment_id}`
  - Tracking by AWB: `/api/shipping/track/awb/{awb_code}`
  - Tracking by Order: `/api/shipping/track/order/{order_id}`
  - Pickup locations: `/api/shipping/pickup-locations`
- **Checkout Page Shipping Integration**:
  - Shipping rates fetched when customer enters pincode
  - Multiple courier options displayed (Xpressbees, Delhivery, Shadowfax, Ekart, etc.)
  - Customer can select preferred shipping option
  - Shipping cost added to order total
- **Auto-Create Shiprocket Shipment**:
  - After Razorpay payment verification, shipment auto-created in Shiprocket
  - Shiprocket order ID and shipment ID stored in order document
- **Files Created/Updated**:
  - `backend/shiprocket_service.py` - Core Shiprocket API service
  - `backend/shiprocket_router.py` - FastAPI routes for shipping
  - `backend/orders_router.py` - Updated with shipping support
  - `frontend/src/pages/CheckoutPage.js` - Shipping UI integration
- **Status**: COMPLETED - 12+ courier options, auto-shipment creation

### Feb 20, 2026 - Multi-Vendor Portal & Filters (Session 2)
- **Quick Filter Toggles**: Added prominent filter buttons above search bar:
  - "Instant Bookable" (green) - Shows fabrics available for immediate booking
  - "Bulk In Stock" (blue) - Shows fabrics with bulk inventory
  - "Samples Available" (purple) - Shows fabrics with sample pricing
  - Toggle on/off with single click, X icon appears when active
- **Priority-Based Fabric Sorting**: Fabrics on listing page sorted by bookability:
  1. Bulk + Sample bookable (highest priority)
  2. Bulk only bookable
  3. Sample only bookable
  4. Enquiry only (lowest priority)
- **Instant Bookable Filter**: Enhanced availability filter on /fabrics page with 4 options:
  - "Instant Bookable (Sample/Bulk)" - Shows fabrics that can be ordered immediately
  - "Samples Only" - Shows fabrics with sample pricing available
  - "Bulk In Stock" - Shows fabrics with bulk inventory available
  - "Enquiry Only" - Shows fabrics that require manual enquiry
- **Backend Filter Support**: Added `instant_bookable` and `enquiry_only` query parameters to `/api/fabrics` and `/api/fabrics/count`
- **GST Updated to 5%**: Changed GST calculation from 18% to 5% across:
  - CheckoutPage.js (frontend calculation)
  - orders_router.py (backend order creation)
  - email_router.py (email templates)
- **UI Polish - Indian Names**: Replaced "John Doe" placeholder with culturally relevant names:
  - "Rajesh Kumar" in Admin Seller form
  - "Amit Sharma" in Checkout form
- **Vendor Portal Scaffolding**: Multi-vendor system implemented with:
  - Vendor login page at `/vendor/login`
  - VendorAuthContext for JWT-based vendor authentication
  - VendorProtectedRoute for protected vendor pages
  - VendorDashboard, VendorInventory, VendorOrders pages
  - Backend vendor_router.py with login, CRUD operations scoped to vendor
- **Seller Email Notifications**: When orders are placed, vendor receives email notification (via Resend)
- **Files Updated**:
  - `frontend/src/pages/FabricsPage.js` - Added 4 filter options
  - `backend/server.py` - Added instant_bookable and enquiry_only filters
  - `frontend/src/pages/CheckoutPage.js` - 5% GST, Indian name placeholder
  - `frontend/src/pages/admin/AdminSellers.js` - Indian name placeholder
- **Status**: COMPLETED (tested with 100% success rate)

### Feb 20, 2026 - Mobile Responsiveness Fixes
- **Fixed**: Fluid width issues on mobile devices causing horizontal scroll
- **Improvements**:
  - Fabric cards: Compact text, shorter button labels on mobile ("Bulk", "Sample", "Enquiry")
  - Proper text sizing with sm: breakpoints
  - Fixed container padding on small screens
  - Prevented horizontal overflow with `overflow-x: hidden`

### Feb 20, 2026 - Email Notifications to b2c@locofast.com
- **All notifications go to b2c@locofast.com**:
  - Order notifications (sample + bulk orders)
  - Enquiry notifications (all types)
- **Customer confirmation emails**:
  - Order confirmation (Shopify-style HTML template)
  - Enquiry acknowledgment email
- **Email templates created**:
  - `get_enquiry_notification_email()` - Admin notification for enquiries
  - `get_customer_enquiry_confirmation_email()` - Customer acknowledgment
- **Auto-send on enquiry creation**: Emails queued asynchronously on every enquiry

### Feb 20, 2026 - Phase 1: Payment & Orders (Razorpay + Resend)
- **Payment Gateway**: Razorpay integration for order payments
  - Checkout page with shipping form, GST calculation, pricing tiers
  - Razorpay SDK loads dynamically for payment modal
  - Payment verification with signature validation
  - Webhook endpoint for payment status updates
- **Orders Collection**: Full order management system
  - Order creation with items, customer info, totals
  - Order statuses: pending, payment_pending, paid, confirmed, processing, shipped, delivered, cancelled
  - Auto inventory deduction on successful payment
  - Unique order numbers (ORD-XXXXXX format)
- **Order Confirmation Page**: Post-payment success page
  - Shows order number, items, shipping address, payment summary
  - "What's Next" steps for customer expectations
- **Email Notifications** (Resend integration):
  - Order confirmation email to customer with HTML template
  - Admin notification email for new orders
- **Admin Orders Dashboard**: `/admin/orders`
  - Order statistics: Total, Pending Payment, Paid, Confirmed, Shipped, Delivered, Revenue
  - Order list with search, status filter
  - Order detail modal with customer info, items, payment status
  - Status update dropdown, resend confirmation button
- **Frontend Updates**:
  - "Book Sample" and "Book Bulk Now" now navigate to checkout page
  - Checkout collects shipping address and creates order via API
- **Files Created**:
  - `backend/orders_router.py` - Order CRUD + payment endpoints
  - `backend/email_router.py` - Email sending with Resend
  - `frontend/src/pages/CheckoutPage.js` - Checkout flow
  - `frontend/src/pages/OrderConfirmationPage.js` - Order success page
  - `frontend/src/pages/admin/AdminOrders.js` - Admin order management
- **API Endpoints Added**:
  - `POST /api/orders/create` - Create order + Razorpay order
  - `POST /api/orders/verify-payment` - Verify Razorpay payment
  - `GET /api/orders` - List orders with filters
  - `GET /api/orders/{id}` - Get order by ID or order_number
  - `GET /api/orders/stats/summary` - Order statistics
  - `PUT /api/orders/{id}/status` - Update order status
  - `POST /api/orders/webhook/razorpay` - Razorpay webhook
  - `POST /api/email/order-confirmation/{id}` - Send confirmation email
- **Status**: COMPLETED (requires real API keys for production)
  - Razorpay: Placeholder test keys configured - need real keys from dashboard
  - Resend: API key needed for email sending

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

### Feb 19, 2026 - Video Upload Feature
- **Direct Video Upload**: Up to 150MB per video file
- **Supported formats**: MP4, WebM, MOV, AVI, MPEG
- **Upload Progress**: Shows percentage progress bar during upload
- **UI**: Two options - "Upload Video" (direct) and "Add URL" (external links)
- **Backend**: New `/api/upload/video` endpoint with chunked upload for large files
- **Files Updated**: `server.py`, `api.js`, `AdminFabrics.js`

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
- [ ] Customer Accounts & Order History
- [ ] SEO-friendly URLs (slugs instead of UUIDs)
- [ ] Order status emails (Shipped/Delivered notifications)
- [ ] Wishlist/Favorites feature
- [ ] Seller profiles public page
- [ ] Price visibility controls
- [ ] RFQ workflows
- [ ] Sample request tracking
- [ ] Advanced analytics dashboard

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
- Password: NewAdmin@2024

## Vendor Portal
- URL: /vendor/login
- Credentials: Created via Admin → Sellers page (requires email, phone, password)
- Features: Inventory management (CRUD), order notifications, dashboard stats

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

### Orders API (Phase 1)
- `POST /api/orders/create` - Create order with Razorpay payment
- `POST /api/orders/verify-payment` - Verify Razorpay payment signature
- `GET /api/orders` - List orders (params: status, payment_status, limit, skip)
- `GET /api/orders/{id}` - Get order by ID or order_number
- `GET /api/orders/by-razorpay/{razorpay_order_id}` - Get order by Razorpay ID
- `GET /api/orders/stats/summary` - Order statistics
- `PUT /api/orders/{id}/status` - Update order status
- `POST /api/orders/webhook/razorpay` - Razorpay webhook handler

### Vendor API
- `POST /api/vendor/login` - Vendor login (returns JWT token)
- `GET /api/vendor/me` - Get current vendor profile
- `GET /api/vendor/fabrics` - List vendor's fabrics
- `POST /api/vendor/fabrics` - Create fabric (vendor scoped)
- `PUT /api/vendor/fabrics/{id}` - Update fabric (vendor scoped)
- `DELETE /api/vendor/fabrics/{id}` - Delete fabric (vendor scoped)
- `GET /api/vendor/orders` - List orders for vendor's fabrics
- `GET /api/vendor/stats` - Vendor dashboard statistics

### Email API
- `POST /api/email/send` - Send custom email
- `POST /api/email/order-confirmation/{id}` - Send order confirmation
- `POST /api/email/test` - Send test email
