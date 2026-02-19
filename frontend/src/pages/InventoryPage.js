import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Package, ShoppingCart, Clock, ArrowLeft, Filter, ChevronDown, Check } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getFabrics, getFabricsCount, getCategories, createEnquiry } from "../lib/api";
import { toast } from "sonner";

const InventoryPage = () => {
  const [fabrics, setFabrics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("price_low");
  const [enquiryModal, setEnquiryModal] = useState(null);
  const [enquiryForm, setEnquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    quantity: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchBookableFabrics = async () => {
      setLoading(true);
      try {
        const params = {
          bookable_only: true,
          limit: 100
        };
        if (search) params.search = search;
        if (selectedCategory) params.category_id = selectedCategory;

        const [fabricsRes, countRes] = await Promise.all([
          getFabrics(params),
          getFabricsCount(params)
        ]);
        
        let sortedFabrics = [...fabricsRes.data];
        
        // Sort fabrics
        if (sortBy === "price_low") {
          sortedFabrics.sort((a, b) => (a.rate_per_meter || 0) - (b.rate_per_meter || 0));
        } else if (sortBy === "price_high") {
          sortedFabrics.sort((a, b) => (b.rate_per_meter || 0) - (a.rate_per_meter || 0));
        } else if (sortBy === "stock_high") {
          sortedFabrics.sort((a, b) => (b.quantity_available || 0) - (a.quantity_available || 0));
        } else if (sortBy === "newest") {
          sortedFabrics.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        
        setFabrics(sortedFabrics);
        setTotalCount(countRes.data.count);
      } catch (err) {
        console.error("Error fetching inventory:", err);
        toast.error("Failed to load inventory");
      }
      setLoading(false);
    };

    const timeout = setTimeout(fetchBookableFabrics, 300);
    return () => clearTimeout(timeout);
  }, [search, selectedCategory, sortBy]);

  const handleEnquiry = async (e) => {
    e.preventDefault();
    if (!enquiryModal) return;
    
    setSubmitting(true);
    try {
      await createEnquiry({
        fabric_id: enquiryModal.id,
        fabric_name: enquiryModal.name,
        ...enquiryForm,
        enquiry_type: "order",
        quantity_required: enquiryForm.quantity
      });
      toast.success("Order enquiry submitted! We'll contact you shortly.");
      setEnquiryModal(null);
      setEnquiryForm({ name: "", email: "", phone: "", company: "", quantity: "", message: "" });
    } catch (err) {
      toast.error("Failed to submit enquiry. Please try again.");
    }
    setSubmitting(false);
  };

  const formatComposition = (composition) => {
    if (!Array.isArray(composition) || composition.length === 0) return null;
    return composition
      .filter(c => c.material && c.percentage > 0)
      .map(c => `${c.percentage}% ${c.material}`)
      .join(', ');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />
      <main className="flex-grow pt-20" data-testid="inventory-page">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white py-16">
          <div className="container-main">
            <Link to="/" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-4 text-sm">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/10 rounded-lg">
                <Package size={28} />
              </div>
              <div>
                <p className="text-emerald-100 text-sm font-medium">Ready to Order</p>
                <h1 className="text-3xl md:text-4xl font-semibold">Bookable Inventory</h1>
              </div>
            </div>
            <p className="text-emerald-100 max-w-2xl">
              Browse fabrics available for immediate ordering. All items listed here have confirmed stock, 
              fixed pricing, and defined dispatch timelines.
            </p>
            <div className="flex items-center gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <Check size={18} className="text-emerald-300" />
                <span>Confirmed Stock</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={18} className="text-emerald-300" />
                <span>Fixed Pricing</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={18} className="text-emerald-300" />
                <span>Fast Dispatch</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container-main py-8">
          {/* Filters Bar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  data-testid="inventory-search"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none bg-white min-w-[160px]"
                data-testid="inventory-category-filter"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none bg-white min-w-[160px]"
                data-testid="inventory-sort"
              >
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="stock_high">Stock: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{totalCount}</span> items available for order
              </p>
              {(search || selectedCategory) && (
                <button
                  onClick={() => { setSearch(""); setSelectedCategory(""); }}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Inventory Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-10 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : fabrics.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookable inventory found</h3>
              <p className="text-gray-500 mb-6">
                {search || selectedCategory 
                  ? "Try adjusting your filters to find available inventory."
                  : "Check back soon for new stock arrivals."}
              </p>
              <Link to="/fabrics" className="btn-primary inline-block">
                Browse All Fabrics
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="inventory-grid">
              {fabrics.map((fabric) => (
                <div 
                  key={fabric.id} 
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                  data-testid={`inventory-item-${fabric.id}`}
                >
                  {/* Image */}
                  <Link to={`/fabrics/${fabric.id}`} className="block aspect-[4/3] overflow-hidden relative">
                    <img
                      src={fabric.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600"}
                      alt={fabric.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                        In Stock
                      </span>
                    </div>
                    {fabric.quantity_available > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur text-gray-700 text-xs font-medium rounded-full">
                          {fabric.quantity_available.toLocaleString()} {fabric.weight_unit === 'ounce' ? 'yds' : 'm'} available
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="p-5">
                    <p className="text-xs font-medium text-emerald-600 mb-1">{fabric.category_name}</p>
                    <Link to={`/fabrics/${fabric.id}`}>
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {fabric.name}
                      </h3>
                    </Link>

                    {/* Specs */}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                      {fabric.gsm > 0 && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded">{fabric.gsm} GSM</span>
                      )}
                      {fabric.weight_unit === 'ounce' && fabric.ounce && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded">{fabric.ounce} oz</span>
                      )}
                      {fabric.width && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded">{fabric.width}" width</span>
                      )}
                    </div>

                    {/* Composition */}
                    {formatComposition(fabric.composition) && (
                      <p className="text-sm text-gray-600 mb-3">{formatComposition(fabric.composition)}</p>
                    )}

                    {/* Price & Dispatch */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-400">Price</p>
                        <p className="text-lg font-bold text-emerald-600">
                          ₹{fabric.rate_per_meter?.toLocaleString() || "—"}<span className="text-sm font-normal text-gray-500">/m</span>
                        </p>
                      </div>
                      {fabric.dispatch_timeline && (
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Dispatch</p>
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <Clock size={14} />
                            <span>{fabric.dispatch_timeline} days</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MOQ */}
                    {fabric.moq && (
                      <p className="text-xs text-gray-500 mt-2">MOQ: {fabric.moq}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setEnquiryModal(fabric)}
                        className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5"
                        data-testid={`order-btn-${fabric.id}`}
                      >
                        <ShoppingCart size={16} />
                        Place Order
                      </button>
                      <Link
                        to={`/fabrics/${fabric.id}`}
                        className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* No inventory CTA */}
        {!loading && fabrics.length > 0 && (
          <div className="bg-emerald-50 border-y border-emerald-100 py-12 mt-8">
            <div className="container-main text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Can't find what you're looking for?</h2>
              <p className="text-gray-600 mb-6">Browse our full catalog or submit a custom sourcing request.</p>
              <div className="flex items-center justify-center gap-4">
                <Link to="/fabrics" className="btn-secondary">
                  Browse Full Catalog
                </Link>
                <Link to="/assisted-sourcing" className="btn-primary">
                  Request Custom Sourcing
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />

      {/* Order Enquiry Modal */}
      {enquiryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEnquiryModal(null)}>
          <div 
            className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold">Place Order Enquiry</h2>
              <p className="text-sm text-gray-500 mt-1">{enquiryModal.name}</p>
            </div>

            <form onSubmit={handleEnquiry} className="p-6 space-y-4">
              {/* Fabric Summary */}
              <div className="bg-emerald-50 rounded-lg p-4 flex gap-4">
                <img
                  src={enquiryModal.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=100"}
                  alt={enquiryModal.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{enquiryModal.name}</p>
                  <p className="text-sm text-gray-600">{enquiryModal.category_name}</p>
                  <p className="text-emerald-600 font-semibold mt-1">₹{enquiryModal.rate_per_meter?.toLocaleString()}/m</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    data-testid="enquiry-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={enquiryForm.company}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    data-testid="enquiry-company"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={enquiryForm.email}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    data-testid="enquiry-email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={enquiryForm.phone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    data-testid="enquiry-phone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Required * <span className="text-gray-400 font-normal">(e.g., 500 meters)</span>
                </label>
                <input
                  type="text"
                  required
                  value={enquiryForm.quantity}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, quantity: e.target.value })}
                  placeholder="Enter quantity with unit"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  data-testid="enquiry-quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={enquiryForm.message}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                  rows={3}
                  placeholder="Any specific requirements or questions..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
                  data-testid="enquiry-message"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEnquiryModal(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary py-2.5 disabled:opacity-50"
                  data-testid="submit-enquiry-btn"
                >
                  {submitting ? "Submitting..." : "Submit Order Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
