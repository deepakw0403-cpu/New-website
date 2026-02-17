import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getFabrics, getCategories } from "../lib/api";

const FabricsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [fabrics, setFabrics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "");
  const [gsmRange, setGsmRange] = useState({
    min: searchParams.get("min_gsm") || "",
    max: searchParams.get("max_gsm") || "",
  });

  const fabricTypes = ["woven", "knitted", "non-woven"];

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchFabrics = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        if (selectedCategory) params.category_id = selectedCategory;
        if (selectedType) params.fabric_type = selectedType;
        if (gsmRange.min) params.min_gsm = gsmRange.min;
        if (gsmRange.max) params.max_gsm = gsmRange.max;

        const res = await getFabrics(params);
        setFabrics(res.data);
      } catch (err) {
        console.error("Error fetching fabrics:", err);
      }
      setLoading(false);
    };

    const timeout = setTimeout(fetchFabrics, 300);
    return () => clearTimeout(timeout);
  }, [search, selectedCategory, selectedType, gsmRange]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedType("");
    setGsmRange({ min: "", max: "" });
    setSearchParams({});
  };

  const hasFilters = search || selectedCategory || selectedType || gsmRange.min || gsmRange.max;

  const getAvailabilityBadge = (avail) => {
    switch (avail) {
      case "Sample":
        return "bg-blue-50 text-blue-700";
      case "Bulk":
        return "bg-emerald-50 text-emerald-700";
      case "On Request":
        return "bg-amber-50 text-amber-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />
      <main className="flex-grow pt-20" data-testid="fabrics-page">
        {/* Header */}
        <div className="bg-gray-50 py-12 border-b border-gray-100">
          <div className="container-main">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
            <p className="subheading mb-2">Catalog</p>
            <h1 className="text-4xl font-semibold">Fabric Catalog</h1>
            <p className="text-neutral-600 mt-2">Browse fabrics by category, type, or specifications.</p>
          </div>
        </div>

      <div className="container-main py-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by fabric name, composition, or color"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-sm focus:border-neutral-900 focus:outline-none"
              data-testid="fabric-search-input"
            />
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden btn-secondary inline-flex items-center justify-center gap-2"
            data-testid="filter-toggle-btn"
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>

          {/* Desktop Filters */}
          <div className="hidden md:flex items-center gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-neutral-200 rounded-sm focus:border-neutral-900 focus:outline-none bg-white min-w-[160px]"
              data-testid="category-filter"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 border border-neutral-200 rounded-sm focus:border-neutral-900 focus:outline-none bg-white min-w-[140px]"
              data-testid="type-filter"
            >
              <option value="">All Types</option>
              {fabricTypes.map((type) => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min GSM"
                value={gsmRange.min}
                onChange={(e) => setGsmRange({ ...gsmRange, min: e.target.value })}
                className="w-24 px-3 py-3 border border-neutral-200 rounded-sm focus:border-neutral-900 focus:outline-none"
                data-testid="min-gsm-filter"
              />
              <span className="text-neutral-400">-</span>
              <input
                type="number"
                placeholder="Max GSM"
                value={gsmRange.max}
                onChange={(e) => setGsmRange({ ...gsmRange, max: e.target.value })}
                className="w-24 px-3 py-3 border border-neutral-200 rounded-sm focus:border-neutral-900 focus:outline-none"
                data-testid="max-gsm-filter"
              />
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className="btn-ghost inline-flex items-center gap-1" data-testid="clear-filters-btn">
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filters Panel */}
        {showFilters && (
          <div className="md:hidden bg-neutral-50 p-4 rounded-sm mb-6 space-y-4 animate-slideDown" data-testid="mobile-filters">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 rounded-sm bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 rounded-sm bg-white"
            >
              <option value="">All Types</option>
              {fabricTypes.map((type) => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min GSM"
                value={gsmRange.min}
                onChange={(e) => setGsmRange({ ...gsmRange, min: e.target.value })}
                className="flex-1 px-3 py-3 border border-neutral-200 rounded-sm"
              />
              <input
                type="number"
                placeholder="Max GSM"
                value={gsmRange.max}
                onChange={(e) => setGsmRange({ ...gsmRange, max: e.target.value })}
                className="flex-1 px-3 py-3 border border-neutral-200 rounded-sm"
              />
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className="w-full btn-secondary">
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-neutral-500 mb-6" data-testid="results-count">
          {fabrics.length} fabric{fabrics.length !== 1 ? "s" : ""} found
        </p>

        {/* Fabric Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-neutral-200 mb-4" />
                <div className="h-3 bg-neutral-200 w-1/3 mb-2" />
                <div className="h-5 bg-neutral-200 w-3/4 mb-2" />
                <div className="h-4 bg-neutral-200 w-1/2" />
              </div>
            ))}
          </div>
        ) : fabrics.length === 0 ? (
          <div className="text-center py-20" data-testid="no-results">
            <p className="text-neutral-500 text-lg">No fabrics match your search criteria.</p>
            <button onClick={clearFilters} className="btn-secondary mt-4">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12" data-testid="fabric-grid">
            {fabrics.map((fabric) => (
              <Link
                key={fabric.id}
                to={`/fabrics/${fabric.id}`}
                className="group"
                data-testid={`fabric-card-${fabric.id}`}
              >
                <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 relative rounded">
                  <img
                    src={fabric.images[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600"}
                    alt={fabric.name}
                    className="w-full h-full object-cover image-zoom"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-1">
                    {(Array.isArray(fabric.availability) ? fabric.availability : []).map((avail, idx) => (
                      <span key={idx} className={`badge ${getAvailabilityBadge(avail)}`}>
                        {avail}
                      </span>
                    ))}
                    {fabric.is_bookable && (
                      <span className="badge bg-emerald-500 text-white">Bookable</span>
                    )}
                  </div>
                </div>
                <p className="subheading mb-1">{fabric.category_name}</p>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-[#2563EB] transition-colors">
                  {fabric.name}
                </h3>
                {/* Only show specs that have data */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-2">
                  {fabric.gsm > 0 && (
                    <>
                      <span className="tech-data">{fabric.gsm} GSM</span>
                      {fabric.width && <span>•</span>}
                    </>
                  )}
                  {fabric.weight_unit === 'ounce' && fabric.ounce && (
                    <>
                      <span className="tech-data">{fabric.ounce} oz</span>
                      {fabric.width && <span>•</span>}
                    </>
                  )}
                  {fabric.width && <span>{fabric.width}</span>}
                </div>
                {/* Composition - only show if available */}
                {Array.isArray(fabric.composition) && fabric.composition.length > 0 && fabric.composition.some(c => c.material) && (
                  <p className="text-sm text-gray-600">
                    {fabric.composition.filter(c => c.material && c.percentage > 0).map(c => `${c.percentage}% ${c.material}`).join(', ')}
                  </p>
                )}
                {/* Rate - show if bookable and has rate */}
                {fabric.is_bookable && fabric.rate_per_meter > 0 && (
                  <p className="text-sm font-medium text-[#2563EB] mt-1">₹{fabric.rate_per_meter.toLocaleString()}/m</p>
                )}
                {/* Starting price if no rate */}
                {!fabric.is_bookable && fabric.starting_price && (
                  <p className="text-sm text-gray-500 mt-1">{fabric.starting_price}</p>
                )}
                {fabric.seller_company && (
                  <p className="text-xs text-gray-400 mt-1">by {fabric.seller_company}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
    <Footer />
    </div>
  );
};

export default FabricsPage;
