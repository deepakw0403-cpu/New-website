# Locofast — External RFQ Lead Ingest API

> **What this is**: A single REST endpoint for pushing RFQ leads into Locofast from any external system — CRM (HubSpot, Salesforce, Zoho), ad platforms, partner sites, marketing automation tools, etc.
>
> **What it does**: Creates a new RFQ in our pipeline that gets the same vendor fan-out and admin treatment as a customer-form RFQ. Returns the Locofast RFQ number for your records.

---

## 1. Endpoint

```
POST  https://www.locofast.com/api/external/rfq
```

> Use the production URL when going live. For testing use the preview URL provided to you separately.

---

## 2. Authentication

All requests must include an `X-API-Key` header. The key is shared with you separately and rotates on demand.

```
X-API-Key: lf_ingest_••••••••••••••••••••••••••••••••••••
```

Missing or wrong key → `401 Unauthorized`.

---

## 3. Categories

Locofast supports **four product categories**. The payload shape changes slightly per category:

| `category` | Quantity unit | Required spec field |
|---|---|---|
| `cotton`  | meters | `fabric_requirement_type` |
| `viscose` | meters | `fabric_requirement_type` |
| `denim`   | meters | `denim_specification` (free text) |
| `knits`   | kilograms | `knit_quality` (free text) |

---

## 4. Field reference

### 4.1 Common fields (every category)

| Field | Type | Mandatory | Description | Sample value |
|---|---|---|---|---|
| `category` | string enum | ✅ | One of `cotton`, `viscose`, `denim`, `knits` | `"cotton"` |
| `full_name` | string | ✅ | Buyer's full name. 2–120 chars. | `"Aarav Sharma"` |
| `email` | string | ✅ | Buyer's email | `"aarav@acmegarments.in"` |
| `phone` | string | ✅ | Mobile (E.164 or 10-digit Indian) | `"+919876543210"` |
| `company` | string | ❌ | Buyer's company name | `"Acme Garments Pvt Ltd"` |
| `gst_number` | string | ❌ | 15-char GSTIN | `"27AAACR5055K1ZP"` |
| `website` | string | ❌ | Buyer's company website | `"https://acmegarments.in"` |
| `message` | string | ❌ | Free-text additional notes | `"Need swatches before 15 Mar"` |
| `target_price_per_meter` | float | ❌ | Buyer's target ₹/m, passed to vendors | `185.0` |
| `dispatch_required_by` | string | ❌ | ISO date `YYYY-MM-DD` | `"2026-04-30"` |
| `delivery_pincode` | string | ❌ | Delivery PIN/postal | `"110001"` |
| `delivery_city` | string | ❌ | Delivery city | `"New Delhi"` |
| `delivery_state` | string | ❌ | Delivery state | `"Delhi"` |
| `lead_source` | string | ❌ | Where this lead came from (free-form) | `"HubSpot"` / `"Meta Ads · Q2 Cotton"` |
| `external_id` | string | ❌ | Your CRM lead ID — used for de-dupe | `"hubspot-deal-184729"` |
| `campaign` | string | ❌ | Marketing campaign / UTM | `"winter-25-cotton"` |

### 4.2 Cotton & Viscose only

| Field | Type | Mandatory | Allowed values | Sample |
|---|---|---|---|---|
| `fabric_requirement_type` | string enum | ✅ | `Greige`, `Dyed`, `RFD`, `Printed` | `"Dyed"` |
| `quantity_meters` | string enum | ✅ | `1000_5000`, `5000_20000`, `20000_50000`, `50000_plus` | `"5000_20000"` |

### 4.3 Denim only

| Field | Type | Mandatory | Description | Sample |
|---|---|---|---|---|
| `denim_specification` | string | ✅ | Free text — composition, weight, finish (5–500 chars) | `"65% Cotton / 35% Poly · 11 oz · Stretch · Indigo"` |
| `quantity_meters` | string enum | ✅ | `1000_2500`, `2500_7500`, `7500_25000`, `25000_plus` | `"7500_25000"` |

### 4.4 Knits only

| Field | Type | Mandatory | Description | Sample |
|---|---|---|---|---|
| `knit_quality` | string | ✅ | Free text — knit quality / GSM (5–200 chars) | `"4 Way Lycra 220-230 GSM"` |
| `quantity_kg` | string enum | ✅ | `less_than_200`, `200_500`, `500_1000`, `1000_plus` | `"500_1000"` |

---

## 5. Request examples (one per category)

### 5.1 Cotton

```bash
curl -X POST "https://www.locofast.com/api/external/rfq" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lf_ingest_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -d '{
    "category": "cotton",
    "fabric_requirement_type": "Dyed",
    "quantity_meters": "5000_20000",
    "full_name": "Aarav Sharma",
    "email": "aarav@acmegarments.in",
    "phone": "+919876543210",
    "company": "Acme Garments Pvt Ltd",
    "gst_number": "27AAACR5055K1ZP",
    "target_price_per_meter": 185.0,
    "dispatch_required_by": "2026-04-30",
    "delivery_pincode": "110001",
    "delivery_city": "New Delhi",
    "delivery_state": "Delhi",
    "message": "Need 5000m swatches first; bulk later",
    "lead_source": "HubSpot",
    "external_id": "hubspot-deal-184729",
    "campaign": "winter-25-cotton"
  }'
```

### 5.2 Viscose

```bash
curl -X POST "https://www.locofast.com/api/external/rfq" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lf_ingest_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -d '{
    "category": "viscose",
    "fabric_requirement_type": "Printed",
    "quantity_meters": "1000_5000",
    "full_name": "Priya Iyer",
    "email": "priya@vstextiles.com",
    "phone": "9123456789",
    "company": "VS Textiles",
    "lead_source": "Salesforce"
  }'
```

### 5.3 Denim

```bash
curl -X POST "https://www.locofast.com/api/external/rfq" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lf_ingest_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -d '{
    "category": "denim",
    "denim_specification": "65% Cotton / 35% Poly · 11 oz · Stretch · Indigo · Dry-process washed",
    "quantity_meters": "7500_25000",
    "full_name": "Rohan Mehta",
    "email": "rohan@blueknit.in",
    "phone": "+919812345678",
    "company": "Blue Knit Apparel",
    "gst_number": "29AABCU9603R1ZX",
    "target_price_per_meter": 320.0,
    "delivery_city": "Bengaluru",
    "lead_source": "Meta Ads · Denim April",
    "external_id": "meta-lead-994412"
  }'
```

### 5.4 Knits

```bash
curl -X POST "https://www.locofast.com/api/external/rfq" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lf_ingest_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -d '{
    "category": "knits",
    "knit_quality": "4 Way Lycra 220-230 GSM",
    "quantity_kg": "500_1000",
    "full_name": "Sana Khan",
    "email": "sana@activeapparel.in",
    "phone": "9988776655",
    "company": "Active Apparel Co",
    "message": "Need black + 2 fluorescent shades",
    "lead_source": "Partner Portal"
  }'
```

---

## 6. Response

### 6.1 Success — new RFQ created (201)

```json
{
  "success": true,
  "rfq_id": "a3a3a51b-7b3b-4a65-9a8e-9b4f4e1c1b7a",
  "rfq_number": "RFQ-AB12CD",
  "status": "new",
  "message": "RFQ ingested",
  "deduplicated": false
}
```

### 6.2 Idempotent retry — existing RFQ returned (201)

If you push the same `external_id` twice, Locofast does **not** create a duplicate. The original RFQ is returned with `deduplicated: true`:

```json
{
  "success": true,
  "rfq_id": "a3a3a51b-7b3b-4a65-9a8e-9b4f4e1c1b7a",
  "rfq_number": "RFQ-AB12CD",
  "status": "new",
  "message": "Existing RFQ returned (deduplicated by external_id)",
  "deduplicated": true
}
```

### 6.3 Errors

| HTTP | Body | When |
|---|---|---|
| **401** | `{"detail": "Invalid API key"}` | Missing or wrong `X-API-Key` |
| **422** | `{"detail": [{"loc": ["body", "email"], "msg": "value is not a valid email address", ...}]}` | Validation error — `loc` array tells you which field failed |
| **503** | `{"detail": "Ingest API not configured"}` | Server-side env not set (you should never see this in production) |

---

## 7. De-duplication & idempotency

If your CRM sometimes pushes the same lead twice (network retries, webhook re-delivery, etc.), pass a stable `external_id`:

- First call → creates RFQ, returns `deduplicated: false`
- All subsequent calls with the same `external_id` → return original RFQ, `deduplicated: true`

This makes the endpoint **safe to retry**. We strongly recommend setting `external_id` for any automated integration.

---

## 8. What happens to the lead next?

Once ingested, the RFQ:

1. Lands in admin `/admin/enquiries` and `/admin/rfqs` dashboards (filtered as `source: external_api`)
2. Triggers a **vendor fan-out email** to all eligible sellers in the chosen category
3. Triggers an **admin notification email**
4. Becomes available in the customer's `/account → My Queries` view (if they later log in with the same email)
5. Vendors quote → buyer compares quotes → converts to a paid order via Razorpay

You'll know the lead is being worked on when the `status` field flips from `new` → `in_progress` → `quoted` → `won` / `lost` / `expired`.

---

## 9. Rate limits & SLAs

- **Soft limit**: 60 requests / minute / API key
- **Hard limit**: 1000 requests / hour / API key
- **Vendor fan-out latency**: < 30 sec from successful ingest
- **Uptime target**: 99.9% (preview environment is best-effort, not SLA-backed)

If you need higher limits for a one-time bulk import, let us know and we'll temporarily raise the cap.

---

## 10. Live OpenAPI / Swagger

A machine-readable schema is available at:

```
GET  https://www.locofast.com/api/docs
GET  https://www.locofast.com/openapi.json
```

The `/api/docs` page is interactive — paste your `X-API-Key` once, then click "Try it out" on any payload to send a real request.

---

## 11. Support

- API issues / new feature requests: **deepak.wadhwa@locofast.com**
- Status / incident updates: announced via your assigned account manager
