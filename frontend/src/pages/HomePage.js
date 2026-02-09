import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Package, Truck, FileCheck, Users } from "lucide-react";
import { getCategories, getFabrics } from "../lib/api";

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [featuredFabrics, setFeaturedFabrics] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, fabRes] = await Promise.all([
          getCategories(),
          getFabrics()
        ]);
        setCategories(catRes.data);
        setFeaturedFabrics(fabRes.data.slice(0, 4));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const howItWorks = [
    { icon: Package, title: "Browse Fabric Catalog", desc: "View fabric specifications including GSM, composition, width, and availability across multiple categories." },
    { icon: FileCheck, title: "Review Specifications", desc: "Access detailed product information. Each listing includes technical data and supplier details." },
    { icon: Users, title: "Submit Enquiry", desc: "Request information or samples directly. Our team connects you with the relevant supplier." },
    { icon: Truck, title: "Coordinate Delivery", desc: "Work with suppliers on sampling, pricing, and logistics. Locofast facilitates the process." },
  ];

  return (
    <main className="pt-20" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 bg-neutral-100">
          <img
            src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1920&q=80"
            alt="Fabric textures"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
        </div>
        
        <div className="container-main relative z-10">
          <div className="max-w-2xl">
            <p className="subheading mb-4">Fabric Sourcing Platform</p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-medium leading-[1.1] mb-6 animate-slideUp">
              Source fabrics directly from textile suppliers
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed mb-10 animate-slideUp stagger-1">
              Locofast connects buyers with fabric suppliers. Browse specifications, compare options, and submit enquiries through a single platform.
            </p>
            <div className="flex flex-wrap gap-4 animate-slideUp stagger-2">
              <Link to="/fabrics" className="btn-primary inline-flex items-center gap-2" data-testid="hero-browse-btn">
                Browse Fabrics
                <ArrowRight size={18} />
              </Link>
              <Link to="/how-it-works" className="btn-secondary" data-testid="hero-how-btn">
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-gap bg-white" data-testid="how-it-works-section">
        <div className="container-main">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="subheading mb-3">Process</p>
            <h2 className="text-4xl font-serif font-medium">How Locofast Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="p-6 border border-neutral-100 hover:border-neutral-200 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <step.icon size={24} strokeWidth={1.5} className="text-neutral-600" />
                </div>
                <h3 className="text-lg font-serif font-medium mb-2">{step.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-gap bg-neutral-50" data-testid="categories-section">
        <div className="container-main">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <p className="subheading mb-3">Catalog</p>
              <h2 className="text-4xl font-serif font-medium">Fabric Categories</h2>
            </div>
            <Link to="/fabrics" className="btn-ghost inline-flex items-center gap-2 mt-4 md:mt-0" data-testid="view-all-categories">
              View All
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                to={`/fabrics?category=${category.id}`}
                className="group relative aspect-[4/3] overflow-hidden bg-neutral-200"
                data-testid={`category-card-${category.id}`}
              >
                <img
                  src={category.image_url || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600"}
                  alt={category.name}
                  className="w-full h-full object-cover image-zoom"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-serif font-medium text-white mb-1">{category.name}</h3>
                  <p className="text-white/70 text-sm">{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Fabrics */}
      <section className="section-gap" data-testid="featured-fabrics-section">
        <div className="container-main">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <p className="subheading mb-3">Catalog</p>
              <h2 className="text-4xl font-serif font-medium">Available Fabrics</h2>
            </div>
            <Link to="/fabrics" className="btn-ghost inline-flex items-center gap-2 mt-4 md:mt-0" data-testid="view-all-fabrics">
              View All Fabrics
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {featuredFabrics.map((fabric) => (
              <Link
                key={fabric.id}
                to={`/fabrics/${fabric.id}`}
                className="group"
                data-testid={`fabric-card-${fabric.id}`}
              >
                <div className="aspect-[3/4] overflow-hidden bg-neutral-100 mb-4">
                  <img
                    src={fabric.images[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600"}
                    alt={fabric.name}
                    className="w-full h-full object-cover image-zoom"
                  />
                </div>
                <p className="subheading mb-1">{fabric.category_name}</p>
                <h3 className="font-serif text-lg font-medium mb-2 group-hover:text-neutral-600 transition-colors">
                  {fabric.name}
                </h3>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <span className="tech-data">{fabric.gsm} GSM</span>
                  <span>•</span>
                  <span>
                    {Array.isArray(fabric.composition) && fabric.composition.length > 0
                      ? fabric.composition.map(c => `${c.percentage}% ${c.material}`).join(', ')
                      : typeof fabric.composition === 'string' ? fabric.composition : '-'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#2563EB]" data-testid="cta-section">
        <div className="container-main text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6">
            Start sourcing fabrics
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Browse the catalog, review specifications, and submit enquiries for the fabrics you need.
          </p>
          <Link to="/fabrics" className="bg-white text-[#2563EB] px-10 py-4 text-sm font-medium hover:bg-blue-50 transition-colors inline-flex items-center gap-2 rounded" data-testid="cta-browse-btn">
            Browse Fabrics
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
