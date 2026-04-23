import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useBrandAuth } from "../../context/BrandAuthContext";
import BrandLayout from "./BrandLayout";
import { Package, Loader2, ShoppingCart, Beaker, MessageSquare, Search, SlidersHorizontal, X } from "lucide-react";
import { displayFabricName } from "../../lib/fabricDisplay";

const API = process.env.REACT_APP_BACKEND_URL;

const FabricCard = ({ f, onOpen }) => {
  const unit = f.fabric_type === "knitted" && f.category_id !== "cat-denim" ? "kg" : "m";
  const stock = Number(f.quantity_available || 0);
  const rate = Number(f.rate_per_meter || 0);
  const samplePrice = Number(f.sample_price || 0);
  const oz = f.ounce ? `${f.ounce} oz` : null;
  const width = f.width ? `${f.width}"` : null;
  const detailUrl = `/brand/fabrics/${f.slug || f.id}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col" data-testid={`brand-fabric-${f.id}`}>
      {/* Image + title are both Links → click anywhere on upper half to open detail */}
      <Link to={detailUrl} className="block" data-testid={`brand-fabric-card-link-${f.id}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          <img
            src={f.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=500"}
            alt={f.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {stock > 0 ? (
            <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-semibold px-2 py-1 rounded-md">
              {stock.toLocaleString("en-IN")}{unit} Available
            </span>
          ) : (
            <span className="absolute top-2 right-2 bg-gray-900/80 text-white text-[11px] font-semibold px-2 py-1 rounded-md">
              On Request
            </span>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 mb-1">{f.category_name || "Fabric"}</p>
        <Link to={detailUrl} className="hover:text-emerald-700">
          <h3 className="font-medium text-sm text-gray-900 line-clamp-2 min-h-[40px]">{displayFabricName(f)}</h3>
        </Link>
        {(oz || width) && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {oz && <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{oz}</span>}
            {width && <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{width}</span>}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-sm border-t border-gray-100 pt-2.5">
          <span className="text-gray-500 text-xs">Sample</span>
          {samplePrice > 0 ? (
            <span className="font-semibold text-emerald-700">₹{samplePrice}/{unit}</span>
          ) : (
            <span className="text-gray-400 text-xs">On Enquiry</span>
          )}
        </div>
        {rate > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 text-xs">Bulk</span>
            <span className="font-semibold text-gray-900">₹{rate}/{unit}</span>
          </div>
        )}
        <div className="mt-3 grid gap-1.5">
          {rate > 0 && stock > 0 ? (
            <button onClick={() => onOpen(f)} className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-md" data-testid={`brand-bulk-${f.id}`}>
              <ShoppingCart size={12} /> Order Bulk
            </button>
          ) : (
            <button onClick={() => onOpen(f)} className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold py-2 rounded-md" data-testid={`brand-quote-${f.id}`}>
              <MessageSquare size={12} /> Request Quote
            </button>
          )}
          {samplePrice > 0 ? (
            <button onClick={() => onOpen(f)} className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-md" data-testid={`brand-sample-${f.id}`}>
              <Beaker size={12} /> Request Sample
            </button>
          ) : (
            <Link to={detailUrl} className="w-full flex items-center justify-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium py-2 rounded-md">
              View details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

const BrandFabrics = () => {
  const { user, token } = useBrandAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [fabrics, setFabrics] = useState([]);
  const [facets, setFacets] = useState({ categories: [], colors: [], patterns: [], widths: [], compositions: [], fabric_types: [] });
  const [loading, setLoading] = useState(true);

  // Filters — hydrated from query string so shares/bookmarks are stable
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "");
  const [selectedComposition, setSelectedComposition] = useState(searchParams.get("composition") || "");
  const [selectedPattern, setSelectedPattern] = useState(searchParams.get("pattern") || "");
  const [selectedColor, setSelectedColor] = useState(searchParams.get("color") || "");
  const [selectedWidth, setSelectedWidth] = useState(searchParams.get("width") || "");
  const [availability, setAvailability] = useState(searchParams.get("avail") || "");
  const [gsmMin, setGsmMin] = useState(searchParams.get("gsm_min") || "");
  const [gsmMax, setGsmMax] = useState(searchParams.get("gsm_max") || "");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    if (!token) { navigate("/brand/login"); return; }
    if (user?.must_reset_password) { navigate("/brand/reset-password"); return; }
    fetch(`${API}/api/brand/fabrics/filter-options`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setFacets).catch(() => {});
  }, [token, user, navigate]);

  // Fetch on any filter change
  useEffect(() => {
    if (!token || user?.must_reset_password) return;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category_id", selectedCategory);
    if (selectedType) params.set("fabric_type", selectedType);
    if (selectedComposition) params.set("composition", selectedComposition);
    if (selectedPattern) params.set("pattern", selectedPattern);
    if (selectedColor) params.set("color", selectedColor);
    if (selectedWidth) params.set("width", selectedWidth);
    if (availability) params.set("availability", availability);
    if (gsmMin) params.set("gsm_min", gsmMin);
    if (gsmMax) params.set("gsm_max", gsmMax);

    setLoading(true);
    fetch(`${API}/api/brand/fabrics?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setFabrics(Array.isArray(d) ? d : []))
      .catch(() => setFabrics([]))
      .finally(() => setLoading(false));

    // Mirror to URL query string (minus empty values)
    const url = new URLSearchParams();
    if (search) url.set("q", search);
    if (selectedCategory) url.set("category", selectedCategory);
    if (selectedType) url.set("type", selectedType);
    if (selectedComposition) url.set("composition", selectedComposition);
    if (selectedPattern) url.set("pattern", selectedPattern);
    if (selectedColor) url.set("color", selectedColor);
    if (selectedWidth) url.set("width", selectedWidth);
    if (availability) url.set("avail", availability);
    if (gsmMin) url.set("gsm_min", gsmMin);
    if (gsmMax) url.set("gsm_max", gsmMax);
    setSearchParams(url, { replace: true });
  }, [token, user, search, selectedCategory, selectedType, selectedComposition, selectedPattern, selectedColor, selectedWidth, availability, gsmMin, gsmMax, setSearchParams]);

  const clear = () => {
    setSearch(""); setSelectedCategory(""); setSelectedType(""); setSelectedComposition("");
    setSelectedPattern(""); setSelectedColor(""); setSelectedWidth(""); setAvailability("");
    setGsmMin(""); setGsmMax("");
  };

  const openFabric = (f) => navigate(`/brand/fabrics/${f.slug || f.id}`);

  const activeFilterCount = useMemo(() => [
    selectedCategory, selectedType, selectedComposition, selectedPattern,
    selectedColor, selectedWidth, availability, gsmMin, gsmMax,
  ].filter(Boolean).length, [selectedCategory, selectedType, selectedComposition, selectedPattern, selectedColor, selectedWidth, availability, gsmMin, gsmMax]);

  return (
    <BrandLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Available Fabrics</h1>
          <p className="text-sm text-gray-500">
            Curated catalogue for {user?.brand_name} · {fabrics.length} SKU{fabrics.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code"
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64"
              data-testid="brand-search"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border ${
              showFilters ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
            data-testid="brand-toggle-filters"
          >
            <SlidersHorizontal size={14} /> Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-emerald-600 text-white text-[10px] px-1.5 rounded-full">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* ── Filters rail ── */}
        {showFilters && (
          <aside className="bg-white border border-gray-200 rounded-xl p-4 self-start sticky top-20" data-testid="brand-filters-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
              {activeFilterCount > 0 && (
                <button onClick={clear} className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1" data-testid="brand-clear-filters">
                  <X size={10} /> Clear
                </button>
              )}
            </div>

            {/* Availability */}
            <div className="mb-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">Availability</p>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { v: "", label: "All" },
                  { v: "instant", label: "Instant" },
                  { v: "bookable", label: "In Stock" },
                  { v: "sample", label: "Sample" },
                ].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setAvailability(o.v)}
                    className={`text-xs px-2 py-1.5 rounded border ${availability === o.v ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                    data-testid={`brand-avail-${o.v || "all"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            {facets.categories?.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">Category</p>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                  data-testid="brand-filter-category"
                >
                  <option value="">All Categories</option>
                  {facets.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {/* Fabric Type */}
            {facets.fabric_types?.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">Fabric Type</p>
                <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white" data-testid="brand-filter-type">
                  <option value="">All Types</option>
                  {facets.fabric_types.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            {/* Composition */}
            {facets.compositions?.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">Composition</p>
                <select value={selectedComposition} onChange={(e) => setSelectedComposition(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white" data-testid="brand-filter-composition">
                  <option value="">All Compositions</option>
                  {facets.compositions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {/* Pattern */}
            {facets.patterns?.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">Pattern</p>
                <select value={selectedPattern} onChange={(e) => setSelectedPattern(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white" data-testid="brand-filter-pattern">
                  <option value="">All Patterns</option>
                  {facets.patterns.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            {/* Color */}
            {facets.colors?.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">Color</p>
                <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white" data-testid="brand-filter-color">
                  <option value="">All Colors</option>
                  {facets.colors.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {/* Width */}
            {facets.widths?.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">Width</p>
                <select value={selectedWidth} onChange={(e) => setSelectedWidth(e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white" data-testid="brand-filter-width">
                  <option value="">All Widths</option>
                  {facets.widths.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            )}

            {/* GSM range */}
            <div className="mb-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">GSM Range</p>
              <div className="flex items-center gap-1.5">
                <input type="number" value={gsmMin} onChange={(e) => setGsmMin(e.target.value)} placeholder="Min" className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs" data-testid="brand-filter-gsm-min" />
                <span className="text-gray-400 text-xs">–</span>
                <input type="number" value={gsmMax} onChange={(e) => setGsmMax(e.target.value)} placeholder="Max" className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs" data-testid="brand-filter-gsm-max" />
              </div>
            </div>
          </aside>
        )}

        {/* ── Grid ── */}
        <section>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-emerald-600" size={24} />
            </div>
          ) : fabrics.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <Package className="text-gray-300 mx-auto mb-3" size={40} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No fabrics match your filters</h3>
              <p className="text-sm text-gray-500">{activeFilterCount > 0 ? "Try clearing some filters." : "Your Locofast relationship manager will unlock relevant categories shortly."}</p>
              {activeFilterCount > 0 && (
                <button onClick={clear} className="mt-4 text-sm text-emerald-700 hover:underline">Clear all filters</button>
              )}
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${showFilters ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`} data-testid="brand-fabric-grid">
              {fabrics.map((f) => <FabricCard key={f.id} f={f} onOpen={openFabric} />)}
            </div>
          )}
        </section>
      </div>
    </BrandLayout>
  );
};

export default BrandFabrics;
