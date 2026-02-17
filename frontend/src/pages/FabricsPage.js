import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getFabrics, getFabricsCount, getCategories } from "../lib/api";

const ITEMS_PER_PAGE = 20;

const FabricsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [fabrics, setFabrics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page")) || 1);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "");
  const [gsmRange, setGsmRange] = useState({
    min: searchParams.get("min_gsm") || "",
    max: searchParams.get("max_gsm") || "",
  });

  const fabricTypes = ["woven", "knitted", "non-woven"];
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchFabrics = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: ITEMS_PER_PAGE
        };
        if (search) params.search = search;
        if (selectedCategory) params.category_id = selectedCategory;
        if (selectedType) params.fabric_type = selectedType;
        if (gsmRange.min) params.min_gsm = gsmRange.min;
        if (gsmRange.max) params.max_gsm = gsmRange.max;

        const [fabricsRes, countRes] = await Promise.all([
          getFabrics(params),
          getFabricsCount(params)
        ]);
        setFabrics(fabricsRes.data);
        setTotalCount(countRes.data.count);
      } catch (err) {
        console.error("Error fetching fabrics:", err);
      }
      setLoading(false);
    };

    const timeout = setTimeout(fetchFabrics, 300);
    return () => clearTimeout(timeout);
  }, [search, selectedCategory, selectedType, gsmRange, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedType, gsmRange.min, gsmRange.max]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedType("");
    setGsmRange({ min: "", max: "" });
    setCurrentPage(1);
    setSearchParams({});
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          {totalCount} fabric{totalCount !== 1 ? "s" : ""} found
          {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
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

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mt-12" data-testid="pagination">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and pages around current
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, idx, arr) => {
                  // Add ellipsis if there's a gap
                  const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                  return (
                    <span key={page} className="flex items-center">
                      {showEllipsisBefore && <span className="px-2 text-gray-400">...</span>}
                      <button
                        onClick={() => goToPage(page)}
                        className={`min-w-[40px] h-10 px-3 border rounded font-medium transition-colors ${
                          currentPage === page
                            ? "bg-[#2563EB] text-white border-[#2563EB]"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </main>
    <Footer />
    </div>
  );
};

export default FabricsPage;
