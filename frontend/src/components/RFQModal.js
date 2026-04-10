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

export default function RFQModal({ open, onClose, fabricUrl, fabricName }) {
  const [form, setForm] = useState({
    name: "", phone: "", country_code: "+91", company_name: "", email: "", fabric_type: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`${API}/api/enquiries/rfq-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: `${form.country_code}${form.phone}`,
          fabric_type: fabricUrl ? "" : form.fabric_type,
          fabric_url: fabricUrl || "",
          fabric_name: fabricName || "",
        })
      });
      toast.success("Your enquiry has been submitted! Our team will reach out within 24 hours.");
      onClose();
      setForm({ name: "", phone: "", country_code: "+91", company_name: "", email: "", fabric_type: "" });
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
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
                <select value={form.country_code} onChange={(e) => setForm(p => ({ ...p, country_code: e.target.value }))} className="px-2 py-2.5 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer" data-testid="rfq-country-code">
                  <option value="+91">+91 IN</option>
                  <option value="+880">+880 BD</option>
                  <option value="+94">+94 LK</option>
                  <option value="+84">+84 VN</option>
                </select>
                <input type="tel" required value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" className="w-full px-3 py-2.5 border border-gray-300 rounded-r-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" data-testid="rfq-phone" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email ID <span className="text-red-500">*</span></label>
              <input type="email" required value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@company.com" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" data-testid="rfq-email" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
            <input type="text" required value={form.company_name} onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))} placeholder="Your company" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" data-testid="rfq-company" />
          </div>

          {fabricUrl ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">Enquiry for</p>
              <a href={fabricUrl} className="text-sm font-medium text-[#2563EB] hover:underline" target="_blank" rel="noopener noreferrer" data-testid="rfq-fabric-link">{fabricName || fabricUrl}</a>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What fabric type are you looking at? <span className="text-red-500">*</span></label>
              <select required value={form.fabric_type} onChange={(e) => setForm(p => ({ ...p, fabric_type: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white" data-testid="rfq-fabric-type">
                <option value="">Select fabric type</option>
                {FABRIC_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
              </select>
            </div>
          )}

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
