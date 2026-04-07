# Locofast - Fabric Catalog CMS

## Original Problem Statement
Build a CMS-driven fabric catalog website for Locofast - a B2B fabric sourcing platform. The website allows the Locofast team to upload fabric swatches and related information, and allows customers to browse fabrics easily on the frontend.

**Recent Evolution**: Platform expanding to full B2B marketplace with seller inventory management, direct booking, order management, vendor portal, and admin approval workflows.

## User Personas
1. **Admin (Locofast Team)** - Manages fabrics, categories, sellers, articles, orders, approves vendor fabrics, views enquiries
2. **Customer (Frontend User)** - Browses fabrics by category, views details, submits enquiries, places orders
3. **Vendor (Seller)** - Manages own inventory, uploads fabrics (pending admin approval), views orders/enquiries

## Core Requirements (Static)
- Admin panel with JWT authentication
- Fabric management (CRUD with images, specs, tags)
- Category management
- Seller management with location, category specializations, and activation controls
- Article management (color variant grouping)
- Fabric browsing with search & filters
- Enquiry submission system
- Vendor Portal with approval workflow
- Static pages (About, How It Works, Contact)

## Technical Stack
- Frontend: React 19, Tailwind CSS, React Router, Sonner
- Backend: FastAPI, Motor (async MongoDB)
- Database: MongoDB
- Auth: JWT with bcrypt (separate for Admin and Vendor)
- Image Storage: Cloudinary (cloud_name: djgmk2gjy)
- Emails: Resend (mail@locofast.com)
- Payments: Razorpay
- Webhooks: Zapier

## What's Been Implemented

### Apr 7, 2026 - Content & UI Overhaul (10 Changes)
- **Homepage**: Trust badge updated to "Trusted by 500+ Brands & Manufacturers across India & the globe"
- **Footer**: Removed "lifetime free enquiries", removed "80:20", added "Payment Protection", added clickable links to Stellaris Ventures & Chiratae Ventures
- **About page**: CTA buttons replaced with "Submit a Requirement" that opens unified RFQ modal
- **Supplier page**: Removed sales call/response time requirements (30-min daily, 2-hour window), removed "Suppliers Already Winning" stats section, replaced with marketplace-focused content: "Grow Your Business", "Increase Capacity Utilisation", "How Sellers Succeed"
- **Status**: COMPLETED (15/15 frontend tests pass)

### Apr 7, 2026 - SKU-Level RFQ Button Unified
- **Fabric Detail Page**: Replaced the old custom enquiry modal on "Request a Quote" button with the unified `RFQModal` component (same flow as homepage and header)
- Both the sidebar button and the bottom "Final CTA" button now open the same RFQ modal
- **Status**: COMPLETED

### Apr 7, 2026 - Order Email Notifications (Auto-Trigger)
- **Auto-send emails on payment confirmation**: When Razorpay payment is verified, 3 emails fire automatically:
  1. **Customer** — Order confirmation with items, totals, shipping details
  2. **Admin** (mail@locofast.com + mohit@locofast.com) — Full order details with ALL customer info including phone, product links, financial breakdown
  3. **Supplier** (registered email) — Order details with product URLs, rate/qty/amount, order type (Bulk/Sample), payment status, dispatch info — **NO customer phone number**
- **Status**: COMPLETED (19/19 backend tests pass)

### Apr 7, 2026 - Header RFQ Modal + Supplier Page UI Revamp
- **Header RFQ Modal**: Extracted `RFQModal.js` shared component and integrated into `Navbar.js`. "Request Quote" button in the header now opens the unified RFQ modal with GST verification on any page.
- **Supplier Page Color Update**: Converted all green/emerald colors in `SellOnLocofast.js` to blue (#2563EB) to match the main shop.locofast.com homepage theme.
- **Bug Fix**: Fixed `handleSubmit` in supplier form — was referencing `form.contactName` (undefined) instead of `formData.contact_name`.
- **Status**: COMPLETED (12/12 frontend tests pass)

### Apr 6, 2026 - GST API Integration + Campaigns Push
- **Sandbox.co.in GST API**: Integrated GSTIN verification at `POST /api/gst/verify`. 2-step auth flow (authenticate → search). Auto-populates company name from `trade_name || legal_name`.
- **Campaigns Push**: All RFQ leads pushed to `campaigns.locofast.com/api/leads` with name, company, email, phone, GST info
- **Email to marketing@locofast.com**: Rich HTML template with GST verification badge (legal name, status, address)
- **Updated RFQ modal**: GST field with "Verify" button, green checkmark on success, auto-fill company name, error messages
- **Status**: COMPLETED (19/19 tests pass)

### Apr 6, 2026 - Homepage RFQ Form Revamp
- **Replaced "Request a Quote" link** with single-form modal on homepage (both hero + bottom CTA)
- **Form fields**: Name, Phone (+91), GST Number, Company Name, Email, Fabric Type dropdown (Greige, Dyed, Printed, Yarn Dyed, Denim, Others)
- **Email to marketing@locofast.com** via Resend with styled HTML template
- **Backend endpoint**: `POST /api/enquiries/rfq-lead` — saves to DB + sends email + pushes to Zapier
- **Status**: COMPLETED

### Apr 6, 2026 - Vendor Inventory Fixes + Seller Assignment
- **Added Ounce (oz) field** to vendor inventory table, form, and backend model
- **GSM/Oz column** added to vendor inventory table
- **Bulk-assign seller endpoint**: `POST /api/fabrics/bulk-assign-seller` — assigned 135 unallocated fabrics to "Locofast Online Services Private Limited"
- **Reassign seller endpoint**: `POST /api/fabrics/reassign-seller` — allows admin to move fabrics between sellers
- **Created "Locofast Online Services Private Limited"** seller (ID: 532b7c34) as the default owner for admin-created fabrics
- **Status**: COMPLETED

### Apr 1, 2026 - Supplier SEO Pages + Prerender
- **Built dynamic supplier pages** at `/suppliers/:category/:state/:slug` (e.g., `/suppliers/weaving/tamil-nadu/vp-tex-pvt-ltd/id=1271/`)
- **Backend API**: `/api/suppliers/lookup/{category}/{state}/{slug}` — matches sellers by slug, serves relevant fabrics even if seller not in DB
- **Prerender endpoint**: `/api/suppliers/prerender/{category}/{state}/{path}` — serves complete HTML to Googlebot with proper meta tags, Schema.org, canonical URLs, 12 fabric cards, 21 internal links
- **React page**: Full supplier profile with breadcrumbs, fabric grid, contact form, related suppliers, CTA section
- **SEO elements**: `<title>`, `<meta description>`, `<link canonical>`, Open Graph, Schema.org LocalBusiness, robots index/follow
- **Status**: COMPLETED

### Apr 1, 2026 - Bug Fixes (P0/P1)
- **Fixed GET /api/fabrics 500 Error**: Vendor-created fabrics stored `tags` as string instead of list. Updated `normalize_fabric()` to handle string/null tags, missing status, stock_type, delivery fields.
- **Fixed GET /api/sellers 500 Error**: Test vendor records lacked `created_at` field. Added defensive defaults for all seller fields.
- **Fixed POST /api/sellers 405 Error (Save Seller Bug)**: Missing `@api_router.post` decorator was preventing seller creation. Restored decorator.
- **Added status field to Fabric response model**: Vendor fabrics now show `pending`, `approved`, `rejected` status in API responses.
- **Added status/include_pending filters**: `GET /api/fabrics` now filters out pending/rejected fabrics by default (public view). Admin can pass `include_pending=true` to see all.
- **Cleaned up query building**: Refactored `get_fabrics` and `get_fabrics_count` to use `$and` conditions, eliminating `$or` conflicts.
- **Admin Approval Flow verified**: Screenshot confirmed admin can filter by "Pending Approval" and see approve/reject buttons.
- **Status**: COMPLETED (22/22 tests pass)

### Mar 10, 2026 - Vendor Portal for Sellers
- Built complete Vendor Portal at `/vendor/login`
- Approval Workflow: Vendor uploads → Status "Pending" → Admin approves → Goes live
- Admin UI: Status filter, Approve/Reject buttons, Status column
- **Status**: COMPLETED

### Mar 10, 2026 - Simplified Product Enquiry Form
- Simplified enquiry form on product page (Name, Email, Phone, Company, GST)
- **Status**: COMPLETED

### Mar 6, 2026 - Zapier Webhook Integration
- Zapier webhook for general enquiry leads
- **Status**: COMPLETED

(Earlier implementations documented in CHANGELOG)

## Admin Credentials
- Email: admin@locofast.com
- Password: admin123

## Vendor Portal
- URL: /vendor/login
- Test Vendor: vendor@test.com / vendor123
- Alt Vendor: info@palimills.com / admin@123

## Key API Endpoints
- `GET /api/fabrics` - Public catalog (filters out pending/rejected by default)
- `GET /api/fabrics?include_pending=true` - All fabrics (for admin)
- `GET /api/fabrics?status=pending` - Only pending fabrics
- `PUT /api/fabrics/{id}` - Update fabric (including status approve/reject)
- `POST /api/sellers` - Create seller
- `GET /api/sellers?include_inactive=true` - All sellers
- `POST /api/vendor/login` - Vendor login
- `POST /api/vendor/fabrics` - Vendor create fabric (auto status=pending)

## Prioritized Backlog

### P1 (Upcoming)
- [ ] Production prerender middleware (nginx User-Agent detection → route bots to `/api/suppliers/prerender/`)
- [ ] Customer Accounts & Order History
- [ ] Test Email Flow (end-to-end order confirmation)

### P2 (Future)
- [ ] SEO-Friendly Fabric URLs (slugs instead of UUIDs)
- [ ] Order Status Emails (Shipped/Delivered)
- [ ] Wishlist/Favorites (blocked by Customer Accounts)
- [ ] Advanced Analytics Dashboard
