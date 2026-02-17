import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, MessageCircle, Calculator, Shield, Clock, Users, Sparkles } from "lucide-react";
import { getCategories, getFabrics } from "../lib/api";

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [featuredFabrics, setFeaturedFabrics] = useState([]);
  const [showGSMCalculator, setShowGSMCalculator] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, fabRes] = await Promise.all([
          getCategories(),
          getFabrics({ limit: 8 })
        ]);
        setCategories(catRes.data);
        setFeaturedFabrics(fabRes.data.slice(0, 8));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const whyDifferent = [
    {
      icon: Shield,
      title: "Verified & Invested Suppliers",
      desc: "Every supplier on our platform is screened and committed — not casually listed."
    },
    {
      icon: CheckCircle2,
      title: "Clear MOQ & Pricing",
      desc: "No last-minute surprises. Know exactly what you're getting into."
    },
    {
      icon: Clock,
      title: "Dispatch Transparency",
      desc: "Know where your fabric is coming from and when it will arrive."
    },
    {
      icon: Users,
      title: "Assisted Selection",
      desc: "Not sure which GSM or weave works? We help you find the perfect match."
    }
  ];

  const whatsappNumber = "918920392418"; // Locofast WhatsApp number

  return (
    <main className="pt-20" data-testid="home-page">
      {/* Hero Section - Premium Service Feel */}
      <section className="relative min-h-[85vh] flex items-center" data-testid="hero-section">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full filter blur-[120px]" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500 rounded-full filter blur-[150px]" />
          </div>
        </div>
        
        <div className="container-main relative z-10 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8">
              <Sparkles size={16} className="text-blue-400" />
              <span className="text-blue-200 text-sm font-medium">Trusted by 500+ brands across India</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.15] mb-6">
              Source the right fabric.
              <span className="block text-blue-400">Without the stress.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl">
              We help you source the right fabric, faster and from verified mills. 
              No marketplace chaos — just curated options matched to your needs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/fabrics" 
                className="bg-white text-slate-900 px-8 py-4 font-semibold hover:bg-slate-100 transition-all inline-flex items-center justify-center gap-2 rounded-lg shadow-lg shadow-white/10"
                data-testid="hero-explore-btn"
              >
                Explore Fabrics
                <ArrowRight size={18} />
              </Link>
              <Link 
                to="/assisted-sourcing" 
                className="bg-blue-600 text-white px-8 py-4 font-semibold hover:bg-blue-700 transition-all inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500"
                data-testid="hero-assisted-btn"
              >
                Get Assisted Sourcing
                <Users size={18} />
              </Link>
            </div>
          </div>
        </div>

        {/* GSM Calculator Link */}
        <button
          onClick={() => setShowGSMCalculator(true)}
          className="absolute top-24 right-6 md:right-10 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20 transition-colors rounded-lg text-sm"
          data-testid="gsm-calculator-btn"
        >
          <Calculator size={16} />
          GSM Calculator
        </button>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 bg-white" data-testid="why-different-section">
        <div className="container-main">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-3">What Makes Us Different</p>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-4">
              Not a marketplace.<br />
              <span className="text-blue-600">A curated sourcing network.</span>
            </h2>
            <p className="text-slate-600 text-lg">
              We're not here to list thousands of options and leave you confused. 
              We're here to match you with exactly what you need.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyDifferent.map((item, index) => (
              <div 
                key={index} 
                className="p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <item.icon size={24} className="text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-slate-50" data-testid="categories-section">
        <div className="container-main">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-2">Browse by Category</p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">Fabric Categories</h2>
            </div>
            <Link to="/fabrics" className="text-blue-600 font-semibold inline-flex items-center gap-2 mt-4 md:mt-0 hover:gap-3 transition-all" data-testid="view-all-categories">
              View All Categories
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                to={`/fabrics?category=${category.id}`}
                className="group relative aspect-square overflow-hidden rounded-xl bg-slate-200"
                data-testid={`category-card-${category.id}`}
              >
                <img
                  src={category.image_url || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400"}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-sm sm:text-base">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Fabrics */}
      <section className="py-20 bg-white" data-testid="featured-fabrics-section">
        <div className="container-main">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-2">Curated Selection</p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">Featured Fabrics</h2>
            </div>
            <Link to="/fabrics" className="text-blue-600 font-semibold inline-flex items-center gap-2 mt-4 md:mt-0 hover:gap-3 transition-all" data-testid="view-all-fabrics">
              Explore All Fabrics
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredFabrics.map((fabric) => (
              <Link
                key={fabric.id}
                to={`/fabrics/${fabric.id}`}
                className="group"
                data-testid={`fabric-card-${fabric.id}`}
              >
                <div className="aspect-square overflow-hidden bg-slate-100 mb-3 rounded-lg">
                  <img
                    src={fabric.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400"}
                    alt={fabric.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">{fabric.category_name}</p>
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {fabric.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {fabric.gsm > 0 && <span>{fabric.gsm} GSM</span>}
                  {fabric.weight_unit === 'ounce' && fabric.ounce && <span>{fabric.ounce} oz</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Assisted Sourcing */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700" data-testid="cta-section">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">
                Not sure what you need?<br />
                Let us help you find it.
              </h2>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                Fill out a quick sourcing brief and our fabric experts will curate the best options for you. 
                No endless scrolling — just matched recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/assisted-sourcing" 
                  className="bg-white text-blue-600 px-8 py-4 font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center gap-2 rounded-lg"
                  data-testid="cta-assisted-btn"
                >
                  Get Assisted Sourcing
                  <ArrowRight size={18} />
                </Link>
                <a 
                  href={`https://wa.me/${whatsappNumber}?text=Hi, I need help sourcing fabric.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-8 py-4 font-semibold hover:bg-green-600 transition-colors inline-flex items-center justify-center gap-2 rounded-lg"
                  data-testid="cta-whatsapp-btn"
                >
                  <MessageCircle size={18} />
                  Chat on WhatsApp
                </a>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-white font-semibold text-xl mb-6">What our experts help with:</h3>
                <ul className="space-y-4">
                  {[
                    "Finding the right GSM and weave for your product",
                    "Matching fabric to your budget and MOQ",
                    "Connecting you with verified suppliers",
                    "Sample coordination and quality checks"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-blue-100">
                      <CheckCircle2 size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=Hi, I need help sourcing fabric.`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors hover:scale-110 transform"
        data-testid="whatsapp-float-btn"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={28} fill="currentColor" />
      </a>

      {/* GSM Calculator Modal */}
      {showGSMCalculator && (
        <GSMCalculatorModal onClose={() => setShowGSMCalculator(false)} />
      )}
    </main>
  );
};

// GSM Calculator Modal Component
const GSMCalculatorModal = ({ onClose }) => {
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [gsm, setGsm] = useState(null);

  const calculateGSM = () => {
    if (weight && length && width) {
      const w = parseFloat(weight);
      const l = parseFloat(length);
      const wd = parseFloat(width);
      if (w > 0 && l > 0 && wd > 0) {
        // GSM = (Weight in grams / (Length in meters × Width in meters)) 
        // If width is in inches, convert to meters (1 inch = 0.0254 meters)
        const widthInMeters = wd * 0.0254;
        const lengthInMeters = l;
        const area = lengthInMeters * widthInMeters;
        const calculatedGSM = Math.round(w / area);
        setGsm(calculatedGSM);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()} data-testid="gsm-calculator-modal">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">GSM Calculator</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fabric Weight (grams)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 150"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fabric Length (meters)</label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fabric Width (inches)</label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 58"
            />
          </div>
          
          <button
            onClick={calculateGSM}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Calculate GSM
          </button>
          
          {gsm !== null && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-green-600 mb-1">Calculated GSM</p>
              <p className="text-3xl font-bold text-green-700">{gsm} GSM</p>
            </div>
          )}
        </div>
        
        <p className="text-xs text-slate-500 mt-4">
          Formula: GSM = Weight (g) / (Length (m) × Width (m))
        </p>
      </div>
    </div>
  );
};

export default HomePage;
