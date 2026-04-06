import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

const FABRIC_TYPES = [
  "Greige Fabric",
  "Dyed Fabric",
  "Printed Fabric",
  "Yarn Dyed Fabric",
  "Denim Fabrics",
  "Others"
];

export default function RFQModal({ open, onClose }) {
  const [form, setForm] = useState({
    name: "", phone: "", gst_number: "", company_name: "", email: "", fabric_type: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstData, setGstData] = useState(null);
  const [gstError, setGstError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`${API}/api/enquiries/rfq-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          gst_legal_name: gstData?.legal_name || "",
          gst_trade_name: gstData?.trade_name || "",
          gst_status: gstData?.gst_status || "",
          gst_city: gstData?.city || "",
          gst_state: gstData?.state || "",
          gst_address: gstData?.address || "",
        })
      });
      toast.success("Your enquiry has been submitted! Our team will reach out within 24 hours.");
      onClose();
      setForm({ name: "", phone: "", gst_number: "", company_name: "", email: "", fabric_type: "" });
      setGstData(null);
      setGstError("");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGstVerify = async () => {
    const gstin = form.gst_number.trim().toUpperCase();
    if (!gstin || gstin.length !== 15) {
      setGstError("GST number must be 15 characters");
      return;
    }
    setGstVerifying(true);
    setGstError("");
    setGstData(null);
    try {
      const res = await fetch(`${API}/api/gst/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gstin })
      });
      const result = await res.json();
      if (result.valid) {
        setGstData(result);
        const companyName = result.trade_name || result.legal_name || "";
        if (companyName) setForm(p => ({ ...p, company_name: companyName }));
        toast.success("GST verified successfully!");
      } else {
        setGstError(result.message || "Invalid GST number");
      }
    } catch (err) {
      setGstError("Verification failed. Please enter company name manually.");
    } finally {
      setGstVerifying(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" data-testid="rfq-modal-overlay">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative overflow-hidden" data-testid="rfq-modal">
        <div className="bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] px-6 py-5 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" data-testid="rfq-modal-close">
            <X size={20} />
          </button>
          <h3 className="text-lg font-semibold">Request a Quote</h3>
          <p className="text-blue-100 text-sm mt-1">Fill in your details — our sourcing experts will reach out within 24 hours.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" data-testid="rfq-form">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input type="text" required value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" data-testid="rfq-name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-500">+91</span>
                <input type="tel" required value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" pattern="[0-9]{10}" className="w-full px-3 py-2.5 border border-gray-300 rounded-r-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" data-testid="rfq-phone" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number <span className="text-red-500">*</span></label>
              <div className="flex">
                <input type="text" required value={form.gst_number} onChange={(e) => { setForm(p => ({ ...p, gst_number: e.target.value.toUpperCase() })); setGstData(null); setGstError(""); }} placeholder="22AAAAA0000A1Z5" maxLength={15} className={`w-full px-3 py-2.5 border rounded-l-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${gstData ? 'border-green-400 bg-green-50' : gstError ? 'border-red-300' : 'border-gray-300'}`} data-testid="rfq-gst" />
                <button type="button" onClick={handleGstVerify} disabled={gstVerifying || form.gst_number.length !== 15} className="px-3 py-2.5 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition-colors whitespace-nowrap" data-testid="rfq-gst-verify">
                  {gstVerifying ? "..." : gstData ? "\u2713" : "Verify"}
                </button>
              </div>
              {gstError && <p className="text-red-500 text-xs mt-1">{gstError}</p>}
              {gstData && <p className="text-green-600 text-xs mt-1">Verified: {gstData.legal_name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span>{gstData && <span className="text-green-600 text-xs ml-1">(Auto-filled)</span>}</label>
              <input type="text" required value={form.company_name} onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))} placeholder="Your company" className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${gstData ? 'border-green-400 bg-green-50' : 'border-gray-300'}`} data-testid="rfq-company" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email ID <span className="text-red-500">*</span></label>
              <input type="email" required value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@company.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" data-testid="rfq-email" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What fabric type are you looking at? <span className="text-red-500">*</span></label>
            <select required value={form.fabric_type} onChange={(e) => setForm(p => ({ ...p, fabric_type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white" data-testid="rfq-fabric-type">
              <option value="">Select fabric type</option>
              {FABRIC_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
            </select>
          </div>

          <button type="submit" disabled={submitting} className="w-full py-3 bg-[#2563EB] text-white font-medium rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors flex items-center justify-center gap-2" data-testid="rfq-submit">
            {submitting ? "Submitting..." : "Get Fabric Samples"}
            {!submitting && <ArrowRight size={16} />}
          </button>
          <p className="text-center text-xs text-gray-400">Free samples &middot; No commitment &middot; Expert sourcing support</p>
        </form>
      </div>
    </div>
  );
}
