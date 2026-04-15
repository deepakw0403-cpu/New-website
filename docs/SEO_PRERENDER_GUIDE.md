# SEO Prerender Setup Guide for Production

## What's Been Done (Code Level)

### 1. Critical Fix: `noindex` removed
- Changed `<meta name="robots" content="noindex, nofollow">` to `<meta name="robots" content="index, follow">` in `index.html`
- This was THE primary reason Google wasn't indexing the homepage

### 2. Static HTML meta tags (already present)
- `<title>`, `<meta description>`, OG tags, Twitter cards, JSON-LD structured data are all in the raw HTML `<head>` — not injected by JavaScript
- `<noscript>` block has meaningful content for crawlers

### 3. Dynamic Sitemap
- **Endpoint**: `GET /api/sitemap.xml`
- Generates sitemap from database (all fabrics, collections, suppliers, blog posts, tool pages)
- Static fallback: `public/sitemap.xml` with 17 core pages

### 4. Prerender Endpoints (for Googlebot)
- `GET /api/prerender/homepage` — Full HTML homepage
- `GET /api/prerender/fabrics` — Fabric catalog with real data
- `GET /api/prerender/collections` — Collections page
- `GET /api/prerender/check?path=/` — Bot detection utility
- Supplier pages already handled by `supplier_router.py`

### 5. Updated `robots.txt`
- Allows `/api/sitemap.xml` and `/api/prerender/` while blocking other `/api/` routes

---

## What You Need To Do (Production Config)

### Step 1: Request Re-indexing (Do This NOW)
1. Go to [Google Search Console](https://search.google.com/search-console)
2. URL Inspection → enter `locofast.com`
3. Click "Request Indexing"
4. Submit sitemap: `https://locofast.com/api/sitemap.xml`

### Step 2: Deploy the code changes
The `noindex` → `index, follow` fix needs to be deployed to production.

### Step 3: Configure Bot Routing (Nginx / Cloudflare Worker)
For Googlebot to receive pre-rendered HTML, you need a reverse proxy rule:

#### Option A: Nginx Config
```nginx
# Add to your server block
map $http_user_agent $is_bot {
    default 0;
    ~*googlebot 1;
    ~*bingbot 1;
    ~*yandex 1;
    ~*facebookexternalhit 1;
    ~*twitterbot 1;
    ~*linkedinbot 1;
    ~*whatsapp 1;
    ~*slackbot 1;
}

location = / {
    if ($is_bot) {
        proxy_pass https://v2-launch.emergent.host/api/prerender/homepage;
    }
    # Normal users get React SPA
    try_files $uri /index.html;
}

location = /fabrics {
    if ($is_bot) {
        proxy_pass https://v2-launch.emergent.host/api/prerender/fabrics;
    }
    try_files $uri /index.html;
}

location = /collections {
    if ($is_bot) {
        proxy_pass https://v2-launch.emergent.host/api/prerender/collections;
    }
    try_files $uri /index.html;
}

# Supplier pages already have prerender at /api/suppliers/prerender/
location ~ ^/suppliers/(.+)/(.+)/(.+) {
    if ($is_bot) {
        proxy_pass https://v2-launch.emergent.host/api/suppliers/prerender/$1/$2/$3;
    }
    try_files $uri /index.html;
}
```

#### Option B: Cloudflare Worker
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const BOT_REGEX = /googlebot|bingbot|yandex|facebookexternalhit|twitterbot|linkedinbot|whatsapp|slackbot/i;
const BACKEND = 'https://v2-launch.emergent.host';

const PRERENDER_MAP = {
  '/': '/api/prerender/homepage',
  '/fabrics': '/api/prerender/fabrics',
  '/collections': '/api/prerender/collections',
};

async function handleRequest(request) {
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  
  if (BOT_REGEX.test(ua)) {
    // Check static prerender routes
    const prerenderPath = PRERENDER_MAP[url.pathname];
    if (prerenderPath) {
      return fetch(`${BACKEND}${prerenderPath}`);
    }
    
    // Check supplier pages
    const supplierMatch = url.pathname.match(/^\/suppliers\/(.+)\/(.+)\/(.+)/);
    if (supplierMatch) {
      return fetch(`${BACKEND}/api/suppliers/prerender/${supplierMatch[1]}/${supplierMatch[2]}/${supplierMatch[3]}`);
    }
  }
  
  // Normal users: pass through to origin
  return fetch(request);
}
```

---

## Summary of SEO Fixes

| Fix | Impact | Status |
|-----|--------|--------|
| Remove `noindex, nofollow` | **CRITICAL** — Google was explicitly blocked | Done in code |
| Meta tags in static HTML | HIGH — title & description visible without JS | Already existed |
| Dynamic sitemap with all pages | HIGH — Google discovers all content | Done in code |
| Prerender endpoints for bots | HIGH — Googlebot gets full HTML | Done in code |
| Request re-indexing in GSC | HIGH — Forces Google to re-crawl | **Manual step** |
| Bot routing (nginx/CF worker) | MEDIUM — Delivers prerendered HTML to bots | **Manual config** |
