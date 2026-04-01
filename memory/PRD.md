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
- [ ] SEO Preservation Routes (`/suppliers/:category/:state/:slug`)
- [ ] Customer Accounts & Order History
- [ ] Test Email Flow (end-to-end order confirmation)

### P2 (Future)
- [ ] SEO-Friendly Fabric URLs (slugs instead of UUIDs)
- [ ] Order Status Emails (Shipped/Delivered)
- [ ] Wishlist/Favorites (blocked by Customer Accounts)
- [ ] Advanced Analytics Dashboard
