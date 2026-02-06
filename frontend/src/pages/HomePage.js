import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Layers, Globe, Shield, Truck } from "lucide-react";
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

  const features = [
    { icon: Layers, title: "Curated Selection", desc: "Hand-picked fabrics from verified global suppliers" },
    { icon: Globe, title: "Global Sourcing", desc: "Access suppliers from India, China, Turkey & beyond" },
    { icon: Shield, title: "Quality Assured", desc: "Every fabric meets strict quality standards" },
    { icon: Truck, title: "Direct Supply", desc: "No middlemen, competitive pricing guaranteed" },
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
            <p className="subheading mb-4 animate-fadeIn">Global Fabric Sourcing Platform</p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-medium leading-[1.1] mb-6 animate-slideUp">
              Your direct path to global fabric sourcing
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed mb-10 animate-slideUp stagger-1">
              Discover premium fabrics from verified suppliers worldwide. Browse swatches, compare specs, and connect directly with manufacturers.
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

      {/* Features Section */}
      <section className="section-gap bg-white" data-testid="features-section">
        <div className="container-main">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 border border-neutral-100 hover:border-neutral-200 transition-colors">
                <feature.icon size={32} strokeWidth={1.5} className="text-neutral-900 mb-4" />
                <h3 className="text-lg font-serif font-medium mb-2">{feature.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{feature.desc}</p>
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
              <p className="subheading mb-3">Explore</p>
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
              <p className="subheading mb-3">Featured</p>
              <h2 className="text-4xl font-serif font-medium">Popular Fabrics</h2>
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
                  <span>{fabric.composition}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-neutral-900" data-testid="cta-section">
        <div className="container-main text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-medium text-white mb-6">
            Ready to source premium fabrics?
          </h2>
          <p className="text-neutral-400 text-lg mb-10 max-w-2xl mx-auto">
            Browse our curated collection of fabrics from verified global suppliers.
          </p>
          <Link to="/fabrics" className="bg-white text-neutral-900 px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-neutral-100 transition-colors inline-flex items-center gap-2" data-testid="cta-browse-btn">
            Start Browsing
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
