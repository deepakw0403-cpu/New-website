import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useBrandAuth } from "../../context/BrandAuthContext";
import { useBrandCart } from "../../context/BrandCartContext";
import BrandLayout from "./BrandLayout";
import { Loader2, ArrowLeft, ShoppingCart, Beaker, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import RFQModal from "../../components/RFQModal";
import { fmtLacs, fmtINR, fmtCount } from "../../lib/inr";
import { displayFabricName } from "../../lib/fabricDisplay";
import { thumbImage, mediumImage, fabricCoverImage } from "../../lib/imageUrl";
import { DispatchStrip } from "../../components/DispatchBadges";

const API = process.env.REACT_APP_BACKEND_URL;

const MAX_SAMPLE_METERS = 5;

const BrandFabricDetail = () => {
  const { id } = useParams();
  const { user, token } = useBrandAuth();
  const { addLine } = useBrandCart();
  const navigate = useNavigate();
  const [fabric, setFabric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [orderType, setOrderType] = useState("bulk");
  const [qty, setQty] = useState(1);
  const [summary, setSummary] = useState(null);
  const [showRfq, setShowRfq] = useState(false);

  useEffect(() => {
    if (!token) { navigate("/enterprise/login"); return; }
    if (user?.must_reset_password) { navigate("/enterprise/reset-password"); return; }
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
        navigate("/enterprise/fabrics");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, user]);

  const rate = Number(fabric?.rate_per_meter || fabric?.price_per_meter || 0);
  const samplePrice = Number(fabric?.sample_price || 100);
  const unit = fabric?.fabric_type === "knitted" && fabric?.category_id !== "cat-denim" ? "kg" : "m";

  const moqValue = (() => {
    const m = fabric?.moq;
    if (typeof m === "number") return m;
    if (typeof m === "string") {
      const match = m.match(/^\s*(\d+)/);
      if (match) return Number(match[1]);
    }
    return 1;
  })();

  const lineTotal = orderType === "sample" ? samplePrice * qty : rate * qty;
  const availableCredit = summary?.credit?.available ?? 0;
  const availableSample = summary?.sample_credits?.available ?? 0;

  // Max bookable for bulk = selected variant's stock (if variant-level) else fabric total
  const maxBulkQty = (() => {
    const variantQty = Number(selectedVariant?.quantity_available ?? NaN);
    if (Number.isFinite(variantQty) && variantQty > 0) return variantQty;
    const fabQty = Number(fabric?.quantity_available || 0);
    return fabQty > 0 ? fabQty : Infinity; // no limit recorded
  })();

  const onQtyChange = (raw) => {
    const v = Number(raw) || 1;
    if (orderType === "sample") setQty(Math.max(1, Math.min(MAX_SAMPLE_METERS, v)));
    else setQty(Math.max(1, Math.min(maxBulkQty, v)));
  };

  const addToCart = () => {
    if (!fabric) return;
    if (orderType === "bulk" && qty < moqValue) {
      toast.error(`MOQ for bulk orders is ${moqValue}${unit}`);
      return;
    }
    if (orderType === "bulk" && qty > maxBulkQty) {
      toast.error(`Only ${maxBulkQty}${unit} available — request a quote for more.`);
      return;
    }
    if (orderType === "sample" && qty > MAX_SAMPLE_METERS) {
      toast.error(`Sample orders are capped at ${MAX_SAMPLE_METERS}${unit} per fabric`);
      return;
    }
    if (orderType === "bulk" && rate <= 0) {
      toast.error("Bulk price not listed — use Request a Quote");
      return;
    }
    addLine({
      fabric_id: fabric.id,
      fabric_name: fabric.name,
      fabric_code: fabric.fabric_code || "",
      category_name: fabric.category_name || "",
      image_url: (selectedVariant?.image_url || fabricCoverImage(fabric)) || "",
      seller_company: fabric.seller_company || "",
      quantity: Number(qty),
      unit,
      color_name: selectedVariant?.color_name || "",
      color_hex: selectedVariant?.hex || "",
      order_type: orderType,
      price_per_unit: orderType === "sample" ? samplePrice : rate,
      moq: moqValue,
    });
    toast.success(`Added to cart · ${orderType === "sample" ? "Sample" : "Bulk"} · ${qty}${unit}`);
  };

  if (loading) {
    return <BrandLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" /></div></BrandLayout>;
  }
  if (!fabric) return null;

  return (
    <BrandLayout>
      <Link to="/enterprise/fabrics" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft size={14} /> Back to catalog
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div className="aspect-[4/5] bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={mediumImage(selectedVariant?.image_url || fabricCoverImage(fabric)) || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800"}
              alt={fabric.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          {(fabric.images || []).length > 1 && (
            <div className="grid grid-cols-5 gap-2 mt-3">
              {(fabric.images || []).slice(0, 5).map((img, i) => (
                <img key={i} src={thumbImage(img)} alt={`${fabric.name} ${i + 1}`} className="aspect-square object-cover rounded border border-gray-200" loading="lazy" />
              ))}
            </div>
          )}
        </div>

        {/* Info + Booking */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{fabric.category_name}</p>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{displayFabricName(fabric)}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-4 flex-wrap">
            {fabric.fabric_code && <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{fabric.fabric_code}</span>}
            {moqValue > 0 && <span>MOQ: {moqValue} {unit}</span>}
            {fabric.seller_company && <span>by {fabric.seller_company}</span>}
          </div>

          {/* Color picker */}
          {fabric.has_multiple_colors && fabric.color_variants?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-gray-600 mb-2">Select colour</p>
              <div className="flex flex-wrap gap-2">
                {fabric.color_variants.map((v, i) => {
                  const qa = Number(v.quantity_available || 0);
                  const samplable = v.sample_available !== false;
                  const disabled = (orderType === "bulk" && qa <= 0) || (orderType === "sample" && !samplable);
                  const selected = selectedVariant?.color_name === v.color_name;
                  return (
                    <button
                      key={i}
                      disabled={disabled}
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
                        selected ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-gray-200 bg-white text-gray-700"
                      } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-gray-400"}`}
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
                className={`p-3 border rounded-lg text-left ${orderType === "sample" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                data-testid="brand-type-sample"
              >
                <p className="text-sm font-medium">Sample</p>
                <p className="text-xs text-gray-500">{fmtINR(samplePrice)}/{unit} · Max {MAX_SAMPLE_METERS}{unit}</p>
              </button>
              <button
                onClick={() => { setOrderType("bulk"); setQty(moqValue); }}
                className={`p-3 border rounded-lg text-left ${orderType === "bulk" ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}
                data-testid="brand-type-bulk"
              >
                <p className="text-sm font-medium">Bulk</p>
                <p className="text-xs text-gray-500">{rate > 0 ? `${fmtINR(rate)}/${unit}` : "On enquiry"}</p>
              </button>
            </div>
          </div>

          {/* Qty */}
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-600 mb-2">
              Quantity ({unit})
              {orderType === "sample" && <span className="ml-1.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">max {MAX_SAMPLE_METERS}{unit}</span>}
              {orderType === "bulk" && Number.isFinite(maxBulkQty) && (
                <span className="ml-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded" data-testid="brand-max-bulk-hint">
                  available {maxBulkQty}{unit}
                </span>
              )}
            </p>
            <input
              type="number"
              min={1}
              max={orderType === "sample" ? MAX_SAMPLE_METERS : (Number.isFinite(maxBulkQty) ? maxBulkQty : undefined)}
              value={qty}
              onChange={(e) => onQtyChange(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              data-testid="brand-qty-input"
            />
            {orderType === "bulk" && qty > maxBulkQty && Number.isFinite(maxBulkQty) && (
              <p className="text-[11px] text-red-600 mt-1.5" data-testid="brand-qty-error">
                Only {maxBulkQty}{unit} available. Use <strong>Request a Quote</strong> for larger volumes.
              </p>
            )}
          </div>

          {/* Line preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Line total</span>
              <span className="font-semibold text-gray-900" data-testid="brand-line-total">{fmtINR(lineTotal)}</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Taxes + logistics calculated at checkout</p>
          </div>

          {/* Balance info */}
          {orderType === "sample" ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2 flex items-center justify-between" data-testid="brand-balance-sample-card">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Sample Credits</p>
                <p className="text-sm text-gray-900 mt-0.5">
                  <strong data-testid="brand-balance-sample">{fmtCount(availableSample)}</strong> credits available
                </p>
              </div>
              <Link to="/enterprise/account" className="text-xs text-amber-700 hover:underline">Top up</Link>
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
              <Link to="/enterprise/account" className="text-xs text-emerald-700 hover:underline">View ledger</Link>
            </div>
          )}

          {/* Primary CTAs — Add to Cart + RFQ */}
          <button
            onClick={addToCart}
            disabled={orderType === "bulk" && qty > maxBulkQty}
            className={`w-full ${orderType === "sample" ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"} disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2`}
            data-testid="brand-add-to-cart"
          >
            {orderType === "sample" ? <Beaker size={14} /> : <ShoppingCart size={14} />}
            Add {orderType === "sample" ? "Sample" : "Bulk Order"} to Cart
          </button>
          <button
            onClick={() => setShowRfq(true)}
            className="w-full mt-2 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
            data-testid="brand-request-quote"
          >
            <MessageSquare size={14} /> Request a Quote
          </button>

          <DispatchStrip fabric={fabric} className="mt-3" />

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
