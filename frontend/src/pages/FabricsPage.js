import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, MessageSquare, Package, ShoppingCart, Clock, Info } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getFabrics, getFabricsCount, getCategories, createEnquiry } from "../lib/api";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 20;

const FabricsPage = () => {
  const navigate = useNavigate();
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
  const [availabilityFilter, setAvailabilityFilter] = useState(searchParams.get("availability") || "");
  const [gsmRange, setGsmRange] = useState({
    min: searchParams.get("min_gsm") || "",
    max: searchParams.get("max_gsm") || "",
  });

  // Modal states
  const [modalType, setModalType] = useState(null); // 'enquiry' | 'sample' | 'bulk'
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [sampleQty, setSampleQty] = useState(1);
  const [bulkQty, setBulkQty] = useState("");
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", company: "", message: ""
  });
  const [submitting, setSubmitting] = useState(false);

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
        if (availabilityFilter === "sample") params.sample_available = true;
        if (availabilityFilter === "bulk") params.bookable_only = true;
        if (availabilityFilter === "instant") params.instant_bookable = true;
        if (availabilityFilter === "enquiry") params.enquiry_only = true;

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
  }, [search, selectedCategory, selectedType, availabilityFilter, gsmRange, currentPage]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedType) params.set("type", selectedType);
    if (availabilityFilter) params.set("availability", availabilityFilter);
    if (gsmRange.min) params.set("min_gsm", gsmRange.min);
    if (gsmRange.max) params.set("max_gsm", gsmRange.max);
    if (currentPage > 1) params.set("page", currentPage.toString());
    setSearchParams(params, { replace: true });
  }, [search, selectedCategory, selectedType, availabilityFilter, gsmRange, currentPage, setSearchParams]);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedType("");
    setAvailabilityFilter("");
    setGsmRange({ min: "", max: "" });
    setCurrentPage(1);
  };

  const getAvailabilityBadge = (availability) => {
    const badges = {
      "Sample Available": "bg-blue-100 text-blue-700",
      "Bulk Available": "bg-green-100 text-green-700",
      "On Request": "bg-yellow-100 text-yellow-700",
    };
    return badges[availability] || "bg-gray-100 text-gray-700";
  };

  // Modal handlers - only used for enquiry now
  const openModal = (fabric, type) => {
    if (type === "sample" || type === "bulk") {
      // For sample/bulk orders, navigate to checkout
      const qty = type === "sample" ? 1 : 6; // Default quantities
      navigate(`/checkout?fabric_id=${fabric.id}&type=${type}&qty=${qty}`);
      return;
    }
    // For enquiry, show modal
    setSelectedFabric(fabric);
    setModalType(type);
    setSampleQty(1);
    setBulkQty("");
    setFormData({ name: "", email: "", phone: "", company: "", message: "" });
  };

  const closeModal = () => {
    setSelectedFabric(null);
    setModalType(null);
  };

  // Calculate bulk price based on tiers
  const calculateBulkPrice = (fabric, quantity) => {
    if (!quantity || quantity <= 0) return null;
    const qty = parseInt(quantity);
    const tiers = fabric.pricing_tiers || [];
    
    for (const tier of tiers) {
      if (qty >= tier.min_qty && qty <= tier.max_qty) {
        return { pricePerMeter: tier.price_per_meter, totalPrice: tier.price_per_meter * qty, tierLabel: `${tier.min_qty}-${tier.max_qty}m` };
      }
    }
    if (fabric.rate_per_meter) {
      return { pricePerMeter: fabric.rate_per_meter, totalPrice: fabric.rate_per_meter * qty, tierLabel: "Base rate" };
    }
    return null;
  };

  // Cart value calculation - only for enquiry modal now
  const cartValue = useMemo(() => {
    if (!selectedFabric) return null;
    
    if (modalType === "sample") {
      const samplePrice = selectedFabric.sample_price || selectedFabric.rate_per_meter || 0;
      return { pricePerMeter: samplePrice, quantity: sampleQty, totalPrice: samplePrice * sampleQty, label: "Sample" };
    } else if (modalType === "bulk") {
      return calculateBulkPrice(selectedFabric, bulkQty);
    }
    return null;
  }, [selectedFabric, modalType, sampleQty, bulkQty]);

  // Submit handler - only for enquiry now
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFabric) return;
    
    setSubmitting(true);
    try {
      let enquiryData = {
        fabric_id: selectedFabric.id,
        fabric_name: selectedFabric.name,
        ...formData,
      };

      enquiryData.enquiry_type = "general";
      enquiryData.message = formData.message || "General enquiry about this fabric";

      await createEnquiry(enquiryData);
      
      toast.success("Enquiry submitted! We'll get back to you soon.");
      closeModal();
    } catch (err) {
      toast.error("Failed to submit. Please try again.");
    }
    setSubmitting(false);
  };

  // Check what actions are available for a fabric
  const getAvailableActions = (fabric) => {
    const actions = {
      canEnquire: true, // Always available
      canBookSample: fabric.is_bookable && (fabric.sample_price > 0 || fabric.rate_per_meter > 0),
      canBookBulk: fabric.is_bookable && fabric.quantity_available > 0,
      samplePrice: fabric.sample_price || fabric.rate_per_meter,
      hasTiers: fabric.pricing_tiers && fabric.pricing_tiers.length > 0
    };
    return actions;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />
      <main className="flex-grow pt-20" data-testid="fabrics-page">
        <div className="container-main py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold mb-1">Fabric Catalog</h1>
              <p className="text-sm sm:text-base text-gray-500">
                {loading ? "Loading..." : `${totalCount} fabrics available`}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search fabrics by name, type, composition..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:border-[#2563EB] focus:outline-none text-sm sm:text-base"
                data-testid="fabrics-search"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                showFilters ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal size={18} />
              Filters
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="">All Types</option>
                    {fabricTypes.map((type) => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Availability</label>
                  <select
                    value={availabilityFilter}
                    onChange={(e) => { setAvailabilityFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#2563EB] focus:outline-none"
                    data-testid="availability-filter"
                  >
                    <option value="">All Fabrics</option>
                    <option value="instant">Instant Bookable (Sample/Bulk)</option>
                    <option value="sample">Samples Only</option>
                    <option value="bulk">Bulk In Stock</option>
                    <option value="enquiry">Enquiry Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GSM Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={gsmRange.min}
                      onChange={(e) => { setGsmRange({ ...gsmRange, min: e.target.value }); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#2563EB] focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={gsmRange.max}
                      onChange={(e) => { setGsmRange({ ...gsmRange, max: e.target.value }); setCurrentPage(1); }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fabrics Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 rounded mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : fabrics.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4">No fabrics found matching your criteria</p>
              <button onClick={clearFilters} className="btn-primary">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6" data-testid="fabrics-grid">
              {fabrics.map((fabric) => {
                const actions = getAvailableActions(fabric);
                return (
                  <div
                    key={fabric.id}
                    className="group bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                    data-testid={`fabric-card-${fabric.id}`}
                  >
                    <Link to={`/fabrics/${fabric.id}`} className="block">
                      <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
                        <img
                          src={fabric.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600"}
                          alt={fabric.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1">
                          {fabric.is_bookable && fabric.quantity_available > 0 && (
                            <span className="badge bg-emerald-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                              In Stock
                            </span>
                          )}
                          {actions.canBookSample && !actions.canBookBulk && (
                            <span className="badge bg-blue-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                              Samples
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    
                    <div className="p-3 sm:p-4">
                      <p className="text-[10px] sm:text-xs font-medium text-[#2563EB] mb-0.5 sm:mb-1 truncate">{fabric.category_name}</p>
                      <Link to={`/fabrics/${fabric.id}`}>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 group-hover:text-[#2563EB] transition-colors line-clamp-2">
                          {fabric.name}
                        </h3>
                      </Link>
                      {fabric.seller_company && (
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-2 truncate">by <span className="font-medium">{fabric.seller_company}</span></p>
                      )}
                      
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3">
                        {fabric.gsm > 0 && <span className="px-1 sm:px-1.5 py-0.5 bg-gray-100 rounded">{fabric.gsm} GSM</span>}
                        {fabric.weight_unit === 'ounce' && fabric.ounce && <span className="px-1 sm:px-1.5 py-0.5 bg-gray-100 rounded">{fabric.ounce} oz</span>}
                        {fabric.width && <span className="px-1 sm:px-1.5 py-0.5 bg-gray-100 rounded">{fabric.width}"</span>}
                      </div>

                      {/* Pricing info */}
                      {actions.canBookSample && (
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-2 sm:mb-3 pt-2 border-t border-gray-100">
                          <span className="text-gray-500">Sample</span>
                          <span className="font-semibold text-emerald-600">₹{actions.samplePrice?.toLocaleString()}/m</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        {actions.canBookBulk && (
                          <button
                            onClick={(e) => { e.preventDefault(); openModal(fabric, 'bulk'); }}
                            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs sm:text-sm font-medium transition-colors"
                            data-testid={`bulk-btn-${fabric.id}`}
                          >
                            <ShoppingCart size={12} className="sm:w-[14px] sm:h-[14px]" />
                            <span className="hidden sm:inline">Book Bulk Now</span>
                            <span className="sm:hidden">Bulk</span>
                          </button>
                        )}
                        {actions.canBookSample && (
                          <button
                            onClick={(e) => { e.preventDefault(); openModal(fabric, 'sample'); }}
                            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium transition-colors"
                            data-testid={`sample-btn-${fabric.id}`}
                          >
                            <Package size={12} className="sm:w-[14px] sm:h-[14px]" />
                            <span className="hidden sm:inline">Book Sample</span>
                            <span className="sm:hidden">Sample</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); openModal(fabric, 'enquiry'); }}
                          className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-xs sm:text-sm font-medium transition-colors"
                          data-testid={`enquiry-btn-${fabric.id}`}
                        >
                          <MessageSquare size={12} className="sm:w-[14px] sm:h-[14px]" />
                          <span className="hidden sm:inline">Send Enquiry</span>
                          <span className="sm:hidden">Enquiry</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-center gap-2 mt-12" data-testid="pagination">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, arr) => {
                    const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                    return (
                      <span key={page} className="flex items-center">
                        {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                        <button
                          onClick={() => goToPage(page)}
                          className={`min-w-[40px] h-10 px-3 border rounded font-medium transition-colors ${
                            currentPage === page ? "bg-[#2563EB] text-white border-[#2563EB]" : "border-gray-200 hover:bg-gray-50"
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
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Unified Modal */}
      {selectedFabric && modalType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold">Send Enquiry</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedFabric.name}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Fabric Summary */}
              <div className="bg-gray-50 rounded-lg p-4 flex gap-4">
                <img
                  src={selectedFabric.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=100"}
                  alt={selectedFabric.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{selectedFabric.name}</p>
                  <p className="text-sm text-gray-600">{selectedFabric.category_name}</p>
                  {selectedFabric.seller_company && (
                    <p className="text-xs text-gray-500">by {selectedFabric.seller_company}</p>
                  )}
                </div>
              </div>

              {/* Enquiry Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Message *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  placeholder="What would you like to know about this fabric?"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  data-testid="enquiry-message"
                />
              </div>

              {/* Contact Details */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Contact Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your Name *"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Company"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email *"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone *"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg font-medium disabled:opacity-50 bg-gray-900 text-white hover:bg-gray-800"
                  data-testid="submit-btn"
                >
                  {submitting ? "Submitting..." : "Send Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FabricsPage;
