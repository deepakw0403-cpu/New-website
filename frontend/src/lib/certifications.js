/**
 * Fabric certification catalogue. Single source of truth for certification
 * keys, display labels, short badges, descriptions, and chip colors used
 * across the admin form, vendor form, catalog card, PDP, and filter
 * sidebar.
 *
 * Keys are stable strings persisted in `fabric.certifications` on the
 * backend — do NOT rename an existing key without a data migration.
 */

export const CERTIFICATIONS = [
  {
    key: "bci",
    label: "BCI",
    fullName: "Better Cotton Initiative",
    short: "BCI",
    description: "Cotton sourced from farms using better water, soil and worker-welfare practices.",
    chipClass: "bg-lime-50 text-lime-800 border-lime-200",
    dotClass: "bg-lime-600",
  },
  {
    key: "grs",
    label: "GRS",
    fullName: "Global Recycled Standard",
    short: "GRS",
    description: "Verified recycled content with a traceable supply chain and social / environmental safeguards.",
    chipClass: "bg-sky-50 text-sky-800 border-sky-200",
    dotClass: "bg-sky-600",
  },
  {
    key: "ocs_100",
    label: "OCS 100",
    fullName: "Organic Content Standard — 100%",
    short: "OCS 100",
    description: "Certified 100% organic fiber content, verified from farm to finished product.",
    chipClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-600",
  },
  {
    key: "ocs_blended",
    label: "OCS Blended",
    fullName: "Organic Blended Content Standard",
    short: "OCS B",
    description: "Minimum 5% certified organic fibers blended with conventional or synthetic materials.",
    chipClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-600",
  },
  {
    key: "higg",
    label: "Higg Index",
    fullName: "Higg Index",
    short: "Higg",
    description: "Standardised measurement of the environmental and social impact of the product.",
    chipClass: "bg-teal-50 text-teal-800 border-teal-200",
    dotClass: "bg-teal-600",
  },
  {
    key: "oeko_tex",
    label: "OEKO-TEX",
    fullName: "OEKO-TEX Standard 100 — Confidence in Textiles",
    short: "OEKO-TEX",
    description: "Tested free of harmful substances according to OEKO-TEX® Standard 100.",
    chipClass: "bg-amber-50 text-amber-900 border-amber-200",
    dotClass: "bg-amber-600",
  },
];

export const CERT_BY_KEY = Object.fromEntries(CERTIFICATIONS.map((c) => [c.key, c]));

// Resolve a list of certification keys (as persisted on the fabric) into
// the display records above. Unknown keys are dropped silently so legacy
// data never breaks rendering.
export const resolveCerts = (keys) => {
  if (!Array.isArray(keys)) return [];
  return keys.map((k) => CERT_BY_KEY[k]).filter(Boolean);
};
