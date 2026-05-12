// "Trusted by global brands production network" ticker.
//
// Logo strategy — Feb 2026 update:
//   The original plan was to fetch logos from logo.clearbit.com but that
//   API was retired in Dec 2025. Until the user provides official SVG
//   files for each brand (which would be the highest-quality option) we
//   render clean text wordmarks in each brand's signature colour.
//
//   To upgrade to actual SVGs later:
//     1. Drop the SVG file under /app/frontend/public/brand-logos/{slug}.svg
//     2. Set `logoSrc: "/brand-logos/{slug}.svg"` on the brand below
//     3. The component already prefers logoSrc over text rendering
//
//   For brands flagged `confirmed: false`, the brand name in the user's
//   input ("Skiva", "Izumi", "Children's Apparel", "Golden Touch")
//   matches multiple companies — UI shows a discreet "?" so ops can
//   verify on review. Once confirmed, drop the `confirmed: false` flag.
import { useMemo } from "react";

const BRANDS = [
  // ── Confirmed (well-known global brands) ────────────────────────
  { slug: "lidl",         name: "Lidl",            confirmed: true,  color: "#0050AA", weight: 900, italic: false },
  { slug: "walmart",      name: "Walmart",         confirmed: true,  color: "#0071CE", weight: 800, italic: false },
  { slug: "levis",        name: "Levi's",          confirmed: true,  color: "#B91C1C", weight: 900, italic: false },
  { slug: "target",       name: "Target",          confirmed: true,  color: "#CC0000", weight: 900, italic: false },
  { slug: "c-and-a",      name: "C&A",             confirmed: true,  color: "#1E3A8A", weight: 900, italic: false },
  { slug: "mango",        name: "MANGO",           confirmed: true,  color: "#000000", weight: 700, italic: false, tracking: "0.2em" },
  { slug: "firstcry",     name: "FirstCry",        confirmed: true,  color: "#EC4899", weight: 800, italic: false },
  { slug: "landmark",     name: "Landmark Group",  confirmed: true,  color: "#0F172A", weight: 700, italic: false },
  { slug: "lpp",          name: "LPP",             confirmed: true,  color: "#1F2937", weight: 900, italic: false },

  // ── Ambiguous — please confirm which company these refer to ────
  { slug: "skiva",        name: "Skiva",           confirmed: false, color: "#0F172A", weight: 800, italic: false },
  { slug: "izumi",        name: "Izumi",           confirmed: false, color: "#DC2626", weight: 800, italic: false },
  { slug: "childrens",    name: "Children's Apparel", confirmed: false, color: "#0F172A", weight: 700, italic: false },
  { slug: "golden-touch", name: "Golden Touch",    confirmed: false, color: "#D97706", weight: 700, italic: true  },
];

const LogoCard = ({ brand }) => (
  <div
    className="flex-shrink-0 w-48 h-20 mx-3 bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex items-center justify-center px-4 relative group hover:shadow-md hover:-translate-y-0.5 transition-all"
    title={
      brand.confirmed
        ? brand.name
        : `${brand.name} — please confirm which "${brand.name}" company this represents`
    }
    data-testid={`brand-card-${brand.slug}`}
  >
    {brand.logoSrc ? (
      <img
        src={brand.logoSrc}
        alt={brand.name}
        loading="lazy"
        className="max-h-11 max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
      />
    ) : (
      <span
        className="text-[17px] sm:text-lg font-extrabold whitespace-nowrap"
        style={{
          color: brand.color,
          fontWeight: brand.weight,
          fontStyle: brand.italic ? "italic" : "normal",
          letterSpacing: brand.tracking || "-0.01em",
        }}
      >
        {brand.name}
      </span>
    )}
    {!brand.confirmed && (
      <span
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-[9px] font-bold flex items-center justify-center shadow-sm"
        title="Ambiguous brand name — please confirm correct company"
      >
        ?
      </span>
    )}
  </div>
);

const BrandTicker = () => {
  // Duplicate the list so the marquee animation loops seamlessly
  const doubled = useMemo(() => [...BRANDS, ...BRANDS], []);

  return (
    <section
      className="py-14 lg:py-16 bg-gradient-to-b from-white to-blue-50/30 overflow-hidden border-y border-gray-100"
      data-testid="brand-ticker-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#2563EB] uppercase mb-2">
          Multi-Brand Production Corridor
        </p>
        <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-gray-900 tracking-tight">
          Trusted by global brands production network
        </h2>
        <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
          Large brands and retail groups source their fabric and samples through Locofast across our production network.
        </p>
      </div>

      <div className="relative">
        {/* edge-fade so the ticker fades into the page instead of hard-cutting */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-white via-white/95 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-white via-white/95 to-transparent z-10" />

        <div className="flex animate-marquee" style={{ width: "max-content" }}>
          {doubled.map((b, i) => (
            <LogoCard key={`${b.slug}-${i}`} brand={b} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes locofast-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: locofast-marquee 45s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default BrandTicker;
