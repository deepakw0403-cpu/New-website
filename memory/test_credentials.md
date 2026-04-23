# Test Credentials

## Admin
- Email: admin@locofast.com
- Password: admin123
- Login URL: /admin/login

## Vendor
- Email: vendor@test.com
- Password: vendor123
- Login URL: /vendor/login

## Alternate Vendor
- Email: info@palimills.com
- Password: admin@123

## Agent
- Email: agent@locofast.com
- Auth: OTP-based (code sent via Resend email)
- Login URL: /agent/login

## Customer
- Auth: OTP-based via Resend email
- Login URL: Account icon in navbar

## Brand Portal (Test Brand Co)
- Email: brandtest@locofast.com
- Password: NewPassword123!  (reset from temp password GQRh59B87Zod)
- Login URL: /brand/login
- Brand ID: 03b50566-e559-4a54-97f0-4cd1179615d4
- Role: brand_admin
- Allowed categories: Denim, Cotton
- Credit lines pre-seeded: Stride ₹100,000 (fully utilised by LF/ORD/001), Muthoot ₹500,000 (partial)
- Sample credits pre-seeded: 500 total (190 available — 310 used by LF/ORD/002)

## Brand OTP Testing Notes
- Admin-side "Upload credit line" requires OTP emailed to the acting admin. In automated tests, the 6-digit code is stored bcrypt-hashed in `admin_otps`. To bypass email-reliant tests, re-hash the row directly: `bcrypt.hashpw(b"123456", bcrypt.gensalt()).decode()` and use `123456` as the OTP.
