import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  ArrowRight, 
  Users, 
  Building2, 
  MapPin, 
  CheckCircle,
  Search,
  MessageSquare,
  Shield,
  Layers,
  TrendingUp,
  Globe,
  Clock,
  Phone,
  Star,
  ChevronDown,
  ChevronUp,
  Package,
  Zap,
  Target,
  Award
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const HomePage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  // Trust indicators
  const trustStats = [
    { icon: Users, value: "5000+", label: "Buyers" },
    { icon: Building2, value: "300+", label: "Suppliers" },
    { icon: MapPin, value: "50+", label: "Cities" },
  ];

  // Fabric categories
  const fabricCategories = [
    { name: "Denim Fabric", description: "Premium denim fabrics for jeans and apparel manufacturing.", image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=300&fit=crop" },
    { name: "Cotton Fabric", description: "High-quality cotton fabrics for garments and home textiles.", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop" },
    { name: "Polyester Knit", description: "Durable polyester knit fabrics for sportswear and activewear.", image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=300&fit=crop" },
    { name: "Greige Fabric", description: "Unfinished grey fabrics ready for dyeing and processing.", image: "https://images.unsplash.com/photo-1606513542745-97629752a13b?w=400&h=300&fit=crop" },
    { name: "Rayon Fabric", description: "Soft rayon fabrics for comfortable everyday wear.", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=300&fit=crop" },
    { name: "Viscose Fabric", description: "Smooth viscose fabrics with excellent drape.", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop" },
    { name: "Printed Fabric", description: "Vibrant printed fabrics for fashion and home decor.", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop" },
    { name: "Suiting Fabric", description: "Premium suiting fabrics for formal and corporate wear.", image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop" },
    { name: "Shirting Fabric", description: "Quality shirting fabrics for dress and casual shirts.", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=300&fit=crop" },
    { name: "Kurti Fabric", description: "Ethnic kurti fabrics for traditional Indian wear.", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=300&fit=crop" },
  ];

  // How it works steps
  const howItWorks = [
    { step: 1, title: "Register Your Business", description: "Sign up with your GST and business details", icon: Building2 },
    { step: 2, title: "List Your Fabrics", description: "Add photos, GSM, composition and MOQ", icon: Layers },
    { step: 3, title: "Receive Enquiries", description: "Get enquiries from buyers across India", icon: MessageSquare },
    { step: 4, title: "Close Orders", description: "Discuss pricing and complete the deal", icon: CheckCircle },
  ];

  // Supplier benefits
  const supplierBenefits = [
    { icon: Globe, title: "Access Buyers Across India", description: "Connect with garment manufacturers, brands, and traders nationwide" },
    { icon: MessageSquare, title: "Receive Inbound Enquiries", description: "Get quality leads from serious buyers looking for fabrics" },
    { icon: TrendingUp, title: "Expand Beyond Local Markets", description: "Grow your business without geographical limitations" },
    { icon: Layers, title: "Showcase Inventory Online", description: "Digital catalog to display your complete fabric range" },
    { icon: Users, title: "Build Long-term Relationships", description: "Connect with repeat buyers for consistent business" },
  ];

  // Buyer benefits
  const buyerBenefits = [
    { icon: Search, title: "Find Reliable Suppliers", description: "Access verified fabric suppliers from across India" },
    { icon: Target, title: "Compare Multiple Suppliers", description: "Get quotes from multiple suppliers to find the best deal" },
    { icon: Package, title: "Access Large Variety", description: "Browse thousands of fabric listings in one place" },
    { icon: Clock, title: "Save Sourcing Time", description: "Find the right fabric faster with smart search" },
    { icon: Phone, title: "Direct Communication", description: "Connect directly with suppliers without middlemen" },
  ];

  // Marketplace features
  const features = [
    { icon: Search, title: "Smart Fabric Search", description: "Search fabrics by GSM, composition, weave and application." },
    { icon: MessageSquare, title: "Direct Buyer Enquiries", description: "Buyers can contact suppliers directly through the platform." },
    { icon: Shield, title: "Verified Supplier Profiles", description: "All suppliers are verified businesses with GST registration." },
    { icon: Layers, title: "Digital Fabric Catalog", description: "Suppliers can showcase their complete inventory online." },
  ];

  // Featured fabrics
  const featuredFabrics = [
    { name: "Indigo Denim 12oz", gsm: "340 GSM", composition: "100% Cotton", location: "Ahmedabad", image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=300&h=200&fit=crop" },
    { name: "Cotton Cambric", gsm: "90 GSM", composition: "100% Cotton", location: "Surat", image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&h=200&fit=crop" },
    { name: "Polyester Interlock", gsm: "220 GSM", composition: "100% Polyester", location: "Ludhiana", image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&h=200&fit=crop" },
    { name: "Rayon Printed", gsm: "120 GSM", composition: "100% Rayon", location: "Mumbai", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=200&fit=crop" },
  ];

  // Featured suppliers
  const featuredSuppliers = [
    { name: "ABC Denim Mills", location: "Ahmedabad", specialty: "Premium stretch denim fabrics", rating: 4.8 },
    { name: "Surat Polyknit Traders", location: "Surat", specialty: "Polyester knit fabrics", rating: 4.7 },
    { name: "Krishna Textiles", location: "Mumbai", specialty: "Cotton shirting fabrics", rating: 4.9 },
    { name: "Rajesh Fabrics", location: "Delhi", specialty: "Suiting and formal fabrics", rating: 4.6 },
  ];

  // Comparison data
  const comparisonData = {
    traditional: [
      "Limited local suppliers",
      "Cold calling and manual outreach",
      "Paper catalogs and samples",
      "No transparency in pricing",
      "Slow communication",
    ],
    marketplace: [
      "Pan-India supplier network",
      "Instant digital enquiries",
      "Online catalogs with specs",
      "Compare multiple quotes",
      "Direct chat with suppliers",
    ],
  };

  // FAQ data
  const faqs = [
    { q: "Who can join the platform?", a: "Any fabric manufacturer, trader, or supplier with a valid GST registration can join as a supplier. Buyers include garment manufacturers, brands, exporters, and traders." },
    { q: "Is there a joining fee?", a: "Basic listing is free. We offer premium plans with enhanced visibility and features for suppliers who want to grow faster." },
    { q: "How do buyers contact suppliers?", a: "Buyers can send enquiries directly through the platform. Suppliers receive notifications and can respond with quotes and details." },
    { q: "Do you guarantee orders?", a: "We connect buyers and suppliers. The actual transaction and order fulfillment happens directly between the parties. We facilitate the connection, not the transaction." },
    { q: "How do suppliers receive enquiries?", a: "Suppliers receive enquiries via email and in their dashboard. They can respond, negotiate, and close deals through the platform." },
  ];

  // Stats
  const stats = [
    { value: "1000+", label: "Fabric Listings" },
    { value: "300+", label: "Verified Suppliers" },
    { value: "5000+", label: "Active Buyers" },
    { value: "50+", label: "Cities Covered" },
  ];

  return (
    <>
      <Helmet>
        <title>Fabric Marketplace India | Connect with Fabric Suppliers & Buyers | Locofast</title>
        <meta name="description" content="India's largest B2B fabric marketplace. Connect with verified fabric suppliers across India. Denim, cotton, polyester knit, and more. Join 5000+ buyers and 300+ suppliers." />
        <meta name="keywords" content="fabric marketplace India, fabric suppliers India, denim fabric suppliers, cotton fabric wholesalers, polyester knit fabric suppliers, B2B fabric platform" />
      </Helmet>

      <Navbar />

      <main className="pt-20">
        {/* ========== HERO SECTION ========== */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white py-20 lg:py-28 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          </div>
          
          <div className="container-main relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
                <Zap size={16} className="text-yellow-400" />
                <span className="text-sm font-medium">India's Fastest Growing Fabric Marketplace</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Grow Your Fabric Business<br />
                <span className="text-blue-200">Without Upfront Investment</span>
              </h1>

              {/* Subheading */}
              <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
                List your fabrics, showcase your inventory and start receiving enquiries from garment manufacturers, brands and traders across India.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  to="/suppliers"
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                  data-testid="hero-cta-primary"
                >
                  Join as Supplier
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/fabrics"
                  className="inline-flex items-center justify-center gap-2 bg-blue-500/30 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-500/40 transition-colors border border-white/20"
                  data-testid="hero-cta-secondary"
                >
                  Instant Booking
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center gap-8 pt-8 border-t border-white/20">
                {trustStats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <stat.icon size={22} className="text-blue-200" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-blue-200">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========== FABRIC CATEGORIES ========== */}
        <section className="py-20 bg-gray-50">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Explore Fabric Categories
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Browse fabrics by category. Find the perfect material for your manufacturing needs.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
              {fabricCategories.map((category, index) => (
                <Link
                  key={index}
                  to={`/fabrics?category=${encodeURIComponent(category.name)}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
                  data-testid={`category-${index}`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{category.description}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              <Link
                to="/fabrics"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
              >
                View All Fabrics
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ========== HOW IT WORKS ========== */}
        <section className="py-20 bg-white">
          <div className="container-main">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                How the Marketplace Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Join thousands of suppliers growing their business online
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((item, index) => (
                <div key={index} className="text-center relative">
                  {/* Connector line */}
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-blue-100" />
                  )}
                  
                  <div className="relative z-10">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <item.icon size={32} className="text-blue-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mx-auto" style={{ left: '50%', transform: 'translateX(20px)' }}>
                      {item.step}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Link
                to="/suppliers"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Listing Fabrics
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ========== WHY SUPPLIERS JOIN ========== */}
        <section className="py-20 bg-blue-600 text-white">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Why Suppliers Join the Platform
              </h2>
              <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                Grow your fabric business without geographical limitations
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {supplierBenefits.map((benefit, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon size={28} className="text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-blue-100">{benefit.description}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              <Link
                to="/suppliers"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Join as Supplier
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ========== WHY BUYERS USE ========== */}
        <section className="py-20 bg-gray-50">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Why Buyers Use the Marketplace
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Find the right fabric supplier faster
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {buyerBenefits.map((benefit, index) => (
                <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon size={28} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              <Link
                to="/fabrics"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Instant Booking
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ========== MARKETPLACE FEATURES ========== */}
        <section className="py-20 bg-white">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Marketplace Features
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Powerful tools to connect buyers and suppliers
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
                    <feature.icon size={24} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== FEATURED FABRICS ========== */}
        <section className="py-20 bg-gray-50">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Featured Fabrics
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Popular fabric listings from verified suppliers
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredFabrics.map((fabric, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
                  <div className="aspect-[3/2] overflow-hidden">
                    <img
                      src={fabric.image}
                      alt={fabric.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{fabric.name}</h3>
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p><span className="font-medium">GSM:</span> {fabric.gsm}</p>
                      <p><span className="font-medium">Composition:</span> {fabric.composition}</p>
                      <p className="flex items-center gap-1">
                        <MapPin size={14} />
                        {fabric.location}
                      </p>
                    </div>
                    <Link
                      to="/rfq"
                      className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Enquire Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              <Link
                to="/fabrics"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
              >
                View All Fabrics
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ========== FEATURED SUPPLIERS ========== */}
        <section className="py-20 bg-white">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Featured Suppliers
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Connect with verified fabric suppliers across India
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredSuppliers.map((supplier, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building2 size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin size={12} />
                        {supplier.location}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{supplier.specialty}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{supplier.rating}</span>
                    </div>
                    <Link
                      to="/rfq"
                      className="text-sm text-blue-600 font-medium hover:text-blue-700"
                    >
                      Contact Supplier
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== STATS SECTION ========== */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container-main">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index}>
                  <p className="text-4xl sm:text-5xl font-bold mb-2">{stat.value}</p>
                  <p className="text-blue-200">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== TESTIMONIALS ========== */}
        <section className="py-20 bg-gray-50">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Supplier Success Stories
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Hear from suppliers who grew their business with us
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "Within two months of joining the platform, we connected with multiple garment manufacturers across India. Our enquiries increased 3x."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Denim Supplier</p>
                    <p className="text-sm text-gray-500">Surat, Gujarat</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "The platform helped us reach buyers in cities we never thought of. We've established long-term relationships with 15+ new clients."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Knit Fabric Trader</p>
                    <p className="text-sm text-gray-500">Tirupur, Tamil Nadu</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "As a small manufacturer, getting visibility was always a challenge. Now buyers find us online and we focus on production."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Cotton Mills</p>
                    <p className="text-sm text-gray-500">Ahmedabad, Gujarat</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== COMPARISON SECTION ========== */}
        <section className="py-20 bg-white">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Traditional vs Marketplace Sourcing
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Why more suppliers and buyers are switching to digital
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Traditional */}
              <div className="bg-gray-100 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Traditional Sourcing</h3>
                <ul className="space-y-3">
                  {comparisonData.traditional.map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs">✕</span>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Marketplace */}
              <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4 text-lg flex items-center gap-2">
                  <Award size={20} className="text-blue-600" />
                  Locofast Marketplace
                </h3>
                <ul className="space-y-3">
                  {comparisonData.marketplace.map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <CheckCircle size={14} className="text-white" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ========== FAQ SECTION ========== */}
        <section className="py-20 bg-gray-50">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about the marketplace
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{faq.q}</span>
                    {openFaq === index ? (
                      <ChevronUp size={20} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-500" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== FINAL CTA ========== */}
        <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white">
          <div className="container-main text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Start Receiving Fabric Enquiries Today
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
              Join hundreds of suppliers expanding their business online. List your fabrics and connect with buyers across India.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/suppliers"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
              >
                Join the Marketplace
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/rfq"
                className="inline-flex items-center justify-center gap-2 bg-blue-500/30 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-500/40 transition-colors border border-white/20"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default HomePage;
