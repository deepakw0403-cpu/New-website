# Locofast - Fabric Sourcing Platform PRD

## Problem Statement
Build a CMS-driven B2B fabric sourcing platform ("locofast.com v 2.0"). Core requirements include vendor portals, instant booking flows, RFQ lead generation, and supplier storefronts.

## Tech Stack
- **Frontend**: React (CRA), Tailwind CSS, Shadcn/UI, react-helmet-async
- **Backend**: FastAPI, Motor (MongoDB async), Pydantic
- **Database**: MongoDB
- **Integrations**: Razorpay (Payments), Resend (Emails), Cloudinary (Images), Sandbox.co.in (GST API)

## Architecture
```
/app
├── backend/
│   ├── server.py                    # Main FastAPI app (~1900 lines, needs refactoring)
│   ├── vendor_router.py             # Vendor portal routes
│   ├── orders_router.py             # Orders + Razorpay + email triggers
│   ├── email_router.py              # Email templates (Resend)
│   ├── seo_router.py                # SEO prerender
│   ├── supplier_router.py           # Googlebot HTML prerendering
│   └── supplier_profile_router.py   # Supplier profile API + enquiry endpoint
└── frontend/src/
    ├── pages/
    │   ├── SupplierProfilePage.js   # NEW: Full supplier storefront (Plus Jakarta Sans)
    │   ├── SupplierProfile.css      # NEW: Custom design tokens + scoped styles
    │   ├── FabricDetailPage.js      # Product detail + checkout routing
    │   ├── CheckoutPage.js          # Razorpay integration + error handling
    │   ├── SellOnLocofast.js        # Supplier sign-up page
    │   └── HomePage.js              # Landing + RFQ modal
    └── components/
        ├── RFQModal.js              # Unified RFQ form (GST + campaigns)
        └── Navbar.js                # Global nav with RFQ button
```

## Key DB Schema
- `fabrics`: { status, seller_id, ounce, is_bookable, quantity_available, sample_price, ... }
- `sellers`: { is_active, seller_code, city, company_name, gst_number, ... }
- `orders`: { payment_id, status, total_amount, shipping_address, ... }
- `enquiries`: { name, company_name, gst_number, source, supplier_slug, ... }

## Key API Endpoints
- `POST /api/enquiries/rfq-lead` — Save RFQ lead + GST verify + campaigns push + email
- `GET /api/suppliers/{slug}/profile` — Full supplier profile data (stats, fabrics, orders, reviews)
- `POST /api/suppliers/{slug}/enquiry` — Save supplier-specific enquiry from profile page
- `GET /api/suppliers/directory` — All active suppliers for directory/sitemap
- `POST /api/orders/verify-payment` — Verify Razorpay + trigger order emails

## Completed Features

### Phase 1: Core Platform (Complete)
- [x] Admin portal with login
- [x] Vendor portal with fabric upload & management
- [x] Fabric catalog with search, filters, pagination
- [x] Fabric detail pages with sample/bulk booking
- [x] Admin approval workflow for vendor fabrics
- [x] Vendor inventory isolation by seller_id
- [x] Cloudinary image storage

### Phase 2: Checkout & Payments (Complete)
- [x] Razorpay-integrated checkout (sample + bulk)
- [x] Razorpay error handling with bank/gateway details + "Try Again"
- [x] Order creation and management

### Phase 3: Lead Generation (Complete)
- [x] Unified RFQModal across all pages (Home, Navbar, SKU-level)
- [x] Sandbox.co.in GST API integration (auto-populate company name)
- [x] Campaigns API push (campaigns.locofast.com/api/leads)
- [x] Country code dropdown (+91, +880, +94, +84)
- [x] Fabric URL passing to RFQ lead

### Phase 4: Emails (Complete)
- [x] Order confirmation email (Customer, Supplier, Admin) via Resend
- [x] Async email triggers on Razorpay payment verification

### Phase 5: SEO (Complete)
- [x] Supplier SEO pages with Googlebot HTML prerendering
- [x] Hash-based tab navigation for SEO-friendly supplier profiles
- [x] JSON-LD structured data (Organization, BreadcrumbList, AggregateRating)
- [x] SEO meta tags (og:title, og:description, canonical)

### Phase 6: Supplier Storefront / Profile Page (Complete - Feb 2026)
- [x] Full supplier profile page matching detailed HTML/CSS template
- [x] Plus Jakarta Sans font, custom design tokens
- [x] Hero card: Logo/initials, badges (Verified, Premium, GST), rating, orders, on-time %
- [x] Share/Save action buttons
- [x] 4 metric cards (Orders, On-Time, SKUs, Years in Business)
- [x] 5 tabbed sections with hash navigation:
  - Overview: Business details table, Factory & Production asset cards, Certifications, About, Related links
  - Catalog: Fabric grid with filters (category, sort, stock toggle), SKU cards with stock badges
  - Inventory: SKU stats, stock-by-category progress bars, lead times
  - Reviews: Score summary, 5-star distribution, sub-ratings, review items (or empty state)
  - Orders & Terms: Payment/shipping terms tables, recent orders table
- [x] Sidebar: Enquiry form (Connect via Locofast), Supplier Snapshot grid, Similar Suppliers
- [x] WhatsApp floating button
- [x] Mobile responsive (breakpoints: 1024, 720, 640, 480px)
- [x] Backend: `/api/suppliers/{slug}/profile` returns complete profile data
- [x] Backend: `/api/suppliers/{slug}/enquiry` saves supplier-specific enquiries

### Content & UI Updates (Complete)
- [x] 10+ content/UI changes on Home, About, Supplier sign-up pages
- [x] "Before vs After" marketplace content on Supplier page
- [x] Supplier sign-up page colors aligned with primary blue theme
- [x] "Talk to onboarding team" mailto links

## Backlog

### P1 (High Priority)
- [ ] Customer Accounts & Order History
- [ ] Test Email Flow (end-to-end order confirmation on preview)
- [ ] Production Nginx prerender config for SEO supplier pages
- [ ] Daily shuffle logic for fabric catalog (awaiting user confirmation)

### P2 (Medium Priority)
- [ ] SEO-Friendly Fabric URLs (slugs instead of UUIDs)
- [ ] Order Status Emails (Shipped/Delivered)
- [ ] server.py refactoring into separate routers

### P3 (Low Priority)
- [ ] Wishlist/Favorites (blocked by Customer Accounts)
- [ ] Advanced Analytics Dashboard

## Credentials
See `/app/memory/test_credentials.md`

## Notes
- "Pali Mills" activation on production is on hold per user request
- server.py is >1900 lines and should be broken into routers
