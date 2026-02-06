# Locofast - Fabric Catalog CMS

## Original Problem Statement
Build a CMS-driven fabric catalog website for Locofast - a B2B fabric sourcing platform. The website allows the Locofast team to upload fabric swatches and related information, and allows customers to browse fabrics easily on the frontend.

## User Personas
1. **Admin (Locofast Team)** - Manages fabrics, categories, and views customer enquiries
2. **Customer (Frontend User)** - Browses fabrics by category, views details, and submits enquiries

## Core Requirements (Static)
- Admin panel with JWT authentication
- Fabric management (CRUD with images, specs, tags)
- Category management
- Fabric browsing with search & filters
- Enquiry submission system
- Static pages (About, How It Works, Contact)

## User Choices
- Authentication: JWT email/password
- Enquiry: Store in DB (email integration deferred)
- Image Storage: Local uploads (Cloudinary integration deferred)
- Branding: Neutral professional (Playfair Display + Manrope fonts)
- Demo Data: Seeded with 8 fabrics, 6 categories

## Brand Language Guidelines Applied
- **Tone**: Clear, confident, professional, operational
- **Audience**: B2B buyers and suppliers in textile sourcing
- **Avoided**: Marketing hype, buzzwords, exaggerated claims
- **CTAs**: Neutral, functional ("Browse Fabrics", "Request Information", "Submit Enquiry")
- **Descriptions**: Factual, specification-led (GSM, composition, width, MOQ)
- **Positioning**: Locofast as facilitator, not seller

## What's Been Implemented

### Feb 6, 2026 - MVP Complete
- **Backend (FastAPI + MongoDB)**
  - JWT authentication for admin
  - Categories CRUD API
  - Fabrics CRUD API with image upload
  - Enquiries API
  - Stats endpoint for dashboard
  - Seed data endpoint

- **Frontend (React + Tailwind)**
  - Homepage with hero, categories grid, featured fabrics
  - Fabric listing page with search, filters (category, type, GSM)
  - Fabric detail page with image gallery, specs, enquiry modal
  - Contact page with form
  - About & How It Works static pages
  - Admin login, dashboard, fabrics/categories/enquiries management

- **Design**
  - "Modern Atelier" identity
  - Playfair Display (headings) + Manrope (body) typography
  - Light theme with neutral palette + beige accents
  - Mobile responsive

### Feb 6, 2026 - Brand Language Update
- Updated all copy to match Locofast brand guidelines
- Removed marketing language, made copy factual and process-driven
- Changed CTAs to neutral/functional wording
- Updated fabric descriptions to be specification-led
- Positioned Locofast as facilitator (not seller) throughout

## Prioritized Backlog

### P0 (Immediate) - Done
- [x] Core fabric catalog
- [x] Admin panel
- [x] Enquiry system
- [x] Brand language alignment

### P1 (Next Phase)
- [ ] Cloudinary integration for images
- [ ] Email notifications for enquiries (SendGrid/Resend)
- [ ] Pagination for fabric listing
- [ ] SEO meta tags for fabric pages

### P2 (Future)
- [ ] Seller profiles
- [ ] Price visibility controls
- [ ] Buyer login/accounts
- [ ] RFQ workflows
- [ ] Sample request tracking

## Technical Stack
- Frontend: React 19, Tailwind CSS, React Router, Sonner
- Backend: FastAPI, Motor (async MongoDB)
- Database: MongoDB
- Auth: JWT with bcrypt

## Admin Credentials
- Email: admin@locofast.com
- Password: admin123
