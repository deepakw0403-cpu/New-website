import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";
import { getFabric, createEnquiry } from "../lib/api";

const FabricDetailPage = () => {
  const { id } = useParams();
  const [fabric, setFabric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFabric = async () => {
      setLoading(true);
      try {
        const res = await getFabric(id);
        setFabric(res.data);
      } catch (err) {
        console.error("Error fetching fabric:", err);
        toast.error("Failed to load fabric details");
      }
      setLoading(false);
    };
    fetchFabric();
  }, [id]);

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!enquiryForm.name || !enquiryForm.email || !enquiryForm.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await createEnquiry({
        ...enquiryForm,
        fabric_id: fabric.id,
        fabric_name: fabric.name,
      });
      toast.success("Enquiry submitted. Our team will respond within 24 hours.");
      setShowEnquiryForm(false);
      setEnquiryForm({ name: "", email: "", phone: "", company: "", message: "" });
    } catch (err) {
      toast.error("Failed to submit enquiry. Please try again.");
    }
    setSubmitting(false);
  };

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

  if (loading) {
    return (
      <main className="pt-20 min-h-screen" data-testid="fabric-detail-loading">
        <div className="container-main py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 w-1/4 rounded" />
              <div className="h-10 bg-gray-200 w-3/4 rounded" />
              <div className="h-4 bg-gray-200 w-full rounded" />
              <div className="h-4 bg-gray-200 w-2/3 rounded" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!fabric) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center" data-testid="fabric-not-found">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-medium mb-4">Fabric not found</h1>
          <Link to="/fabrics" className="btn-primary">Back to Catalog</Link>
        </div>
      </main>
    );
  }

  const images = fabric.images.length > 0 ? fabric.images : ["https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800"];

  return (
    <main className="pt-20 min-h-screen" data-testid="fabric-detail-page">
      {/* Breadcrumb */}
      <div className="border-b border-neutral-100">
        <div className="container-main py-4">
          <Link to="/fabrics" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors" data-testid="back-to-catalog">
            <ArrowLeft size={16} />
            Back to Catalog
          </Link>
        </div>
      </div>

      <div className="container-main py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4" data-testid="fabric-images">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden bg-neutral-100 relative">
              <img
                src={images[currentImage]}
                alt={fabric.name}
                className="w-full h-full object-cover"
                data-testid="main-image"
              />
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage(currentImage === 0 ? images.length - 1 : currentImage - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white flex items-center justify-center rounded-full shadow-soft transition-colors"
                    data-testid="prev-image-btn"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImage(currentImage === images.length - 1 ? 0 : currentImage + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white flex items-center justify-center rounded-full shadow-soft transition-colors"
                    data-testid="next-image-btn"
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3" data-testid="image-thumbnails">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`w-20 h-20 overflow-hidden border-2 transition-colors ${
                      currentImage === idx ? "border-neutral-900" : "border-transparent hover:border-neutral-300"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div data-testid="fabric-details">
            <div className="mb-6">
              <p className="subheading mb-2">{fabric.category_name}</p>
              <h1 className="text-4xl font-semibold mb-4">{fabric.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                {(Array.isArray(fabric.availability) ? fabric.availability : []).map((avail, idx) => (
                  <span key={idx} className={`badge ${getAvailabilityBadge(avail)}`}>
                    {avail}
                  </span>
                ))}
                {fabric.seller_company && (
                  <span className="text-sm text-gray-500">
                    by <span className="font-medium text-gray-700">{fabric.seller_company}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Seller Info */}
            {fabric.seller_company && (
              <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-100" data-testid="seller-info">
                <p className="text-xs text-gray-500 mb-1">Supplied by</p>
                <p className="font-medium text-gray-900">{fabric.seller_company}</p>
                {fabric.seller_name && (
                  <p className="text-sm text-gray-600">Contact: {fabric.seller_name}</p>
                )}
              </div>
            )}

            <p className="text-gray-600 leading-relaxed mb-8" data-testid="fabric-description">
              {fabric.description}
            </p>

            {/* Specifications */}
            <div className="border-t border-gray-100 pt-8 mb-8" data-testid="fabric-specs">
              <h3 className="subheading mb-6">Technical Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-xs text-gray-400 mb-1">Fabric Type</p>
                  <p className="font-medium capitalize">{fabric.fabric_type}</p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-xs text-gray-400 mb-1">Composition</p>
                  <p className="font-medium">{fabric.composition}</p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-xs text-gray-400 mb-1">GSM</p>
                  <p className="font-medium tech-data">{fabric.gsm}</p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-xs text-gray-400 mb-1">Width</p>
                  <p className="font-medium">{fabric.width}</p>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-xs text-gray-400 mb-1">Color</p>
                  <p className="font-medium">{fabric.color}</p>
                </div>
                {fabric.finish && (
                  <div className="border-b border-gray-100 pb-3">
                    <p className="text-xs text-gray-400 mb-1">Finish</p>
                    <p className="font-medium">{fabric.finish}</p>
                  </div>
                )}
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-xs text-gray-400 mb-1">MOQ</p>
                  <p className="font-medium">{fabric.moq}</p>
                </div>
                {fabric.price_range && (
                  <div className="border-b border-gray-100 pb-3">
                    <p className="text-xs text-gray-400 mb-1">Price Range</p>
                    <p className="font-medium">{fabric.price_range}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {fabric.tags && fabric.tags.length > 0 && (
              <div className="mb-8" data-testid="fabric-tags">
                <h3 className="subheading mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {fabric.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-neutral-100 text-neutral-600 text-sm rounded-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="border-t border-neutral-100 pt-8">
              <button
                onClick={() => setShowEnquiryForm(true)}
                className="btn-primary w-full md:w-auto inline-flex items-center justify-center gap-2"
                data-testid="enquiry-btn"
              >
                <Send size={18} />
                Request Information
              </button>
              <p className="text-sm text-neutral-500 mt-3">Our team will respond within 24 hours.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      {showEnquiryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" data-testid="enquiry-modal">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 animate-slideUp">
            <h2 className="text-2xl font-serif font-medium mb-2">Submit Enquiry</h2>
            <p className="text-neutral-500 mb-6">Regarding: {fabric.name}</p>

            <form onSubmit={handleEnquirySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  value={enquiryForm.name}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-sm"
                  required
                  data-testid="enquiry-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={enquiryForm.email}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-sm"
                  required
                  data-testid="enquiry-email"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={enquiryForm.phone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-sm"
                    data-testid="enquiry-phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <input
                    type="text"
                    value={enquiryForm.company}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, company: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-sm"
                    data-testid="enquiry-company"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <textarea
                  value={enquiryForm.message}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-sm h-32 resize-none"
                  placeholder="Describe your requirements: quantity needed, delivery timeline, specific questions."
                  required
                  data-testid="enquiry-message"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEnquiryForm(false)}
                  className="btn-secondary flex-1"
                  data-testid="cancel-enquiry-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 disabled:opacity-50"
                  data-testid="submit-enquiry-btn"
                >
                  {submitting ? "Submitting..." : "Submit Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default FabricDetailPage;
