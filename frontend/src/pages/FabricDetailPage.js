import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ChevronLeft, ChevronRight, Send, X, ZoomIn, Package, Truck, FileCheck, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ExpandableText from "../components/ExpandableText";
import { getFabric, createEnquiry, getFabricSEO, getRelatedFabrics } from "../lib/api";

const FabricDetailPage = () => {
  const { id } = useParams();
  const [fabric, setFabric] = useState(null);
  const [seoContent, setSeoContent] = useState(null);
  const [relatedFabrics, setRelatedFabrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
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
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fabricRes, seoRes, relatedRes] = await Promise.all([
          getFabric(id),
          getFabricSEO(id).catch(() => ({ data: null })),
          getRelatedFabrics(id).catch(() => ({ data: [] }))
        ]);
        setFabric(fabricRes.data);
        setSeoContent(seoRes.data);
        setRelatedFabrics(relatedRes.data || []);
      } catch (err) {
        console.error("Error fetching fabric:", err);
        toast.error("Failed to load fabric details");
      }
      setLoading(false);
    };
    fetchData();
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

  // Generate schema markup
  const generateSchemaMarkup = () => {
    if (!fabric) return null;
    
    const schemas = [];
    
    // Breadcrumb Schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": window.location.origin
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Fabrics",
          "item": `${window.location.origin}/fabrics`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": fabric.category_name,
          "item": `${window.location.origin}/fabrics`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": fabric.name
        }
      ]
    };
    schemas.push(breadcrumbSchema);
    
    // Product Schema
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": fabric.name,
      "description": seoContent?.seo_intro || fabric.description,
      "category": fabric.category_name,
      "brand": {
        "@type": "Brand",
        "name": fabric.seller_company || "Locofast"
      }
    };
    
    if (fabric.images?.length > 0) {
      productSchema.image = fabric.images;
    }
    
    if (fabric.fabric_code) {
      productSchema.sku = fabric.fabric_code;
    }
    
    schemas.push(productSchema);
    
    // FAQ Schema
    if (seoContent?.seo_faq?.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": seoContent.seo_faq.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      };
      schemas.push(faqSchema);
    }
    
    return schemas;
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
  const schemaMarkup = generateSchemaMarkup();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{seoContent?.meta_title || `${fabric.name} | Locofast`}</title>
        <meta name="description" content={seoContent?.meta_description || fabric.description} />
        {seoContent?.canonical_url && (
          <link rel="canonical" href={`${window.location.origin}${seoContent.canonical_url}`} />
        )}
        {seoContent?.is_indexed === false && (
          <meta name="robots" content="noindex, nofollow" />
        )}
        {schemaMarkup && schemaMarkup.map((schema, idx) => (
          <script key={idx} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

      <Navbar />
      
      {/* Zoom Modal */}
      {showZoom && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowZoom(false)}
          data-testid="zoom-modal"
        >
          <button
            onClick={() => setShowZoom(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Close zoom"
          >
            <X size={24} />
          </button>
          
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImage(currentImage === 0 ? images.length - 1 : currentImage - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImage(currentImage === images.length - 1 ? 0 : currentImage + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          
          <img
            src={images[currentImage]}
            alt={fabric.name}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {currentImage + 1} / {images.length}
          </div>
        </div>
      )}

      <main className="flex-grow pt-20" data-testid="fabric-detail-page">
        {/* Breadcrumb */}
        <div className="border-b border-neutral-100 bg-white">
          <div className="container-main py-4">
            <nav className="flex items-center gap-2 text-sm text-neutral-500">
              <Link to="/" className="hover:text-neutral-900">Home</Link>
              <span>/</span>
              <Link to="/fabrics" className="hover:text-neutral-900">Fabrics</Link>
              <span>/</span>
              <span className="text-neutral-900">{fabric.name}</span>
            </nav>
          </div>
        </div>

        <div className="container-main py-12">
          {/* Top Section: H1 + Intro */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-semibold mb-4" data-testid="fabric-h1">
              {seoContent?.seo_h1 || fabric.name}
            </h1>
            {(seoContent?.seo_intro || fabric.description) && (
              <div className="max-w-4xl" data-testid="seo-intro">
                <ExpandableText 
                  text={seoContent?.seo_intro || fabric.description} 
                  maxLength={500}
                  maxLines={8}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Image Gallery */}
            <div className="space-y-4" data-testid="fabric-images">
              {/* Main Image */}
              <div 
                className="aspect-square overflow-hidden bg-neutral-100 relative cursor-zoom-in group"
                onClick={() => setShowZoom(true)}
              >
                <img
                  src={images[currentImage]}
                  alt={fabric.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  data-testid="main-image"
                />
                
                {/* Zoom indicator */}
                <div className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn size={18} className="text-gray-600" />
                </div>
                
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImage(currentImage === 0 ? images.length - 1 : currentImage - 1); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white flex items-center justify-center rounded-full shadow-soft transition-colors"
                      data-testid="prev-image-btn"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentImage(currentImage === images.length - 1 ? 0 : currentImage + 1); }}
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
                <div className="flex items-center gap-3 flex-wrap mb-4">
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
                {fabric.fabric_code && (
                  <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">{fabric.fabric_code}</span>
                )}
              </div>

              {/* Technical Specifications */}
              <div className="border-t border-gray-100 pt-6 mb-6" data-testid="fabric-specs">
                <h2 className="text-lg font-semibold mb-4">Technical Specifications</h2>
                <div className="grid grid-cols-2 gap-4">
                  {fabric.fabric_type && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-xs text-gray-400 mb-1">Fabric Type</p>
                      <p className="font-medium capitalize">{fabric.fabric_type}</p>
                    </div>
                  )}
                  {Array.isArray(fabric.composition) && fabric.composition.length > 0 && fabric.composition.some(c => c.material) && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-xs text-gray-400 mb-1">Composition</p>
                      <p className="font-medium">
                        {fabric.composition.filter(c => c.material && c.percentage > 0).map(c => `${c.percentage}% ${c.material}`).join(', ')}
                      </p>
                    </div>
                  )}
                  {((fabric.weight_unit === 'ounce' && fabric.ounce) || (fabric.weight_unit !== 'ounce' && fabric.gsm)) && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-xs text-gray-400 mb-1">
                        {fabric.weight_unit === 'ounce' ? 'Weight (Ounce)' : 'GSM'}
                      </p>
                      <p className="font-medium tech-data">
                        {fabric.weight_unit === 'ounce' ? fabric.ounce : fabric.gsm}
                      </p>
                    </div>
                  )}
                  {fabric.width && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-xs text-gray-400 mb-1">Width</p>
                      <p className="font-medium">{fabric.width}</p>
                    </div>
                  )}
                  {fabric.color && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-xs text-gray-400 mb-1">Color</p>
                      <p className="font-medium">{fabric.color}</p>
                    </div>
                  )}
                  {fabric.finish && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-xs text-gray-400 mb-1">Finish</p>
                      <p className="font-medium">{fabric.finish}</p>
                    </div>
                  )}
                  {fabric.moq && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-xs text-gray-400 mb-1">MOQ</p>
                      <p className="font-medium">{fabric.moq}</p>
                    </div>
                  )}
                  {fabric.starting_price && (
                    <div className="border-b border-gray-100 pb-3">
                      <p className="text-xs text-gray-400 mb-1">Starting Price</p>
                      <p className="font-medium text-[#2563EB]">{fabric.starting_price}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Description - Expandable for long text */}
              {fabric.description && (
                <div className="border-t border-gray-100 pt-6 mb-6" data-testid="fabric-description">
                  <h2 className="text-lg font-semibold mb-4">Product Description</h2>
                  <ExpandableText 
                    text={fabric.description} 
                    maxLength={250}
                  />
                </div>
              )}

              {/* CTA - Early position */}
              <div className="bg-[#2563EB] text-white p-6 rounded-lg mb-8">
                <p className="font-medium mb-2">Interested in this fabric?</p>
                <p className="text-sm text-blue-100 mb-4">Get pricing, samples, and availability information</p>
                <button
                  onClick={() => setShowEnquiryForm(true)}
                  className="bg-white text-[#2563EB] px-6 py-3 rounded font-medium hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
                  data-testid="enquiry-btn"
                >
                  <Send size={18} />
                  Raise Your Requirement
                </button>
              </div>
            </div>
          </div>

          {/* Applications / Use Cases */}
          {seoContent?.seo_applications?.length > 0 && (
            <div className="border-t border-gray-200 pt-12 mt-12" data-testid="seo-applications">
              <h2 className="text-2xl font-semibold mb-6">Applications & Use Cases</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {seoContent.seo_applications.map((app, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 p-4 rounded-lg text-center">
                    <p className="text-gray-700 font-medium">{app}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Order Details */}
          {seoContent?.seo_bulk_details && Object.keys(seoContent.seo_bulk_details).length > 0 && (
            <div className="border-t border-gray-200 pt-12 mt-12" data-testid="bulk-details">
              <h2 className="text-2xl font-semibold mb-6">Bulk Order Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-100 p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Package size={20} className="text-[#2563EB]" />
                    <p className="text-xs text-gray-400 uppercase tracking-wide">MOQ</p>
                  </div>
                  <p className="font-semibold text-gray-900">{seoContent.seo_bulk_details.moq}</p>
                </div>
                <div className="bg-white border border-gray-100 p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Truck size={20} className="text-[#2563EB]" />
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Lead Time</p>
                  </div>
                  <p className="font-semibold text-gray-900">{seoContent.seo_bulk_details.lead_time}</p>
                </div>
                <div className="bg-white border border-gray-100 p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <FileCheck size={20} className="text-[#2563EB]" />
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Sampling</p>
                  </div>
                  <p className="font-semibold text-gray-900">{seoContent.seo_bulk_details.sampling}</p>
                </div>
                <div className="bg-white border border-gray-100 p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin size={20} className="text-[#2563EB]" />
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Dispatch</p>
                  </div>
                  <p className="font-semibold text-gray-900">{seoContent.seo_bulk_details.dispatch_region}</p>
                </div>
              </div>
            </div>
          )}

          {/* Why This Fabric */}
          {seoContent?.seo_why_fabric?.length > 0 && (
            <div className="border-t border-gray-200 pt-12 mt-12" data-testid="why-fabric">
              <h2 className="text-2xl font-semibold mb-6">Why This Fabric</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {seoContent.seo_why_fabric.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white border border-gray-100 p-4 rounded-lg">
                    <CheckCircle2 size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How Ordering Works - Static Component */}
          <div className="border-t border-gray-200 pt-12 mt-12" data-testid="how-ordering-works">
            <h2 className="text-2xl font-semibold mb-6">How Ordering Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#2563EB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#2563EB] font-bold">1</span>
                </div>
                <h3 className="font-medium mb-2">Submit Requirement</h3>
                <p className="text-sm text-gray-500">Share your fabric needs and quantity requirements</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#2563EB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#2563EB] font-bold">2</span>
                </div>
                <h3 className="font-medium mb-2">Get Quote</h3>
                <p className="text-sm text-gray-500">Receive pricing and availability within 24 hours</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#2563EB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#2563EB] font-bold">3</span>
                </div>
                <h3 className="font-medium mb-2">Sample Review</h3>
                <p className="text-sm text-gray-500">Request samples to verify quality before bulk order</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#2563EB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#2563EB] font-bold">4</span>
                </div>
                <h3 className="font-medium mb-2">Place Order</h3>
                <p className="text-sm text-gray-500">Confirm order with secure payment and tracking</p>
              </div>
            </div>
          </div>

          {/* Related Fabrics */}
          {relatedFabrics.length > 0 && (
            <div className="border-t border-gray-200 pt-12 mt-12" data-testid="related-fabrics">
              <h2 className="text-2xl font-semibold mb-6">Related Fabrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {relatedFabrics.map((related) => (
                  <Link
                    key={related.id}
                    to={`/fabrics/${related.id}`}
                    className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:border-[#2563EB] transition-colors group"
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      {related.images?.[0] ? (
                        <img
                          src={related.images[0]}
                          alt={related.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm text-gray-900 truncate">{related.name}</p>
                      <p className="text-xs text-gray-500">
                        {related.gsm ? `${related.gsm} GSM` : related.ounce ? `${related.ounce} oz` : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Section */}
          {seoContent?.seo_faq?.length > 0 && (
            <div className="border-t border-gray-200 pt-12 mt-12" data-testid="faq-section">
              <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4 max-w-3xl">
                {seoContent.seo_faq.map((faq, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-lg p-5">
                    <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final CTA */}
          <div className="border-t border-gray-200 pt-12 mt-12 text-center" data-testid="final-cta">
            <h2 className="text-2xl font-semibold mb-4">Ready to Source This Fabric?</h2>
            <p className="text-gray-500 mb-6 max-w-xl mx-auto">
              Get in touch with our sourcing team for pricing, samples, and availability. We respond within 24 hours.
            </p>
            <button
              onClick={() => setShowEnquiryForm(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Send size={18} />
              Raise Your Requirement
            </button>
          </div>

          {/* Internal Links */}
          <div className="border-t border-gray-200 pt-8 mt-12">
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/fabrics" className="text-[#2563EB] hover:underline">← All Fabrics</Link>
              <Link to="/fabrics/" className="text-[#2563EB] hover:underline">Browse by Category</Link>
              <Link to="/assisted-sourcing" className="text-[#2563EB] hover:underline">Assisted Sourcing</Link>
            </div>
          </div>
        </div>

        {/* Enquiry Modal */}
        {showEnquiryForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" data-testid="enquiry-modal">
            <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 rounded-lg animate-slideUp">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Submit Enquiry</h2>
                  <p className="text-neutral-500">Regarding: {fabric.name}</p>
                </div>
                <button onClick={() => setShowEnquiryForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg"
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
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg"
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
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg"
                      data-testid="enquiry-phone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Company</label>
                    <input
                      type="text"
                      value={enquiryForm.company}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, company: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg"
                      data-testid="enquiry-company"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message *</label>
                  <textarea
                    value={enquiryForm.message}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg h-32 resize-none"
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
      <Footer />
    </div>
  );
};

export default FabricDetailPage;
