import { Link } from "react-router-dom";
import { Shield, Users, TrendingUp, CheckCircle } from "lucide-react";

const AboutPage = () => {
  const highlights = [
    { icon: Shield, title: "Money-Back Guarantee", desc: "Every eligible transaction is protected under the Locofast Money-Back Guarantee, giving buyers confidence at every stage." },
    { icon: Users, title: "Verified Supplier Network", desc: "We work with hundreds of verified suppliers across India and South Asia, ensuring quality and reliability." },
    { icon: TrendingUp, title: "Scale & Speed", desc: "Built for serious B2B sourcing—supporting brands, manufacturers, and exporters who need scale, speed, and reliability." },
    { icon: CheckCircle, title: "End-to-End Tracking", desc: "From posting requirements and comparing quotes to tracking orders, buyers stay in control while we safeguard the transaction." },
  ];

  return (
    <main className="pt-20" data-testid="about-page">
      {/* Hero */}
      <section className="relative py-24 lg:py-32 bg-neutral-50">
        <div className="container-main">
          <div className="max-w-3xl">
            <p className="subheading mb-4">About Locofast</p>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-6">
              Faster, fairer, and more reliable fabric sourcing
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed">
              Locofast was built to make fabric sourcing faster, fairer, and far more reliable for growing fashion and textile businesses.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-gap">
        <div className="container-main">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg">
              <p className="text-neutral-600 leading-relaxed mb-6">
                We believe buyers deserve the price advantage of sourcing directly from suppliers—without taking on unnecessary financial or quality risk.
              </p>
              
              <p className="text-neutral-600 leading-relaxed mb-6">
                Traditionally, direct sourcing has meant juggling multiple suppliers, unclear price discovery, limited transparency, and little to no protection once payment is made. <strong className="text-neutral-800">Locofast changes that.</strong> Our platform brings verified sellers, transparent price comparison, and platform-backed payment protection together in one seamless experience.
              </p>

              <p className="text-neutral-600 leading-relaxed mb-6">
                With Locofast, buyers work directly with suppliers to negotiate and finalise orders, while payments flow securely through our platform. Every eligible transaction is protected under the <strong className="text-neutral-800">Locofast Money-Back Guarantee</strong>, giving buyers confidence and peace of mind at every stage of the order.
              </p>

              <p className="text-neutral-600 leading-relaxed mb-6">
                From posting a requirement and comparing quotes to tracking orders end-to-end, buyers stay in control while Locofast safeguards the transaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="section-gap bg-neutral-50" data-testid="highlights-section">
        <div className="container-main">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="subheading mb-4">Why Locofast</p>
            <h2 className="text-3xl md:text-4xl font-semibold">Better prices and peace of mind</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((item, index) => (
              <div key={index} className="bg-white p-8 border border-neutral-100">
                <item.icon size={32} strokeWidth={1.5} className="text-[#2563EB] mb-6" />
                <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for B2B */}
      <section className="section-gap">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="subheading mb-4">Built for B2B</p>
              <h2 className="text-3xl md:text-4xl font-semibold mb-6">
                Serious sourcing at scale
              </h2>
              <p className="text-neutral-600 leading-relaxed mb-6">
                We are built for serious B2B sourcing—supporting brands, manufacturers, and exporters who need scale, speed, and reliability. Our ecosystem is powered by a growing network of verified suppliers, transparent documentation, and dedicated support for quality and logistics resolution.
              </p>
              <p className="text-neutral-600 leading-relaxed mb-6">
                Today, Locofast works with hundreds of suppliers and has enabled thousands of successful transactions for brands across India and South Asia.
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Backed by leading investors and driven by a team deeply rooted in the textile industry, we are focused on one clear mission: <strong className="text-neutral-800">enabling confident sourcing at scale.</strong>
              </p>
            </div>
            <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800"
                alt="Textile sourcing"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="section-gap bg-neutral-50" data-testid="offices-section">
        <div className="container-main">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="subheading mb-4">Locations</p>
            <h2 className="text-3xl md:text-4xl font-semibold">Our Offices</h2>
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
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            At Locofast, buyers don't have to choose
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto">
            Between better prices and peace of mind. With us, they get both.
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
