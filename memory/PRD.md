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
│   ├── server.py                    # Main FastAPI app (Sellers, Fabrics, Enquiries, Reviews CRUD)
│   ├── vendor_router.py             # Vendor portal routes
│   ├── orders_router.py             # Orders + Razorpay + email triggers
│   ├── email_router.py              # Email templates (Resend)
│   ├── seo_router.py                # SEO prerender
│   ├── supplier_router.py           # Googlebot HTML prerendering
│   └── supplier_profile_router.py   # Supplier profile API + enquiry + real reviews
└── frontend/src/
    ├── pages/
    │   ├── admin/
    │   │   ├── AdminReviews.js      # NEW: Reviews CMS (Add/View/Delete)
    │   │   └── AdminSellers.js      # UPDATED: Additional Fields section
    │   ├── SupplierProfilePage.js   # Supplier storefront (Plus Jakarta Sans)
    │   ├── SupplierProfile.css      # Custom design tokens + scoped styles
    │   └── ...other pages
    └── components/
        ├── admin/AdminLayout.js     # UPDATED: Reviews nav link
        ├── RFQModal.js              # Unified RFQ form
        └── Navbar.js                # Global nav
```

## Key DB Collections
- `fabrics`: { status, seller_id, ounce, is_bookable, quantity_available, sample_price, ... }
- `sellers`: { is_active, seller_code, city, company_name, gst_number, established_year, certifications, export_markets, factory_size, ... }
- `orders`: { payment_id, status, total_amount, shipping_address, ... }
- `enquiries`: { name, company_name, gst_number, source, supplier_slug, ... }
- `reviews`: { seller_id, customer_name, customer_company, customer_location, rating, review_text, review_date, is_verified, ... }

## Completed Features

### Phase 1-5: Core Platform, Checkout, Lead Gen, Emails, SEO (All Complete)
- Admin/Vendor portals, fabric catalog, Razorpay checkout, RFQ modals
- GST verification, campaigns push, order emails, SEO prerender

### Phase 6: Supplier Storefront (Complete - Feb 2026)
- Full supplier profile page matching detailed HTML/CSS template
- Plus Jakarta Sans font, custom design tokens, 5 tabbed sections
- Hero card, metrics, sidebar enquiry form, similar suppliers
- WhatsApp float, mobile responsive, JSON-LD structured data

### Phase 7: Reviews CMS + Additional Seller Fields (Complete - Feb 2026)
- [x] **Reviews CMS** (`/admin/reviews`): Add/View/Delete supplier reviews
  - Fields: Supplier (dropdown), Customer Name, Company, Location, Star Rating (1-5 clicker), Review Description, Date, Verified Purchase toggle
  - Reviews stored in `reviews` MongoDB collection
  - Authenticated CRUD: POST/GET/DELETE `/api/reviews`
  - Real computed stats on Supplier Profile (average, distribution, sub-ratings)
  - Individual review cards with name, company, location, stars, text, date, verified badge
- [x] **Additional Seller Fields** in Admin Sellers edit modal:
  - Established Year, Monthly Capacity, Employee Count, Factory Size, Annual Turnover, Certifications (comma-separated), Export Markets (comma-separated), GST Number
  - Fields saved to DB and displayed on Supplier Profile page

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
