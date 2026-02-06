import { Link } from "react-router-dom";
import { Target, Users, Globe, Award } from "lucide-react";

const AboutPage = () => {
  const values = [
    { icon: Target, title: "Quality First", desc: "Every fabric in our catalog meets strict quality standards before being listed." },
    { icon: Users, title: "Direct Relationships", desc: "We connect brands directly with manufacturers, eliminating unnecessary middlemen." },
    { icon: Globe, title: "Global Network", desc: "Access suppliers from major textile hubs including India, China, and Turkey." },
    { icon: Award, title: "Verified Suppliers", desc: "All our partner suppliers are thoroughly vetted for reliability and quality." },
  ];

  return (
    <main className="pt-20" data-testid="about-page">
      {/* Hero */}
      <section className="relative py-24 lg:py-32 bg-neutral-50">
        <div className="container-main">
          <div className="max-w-3xl">
            <p className="subheading mb-4">About Us</p>
            <h1 className="text-5xl md:text-6xl font-serif font-medium leading-tight mb-6">
              Revolutionizing fabric sourcing for modern brands
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed">
              Locofast is a B2B fabric sourcing platform that connects fashion brands, garment manufacturers, and designers with verified fabric suppliers worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section-gap">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="subheading mb-4">Our Mission</p>
              <h2 className="text-4xl font-serif font-medium mb-6">
                Making fabric sourcing transparent and efficient
              </h2>
              <p className="text-neutral-600 leading-relaxed mb-6">
                We believe that discovering and sourcing the right fabrics shouldn't be complicated. Our platform brings together the best fabric suppliers from around the world, providing detailed specifications, quality assurance, and direct communication channels.
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Whether you're a startup fashion label or an established manufacturer, Locofast provides the tools and network you need to source premium fabrics efficiently.
              </p>
            </div>
            <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1753162658542-dd053c2b5196?w=800"
                alt="Fashion design process"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-gap bg-neutral-50" data-testid="values-section">
        <div className="container-main">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="subheading mb-4">Our Values</p>
            <h2 className="text-4xl font-serif font-medium">What drives us</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-8 border border-neutral-100">
                <value.icon size={32} strokeWidth={1.5} className="text-neutral-900 mb-6" />
                <h3 className="text-lg font-serif font-medium mb-3">{value.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-gap" data-testid="stats-section">
        <div className="container-main">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-5xl font-serif font-medium mb-2">500+</p>
              <p className="subheading">Fabrics Listed</p>
            </div>
            <div>
              <p className="text-5xl font-serif font-medium mb-2">50+</p>
              <p className="subheading">Verified Suppliers</p>
            </div>
            <div>
              <p className="text-5xl font-serif font-medium mb-2">10+</p>
              <p className="subheading">Countries</p>
            </div>
            <div>
              <p className="text-5xl font-serif font-medium mb-2">200+</p>
              <p className="subheading">Happy Brands</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-neutral-900">
        <div className="container-main text-center">
          <h2 className="text-4xl font-serif font-medium text-white mb-6">
            Ready to explore our fabric collection?
          </h2>
          <Link to="/fabrics" className="bg-white text-neutral-900 px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-neutral-100 transition-colors inline-block" data-testid="about-cta-btn">
            Browse Fabrics
          </Link>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
