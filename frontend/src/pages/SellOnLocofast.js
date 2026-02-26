import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  Target,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Building2,
  Zap,
  ShieldCheck,
  BarChart3
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SellOnLocofast = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    phone: "",
    email: "",
    categories: [],
    monthly_capacity: "",
    city: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = ["Denim", "Cotton Shirting", "Knits", "Blends"];

  const faqs = [
    {
      q: "What's the realistic conversion rate I should expect?",
      a: "Based on our data, suppliers who put in consistent effort see 10-15% conversion from routed leads. This isn't a magic platform — it's a structured system. Your conversion depends on your pricing, response time, and follow-up quality. We give you verified demand; you close the deal."
    },
    {
      q: "How does the payment structure work?",
      a: "Buyers pay directly to you. We don't hold funds or act as an escrow. The transaction happens between you and the buyer. We track and structure the process, but the commercial relationship is direct. Commission structures are discussed during onboarding based on category and volume."
    },
    {
      q: "What's the order flow from lead to dispatch?",
      a: "1) You receive a verified buyer requirement with specs and contact. 2) You call the buyer directly within 2 hours. 3) You negotiate pricing and terms. 4) Order confirmation happens on platform. 5) You produce and dispatch. 6) We track delivery and completion. Simple. No middlemen in between."
    },
    {
      q: "Who handles dispatch and logistics?",
      a: "You do. You're the supplier — dispatch is your responsibility. We can recommend logistics partners, but the delivery commitment is yours. Buyers expect professional dispatch with proper documentation. If you can't handle logistics, this isn't the right platform for you."
    },
    {
      q: "Is there a subscription fee or listing charge?",
      a: "No monthly subscriptions. No listing fees. No pay-to-play visibility boosting. We operate on a performance model. Details are shared during the onboarding call based on your category and capacity."
    },
    {
      q: "What if a buyer doesn't pay after dispatch?",
      a: "Payment terms are between you and the buyer. We recommend suppliers to take advance payments or work with buyers they've verified. We provide buyer verification data, but commercial risk management is your call. We're a sourcing engine, not a payment guarantor."
    }
  ];

  const handleCategoryToggle = (cat) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API call - replace with actual endpoint
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitted(true);
    setSubmitting(false);
  };

  // Schema markup for B2B marketplace
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Sell on Locofast - B2B Fabric Supplier Onboarding",
    "description": "Join India's structured fabric sourcing platform. Get verified buyer requirements for Denim, Cotton Shirting, and Knits. MOQ 1000+ meters. Apply now.",
    "url": "https://locofast.com/sell",
    "mainEntity": {
      "@type": "Organization",
      "name": "Locofast",
      "description": "B2B Fabric Sourcing Platform",
      "areaServed": "India",
      "serviceType": "B2B Fabric Marketplace"
    }
  };

  return (
    <>
      <Helmet>
        <title>Sell on Locofast | B2B Fabric Supplier Platform | Denim, Cotton, Knits</title>
        <meta 
          name="description" 
          content="Join India's structured fabric sourcing engine. Get verified buyer requirements routed to you. Denim, Cotton Shirting, Knits — MOQ 1000+ meters. No subscriptions. Performance-based. Apply now." 
        />
        <meta name="keywords" content="sell fabric online, b2b fabric marketplace, fabric supplier india, denim supplier, cotton shirting manufacturer, knit fabric seller, wholesale fabric platform" />
        <link rel="canonical" href="https://locofast.com/sell" />
        <meta property="og:title" content="Sell on Locofast | B2B Fabric Supplier Platform" />
        <meta property="og:description" content="Get verified buyer requirements for Denim, Cotton Shirting, and Knits. MOQ 1000+ meters. No subscriptions." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </Helmet>

      <Navbar />

      <main className="bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          
          <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-1.5 text-emerald-400 text-sm font-medium mb-6">
                <TrendingUp size={16} />
                Scaling B2B Fabric Sourcing in India
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Stop Chasing Random Inquiries.
                <span className="block text-emerald-400 mt-2">Start Closing Real Orders.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
                We route verified buyer requirements directly to you. 
                <span className="text-white font-medium"> You call. You negotiate. You close.</span>
                <br />No middlemen. No subscriptions. Just structured demand.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="#apply-form"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105"
                  data-testid="hero-cta-apply"
                >
                  Apply as Supplier
                  <ArrowRight size={20} />
                </a>
                <a 
                  href="https://wa.me/918920392418?text=Hi, I want to discuss supplier onboarding for Locofast"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all"
                  data-testid="hero-cta-talk"
                >
                  <Phone size={20} />
                  Talk to Onboarding Team
                </a>
              </div>
              
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  MOQ 1000+ meters only
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  Direct buyer contact
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  No listing fees
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                The B2B Fabric Selling Problem
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                If you're a serious manufacturer or trader, you've felt this pain.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <MessageSquare className="text-red-500" size={24} />,
                  title: "Random, Unqualified Inquiries",
                  desc: "80% of your inbox is price shoppers, students doing research, or tire-kickers asking for 50 meters."
                },
                {
                  icon: <Clock className="text-red-500" size={24} />,
                  title: "Massive Time Waste",
                  desc: "Hours spent on calls that go nowhere. Follow-ups ignored. Samples sent, never heard back."
                },
                {
                  icon: <Users className="text-red-500" size={24} />,
                  title: "Middleman Dependency",
                  desc: "Agents taking 5-10% cuts. No direct buyer relationships. Zero control over your pipeline."
                },
                {
                  icon: <BarChart3 className="text-red-500" size={24} />,
                  title: "No Structured Follow-up",
                  desc: "Leads fall through cracks. No system to track who's hot, who's cold, who needs a push."
                },
                {
                  icon: <Target className="text-red-500" size={24} />,
                  title: "Expensive Platforms",
                  desc: "₹50K+ yearly subscriptions for directories that send you the same garbage leads as everyone else."
                },
                {
                  icon: <XCircle className="text-red-500" size={24} />,
                  title: "Feast or Famine",
                  desc: "Some months flooded, some months dead. No predictability. No consistent demand flow."
                }
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Model Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                <Zap size={16} />
                How Locofast Works
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                A Sourcing Engine, Not a Directory
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                We don't list you and hope. We route verified demand and track outcomes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-emerald-100">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">What We Do</h3>
                <ul className="space-y-4">
                  {[
                    "Route verified buyer requirements with specs, quantity, and timeline",
                    "Share buyer contact directly — you call them, not the other way",
                    "Focus on MOQ 1000+ meters — serious bulk orders only",
                    "Track every interaction — calls, samples, negotiations",
                    "Provide conversion data so you know what's working"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="text-emerald-600 mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">What We Don't Do</h3>
                <ul className="space-y-4">
                  {[
                    "Promise guaranteed orders — nobody can",
                    "Take over your buyer relationships",
                    "Handle your production or dispatch",
                    "Guarantee payments — that's between you and buyer",
                    "Send you unverified, low-intent inquiries"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <XCircle className="text-slate-400 mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Conversion Reality */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="text-amber-600" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Real Talk on Conversion</h4>
                  <p className="text-slate-700">
                    Suppliers who work the system consistently see <strong>10-15% conversion rates</strong>. 
                    That means for every 10 verified requirements you get, 1-2 become orders. 
                    This isn't a lottery — it's sales. Your conversion depends on your pricing, speed, and follow-up quality. 
                    We give you at-bats. You hit the runs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who This Is For Section */}
        <section className="py-16 md:py-24 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Is This Platform For You?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* For */}
              <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-400">This IS For You If:</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "You're a manufacturer or trader doing 5000+ meters/month",
                    "You can handle MOQ of 1000 meters minimum",
                    "You have capacity in Denim, Cotton Shirting, Knits, or Blends",
                    "You're comfortable making 5-10 sales calls daily",
                    "You respond to requirements within 2 hours",
                    "You want direct buyer relationships, not middlemen"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="text-emerald-400 mt-0.5 flex-shrink-0" size={18} />
                      <span className="text-slate-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Not For */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <XCircle size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-red-400">This is NOT For You If:</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "You sell cut-pieces or retail quantities",
                    "You want to just list and wait for orders to come",
                    "You can't commit 30 minutes daily to sales calls",
                    "You expect guaranteed orders without effort",
                    "You're looking for a magic solution to fill your factory",
                    "You can't handle professional follow-up and documentation"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <XCircle className="text-red-400 mt-0.5 flex-shrink-0" size={18} />
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Expectations Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                What We Expect From Suppliers
              </h2>
              <p className="text-xl text-slate-600">
                We're building a network of serious players. Here's the commitment.
              </p>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  title: "30 Minutes Daily Talk Time (Minimum)",
                  desc: "Requirements come in throughout the day. You need to call buyers promptly. Delayed response = lost deal. We track call activity."
                },
                {
                  title: "2-Hour Response Window",
                  desc: "When you get a requirement, you call within 2 hours. Buyers have options. Speed wins. This is non-negotiable."
                },
                {
                  title: "Professional Follow-Up",
                  desc: "After first call, you follow up systematically. Send quotes on time. Update the platform. Close professionally."
                },
                {
                  title: "Accurate Pricing & Delivery Commitments",
                  desc: "Quote what you can deliver. Don't overpromise on timelines. Reputation is everything in B2B."
                },
                {
                  title: "No Guaranteed Orders — This is Sales",
                  desc: "We give you demand. You close it. Some months will be better than others. Consistency compounds."
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Categories We're Scaling
              </h2>
              <p className="text-xl text-slate-300">
                Focused categories. Verified demand. Bulk orders only.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Denim", desc: "Rigid, stretch, selvedge", moq: "1000m+", link: "/fabrics?category=denim" },
                { name: "Cotton Shirting", desc: "Oxford, poplin, twill", moq: "1000m+", link: "/fabrics?category=cotton-fabrics" },
                { name: "Knits", desc: "Single jersey, interlock, pique", moq: "1000m+", link: "/fabrics?category=knits" },
                { name: "Blends", desc: "PC, TC, CVC blends", moq: "1000m+", link: "/fabrics?category=blended-fabrics" }
              ].map((cat, i) => (
                <Link 
                  key={i}
                  to={cat.link}
                  className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-6 transition-all"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{cat.name}</h3>
                  <p className="text-slate-400 mb-4">{cat.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-400 font-medium">MOQ {cat.moq}</span>
                    <ArrowRight className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" size={18} />
                  </div>
                </Link>
              ))}
            </div>
            
            <p className="text-center text-slate-400 mt-8">
              More categories coming soon. If you have capacity in other fabrics, <a href="#apply-form" className="text-emerald-400 hover:underline">still apply</a>.
            </p>
          </div>
        </section>

        {/* Video Testimonials Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Supplier Stories
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Hear From Our Suppliers
              </h2>
              <p className="text-xl text-slate-600">
                Real suppliers. Real results. No scripts.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "From Random Calls to Real Orders",
                  videoUrl: `${process.env.REACT_APP_BACKEND_URL}/api/uploads/video_43a5cdc1-0c2c-459c-ba41-d2382aaf7084.mp4`,
                  supplier: "Textile Mill Owner",
                  location: "Ahmedabad",
                  hasVideo: true
                },
                {
                  title: "How I Closed 5 Orders in Month 1",
                  videoUrl: `${process.env.REACT_APP_BACKEND_URL}/api/uploads/video_3793a790-275c-4cbf-8b4c-1c7cbd76615b.mp4`,
                  supplier: "Denim Manufacturer",
                  location: "Surat",
                  hasVideo: true
                },
                {
                  title: "Direct Buyers Changed Everything",
                  videoUrl: `${process.env.REACT_APP_BACKEND_URL}/api/uploads/video_7d90f8a3-de34-4819-90d1-e046c70d6341.mp4`,
                  supplier: "Fabric Trader",
                  location: "Erode",
                  hasVideo: true
                }
              ].map((video, i) => (
                <div 
                  key={i}
                  className="group bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-video bg-slate-900">
                    {video.hasVideo ? (
                      <video 
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        poster=""
                      >
                        <source src={video.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <>
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                          <span className="text-slate-500 text-sm">Coming Soon</span>
                        </div>
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7 text-white/50 ml-1" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Building2 size={14} />
                      <span>{video.supplier}, {video.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-center text-slate-500 mt-8 text-sm">
              Want to share your story? <a href="https://wa.me/918920392418?text=I want to share my supplier experience" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Contact us</a>
            </p>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Suppliers Already Winning
              </h2>
              <p className="text-xl text-slate-600">
                Real results from suppliers who work the system.
              </p>
            </div>
            
            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-6 mb-12">
              {[
                { stat: "12%", label: "Avg. Conversion Rate", sub: "For active suppliers" },
                { stat: "45 min", label: "Avg. Daily Talk Time", sub: "Top performer average" },
                { stat: "₹8.5L", label: "Avg. Monthly GMV", sub: "Per active supplier" }
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                  <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">{item.stat}</div>
                  <div className="text-lg font-semibold text-slate-900">{item.label}</div>
                  <div className="text-sm text-slate-500">{item.sub}</div>
                </div>
              ))}
            </div>
            
            {/* Testimonials Placeholder */}
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  quote: "First month was slow — 2 orders from 18 leads. Third month, I cracked 7 orders. The system works if you work it. No BS.",
                  name: "Rajesh M.",
                  company: "Denim Manufacturer, Ahmedabad",
                  stat: "7 orders in Month 3"
                },
                {
                  quote: "I was skeptical about another platform. But direct buyer numbers changed everything. No agents eating my margins anymore.",
                  name: "Suresh K.",
                  company: "Cotton Shirting Trader, Erode",
                  stat: "15% conversion rate"
                }
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-slate-700 mb-6 italic">"{item.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-sm text-slate-500">{item.company}</div>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                      {item.stat}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-slate-600">
                Straight answers. No fluff.
              </p>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
                    {openFaq === i ? (
                      <ChevronUp className="text-slate-400 flex-shrink-0" size={20} />
                    ) : (
                      <ChevronDown className="text-slate-400 flex-shrink-0" size={20} />
                    )}
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6 bg-slate-50">
                      <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Application Form Section */}
        <section id="apply-form" className="py-16 md:py-24 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Serious Suppliers Win Here
              </h2>
              <p className="text-xl text-slate-300">
                If you're ready to put in the work, we're ready to route you demand.
              </p>
            </div>
            
            {submitted ? (
              <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-emerald-400 mb-4">Application Received</h3>
                <p className="text-slate-300 mb-6">
                  Our onboarding team will review your application and call you within 24-48 hours. 
                  Keep your phone handy.
                </p>
                <a 
                  href="https://wa.me/918920392418?text=Hi, I just submitted my supplier application on Locofast"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
                >
                  <Phone size={18} />
                  Or message us on WhatsApp for faster response
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                      placeholder="Your mill / trading company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contact_name}
                      onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                      placeholder="Decision maker name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                      placeholder="business@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City / Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                      placeholder="Ahmedabad, Surat, Erode, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Monthly Capacity (meters)
                    </label>
                    <select
                      value={formData.monthly_capacity}
                      onChange={(e) => setFormData({...formData, monthly_capacity: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 bg-white"
                    >
                      <option value="">Select capacity</option>
                      <option value="5000-10000">5,000 - 10,000 meters</option>
                      <option value="10000-25000">10,000 - 25,000 meters</option>
                      <option value="25000-50000">25,000 - 50,000 meters</option>
                      <option value="50000+">50,000+ meters</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Categories You Supply *
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryToggle(cat)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          formData.categories.includes(cat)
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-white border-slate-200 text-slate-700 hover:border-emerald-500"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
                  <p className="text-amber-800 text-sm">
                    <strong>By applying, you confirm:</strong> You can handle MOQ 1000+ meters, 
                    commit 30+ minutes daily to calls, and respond to requirements within 2 hours.
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={submitting || formData.categories.length === 0}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-emerald-600 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stop Waiting. Start Selling.
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Verified demand is being routed right now. Are you on the list?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="#apply-form"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-50 transition-all"
              >
                Apply Now
                <ArrowRight size={20} />
              </a>
              <a 
                href="https://wa.me/918920392418?text=Hi, I want to know more about selling on Locofast"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                <Phone size={20} />
                WhatsApp Us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SellOnLocofast;
