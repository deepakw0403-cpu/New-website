import { Link } from "react-router-dom";

const MediaPage = () => {
  const pressReleases = [
    {
      date: "2023",
      title: "Locofast raises $15 million in Series A",
      description: "Funding to expand supplier network and technology platform across Southeast Asia."
    },
    {
      date: "2022",
      title: "Locofast expands operations to Bangladesh",
      description: "New office in Dhaka to serve international textile market."
    },
    {
      date: "2021",
      title: "Platform launch",
      description: "Locofast B2B textile platform officially launched."
    }
  ];

  const features = [
    "B2B fabric sourcing platform connecting buyers with suppliers",
    "Operations across multiple cities in India and Bangladesh",
    "Serving textile buyers including brands, manufacturers, and traders",
    "Technology-enabled supply chain and logistics coordination"
  ];

  return (
    <main className="pt-20" data-testid="media-page">
      {/* Header */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="container-main">
          <div className="max-w-3xl">
            <p className="subheading mb-4">Press</p>
            <h1 className="text-5xl font-serif font-medium mb-6">Media & Awards</h1>
            <p className="text-neutral-600 text-lg leading-relaxed">
              News and updates about Locofast.
            </p>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="section-gap">
        <div className="container-main">
          <div className="max-w-3xl">
            <p className="subheading mb-4">Overview</p>
            <h2 className="text-4xl font-serif font-medium mb-8">About Locofast</h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              Locofast Online Services Pvt. Ltd. operates a B2B platform for fabric sourcing. The platform connects textile buyers with fabric suppliers, providing access to catalogs, specifications, and facilitating transactions.
            </p>
            <ul className="space-y-3 text-neutral-600">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full mt-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="section-gap bg-neutral-50">
        <div className="container-main">
          <div className="max-w-3xl">
            <p className="subheading mb-4">News</p>
            <h2 className="text-4xl font-serif font-medium mb-12">Press Releases</h2>
            <div className="space-y-8">
              {pressReleases.map((item, index) => (
                <div key={index} className="border-b border-neutral-200 pb-8">
                  <span className="subheading text-neutral-400">{item.date}</span>
                  <h3 className="text-xl font-serif font-medium mt-2 mb-3">{item.title}</h3>
                  <p className="text-neutral-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Media Contact */}
      <section className="section-gap">
        <div className="container-main">
          <div className="max-w-3xl">
            <p className="subheading mb-4">Contact</p>
            <h2 className="text-4xl font-serif font-medium mb-8">Media Enquiries</h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              For media enquiries, please contact:
            </p>
            <p className="text-neutral-600">
              <strong>Email:</strong> mail@locofast.com
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default MediaPage;
