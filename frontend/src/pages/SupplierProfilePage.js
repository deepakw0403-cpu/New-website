import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Star, MapPin, Clock, Shield, Award, Package, Phone, Mail,
  ChevronRight, ExternalLink, MessageSquare, Filter, ArrowUpDown,
  Building2, Users, Factory, Globe, Truck, CreditCard, CheckCircle2,
  BarChart3, Box, AlertTriangle, Calendar
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RFQModal from "../components/RFQModal";

const API = process.env.REACT_APP_BACKEND_URL;

// ─── STAR RATING COMPONENT ───
function StarRating({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
      ))}
    </div>
  );
}

// ─── STAT CARD ───
function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <Icon size={22} className="mx-auto text-blue-600 mb-2" />
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

// ─── STOCK BAR ───
function StockBar({ label, value, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3">
        <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700 w-20 text-right">{value.toLocaleString()}m</span>
    </div>
  );
}

// ─── MAIN PAGE ───
export default function SupplierProfilePage() {
  const { category, city, slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showRfqModal, setShowRfqModal] = useState(false);

  // Catalog filters
  const [catFilter, setCatFilter] = useState("");
  const [stockOnly, setStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [showAllFabrics, setShowAllFabrics] = useState(false);

  // Parse hash for tab
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (["overview", "catalog", "inventory", "reviews", "orders"].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const cleanSlug = (slug || "").replace(/\/$/, "");
        const res = await fetch(`${API}/api/suppliers/${cleanSlug}/profile`);
        if (!res.ok) throw new Error("Supplier not found");
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProfile();
  }, [slug]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  };

  // Filtered + sorted fabrics
  const filteredFabrics = useMemo(() => {
    if (!profile) return [];
    let list = [...profile.fabrics];
    if (catFilter) list = list.filter(f => f.category_name === catFilter);
    if (stockOnly) list = list.filter(f => (f.quantity_available || 0) > 0);
    if (sortBy === "price-asc") list.sort((a, b) => (a.price_per_meter || 0) - (b.price_per_meter || 0));
    else if (sortBy === "price-desc") list.sort((a, b) => (b.price_per_meter || 0) - (a.price_per_meter || 0));
    else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list;
  }, [profile, catFilter, stockOnly, sortBy]);

  const displayFabrics = showAllFabrics ? filteredFabrics : filteredFabrics.slice(0, 12);

  if (loading) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
    </>
  );

  if (error || !profile) return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Supplier Not Found</h1>
        <Link to="/fabrics" className="text-blue-600 hover:underline">Browse all fabrics</Link>
      </div>
    </>
  );

  const s = profile.seller;
  const stats = profile.stats;
  const pageTitle = `${s.company_name} — ${s.primary_category || "Fabric"} Supplier in ${s.city}`;
  const pageDesc = `${s.company_name} is a verified ${s.business_type} of ${s.primary_category || "fabrics"} based in ${s.city}, ${s.state}. ${stats.total_skus} products, ${stats.on_time_rate}% on-time delivery. Get quotes and samples.`;
  const profileUrl = `${window.location.origin}/suppliers/${category}/${city}/${slug}`;

  // Structured data
  const breadcrumbLD = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin },
      { "@type": "ListItem", "position": 2, "name": `${(category || "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Suppliers`, "item": `${window.location.origin}/suppliers/${category}` },
      { "@type": "ListItem", "position": 3, "name": (city || "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()), "item": `${window.location.origin}/suppliers/${category}/${city}` },
      { "@type": "ListItem", "position": 4, "name": s.company_name, "item": profileUrl }
    ]
  };

  const orgLD = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": s.company_name,
    "url": profileUrl,
    "address": { "@type": "PostalAddress", "addressLocality": s.city, "addressRegion": s.state, "addressCountry": "IN" },
    ...(s.logo_url ? { "logo": s.logo_url.startsWith("http") ? s.logo_url : `${API}${s.logo_url}` } : {}),
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": profile.review_stats.average, "reviewCount": Math.max(profile.review_stats.count, 1), "bestRating": 5 }
  };

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "catalog", label: `Catalog (${stats.total_skus})` },
    { id: "inventory", label: "Inventory" },
    { id: "reviews", label: `Reviews (${profile.review_stats.count})` },
    { id: "orders", label: "Orders & Terms" },
  ];

  const logoSrc = s.logo_url ? (s.logo_url.startsWith("http") ? s.logo_url : `${API}${s.logo_url}`) : null;
  const initials = s.company_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <Helmet>
        <title>{pageTitle} | Locofast</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={profileUrl} />
        {logoSrc && <meta property="og:image" content={logoSrc} />}
        <link rel="canonical" href={profileUrl} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbLD)}</script>
        <script type="application/ld+json">{JSON.stringify(orgLD)}</script>
      </Helmet>

      <Navbar />

      <main className="bg-gray-50 min-h-screen" data-testid="supplier-profile">
        {/* ─── BREADCRUMB ─── */}
        <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-1.5 text-sm text-gray-500 overflow-x-auto" aria-label="Breadcrumb" data-testid="breadcrumbs">
          <Link to="/" className="hover:text-blue-600 whitespace-nowrap">Home</Link>
          <ChevronRight size={14} />
          <Link to={`/suppliers/${category}`} className="hover:text-blue-600 whitespace-nowrap capitalize">{(category || "").replace(/-/g, " ")} Suppliers</Link>
          <ChevronRight size={14} />
          <Link to={`/suppliers/${category}/${city}`} className="hover:text-blue-600 whitespace-nowrap capitalize">{(city || "").replace(/-/g, " ")}</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium whitespace-nowrap">{s.company_name}</span>
        </nav>

        {/* ─── HERO ─── */}
        <section className="bg-white border-b border-gray-200" data-testid="hero-section">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                {logoSrc ? (
                  <img src={logoSrc} alt={`${s.company_name} logo`} className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <span className="text-2xl md:text-3xl font-bold text-blue-600">{initials}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {s.gst_verified && (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-2 py-0.5 rounded-full" data-testid="verified-badge">
                      <Shield size={12} /> GST Verified
                    </span>
                  )}
                  {s.is_premium && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2 py-0.5 rounded-full">
                      <Award size={12} /> Premium
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2" data-testid="supplier-h1">
                  {s.company_name} — {s.primary_category || "Fabric"} {s.business_type} in {s.city}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <StarRating rating={profile.review_stats.average} />
                    <span className="font-medium ml-1">{profile.review_stats.average}</span>
                    <span>({profile.review_stats.count} reviews)</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-1"><Package size={14} /> {stats.total_orders} orders</div>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-1"><Clock size={14} /> {stats.response_time}</div>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-1"><Truck size={14} /> {stats.on_time_rate}% on-time</div>
                </div>

                {/* Category tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.keys(stats.category_counts).map(cat => (
                    <Link key={cat} to={`/fabrics?category=${encodeURIComponent(cat)}`} className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
                      {cat}
                    </Link>
                  ))}
                </div>

                {/* Location + Export */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                  <Link to={`/suppliers/${category}/${city}`} className="flex items-center gap-1 hover:text-blue-600">
                    <MapPin size={14} /> {s.city}, {s.state}
                  </Link>
                  {s.export_markets?.length > 0 && (
                    <>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-1.5">
                        <Globe size={14} />
                        {s.export_markets.map(m => (
                          <span key={m} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{m}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setShowRfqModal(true)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors" data-testid="contact-supplier-btn">
                    <MessageSquare size={16} /> Contact Supplier
                  </button>
                  <button onClick={() => setShowRfqModal(true)} className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-lg font-medium transition-colors" data-testid="request-sample-btn">
                    <Package size={16} /> Request Sample
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── METRICS ROW ─── */}
        <section className="max-w-7xl mx-auto px-4 -mt-4 mb-6 relative z-10" data-testid="metrics-row">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Package} value={stats.total_orders} label="Total Orders" />
            <StatCard icon={Truck} value={`${stats.on_time_rate}%`} label="On-Time Delivery" />
            <StatCard icon={Box} value={stats.total_skus} label="Active SKUs" />
            <StatCard icon={Calendar} value={stats.years_in_business} label="Years in Business" />
          </div>
        </section>

        {/* ─── CONTENT AREA ─── */}
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* ─── TAB NAVIGATION ─── */}
              <div className="bg-white border border-gray-200 rounded-t-xl overflow-x-auto sticky top-0 z-20" data-testid="tab-nav">
                <div className="flex">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => switchTab(tab.id)}
                      className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-600 bg-blue-50/50"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      data-testid={`tab-${tab.id}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── TAB: OVERVIEW ─── */}
              <div className={activeTab === "overview" ? "visible" : "invisible h-0 overflow-hidden"} data-testid="panel-overview">
                <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Business Details */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h2>
                      <table className="w-full text-sm">
                        <tbody>
                          {[
                            ["Legal Name", s.company_name],
                            ["GST", s.gst_verified ? "Verified" : "Not provided"],
                            ["Business Type", s.business_type],
                            ["Established", s.established_year || "—"],
                            ["Turnover Range", s.turnover_range || "—"],
                            ["Employees", s.employee_count || "—"],
                            ["Factory Size", s.factory_size || "—"],
                            ["Location", `${s.city}, ${s.state}`],
                            ["Export Markets", s.export_markets?.join(", ") || "Domestic"],
                          ].map(([label, val], i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                              <td className="py-2.5 px-3 text-gray-500 font-medium w-40">{label}</td>
                              <td className="py-2.5 px-3 text-gray-900">
                                {label === "Location" ? (
                                  <a href={`https://maps.google.com/?q=${encodeURIComponent(`${s.city}, ${s.state}, India`)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                    {val} <ExternalLink size={12} />
                                  </a>
                                ) : val}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Contact Card */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Primary Contact</h2>
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-lg font-bold text-blue-600">{(s.contact_name || "?")[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{s.contact_name || "Contact Person"}</p>
                            <p className="text-sm text-gray-500">Sales Manager</p>
                          </div>
                        </div>
                        <div className="space-y-2.5 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={14} /> {s.contact_phone ? `${s.contact_phone.slice(0, -4)}****` : "Available on request"}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={14} /> {s.contact_email ? `${s.contact_email.split("@")[0].slice(0, 3)}***@${s.contact_email.split("@")[1]}` : "Available on request"}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Globe size={14} /> Languages: {s.languages?.join(", ")}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock size={14} /> {s.working_hours}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock size={14} /> Avg Response: {stats.response_time}
                          </div>
                        </div>
                        <button onClick={() => setShowRfqModal(true)} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors">
                          Send Enquiry
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Certifications */}
                  {s.certifications?.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Certifications</h3>
                      <div className="flex flex-wrap gap-2">
                        {s.certifications.map(cert => (
                          <span key={cert} className="bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-3 py-1.5 rounded-full">
                            <CheckCircle2 size={12} className="inline mr-1" />{cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specialisation tags */}
                  <div className="mt-8">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Specialisations</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(stats.category_counts).map(cat => (
                        <Link key={cat} to={`/fabrics?category=${encodeURIComponent(cat)}`} className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors">
                          {cat} Suppliers · {s.city}
                        </Link>
                      ))}
                      {s.certifications?.map(cert => (
                        <span key={cert} className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full">
                          {s.primary_category || "Fabric"} · {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── TAB: CATALOG ─── */}
              <div className={activeTab === "catalog" ? "visible" : "invisible h-0 overflow-hidden"} data-testid="panel-catalog">
                <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-6">
                  {/* Filter bar */}
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500"><Filter size={14} /> Filters:</div>
                    <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2" data-testid="catalog-cat-filter">
                      <option value="">All Categories</option>
                      {Object.keys(stats.category_counts).map(cat => (
                        <option key={cat} value={cat}>{cat} ({stats.category_counts[cat]})</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={stockOnly} onChange={e => setStockOnly(e.target.checked)} className="rounded border-gray-300" />
                      In Stock Only
                    </label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 ml-auto">
                      <option value="newest">Newest First</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>

                  {filteredFabrics.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <Box size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No products found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayFabrics.map(f => (
                          <Link key={f.id} to={`/fabrics/${f.id}`} className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow" data-testid={`catalog-card-${f.id}`}>
                            <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                              <img
                                src={f.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400"}
                                alt={f.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{f.name}</h3>
                              <p className="text-xs text-gray-500 mb-2">{f.fabric_code || ""} {f.composition ? `· ${f.composition}` : ""}</p>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {f.width && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{f.width}</span>}
                                {f.gsm && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{f.gsm} GSM</span>}
                                {(f.quantity_available || 0) > 0 ? (
                                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">In Stock</span>
                                ) : (
                                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Made to Order</span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900">
                                  {f.price_per_meter ? `₹${f.price_per_meter}/m` : "Get Quote"}
                                </span>
                                {f.moq && <span className="text-xs text-gray-500">MOQ: {f.moq}m</span>}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                      {filteredFabrics.length > 12 && !showAllFabrics && (
                        <div className="text-center mt-6">
                          <button onClick={() => setShowAllFabrics(true)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                            View all {filteredFabrics.length} SKUs
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ─── TAB: INVENTORY ─── */}
              <div className={activeTab === "inventory" ? "visible" : "invisible h-0 overflow-hidden"} data-testid="panel-inventory">
                <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-6">
                  {/* Inventory metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-700">{stats.total_skus}</div>
                      <div className="text-xs text-blue-600">Total SKUs</div>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-700">{stats.in_stock}</div>
                      <div className="text-xs text-green-600">In Stock</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-amber-700">{stats.low_stock}</div>
                      <div className="text-xs text-amber-600">Low Stock</div>
                    </div>
                  </div>

                  {/* Stock by category bar chart */}
                  {Object.keys(stats.stock_by_category).length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Stock by Category</h3>
                      <div className="space-y-3">
                        {Object.entries(stats.stock_by_category).sort((a, b) => b[1] - a[1]).map(([cat, qty]) => (
                          <StockBar key={cat} label={cat} value={qty} max={Math.max(...Object.values(stats.stock_by_category))} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Production capacity */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Production Capacity</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        {[
                          ["Monthly Capacity", s.monthly_capacity || "On request"],
                          ["Standard Lead Time", s.standard_lead_time],
                          ["Custom Order Lead Time", s.custom_lead_time],
                          ["Sample Lead Time", s.sample_lead_time],
                        ].map(([label, val], i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                            <td className="py-2.5 px-3 text-gray-500 font-medium">{label}</td>
                            <td className="py-2.5 px-3 text-gray-900">{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ─── TAB: REVIEWS ─── */}
              <div className={activeTab === "reviews" ? "visible" : "invisible h-0 overflow-hidden"} data-testid="panel-reviews">
                <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-6">
                  {/* Rating summary */}
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-900 mb-2">{profile.review_stats.average}</div>
                      <StarRating rating={profile.review_stats.average} size={22} />
                      <p className="text-sm text-gray-500 mt-2">{profile.review_stats.count} reviews</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Sub-ratings</h3>
                      {Object.entries(profile.review_stats.sub_ratings).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-3 mb-2">
                          <span className="text-sm text-gray-600 w-32 capitalize">{key.replace(/_/g, " ")}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                            <div className="bg-amber-400 h-2.5 rounded-full" style={{ width: `${(val / 5) * 100}%` }} />
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-8">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {profile.reviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Star size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No reviews yet</p>
                      <p className="text-sm">Be the first to review this supplier</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.reviews.map((review, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                              {(review.buyer_name || "B")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{review.buyer_name}</p>
                              <p className="text-xs text-gray-500">{review.buyer_company}</p>
                            </div>
                            <div className="ml-auto text-sm text-gray-400">{review.date}</div>
                          </div>
                          <StarRating rating={review.rating} />
                          <p className="text-gray-700 mt-2">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ─── TAB: ORDERS & TERMS ─── */}
              <div className={activeTab === "orders" ? "visible" : "invisible h-0 overflow-hidden"} data-testid="panel-orders">
                <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-6">
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Order terms */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Order Terms</h3>
                      <table className="w-full text-sm">
                        <tbody>
                          {[
                            ["MOQ", s.moq],
                            ["Payment Terms", s.payment_terms],
                            ["Payment Modes", s.payment_modes?.join(", ")],
                            ["Dispatch City", s.dispatch_city],
                            ["Packing Method", s.packing_method],
                          ].map(([label, val], i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                              <td className="py-2.5 px-3 text-gray-500 font-medium">{label}</td>
                              <td className="py-2.5 px-3 text-gray-900">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Shipping */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Shipping & Delivery</h3>
                      <table className="w-full text-sm">
                        <tbody>
                          {[
                            ["India Delivery", "5-7 business days"],
                            ["Bangladesh", "10-14 business days"],
                            ["Sri Lanka", "10-14 business days"],
                            ["Middle East", "12-18 business days"],
                            ["On-Time Rate", `${stats.on_time_rate}%`],
                          ].map(([label, val], i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                              <td className="py-2.5 px-3 text-gray-500 font-medium">{label}</td>
                              <td className="py-2.5 px-3 text-gray-900">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  {profile.recent_orders.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Orders (Anonymised)</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="py-2.5 px-3 text-left text-gray-500 font-medium">Order ID</th>
                              <th className="py-2.5 px-3 text-left text-gray-500 font-medium">Product</th>
                              <th className="py-2.5 px-3 text-center text-gray-500 font-medium">Qty</th>
                              <th className="py-2.5 px-3 text-left text-gray-500 font-medium">Buyer Location</th>
                              <th className="py-2.5 px-3 text-center text-gray-500 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profile.recent_orders.map((o, i) => (
                              <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                                <td className="py-2.5 px-3 font-mono text-gray-600">{o.order_id}</td>
                                <td className="py-2.5 px-3 text-gray-900">{o.product}</td>
                                <td className="py-2.5 px-3 text-center">{o.quantity}m</td>
                                <td className="py-2.5 px-3 text-gray-600">{o.buyer_location}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    o.status === "delivered" ? "bg-green-50 text-green-700" :
                                    o.status === "shipped" ? "bg-blue-50 text-blue-700" :
                                    "bg-amber-50 text-amber-700"
                                  }`}>{o.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {profile.recent_orders.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Package size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No orders yet</p>
                      <p className="text-sm">This supplier is newly onboarded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── SIDEBAR (sticky) ─── */}
            <aside className="w-full lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-6">
                {/* Quick stats */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Active SKUs</span><span className="font-medium">{stats.total_skus}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">In Stock</span><span className="font-medium text-green-600">{stats.in_stock}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total Orders</span><span className="font-medium">{stats.total_orders}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">On-Time</span><span className="font-medium">{stats.on_time_rate}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Response Time</span><span className="font-medium">{stats.response_time}</span></div>
                  </div>
                </div>

                {/* Send Enquiry form */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Enquiry</h3>
                  <button onClick={() => setShowRfqModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors" data-testid="sidebar-enquiry-btn">
                    Send Enquiry
                  </button>
                </div>

                {/* Similar Suppliers */}
                {profile.similar_suppliers.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      {s.state ? `Similar Suppliers in ${s.state.trim()}` : `Other ${s.primary_category || "Fabric"} Suppliers`}
                    </h3>
                    <div className="space-y-3">
                      {profile.similar_suppliers.map(sim => {
                        const simCity = (sim.city || "").toLowerCase().replace(/\s+/g, "-");
                        const simCat = (sim.primary_category || sim.category_ids?.[0]?.replace("cat-", "") || "fabrics").toLowerCase();
                        return (
                          <Link
                            key={sim.id}
                            to={`/suppliers/${simCat}/${simCity}/${sim.slug}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                            data-testid={`similar-${sim.slug}`}
                          >
                            {sim.logo_url ? (
                              <img src={sim.logo_url.startsWith("http") ? sim.logo_url : `${API}${sim.logo_url}`} alt={sim.company_name} className="w-10 h-10 rounded-lg object-cover border" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                                {sim.company_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{sim.company_name}</p>
                              <p className="text-xs text-gray-500">{sim.city}{sim.fabric_count > 0 ? ` · ${sim.fabric_count} products` : ""}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        <RFQModal open={showRfqModal} onClose={() => setShowRfqModal(false)} />
      </main>

      <Footer />
    </>
  );
}
