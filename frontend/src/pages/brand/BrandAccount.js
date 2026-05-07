import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useBrandAuth } from "../../context/BrandAuthContext";
import BrandLayout from "./BrandLayout";
import {
  Loader2, Plus, Building2, Wallet, Beaker, Info, User, MapPin,
  Pencil, Trash2, Check, X, ShoppingBag, FileText, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { fmtLacs, fmtINR, fmtCount } from "../../lib/inr";

const API = process.env.REACT_APP_BACKEND_URL;
const TABS = [
  { id: "overview", label: "Overview", icon: Wallet },
  { id: "profile", label: "Profile", icon: User },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "ledger", label: "Activity Ledger", icon: FileText },
];

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

// ───────────────────────────────────────────────── OVERVIEW
const Overview = ({ summary, ledger, topupAmt, setTopupAmt, topupBusy, topup }) => {
  const c = summary.credit;
  const s = summary.sample_credits;
  const creditUtilPct = c.total_allocated > 0 ? Math.min(100, (c.total_utilized / c.total_allocated) * 100) : 0;
  const sampleUtilPct = s.total > 0 ? Math.min(100, (s.used / s.total) * 100) : 0;
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl p-6 shadow-sm" data-testid="brand-credit-limit-tile">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-emerald-100 text-xs uppercase tracking-wide font-semibold">
              <Wallet size={13} /> Credit Limit
            </div>
            <span className="text-[10px] bg-white/15 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">For bulk orders</span>
          </div>
          <div className="mt-2">
            <div className="text-4xl font-bold tracking-tight" data-testid="brand-credit-limit-lacs">{fmtLacs(c.available)}</div>
            <div className="text-sm text-emerald-100 mt-1" data-testid="brand-credit-limit-inr">Available · {fmtINR(c.available)}</div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-xs text-emerald-100">
              <span>Utilised</span>
              <span className="font-medium text-white">{fmtINR(c.total_utilized)} of {fmtINR(c.total_allocated)}</span>
            </div>
            <div className="mt-1.5 h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-white/80 rounded-full" style={{ width: `${creditUtilPct}%` }} />
            </div>
          </div>
          <p className="text-[11px] text-emerald-100/80 mt-3 leading-relaxed flex items-start gap-1">
            <Info size={11} className="mt-0.5 flex-shrink-0" />
            FIFO across embedded lenders (Stride / Muthoot / Mintifi).
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-6 shadow-sm" data-testid="brand-sample-credits-tile">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-amber-50 text-xs uppercase tracking-wide font-semibold">
              <Beaker size={13} /> Sample Credits
            </div>
            <span className="text-[10px] bg-white/15 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">For sample orders only</span>
          </div>
          <div className="mt-2">
            <div className="text-4xl font-bold tracking-tight" data-testid="brand-sample-available">{fmtCount(s.available)}</div>
            <div className="text-sm text-amber-50 mt-1">sample credits available</div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-xs text-amber-50">
              <span>Utilised</span>
              <span className="font-medium text-white">{fmtCount(s.used)} of {fmtCount(s.total)}</span>
            </div>
            <div className="mt-1.5 h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-white/80 rounded-full" style={{ width: `${sampleUtilPct}%` }} />
            </div>
          </div>
          <p className="text-[11px] text-amber-50/90 mt-3 leading-relaxed flex items-start gap-1">
            <Info size={11} className="mt-0.5 flex-shrink-0" />
            ₹1 = 1 sample credit. Top up below.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6" data-testid="brand-credit-lines-table">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Credit Lines</h3>
            <p className="text-xs text-gray-500">Orders debit FIFO — oldest line used fully before moving to the next</p>
          </div>
          <span className="text-xs text-gray-500">{c.lines.length} active</span>
        </div>
        {c.lines.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No credit lines yet. Your Locofast RM will upload soon.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Lender</th>
                <th className="px-4 py-2 text-right">Allocated</th>
                <th className="px-4 py-2 text-right">Utilised</th>
                <th className="px-4 py-2 text-right">Available</th>
                <th className="px-4 py-2 text-left">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {c.lines.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
                      <Building2 size={10} /> {l.lender_name}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{fmtINR(l.amount_inr)}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{fmtINR(l.utilized_inr)}</td>
                  <td className="px-4 py-2 text-right font-semibold text-emerald-700">{fmtINR(l.amount_inr - l.utilized_inr)}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-amber-200 rounded-xl p-5" data-testid="brand-topup-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Plus size={14} /> Add sample credits</h3>
            <p className="text-xs text-gray-500 mt-0.5">₹1 = 1 credit · Pay via Razorpay · Credits added instantly on payment confirmation</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-gray-300 rounded-lg">
              <span className="pl-3 pr-1 text-gray-500 text-sm">₹</span>
              <input type="number" min={100} step={100} value={topupAmt} onChange={(e) => setTopupAmt(e.target.value)}
                     className="w-28 py-2 pr-3 outline-none text-sm" data-testid="brand-topup-amount" />
            </div>
            <button onClick={topup} disabled={topupBusy}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                    data-testid="brand-topup-submit">
              {topupBusy ? "..." : "Pay & add"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ───────────────────────────────────────────────── PROFILE TAB
const ProfileTab = ({ user, brand, token, onUpdated }) => {
  const isAdmin = user?.role === "brand_admin";
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    name: brand?.name || "",
    gst: brand?.gst || "",
    phone: brand?.phone || "",
    address: brand?.address || "",
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/brand/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Save failed");
      toast.success("Profile updated");
      setEdit(false);
      onUpdated?.(d.brand);
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5" data-testid="brand-profile-tab">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Building2 size={14} /> Enterprise profile</h3>
          {isAdmin && !edit && (
            <button onClick={() => setEdit(true)} className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1 hover:underline" data-testid="brand-profile-edit">
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>
        {!edit ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-gray-500">Enterprise Name</dt><dd className="font-medium text-gray-900">{brand?.name || "—"}</dd></div>
            <div><dt className="text-xs text-gray-500">Type</dt><dd className="font-medium text-gray-900 capitalize">{brand?.type || "brand"}</dd></div>
            <div>
              <dt className="text-xs text-gray-500">GST Number</dt>
              <dd className="font-mono text-gray-900 inline-flex items-center gap-1.5">
                {brand?.gst || "—"}
                {brand?.gst && <span className="text-[10px] inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full"><ShieldCheck size={10} /> on file</span>}
              </dd>
            </div>
            <div><dt className="text-xs text-gray-500">Phone</dt><dd className="text-gray-900">{brand?.phone || "—"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-gray-500">Registered Address</dt><dd className="text-gray-900 whitespace-pre-line">{brand?.address || "—"}</dd></div>
            <div><dt className="text-xs text-gray-500">Verification</dt><dd><span className={`text-xs px-2 py-0.5 rounded-full ${brand?.verification_status === "verified" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{brand?.verification_status || "verified"}</span></dd></div>
            <div><dt className="text-xs text-gray-500">Member since</dt><dd className="text-gray-700 text-xs">{brand?.created_at ? new Date(brand.created_at).toLocaleDateString() : "—"}</dd></div>
          </dl>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-gray-600 mb-1 block">Enterprise Name *</span>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="brand-profile-name" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600 mb-1 block">GST (15 chars)</span>
              <input maxLength={15} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value.toUpperCase() })} data-testid="brand-profile-gst" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600 mb-1 block">Phone</span>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="brand-profile-phone" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-gray-600 mb-1 block">Registered Address</span>
              <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} data-testid="brand-profile-address" />
            </label>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
              <button onClick={() => setEdit(false)} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-1.5" data-testid="brand-profile-save">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logged-in user details (read-only, for clarity) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><User size={14} /> You</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><dt className="text-xs text-gray-500">Name</dt><dd className="font-medium text-gray-900">{user?.name}</dd></div>
          <div><dt className="text-xs text-gray-500">Email</dt><dd className="text-gray-900 font-mono">{user?.email}</dd></div>
          <div><dt className="text-xs text-gray-500">Designation</dt><dd className="text-gray-900">{user?.designation || "—"}</dd></div>
          <div><dt className="text-xs text-gray-500">Role</dt><dd><span className={`text-xs px-2 py-0.5 rounded-full ${user?.role === "brand_admin" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>{user?.role?.replace("_", " ")}</span></dd></div>
        </dl>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────── ADDRESSES TAB
const AddressesTab = ({ token, isAdmin }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label: "", name: "", phone: "", address: "", city: "", state: "", pincode: "", set_default: false });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/brand/addresses`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setList(d.addresses || []);
    } catch {
      toast.error("Failed to load addresses");
    }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  const add = async () => {
    if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      toast.error("Address, city, state and pincode are required"); return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/brand/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Save failed");
      setList(d.addresses || []);
      setShowAdd(false);
      setForm({ label: "", name: "", phone: "", address: "", city: "", state: "", pincode: "", set_default: false });
      toast.success("Address added");
    } catch (e) { toast.error(e.message); }
    setBusy(false);
  };
  const setDefault = async (id) => {
    try {
      const r = await fetch(`${API}/api/brand/addresses/${id}/default`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail);
      setList(d.addresses || []);
      toast.success("Default updated");
    } catch (e) { toast.error(e.message); }
  };
  const remove = async (id) => {
    try {
      const r = await fetch(`${API}/api/brand/addresses/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail);
      setList(d.addresses || []);
      toast.success("Address removed");
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div data-testid="brand-addresses-tab">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">Saved shipping destinations. The default is auto-selected at checkout.</p>
        <button onClick={() => setShowAdd((s) => !s)} className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5" data-testid="brand-add-address">
          <Plus size={12} /> {showAdd ? "Cancel" : "Add address"}
        </button>
      </div>
      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Label (e.g. Bangalore Warehouse)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} data-testid="brand-addr-label" />
            <input placeholder="Contact name" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="brand-addr-name" />
            <input placeholder="Phone" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="brand-addr-phone" />
            <input placeholder="Pincode" maxLength={6} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} data-testid="brand-addr-pincode" />
            <textarea rows={2} placeholder="Address" className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} data-testid="brand-addr-address" />
            <input placeholder="City" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="brand-addr-city" />
            <input placeholder="State" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} data-testid="brand-addr-state" />
            <label className="flex items-center gap-2 text-xs text-gray-600 sm:col-span-2"><input type="checkbox" checked={form.set_default} onChange={(e) => setForm({ ...form, set_default: e.target.checked })} /> Set as default</label>
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={add} disabled={busy} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-1.5" data-testid="brand-addr-save">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : list.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-sm text-gray-500">
          No saved addresses yet. Place an order or click "Add address" above to seed the book.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.map((a) => (
            <div key={a.id} className={`bg-white border ${a.is_default ? "border-emerald-400 ring-1 ring-emerald-100" : "border-gray-200"} rounded-xl p-4`} data-testid={`brand-addr-card-${a.id}`}>
              <div className="flex items-start justify-between mb-1">
                <div className="min-w-0">
                  <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">{a.label || "Address"}</p>
                  <p className="font-medium text-gray-900">{a.name || "—"}</p>
                </div>
                {a.is_default && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Default</span>}
              </div>
              <p className="text-sm text-gray-700 leading-snug">{a.address}</p>
              <p className="text-xs text-gray-500 mt-1">{[a.city, a.state, a.pincode].filter(Boolean).join(", ")}</p>
              {a.phone && <p className="text-xs text-gray-500">{a.phone}</p>}
              {a.source === "gst" && <span className="text-[10px] inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded mt-2"><ShieldCheck size={10} /> Auto-seeded from GST</span>}
              {isAdmin && (
                <div className="flex justify-end gap-2 mt-3">
                  {!a.is_default && (
                    <button onClick={() => setDefault(a.id)} className="text-xs text-emerald-700 hover:underline" data-testid={`brand-addr-default-${a.id}`}>Set default</button>
                  )}
                  <button onClick={() => remove(a.id)} className="text-xs text-red-500 hover:underline inline-flex items-center gap-1" data-testid={`brand-addr-remove-${a.id}`}>
                    <Trash2 size={11} /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ───────────────────────────────────────────────── ORDERS TAB
const OrdersTab = ({ token }) => {
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    fetch(`${API}/api/brand/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setOrders).catch(() => setOrders([]));
  }, [token]);

  if (!orders) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-600" /></div>;
  if (orders.length === 0) {
    return <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-sm text-gray-500">No orders placed yet.</div>;
  }

  const samples = orders.filter((o) => o.order_type === "sample");
  const bulks = orders.filter((o) => o.order_type === "bulk");

  const Section = ({ title, list, accent }) => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" data-testid={`brand-orders-${title.toLowerCase()}`}>
      <div className={`px-4 py-2.5 border-b border-gray-100 flex items-center justify-between ${accent}`}>
        <h4 className="text-sm font-semibold">{title} ({list.length})</h4>
      </div>
      <div className="divide-y divide-gray-100">
        {list.map((o) => (
          <div key={o.id} className="p-4 text-sm flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-gray-700">{o.order_number}</p>
              <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</p>
              <ul className="mt-1 space-y-0.5 text-xs text-gray-700">
                {(o.items || []).slice(0, 3).map((it, i) => (
                  <li key={i} className="truncate">
                    • <Link to={`/enterprise/fabrics/${it.fabric_id}`} className="text-emerald-700 hover:underline">{it.fabric_name || "Fabric"}</Link>
                    {it.color_name ? `, ${it.color_name}` : ""} — {it.quantity}{it.unit || "m"}
                  </li>
                ))}
                {(o.items || []).length > 3 && <li className="text-[10px] text-gray-500">+{o.items.length - 3} more</li>}
              </ul>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{fmtINR(o.total)}</p>
              <span className="text-[10px] inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 mt-1 capitalize">{o.status?.replace("_", " ")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {samples.length > 0 && <Section title="Sample Orders" list={samples} accent="bg-blue-50 text-blue-800" />}
      {bulks.length > 0 && <Section title="Bulk Orders" list={bulks} accent="bg-emerald-50 text-emerald-800" />}
    </div>
  );
};

// ───────────────────────────────────────────────── LEDGER TAB
const LedgerTab = ({ ledger }) => {
  if (!ledger) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-600" /></div>;
  if (ledger.length === 0) {
    return <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-sm text-gray-500">No activity yet.</div>;
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" data-testid="brand-ledger">
      <div className="divide-y divide-gray-100">
        {ledger.map((e) => {
          const isSample = e.type.startsWith("sample");
          const positive = ["credit_allocated", "sample_credit_added"].includes(e.type);
          const products = e.order?.products || [];
          return (
            <div key={e.id} className="p-4 text-sm" data-testid={`ledger-row-${e.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      e.type === "credit_allocated" ? "bg-emerald-100 text-emerald-700" :
                      e.type === "debit_order" ? "bg-red-50 text-red-700" :
                      e.type === "sample_credit_added" ? "bg-amber-100 text-amber-700" :
                      e.type === "sample_credit_used" ? "bg-orange-50 text-orange-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>{e.type.replaceAll("_", " ")}</span>
                    {e.order?.order_number && (
                      <Link to={`/enterprise/orders`} className="text-xs text-emerald-700 hover:underline font-mono">{e.order.order_number}</Link>
                    )}
                    {e.lender_name && <span className="text-[11px] text-gray-500">via <strong>{e.lender_name}</strong></span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(e.created_at).toLocaleString()}</p>
                  {products.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {products.map((p, i) => (
                        <li key={i} className="text-xs text-gray-700 truncate">
                          •{" "}
                          {p.fabric_id ? (
                            <Link to={p.pdp_url} className="text-emerald-700 hover:underline">{p.fabric_name || "Fabric"}</Link>
                          ) : (
                            <span>{p.fabric_name || "Fabric"}</span>
                          )}
                          {p.fabric_code ? <span className="text-gray-500 ml-1 font-mono">[{p.fabric_code}]</span> : null}
                          {p.color_name ? <span className="text-gray-500">, {p.color_name}</span> : null}
                          <span className="text-gray-500"> — {p.quantity}{p.unit || "m"}</span>
                        </li>
                      ))}
                      {e.order.items_total > products.length && (
                        <li className="text-[10px] text-gray-500">+{e.order.items_total - products.length} more item{e.order.items_total - products.length === 1 ? "" : "s"}</li>
                      )}
                    </ul>
                  )}
                  {e.debits && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      FIFO: {e.debits.map((d) => `${d.lender_name} ${fmtINR(d.amount)}`).join(" + ")}
                    </p>
                  )}
                  {e.note && !products.length && <p className="text-xs text-gray-500 mt-0.5">{e.note}</p>}
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className={`text-sm font-semibold ${positive ? "text-emerald-700" : "text-red-600"}`}>
                    {positive ? "+" : "-"}{isSample ? `${fmtCount(e.amount)} cr` : fmtINR(e.amount)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────── MAIN PAGE
const BrandAccount = () => {
  const { user, token } = useBrandAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialTab = TABS.find((t) => t.id === params.get("tab"))?.id || "overview";
  const [tab, setTab] = useState(initialTab);
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topupAmt, setTopupAmt] = useState(1000);
  const [topupBusy, setTopupBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, lRes, mRes] = await Promise.all([
        fetch(`${API}/api/brand/credit-summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/brand/ledger`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/brand/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setSummary(await sRes.json());
      setLedger(await lRes.json());
      const m = await mRes.json();
      setBrand(m?.brand || null);
    } catch {
      toast.error("Failed to load account");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) { navigate("/enterprise/login"); return; }
    if (user?.must_reset_password) { navigate("/enterprise/reset-password"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const switchTab = (id) => {
    setTab(id);
    setParams({ tab: id });
  };

  const topup = async () => {
    if (!topupAmt || topupAmt < 100) return toast.error("Minimum ₹100");
    setTopupBusy(true);
    const ok = await loadRazorpay();
    if (!ok) { setTopupBusy(false); return toast.error("Failed to load payment SDK"); }
    try {
      const res = await fetch(`${API}/api/brand/sample-credits/topup/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount_inr: Number(topupAmt) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Top-up init failed");
      const rzp = new window.Razorpay({
        key: data.key_id, amount: data.amount_paise, currency: data.currency, order_id: data.razorpay_order_id,
        name: "Locofast Brand — Sample Credits",
        description: `Add ${data.amount_inr} sample credits`,
        prefill: { email: user.email, name: user.name },
        theme: { color: "#d97706" },
        handler: async (response) => {
          try {
            const v = await fetch(`${API}/api/brand/sample-credits/topup/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(response),
            });
            const vd = await v.json();
            if (!v.ok) throw new Error(vd.detail || "Verification failed");
            toast.success(vd.message);
            load();
          } catch (err) { toast.error(err.message); }
        },
        modal: { ondismiss: () => setTopupBusy(false) },
      });
      rzp.open();
    } catch (err) { toast.error(err.message); }
    setTopupBusy(false);
  };

  if (loading || !summary) {
    return (
      <BrandLayout>
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" /></div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-900">My Account</h1>
        <p className="text-sm text-gray-500 mt-1">Profile, addresses, orders, credit & sample-credit ledger — all in one place.</p>
      </div>

      <div className="border-b border-gray-200 mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" data-testid="brand-account-tabs">
        <div className="flex gap-1 sm:gap-2 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
                  active ? "text-emerald-700 border-emerald-600 bg-emerald-50/50" : "text-gray-500 hover:text-gray-700 border-transparent"
                }`}
                data-testid={`brand-account-tab-${t.id}`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" && (
        <Overview summary={summary} ledger={ledger} topupAmt={topupAmt} setTopupAmt={setTopupAmt} topupBusy={topupBusy} topup={topup} />
      )}
      {tab === "profile" && (
        <ProfileTab user={user} brand={brand} token={token} onUpdated={(b) => setBrand(b)} />
      )}
      {tab === "addresses" && (
        <AddressesTab token={token} isAdmin={user?.role === "brand_admin"} />
      )}
      {tab === "orders" && <OrdersTab token={token} />}
      {tab === "ledger" && <LedgerTab ledger={ledger} />}
    </BrandLayout>
  );
};

export default BrandAccount;
