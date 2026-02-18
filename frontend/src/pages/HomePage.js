import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, MessageCircle, Shield, Clock, Users, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCollections } from "../lib/api";

const HomePage = () => {
  const [collections, setCollections] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await getCollections();
      setCollections(res.data.slice(0, 4));
    } catch (err) {
      console.error("Failed to fetch collections");
    }
  };

  const valueProps = [
    {
      icon: Shield,
      title: "Verified Network of Suppliers",
      description: "Every supplier in our network goes through quality checks and verification before onboarding."
    },
    {
      icon: CheckCircle,
      title: "Transparent MOQ & Pricing",
      description: "No hidden costs. Clear minimum order quantities and pricing shared upfront."
    },
    {
      icon: Clock,
      title: "Fast Curated Options",
      description: "Get matched with relevant fabric options within 24-48 hours of your requirement."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Tell Us Your Requirements",
      description: "Share your fabric needs — type, quantity, budget, and timeline. We listen first.",
      cta: "Submit Requirement"
    },
    {
      number: "02",
      title: "We Match Curated Options",
      description: "Our team handpicks options from verified mills that fit your exact specifications.",
      cta: "How We Select"
    },
    {
      number: "03",
      title: "Review, Select & Get Delivery Clarity",
      description: "Compare options, request samples, and get clear delivery timelines before you commit.",
      cta: "Start Now"
    }
  ];

  const testimonials = [
    {
      quote: "Delivered quality swatches before I even paid — fast and transparent. This is how sourcing should work.",
      author: "Priya Sharma",
      role: "Boutique Owner",
      location: "Jaipur"
    },
    {
      quote: "Finally found a sourcing partner who understands what small brands need. No more chasing suppliers.",
      author: "Arjun Mehta",
      role: "Fashion Designer",
      location: "Mumbai"
    },
    {
      quote: "The clarity on MOQ and pricing saved us weeks of back-and-forth. Highly recommended.",
      author: "Sneha Patel",
      role: "D2C Brand Founder",
      location: "Bangalore"
    },
    {
      quote: "Their curated approach means I only see fabrics that actually match my requirements. Game changer.",
      author: "Rahul Verma",
      role: "Export House",
      location: "Delhi"
    }
  ];

  const faqs = [
    {
      question: "Can I get samples before placing a bulk order?",
      answer: "Yes, absolutely. We encourage sampling before bulk orders. Sample costs vary by fabric type and are typically adjusted against your final order."
    },
    {
      question: "What is the minimum order quantity (MOQ)?",
      answer: "MOQ varies by supplier and fabric type, typically ranging from 300-1500 meters. We always share this upfront so there are no surprises."
    },
    {
      question: "How fast is delivery?",
      answer: "Standard lead times range from 15-45 days depending on the fabric and customization required. We provide clear timelines before you commit."
    },
    {
      question: "How does pricing work?",
      answer: "Pricing is transparent and shared per meter/kg based on the fabric. We don't add hidden margins — what you see is what you pay."
    },
    {
      question: "Do you handle logistics and shipping?",
      answer: "Yes, we can manage end-to-end logistics including quality checks, packaging, and delivery to your location across India."
    }
  ];

  const trustBadges = [
    { label: "100+ Quality Checks", icon: CheckCircle },
    { label: "Verified Mills", icon: Shield },
    { label: "500+ Brands Served", icon: Users }
  ];

  return (
    <>
      <Navbar />
      
      <main className="bg-white" data-testid="home-page">
        
        {/* ========== HERO SECTION ========== */}
        <section className="relative min-h-[90vh] flex items-center" data-testid="hero-section">
          <div className="absolute inset-0">
            <img
              src="https://customer-assets.emergentagent.com/job_13644b54-5ee2-48ed-bdd9-d8ac683b189f/artifacts/8l3peaqq_WhatsApp%20Image%202026-01-29%20at%2014.53.57%20%281%29.jpeg"
              alt="Locofast team"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/90 via-neutral-900/70 to-neutral-900/40" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm mb-8">
                <Sparkles size={16} />
                Trusted by 500+ brands across India
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight mb-6" data-testid="hero-headline">
                Reliable Fabric Sourcing for Brands & Boutiques
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-10 max-w-xl">
                We simplify your sourcing process with verified suppliers, clear timelines, and curated options — so you can focus on design, not logistics.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/assisted-sourcing"
                  className="inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-600 transition-all hover:gap-3"
                  data-testid="hero-cta-primary"
                >
                  Get Curated Options
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/20"
                  data-testid="hero-cta-secondary"
                >
                  <MessageCircle size={18} />
                  Talk to a Fabric Expert
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========== VALUE PROPOSITION ========== */}
        <section className="py-20 lg:py-28 bg-neutral-50" data-testid="value-section">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm tracking-widest text-[#2563EB] uppercase mb-4">Why Choose Us</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900">
                Why Designers & Brands Trust Us
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-12">
              {valueProps.map((prop, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                    <prop.icon size={28} className="text-[#2563EB]" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">{prop.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{prop.description}</p>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 pt-8 border-t border-neutral-200">
              {trustBadges.map((badge, index) => (
                <div key={index} className="flex items-center gap-2 text-neutral-600">
                  <badge.icon size={18} className="text-green-600" />
                  <span className="text-sm font-medium">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== HOW IT WORKS ========== */}
        <section className="py-20 lg:py-28" data-testid="how-it-works-section">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm tracking-widest text-[#2563EB] uppercase mb-4">Simple Process</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900">
                How It Works
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-full w-full h-px bg-neutral-200 -translate-x-1/2 z-0" />
                  )}
                  <div className="relative bg-white p-8 rounded-2xl border border-neutral-100 hover:border-[#2563EB]/30 transition-colors">
                    <span className="text-5xl font-bold text-neutral-100 absolute top-4 right-6">{step.number}</span>
                    <div className="relative">
                      <h3 className="text-xl font-semibold text-neutral-900 mb-3 pr-12">{step.title}</h3>
                      <p className="text-neutral-600 leading-relaxed mb-6">{step.description}</p>
                      <Link
                        to="/assisted-sourcing"
                        className="inline-flex items-center gap-1 text-[#2563EB] font-medium text-sm hover:gap-2 transition-all"
                      >
                        {step.cta} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== TESTIMONIALS ========== */}
        <section className="py-20 lg:py-28 bg-neutral-900" data-testid="testimonials-section">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm tracking-widest text-blue-400 uppercase mb-4">Social Proof</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-white">
                What Our Buyers Say
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-neutral-800/50 p-6 rounded-2xl border border-neutral-700/50">
                  <p className="text-neutral-300 leading-relaxed mb-6 text-sm">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-medium text-white">{testimonial.author}</p>
                    <p className="text-neutral-500 text-sm">{testimonial.role}, {testimonial.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== COLLECTION SHOWCASE ========== */}
        <section className="py-20 lg:py-28" data-testid="collections-section">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm tracking-widest text-[#2563EB] uppercase mb-4">Curated For You</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900">
                Explore Curated Fabric Groups
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {collections.length > 0 ? (
                collections.map((collection) => (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.id}`}
                    className="group relative bg-neutral-100 rounded-2xl overflow-hidden aspect-[4/5] hover:shadow-lg transition-all"
                  >
                    {collection.image ? (
                      <img src={collection.image} alt={collection.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl font-semibold text-white mb-1">{collection.name}</h3>
                      <p className="text-white/70 text-sm mb-3 line-clamp-2">{collection.description}</p>
                      <span className="inline-flex items-center gap-1 text-white text-sm font-medium group-hover:gap-2 transition-all">
                        View Options <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                // Placeholder collections
                ["Summer Weaves", "Signature Essentials", "Print Studio", "Premium Blends"].map((name, index) => (
                  <Link
                    key={index}
                    to="/collections"
                    className="group relative bg-neutral-100 rounded-2xl overflow-hidden aspect-[4/5] hover:shadow-lg transition-all"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl font-semibold text-white mb-2">{name}</h3>
                      <span className="inline-flex items-center gap-1 text-white text-sm font-medium group-hover:gap-2 transition-all">
                        View Options <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/collections"
                className="inline-flex items-center gap-2 text-[#2563EB] font-medium hover:gap-3 transition-all"
              >
                View All Collections <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* ========== ABOUT / TRUST BLOCK ========== */}
        <section className="py-20 lg:py-28 bg-neutral-50" data-testid="about-section">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-sm tracking-widest text-[#2563EB] uppercase mb-4">Who We Are</p>
                <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-6">
                  We're a Team of Sourcing Architects
                </h2>
                <div className="space-y-4 text-neutral-600 leading-relaxed">
                  <p>
                    Built by sourcing, operations, and tech professionals — not random sellers. We understand the challenges brands face because we've lived them.
                  </p>
                  <p>
                    We manage your end-to-end requirements so you get clarity and confidence, not chaos. Every fabric option is vetted, every timeline is realistic, and every price is transparent.
                  </p>
                  <p>
                    Our mission is simple: make fabric sourcing as reliable as it should be.
                  </p>
                </div>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-[#2563EB] font-medium mt-8 hover:gap-3 transition-all"
                >
                  Learn More About Us <ArrowRight size={18} />
                </Link>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://customer-assets.emergentagent.com/job_13644b54-5ee2-48ed-bdd9-d8ac683b189f/artifacts/8l3peaqq_WhatsApp%20Image%202026-01-29%20at%2014.53.57%20%281%29.jpeg"
                  alt="Team celebration"
                  className="w-full aspect-square object-cover rounded-2xl"
                />
                <img
                  src="https://customer-assets.emergentagent.com/job_13644b54-5ee2-48ed-bdd9-d8ac683b189f/artifacts/jsmcl2l3_WhatsApp%20Image%202026-01-29%20at%2014.53.57.jpeg"
                  alt="Team photo"
                  className="w-full aspect-square object-cover rounded-2xl mt-8"
                />
                <img
                  src="https://customer-assets.emergentagent.com/job_13644b54-5ee2-48ed-bdd9-d8ac683b189f/artifacts/1tpvf3i8_WhatsApp%20Image%202026-01-29%20at%2014.53.57%20%282%29.jpeg"
                  alt="Team bonding"
                  className="w-full aspect-square object-cover rounded-2xl -mt-8"
                />
                <img
                  src="https://customer-assets.emergentagent.com/job_13644b54-5ee2-48ed-bdd9-d8ac683b189f/artifacts/10bs4awk_WhatsApp%20Image%202026-01-29%20at%2014.53.58%20%281%29.jpeg"
                  alt="Team outdoor"
                  className="w-full aspect-square object-cover rounded-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========== FAQ SECTION ========== */}
        <section className="py-20 lg:py-28" data-testid="faq-section">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-sm tracking-widest text-[#2563EB] uppercase mb-4">FAQs</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900">
                Common Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-neutral-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors"
                  >
                    <span className="font-medium text-neutral-900 pr-4">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp size={20} className="text-neutral-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-neutral-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-neutral-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== FINAL CTA BLOCK ========== */}
        <section className="py-20 lg:py-28 bg-[#2563EB]" data-testid="cta-section">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6">
              Ready to Source the Right Fabric?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join 500+ brands who source with clarity and confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/assisted-sourcing"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#2563EB] px-8 py-4 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                data-testid="final-cta-primary"
              >
                Get Curated Options
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-white px-8 py-4 rounded-lg font-medium border-2 border-white/30 hover:bg-white/10 transition-colors"
                data-testid="final-cta-secondary"
              >
                <MessageCircle size={18} />
                Talk to an Expert
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
      
      {/* ========== STICKY CTA BAR ========== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 z-40 md:hidden" data-testid="sticky-cta">
        <Link
          to="/assisted-sourcing"
          className="flex items-center justify-center gap-2 bg-[#2563EB] text-white w-full py-3 rounded-lg font-medium"
        >
          Get Curated Options
          <ArrowRight size={18} />
        </Link>
      </div>
    </>
  );
};

export default HomePage;
