import { Link } from "react-router-dom";
import { Building2, Users, MapPin, FileCheck } from "lucide-react";

const AboutPage = () => {
  const facts = [
    { icon: Building2, title: "Platform Model", desc: "Locofast operates as a facilitator between buyers and textile suppliers. We do not manufacture or sell fabrics directly." },
    { icon: Users, title: "Supplier Network", desc: "We work with a network of verified fabric suppliers across India and other textile manufacturing regions." },
    { icon: MapPin, title: "Operations", desc: "Offices in Delhi NCR, Jaipur, Ahmedabad, and Bangladesh. Our teams coordinate sourcing and logistics." },
    { icon: FileCheck, title: "Quality Process", desc: "Suppliers are verified before being listed. Fabric specifications are provided directly by suppliers." },
  ];

  return (
    <main className="pt-20" data-testid="about-page">
      {/* Hero */}
      <section className="relative py-24 lg:py-32 bg-neutral-50">
        <div className="container-main">
          <div className="max-w-3xl">
            <p className="subheading mb-4">About Locofast</p>
            <h1 className="text-5xl md:text-6xl font-semibold leading-tight mb-6">
              A platform for fabric sourcing
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed">
              Locofast connects textile buyers with fabric suppliers. The platform provides access to supplier catalogs, fabric specifications, and a process for submitting enquiries.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="section-gap">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="subheading mb-4">What We Do</p>
              <h2 className="text-4xl font-semibold mb-6">
                Facilitating fabric sourcing
              </h2>
              <p className="text-neutral-600 leading-relaxed mb-6">
                Locofast provides a platform where buyers can browse fabric listings from multiple suppliers. Each listing includes technical specifications such as composition, GSM, width, and MOQ.
              </p>
              <p className="text-neutral-600 leading-relaxed mb-6">
                When a buyer submits an enquiry, our team coordinates with the relevant supplier to provide pricing, sampling information, and logistics support.
              </p>
              <p className="text-neutral-600 leading-relaxed">
                The platform is designed for B2B transactions between fabric buyers (brands, manufacturers, traders) and fabric suppliers (mills, processors, converters).
              </p>
            </div>
            <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1753162658542-dd053c2b5196?w=800"
                alt="Textile manufacturing"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Facts */}
      <section className="section-gap bg-neutral-50" data-testid="facts-section">
        <div className="container-main">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="subheading mb-4">Platform Overview</p>
            <h2 className="text-4xl font-semibold">How we operate</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {facts.map((fact, index) => (
              <div key={index} className="bg-white p-8 border border-neutral-100">
                <fact.icon size={32} strokeWidth={1.5} className="text-[#2563EB] mb-6" />
                <h3 className="text-lg font-semibold mb-3">{fact.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{fact.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="section-gap" data-testid="offices-section">
        <div className="container-main">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="subheading mb-4">Locations</p>
            <h2 className="text-4xl font-semibold">Our Offices</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="font-serif text-lg font-medium mb-1">New Delhi</p>
              <p className="text-neutral-500 text-sm">Headquarters</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-lg font-medium mb-1">Jaipur</p>
              <p className="text-neutral-500 text-sm">Regional Office</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-lg font-medium mb-1">Ahmedabad</p>
              <p className="text-neutral-500 text-sm">Regional Office</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-lg font-medium mb-1">Bangladesh</p>
              <p className="text-neutral-500 text-sm">International</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#2563EB]">
        <div className="container-main text-center">
          <h2 className="text-4xl font-semibold text-white mb-6">
            Browse the fabric catalog
          </h2>
          <p className="text-blue-100 mb-10 max-w-xl mx-auto">
            View available fabrics, specifications, and submit enquiries.
          </p>
          <Link to="/fabrics" className="bg-white text-[#2563EB] px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-blue-50 transition-colors inline-block" data-testid="about-cta-btn">
            Browse Fabrics
          </Link>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
