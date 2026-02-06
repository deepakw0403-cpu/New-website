import { Link } from "react-router-dom";
import { Search, FileText, MessageSquare, Truck } from "lucide-react";

const HowItWorksPage = () => {
  const steps = [
    {
      icon: Search,
      number: "01",
      title: "Browse & Discover",
      description: "Explore our curated catalog of fabrics from verified global suppliers. Use filters to find fabrics by type, composition, GSM, and more.",
    },
    {
      icon: FileText,
      number: "02",
      title: "Review Specifications",
      description: "Access detailed fabric specifications including composition, weight, width, finishes, and pricing. View high-quality swatch images.",
    },
    {
      icon: MessageSquare,
      number: "03",
      title: "Submit Enquiry",
      description: "Found something you like? Submit an enquiry with your requirements. Our team will connect you with the right supplier.",
    },
    {
      icon: Truck,
      number: "04",
      title: "Sample & Order",
      description: "Request samples, negotiate terms, and place orders directly with suppliers. We facilitate the connection for a smooth transaction.",
    },
  ];

  const faqs = [
    {
      q: "What is the minimum order quantity (MOQ)?",
      a: "MOQ varies by fabric and supplier. Each fabric listing displays the specific MOQ, typically ranging from 200-500 meters for production orders. Sample quantities are usually available for evaluation.",
    },
    {
      q: "How do I request a sample?",
      a: "Click the 'Request Details / Enquire' button on any fabric page and mention your sample requirements. Our team will coordinate with the supplier to arrange sample delivery.",
    },
    {
      q: "Are all suppliers verified?",
      a: "Yes, all suppliers on Locofast undergo a thorough verification process including quality assessment, production capacity verification, and compliance checks.",
    },
    {
      q: "What payment methods are accepted?",
      a: "Payment terms are negotiated directly with suppliers. Common methods include bank transfer, letter of credit, and trade finance options for larger orders.",
    },
  ];

  return (
    <main className="pt-20" data-testid="how-it-works-page">
      {/* Hero */}
      <section className="py-24 lg:py-32 bg-neutral-50">
        <div className="container-main">
          <div className="max-w-3xl">
            <p className="subheading mb-4">Process</p>
            <h1 className="text-5xl md:text-6xl font-serif font-medium leading-tight mb-6">
              How Locofast Works
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed">
              From discovery to delivery, here's how you can source premium fabrics through our platform.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="section-gap" data-testid="steps-section">
        <div className="container-main">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-neutral-900 text-white flex items-center justify-center">
                    <step.icon size={28} strokeWidth={1.5} />
                  </div>
                </div>
                <div>
                  <span className="subheading text-neutral-400">Step {step.number}</span>
                  <h3 className="text-2xl font-serif font-medium mt-1 mb-3">{step.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Section */}
      <section className="section-gap bg-neutral-50">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <p className="subheading mb-4">Why Choose Locofast</p>
              <h2 className="text-4xl font-serif font-medium mb-6">
                Direct access to global textile suppliers
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-neutral-900 text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-neutral-600">Verified suppliers with quality certifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-neutral-900 text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-neutral-600">Detailed specifications and real fabric imagery</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-neutral-900 text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-neutral-600">Direct communication with manufacturers</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-neutral-900 text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-neutral-600">Competitive pricing without middlemen markup</span>
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2 aspect-square bg-neutral-200 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1560258632-fb994fd2bd44?w=800"
                alt="Fabric texture"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-gap" data-testid="faq-section">
        <div className="container-main">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <p className="subheading mb-4">FAQ</p>
              <h2 className="text-4xl font-serif font-medium">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-neutral-100 pb-6">
                  <h3 className="text-lg font-medium mb-3">{faq.q}</h3>
                  <p className="text-neutral-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-neutral-900">
        <div className="container-main text-center">
          <h2 className="text-4xl font-serif font-medium text-white mb-6">
            Ready to start sourcing?
          </h2>
          <p className="text-neutral-400 mb-10 max-w-xl mx-auto">
            Browse our collection and find the perfect fabrics for your next project.
          </p>
          <Link to="/fabrics" className="bg-white text-neutral-900 px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-neutral-100 transition-colors inline-block" data-testid="how-cta-btn">
            Browse Fabrics
          </Link>
        </div>
      </section>
    </main>
  );
};

export default HowItWorksPage;
