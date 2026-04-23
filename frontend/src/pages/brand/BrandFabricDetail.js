import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useBrandAuth } from "../../context/BrandAuthContext";
import BrandLayout from "./BrandLayout";
import { Loader2, ArrowLeft, Package, CheckCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import RFQModal from "../../components/RFQModal";
import { fmtLacs, fmtINR, fmtCount } from "../../lib/inr";

const API = process.env.REACT_APP_BACKEND_URL;

const BrandFabricDetail = () => {
  const { id } = useParams();
  const { user, token } = useBrandAuth();
  const navigate = useNavigate();
  const [fabric, setFabric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [orderType, setOrderType] = useState("bulk");
  const [qty, setQty] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showRfq, setShowRfq] = useState(false);

  useEffect(() => {
    if (!token) { navigate("/brand/login"); return; }
    if (user?.must_reset_password) { navigate("/brand/reset-password"); return; }
    (async () => {
      try {
        const [fRes, sRes] = await Promise.all([
          fetch(`${API}/api/brand/fabrics/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/brand/credit-summary`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const fd = await fRes.json();
        if (!fRes.ok) throw new Error(fd.detail || "Failed");
        setFabric(fd);
        setSummary(await sRes.json());
        const variants = fd.color_variants || [];
        if (fd.has_multiple_colors && variants.length) {
          setSelectedVariant(variants.find((v) => (v.quantity_available ?? 0) > 0) || variants[0]);
        }
        const moq = Number(fd.moq || 1);
        setQty(moq);
      } catch (err) {
        toast.error(err.message || "Fabric not found");
        navigate("/brand/fabrics");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, user]);

  const rate = Number(fabric?.rate_per_meter || fabric?.price_per_meter || 0);
  const samplePrice = Number(fabric?.sample_price || 100);
  const unit = fabric?.fabric_type === "knitted" && fabric?.category_id !== "cat-denim" ? "kg" : "m";

  const lineTotal = orderType === "sample" ? samplePrice * qty : rate * qty;
  const tax = +(lineTotal * 0.05).toFixed(2);
  const logistics = orderType === "bulk" ? Math.max(lineTotal * 0.03, 3000) : 100;
  const total = +(lineTotal + tax + logistics).toFixed(2);

  const availableCredit = summary?.credit?.available ?? 0;
  const availableSample = summary?.sample_credits?.available ?? 0;
  const enough = orderType === "sample" ? availableSample >= total : availableCredit >= total;

  const placeOrder = async () => {
    if (qty <= 0) return toast.error("Enter a valid qty");
    if (orderType === "bulk" && qty < Number(fabric?.moq || 1)) {
      return toast.error(`MOQ is ${fabric?.moq}${unit}`);
    }
    if (!enough) return toast.error("Insufficient balance");
    setPlacing(true);
    try {
      const payload = {
        items: [{
          fabric_id: fabric.id,
          quantity: Number(qty),
          color_name: selectedVariant?.color_name || "",
          color_hex: selectedVariant?.hex || "",
        }],
        order_type: orderType,
      };
      const res = await fetch(`${API}/api/brand/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Order failed");
      setSuccess(data);
    } catch (err) {
      toast.error(err.message);
    }
    setPlacing(false);
  };

  if (loading) {
    return <BrandLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" /></div></BrandLayout>;
  }
  if (!fabric) return null;

  if (success) {
    return (
      <BrandLayout>
        <div className="max-w-md mx-auto bg-white border border-emerald-200 rounded-2xl p-8 text-center" data-testid="brand-order-success">
          <CheckCircle size={48} className="mx-auto text-emerald-600 mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Order placed</h2>
          <p className="text-sm text-gray-500 mb-4">Order <span className="font-mono">{success.order_number}</span> · {fmtINR(success.total)} debited</p>
          <div className="space-y-2">
            <Link to="/brand/orders" className="block w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium">View my orders</Link>
            <Link to="/brand/fabrics" className="block w-full bg-white border border-gray-300 py-2.5 rounded-lg text-sm">Back to catalog</Link>
          </div>
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      <Link to="/brand/fabrics" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft size={14} /> Back to catalog
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div className="aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={(selectedVariant?.image_url || fabric.images?.[0]) || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800"}
              alt={fabric.name}
              className="w-full h-full object-cover"
            />
          </div>
          {(fabric.images || []).length > 1 && (
            <div className="grid grid-cols-5 gap-2 mt-3">
              {(fabric.images || []).slice(0, 5).map((img, i) => (
                <img key={i} src={img} alt={i} className="aspect-square object-cover rounded border border-gray-200" />
              ))}
            </div>
          )}
        </div>

        {/* Info + Booking */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{fabric.category_name}</p>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{fabric.name}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
            {fabric.fabric_code && <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{fabric.fabric_code}</span>}
            {fabric.moq && <span>MOQ: {fabric.moq} {unit}</span>}
          </div>

          {/* Color picker */}
          {fabric.has_multiple_colors && fabric.color_variants?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-gray-600 mb-2">Select colour</p>
              <div className="flex flex-wrap gap-2">
                {fabric.color_variants.map((v, i) => {
                  const qa = Number(v.quantity_available || 0);
                  const disabled = orderType === "bulk" && qa <= 0;
                  const samplable = v.sample_available !== false;
                  const disabledSample = orderType === "sample" && !samplable;
                  const isDisabled = disabled || disabledSample;
                  const selected = selectedVariant?.color_name === v.color_name;
                  return (
                    <button
                      key={i}
                      disabled={isDisabled}
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
                        selected
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-gray-200 bg-white text-gray-700"
                      } ${isDisabled ? "opacity-40 cursor-not-allowed" : "hover:border-gray-400"}`}
                      data-testid={`brand-variant-${v.color_name}`}
                    >
                      <span className="w-4 h-4 rounded-full border border-gray-300" style={{ background: v.hex || "#fff" }} />
                      {v.color_name}
                      <span className="text-[10px] text-gray-500">{orderType === "bulk" ? `${qa}${unit}` : samplable ? "sample ✓" : "—"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order type */}
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-600 mb-2">Order type</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setOrderType("sample"); setQty(1); }}
                className={`p-3 border rounded-lg text-left ${orderType === "sample" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}
                data-testid="brand-type-sample"
              >
                <p className="text-sm font-medium">Sample</p>
                <p className="text-xs text-gray-500">{fmtINR(samplePrice)} per sample</p>
              </button>
              <button
                onClick={() => { setOrderType("bulk"); setQty(Number(fabric.moq || 1)); }}
                className={`p-3 border rounded-lg text-left ${orderType === "bulk" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}
                data-testid="brand-type-bulk"
              >
                <p className="text-sm font-medium">Bulk</p>
                <p className="text-xs text-gray-500">{fmtINR(rate)} / {unit}</p>
              </button>
            </div>
          </div>

          {/* Qty */}
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-600 mb-2">Quantity ({orderType === "sample" ? "samples" : unit})</p>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              data-testid="brand-qty-input"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmtINR(lineTotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax (5%)</span><span>{fmtINR(tax)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{orderType === "bulk" ? "Logistics (incl. packaging)" : "Courier"}</span><span>{fmtINR(logistics)}</span></div>
            <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-gray-900"><span>Total</span><span data-testid="brand-total">{fmtINR(total)}</span></div>
          </div>

          {/* Balance panel — distinct visuals for Credit Limit vs Sample Credits */}
          {orderType === "sample" ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2 flex items-center justify-between" data-testid="brand-balance-sample-card">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Sample Credits</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  <strong data-testid="brand-balance-sample">{fmtCount(availableSample)}</strong> credits available
                </p>
              </div>
              <Link to="/brand/account" className="text-xs text-amber-700 hover:underline">Top up</Link>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-2 flex items-center justify-between" data-testid="brand-balance-credit-card">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Credit Limit</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  <strong data-testid="brand-balance-credit-lacs">{fmtLacs(availableCredit)}</strong>
                  <span className="text-gray-500 text-xs ml-1.5" data-testid="brand-balance-credit">({fmtINR(availableCredit)})</span>
                </p>
              </div>
              <Link to="/brand/account" className="text-xs text-emerald-700 hover:underline">View ledger</Link>
            </div>
          )}
          {!enough && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2 mb-3" data-testid="brand-insufficient">
              Insufficient {orderType === "sample" ? "sample credits" : "credit"}. Contact your RM, top up, or request a quote below.
            </div>
          )}
          <button
            onClick={placeOrder}
            disabled={placing || !enough}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            data-testid="brand-place-order"
          >
            {placing ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
            Place order · {fmtINR(total)}
          </button>

          {/* Request a Quote — always available, works for every category (incl. Denim) */}
          <button
            onClick={() => setShowRfq(true)}
            className="w-full mt-2 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
            data-testid="brand-request-quote"
          >
            <MessageSquare size={14} /> Request a Quote
          </button>

          {fabric.description && (
            <div className="mt-6 pt-5 border-t border-gray-200">
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{fabric.description}</p>
            </div>
          )}
        </div>
      </div>
      <RFQModal
        open={showRfq}
        onClose={() => setShowRfq(false)}
        fabricUrl={typeof window !== "undefined" ? window.location.href : ""}
        fabricName={fabric?.name || ""}
      />
    </BrandLayout>
  );
};

export default BrandFabricDetail;
