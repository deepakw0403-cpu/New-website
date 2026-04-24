import { Truck, Beaker, Clock } from "lucide-react";

/**
 * Surfaces the three core turnaround promises.
 * Render a single line (`variant="sample" | "bulk" | "enquiry"`) next to a CTA,
 * or `variant="all"` for a stacked strip of all three (detail pages, cart, etc.).
 */
const COPY = {
  sample: {
    icon: Beaker,
    label: "Samples dispatched in 24–48 hours",
    tone: "text-blue-700",
  },
  bulk: {
    icon: Truck,
    label: "Bulk: 24–48 hours for packaging & dispatch",
    tone: "text-emerald-700",
  },
  enquiry: {
    icon: Clock,
    label: "Our team responds to enquiries within 24 hours",
    tone: "text-orange-700",
  },
};

export const DispatchLine = ({ variant = "bulk", className = "" }) => {
  const c = COPY[variant];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <p
      className={`inline-flex items-center gap-1.5 text-[11px] ${c.tone} ${className}`}
      data-testid={`dispatch-line-${variant}`}
    >
      <Icon size={12} aria-hidden />
      <span>{c.label}</span>
    </p>
  );
};

export const DispatchStrip = ({ className = "" }) => (
  <div
    className={`rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5 ${className}`}
    data-testid="dispatch-strip"
  >
    {(["sample", "bulk", "enquiry"]).map((v) => (
      <DispatchLine key={v} variant={v} className="text-xs" />
    ))}
  </div>
);

export default DispatchStrip;
