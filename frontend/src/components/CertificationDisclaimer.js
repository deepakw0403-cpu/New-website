/**
 * Legal note shown alongside certification chips/filters. Surfaces on:
 *   - Public PDP (FabricDetailPage)
 *   - Brand PDP (BrandFabricDetail)
 *   - Catalog certification filter (FabricsPage)
 */
import React from "react";
import { Info } from "lucide-react";

const CertificationDisclaimer = ({ className = "", testId = "cert-disclaimer" }) => (
  <div
    className={`flex gap-2 p-3 rounded-md bg-amber-50 border border-amber-100 text-[11px] leading-snug text-amber-900 ${className}`}
    data-testid={testId}
  >
    <Info size={13} className="flex-shrink-0 mt-0.5 text-amber-700" />
    <div className="space-y-1">
      <p>
        All certifications shown are owned and maintained by the respective
        partner mills. <span className="font-semibold">Locofast Online Services Pvt. Ltd.</span>{" "}
        does not claim ownership and acts solely as a sourcing and service partner.
      </p>
      <p className="text-amber-800/90">
        Certification documents are available on request for specific products and mills.
      </p>
    </div>
  </div>
);

export default CertificationDisclaimer;
