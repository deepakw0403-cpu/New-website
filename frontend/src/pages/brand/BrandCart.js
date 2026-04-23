import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBrandAuth } from "../../context/BrandAuthContext";
import { useBrandCart } from "../../context/BrandCartContext";
import BrandLayout from "./BrandLayout";
import { ShoppingCart, Trash2, ArrowRight, CheckCircle, Loader2, MapPin, Beaker } from "lucide-react";
import { toast } from "sonner";
import { fmtINR, fmtLacs, fmtCount } from "../../lib/inr";
import { thumbImage } from "../../lib/imageUrl";

const API = process.env.REACT_APP_BACKEND_URL;

const LineRow = ({ l, onQty, onRemove }) => {
  const isSample = l.order_type === "sample";
  const lineTotal = Number(l.price_per_unit) * Number(l.quantity);
  return (
    <div className="flex items-start gap-3 p-3 border-b border-gray-100 last:border-b-0" data-testid={`brand-cart-line-${l.id}`}>
      <img
        src={thumbImage(l.image_url) || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200"}
        alt={l.fabric_name}
        className="w-16 h-16 object-cover rounded border border-gray-200 flex-shrink-0"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-blue-600 font-semibold">{l.category_name}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{l.fabric_name}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
          {l.fabric_code && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{l.fabric_code}</span>}
          {l.color_name && (
            <span className="inline-flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
              <span className="w-2 h-2 rounded-full border border-gray-300" style={{ background: l.color_hex || "#fff" }} />
              {l.color_name}
            </span>
          )}
          <span>{l.unit === "kg" ? "kg" : "m"} · ₹{l.price_per_unit}/{l.unit}</span>
          {isSample && <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Max 5{l.unit}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <input
          type="number"
          min={1}
          max={isSample ? 5 : undefined}
          value={l.quantity}
          onChange={(e) => onQty(l.id, Number(e.target.value))}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
          data-testid={`brand-cart-qty-${l.id}`}
        />
        <p className="text-sm font-semibold text-gray-900">{fmtINR(lineTotal)}</p>
        <button onClick={() => onRemove(l.id)} className="text-red-400 hover:text-red-600" data-testid={`brand-cart-remove-${l.id}`}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

const BrandCart = () => {
  const { user, token } = useBrandAuth();
  const navigate = useNavigate();
  const { bulkLines, sampleLines, bulkSubtotal, sampleSubtotal, updateQty, removeLine, clear } = useBrandCart();

  const [summary, setSummary] = useState(null);
  const [address, setAddress] = useState({
    ship_to_name: "", ship_to_phone: "", ship_to_address: "",
    ship_to_city: "", ship_to_state: "", ship_to_pincode: "",
    notes: "",
  });
  const [saveDefault, setSaveDefault] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!token) { navigate("/brand/login"); return; }
    if (user?.must_reset_password) { navigate("/brand/reset-password"); return; }
    (async () => {
      try {
        const s = await fetch(`${API}/api/brand/credit-summary`, { headers: { Authorization: `Bearer ${token}` } });
        setSummary(await s.json());
        const me = await fetch(`${API}/api/brand/me`, { headers: { Authorization: `Bearer ${token}` } });
        const meData = await me.json();
        const defAddr = meData?.brand?.default_ship_to || {};
        if (defAddr.address) {
          setAddress((a) => ({
            ...a,
            ship_to_name: defAddr.name || user.name || "",
            ship_to_phone: defAddr.phone || "",
            ship_to_address: defAddr.address || "",
            ship_to_city: defAddr.city || "",
            ship_to_state: defAddr.state || "",
            ship_to_pincode: defAddr.pincode || "",
          }));
        } else {
          setAddress((a) => ({ ...a, ship_to_name: user.name || "" }));
        }
      } catch { /* noop */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  // Charges — mirror backend
  const bulkQty = bulkLines.reduce((s, l) => s + Number(l.quantity), 0);
  const bulkTax = +(bulkSubtotal * 0.05).toFixed(2);
  const bulkPackaging = bulkQty * 1;
  const bulkLogistics = Math.max(bulkSubtotal * 0.03, bulkLines.length ? 3000 : 0);
  const bulkTotal = +(bulkSubtotal + bulkTax + Math.max(bulkLogistics, bulkPackaging)).toFixed(2);

  const sampleTax = +(sampleSubtotal * 0.05).toFixed(2);
  const sampleCourier = sampleLines.length ? 100 : 0;
  const sampleTotal = +(sampleSubtotal + sampleTax + sampleCourier).toFixed(2);

  const availableCredit = summary?.credit?.available ?? 0;
  const availableSample = summary?.sample_credits?.available ?? 0;

  const bulkEnough = bulkLines.length === 0 || bulkTotal <= availableCredit + 0.01;
  const sampleEnough = sampleLines.length === 0 || Math.round(sampleTotal) <= availableSample;

  const validateAddress = () => {
    const a = address;
    if (!a.ship_to_name.trim()) return "Please enter a contact name";
    if (!a.ship_to_phone.trim() || a.ship_to_phone.trim().length < 10) return "Enter a valid 10-digit phone";
    if (!a.ship_to_address.trim()) return "Enter a delivery address";
    if (!a.ship_to_city.trim()) return "Enter city";
    if (!a.ship_to_state.trim()) return "Enter state";
    if (!a.ship_to_pincode.trim() || !/^\d{6}$/.test(a.ship_to_pincode.trim())) return "Enter a valid 6-digit pincode";
    return null;
  };

  const placeOrders = async () => {
    if (!bulkLines.length && !sampleLines.length) return toast.error("Cart is empty");
    const err = validateAddress();
    if (err) return toast.error(err);
    if (!bulkEnough) return toast.error(`Not enough credit for bulk (₹${availableCredit.toFixed(2)} available)`);
    if (!sampleEnough) return toast.error(`Not enough sample credits (${availableSample} available)`);

    setPlacing(true);
    const placed = [];
    try {
      if (saveDefault) {
        await fetch(`${API}/api/brand/default-ship-to`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: address.ship_to_name,
            phone: address.ship_to_phone,
            address: address.ship_to_address,
            city: address.ship_to_city,
            state: address.ship_to_state,
            pincode: address.ship_to_pincode,
          }),
        });
      }

      const base = {
        ship_to_address: address.ship_to_address,
        ship_to_city: address.ship_to_city,
        ship_to_state: address.ship_to_state,
        ship_to_pincode: address.ship_to_pincode,
        notes: address.notes,
      };

      // Submit sample order first (independent), then bulk
      if (sampleLines.length > 0) {
        const res = await fetch(`${API}/api/brand/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ...base,
            order_type: "sample",
            items: sampleLines.map((l) => ({
              fabric_id: l.fabric_id, quantity: l.quantity,
              color_name: l.color_name, color_hex: l.color_hex,
            })),
          }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.detail || "Sample order failed");
        placed.push({ type: "sample", ...d });
      }
      if (bulkLines.length > 0) {
        const res = await fetch(`${API}/api/brand/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            ...base,
            order_type: "bulk",
            items: bulkLines.map((l) => ({
              fabric_id: l.fabric_id, quantity: l.quantity,
              color_name: l.color_name, color_hex: l.color_hex,
            })),
          }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.detail || "Bulk order failed");
        placed.push({ type: "bulk", ...d });
      }

      clear();
      setSuccess(placed);
    } catch (err) {
      toast.error(err.message || "Order placement failed");
      if (placed.length > 0) {
        // Some orders succeeded — sync cart state
        clear();
        setSuccess(placed);
        toast.info("Some orders were placed before the error — check the Orders page");
      }
    }
    setPlacing(false);
  };

  if (success) {
    return (
      <BrandLayout>
        <div className="max-w-md mx-auto bg-white border border-emerald-200 rounded-2xl p-8 text-center" data-testid="brand-cart-success">
          <CheckCircle size={48} className="mx-auto text-emerald-600 mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Orders placed</h2>
          <p className="text-sm text-gray-500 mb-4">Confirmation emailed to you, your brand admin and our ops team.</p>
          <ul className="text-sm text-left space-y-2 bg-gray-50 rounded-lg p-3 mb-4">
            {success.map((o, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase mr-2 ${o.type === "sample" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>{o.type}</span>
                  <span className="font-mono">{o.order_number}</span>
                </span>
                <span className="font-semibold">{fmtINR(o.total)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <Link to="/brand/orders" className="block w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium">View all orders</Link>
            <Link to="/brand/fabrics" className="block w-full bg-white border border-gray-300 py-2.5 rounded-lg text-sm">Back to catalog</Link>
          </div>
        </div>
      </BrandLayout>
    );
  }

  if (!bulkLines.length && !sampleLines.length) {
    return (
      <BrandLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <ShoppingCart className="text-gray-300 mx-auto mb-4" size={56} />
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Your cart is empty</h2>
          <p className="text-sm text-gray-500 mb-4">Browse the catalogue to add samples or bulk orders.</p>
          <Link to="/brand/fabrics" className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            Browse Fabrics <ArrowRight size={14} />
          </Link>
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <ShoppingCart size={22} /> Shopping Cart
        </h1>
        <p className="text-sm text-gray-500 mt-1">Review, enter a shipping address, and place your orders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* ─── Left: items + address ─── */}
        <div className="space-y-5">
          {sampleLines.length > 0 && (
            <div className="bg-white border border-blue-200 rounded-xl overflow-hidden" data-testid="brand-cart-sample-section">
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-800">
                  <Beaker size={14} />
                  <h3 className="text-sm font-semibold">Sample Requests · {sampleLines.length}</h3>
                </div>
                <span className="text-xs text-blue-700">Debited from sample credits · Max 5{sampleLines[0]?.unit || "m"} per line</span>
              </div>
              {sampleLines.map((l) => (
                <LineRow key={l.id} l={l} onQty={updateQty} onRemove={removeLine} />
              ))}
            </div>
          )}

          {bulkLines.length > 0 && (
            <div className="bg-white border border-emerald-200 rounded-xl overflow-hidden" data-testid="brand-cart-bulk-section">
              <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800">
                  <ShoppingCart size={14} />
                  <h3 className="text-sm font-semibold">Bulk Orders · {bulkLines.length}</h3>
                </div>
                <span className="text-xs text-emerald-700">Debited FIFO from credit limit</span>
              </div>
              {bulkLines.map((l) => (
                <LineRow key={l.id} l={l} onQty={updateQty} onRemove={removeLine} />
              ))}
            </div>
          )}

          {/* Address */}
          <div className="bg-white border border-gray-200 rounded-xl p-5" data-testid="brand-cart-address">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
              <MapPin size={14} /> Shipping Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="Contact name *" value={address.ship_to_name} onChange={(e) => setAddress({ ...address, ship_to_name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" data-testid="brand-ship-name" />
              <input required placeholder="Phone *" value={address.ship_to_phone} onChange={(e) => setAddress({ ...address, ship_to_phone: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" data-testid="brand-ship-phone" />
              <textarea required placeholder="Address * (street, landmark, etc.)" value={address.ship_to_address} onChange={(e) => setAddress({ ...address, ship_to_address: e.target.value })} rows={2} className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" data-testid="brand-ship-address" />
              <input required placeholder="City *" value={address.ship_to_city} onChange={(e) => setAddress({ ...address, ship_to_city: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" data-testid="brand-ship-city" />
              <input required placeholder="State *" value={address.ship_to_state} onChange={(e) => setAddress({ ...address, ship_to_state: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" data-testid="brand-ship-state" />
              <input required placeholder="Pincode *" maxLength={6} value={address.ship_to_pincode} onChange={(e) => setAddress({ ...address, ship_to_pincode: e.target.value.replace(/\D/g, "") })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" data-testid="brand-ship-pincode" />
              <textarea placeholder="Order notes (optional)" value={address.notes} onChange={(e) => setAddress({ ...address, notes: e.target.value })} rows={2} className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
            </div>
            <label className="flex items-center gap-2 mt-3 text-xs text-gray-600">
              <input type="checkbox" checked={saveDefault} onChange={(e) => setSaveDefault(e.target.checked)} />
              Save as default shipping address for my brand
            </label>
          </div>
        </div>

        {/* ─── Right: order summary ─── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 self-start sticky top-20" data-testid="brand-cart-summary">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Summary</h3>

          {sampleLines.length > 0 && (
            <div className="mb-3 pb-3 border-b border-gray-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 mb-2">Samples ({sampleLines.length})</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmtINR(sampleSubtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax (5%)</span><span>{fmtINR(sampleTax)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Courier</span><span>{fmtINR(sampleCourier)}</span></div>
                <div className="flex justify-between font-semibold pt-1"><span>Total</span><span data-testid="brand-cart-sample-total">{fmtINR(sampleTotal)}</span></div>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Debited from sample credits · <strong data-testid="brand-cart-sample-balance">{fmtCount(availableSample)}</strong> available
              </p>
              {!sampleEnough && <p className="text-[11px] text-red-600 mt-1">Insufficient sample credits</p>}
            </div>
          )}

          {bulkLines.length > 0 && (
            <div className="mb-3 pb-3 border-b border-gray-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 mb-2">Bulk ({bulkLines.length})</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmtINR(bulkSubtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax (5%)</span><span>{fmtINR(bulkTax)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Logistics + packaging</span><span>{fmtINR(Math.max(bulkLogistics, bulkPackaging))}</span></div>
                <div className="flex justify-between font-semibold pt-1"><span>Total</span><span data-testid="brand-cart-bulk-total">{fmtINR(bulkTotal)}</span></div>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Debited FIFO from credit · <strong data-testid="brand-cart-credit-balance">{fmtLacs(availableCredit)}</strong> ({fmtINR(availableCredit)}) available
              </p>
              {!bulkEnough && <p className="text-[11px] text-red-600 mt-1">Insufficient credit — top up or contact your RM</p>}
            </div>
          )}

          <div className="flex justify-between items-center mb-4 pt-2">
            <span className="text-sm font-semibold text-gray-900">Grand total</span>
            <span className="text-xl font-bold text-gray-900" data-testid="brand-cart-grand-total">{fmtINR(sampleTotal + bulkTotal)}</span>
          </div>

          <button
            onClick={placeOrders}
            disabled={placing || (!bulkEnough && bulkLines.length > 0) || (!sampleEnough && sampleLines.length > 0)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            data-testid="brand-place-order"
          >
            {placing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            Place {sampleLines.length > 0 && bulkLines.length > 0 ? "Orders" : "Order"}
          </button>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Confirmation emails go to you, your team admin, the sellers and Locofast ops.
          </p>
        </div>
      </div>
    </BrandLayout>
  );
};

export default BrandCart;
