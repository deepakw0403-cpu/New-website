import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrandAuth } from "../../context/BrandAuthContext";
import BrandLayout from "./BrandLayout";
import { Wallet, Loader2, TrendingUp, Plus, Building2, Check } from "lucide-react";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

const StatCard = ({ label, value, accent = "emerald", icon: Icon, testId }) => (
  <div
    className={`bg-white border border-${accent}-100 rounded-xl p-5 shadow-sm`}
    data-testid={testId}
  >
    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-1">
      {Icon && <Icon size={12} />}
      {label}
    </div>
    <div className={`text-2xl font-semibold text-${accent}-700`}>{value}</div>
  </div>
);

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const BrandAccount = () => {
  const { user, token } = useBrandAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupAmt, setTopupAmt] = useState(1000);
  const [topupBusy, setTopupBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, lRes] = await Promise.all([
        fetch(`${API}/api/brand/credit-summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/brand/ledger`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setSummary(await sRes.json());
      setLedger(await lRes.json());
    } catch {
      toast.error("Failed to load account");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) { navigate("/brand/login"); return; }
    if (user?.must_reset_password) { navigate("/brand/reset-password"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

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
        key: data.key_id,
        amount: data.amount_paise,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name: "Locofast Brand Credit",
        description: `Add ${data.amount_inr} sample credits`,
        prefill: { email: user.email, name: user.name },
        theme: { color: "#059669" },
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
    } catch (err) {
      toast.error(err.message);
    }
    setTopupBusy(false);
  };

  const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  if (loading || !summary) {
    return (
      <BrandLayout>
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" /></div>
      </BrandLayout>
    );
  }

  const c = summary.credit;
  const s = summary.sample_credits;

  return (
    <BrandLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Wallet size={22} /> Credit & Sample Accounts
        </h1>
        <p className="text-sm text-gray-500 mt-1">Available balances, credit lines and recent activity</p>
      </div>

      {/* Credit section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Available Credit" value={fmtINR(c.available)} accent="emerald" icon={Wallet} testId="brand-credit-available" />
        <StatCard label="Total Allocated" value={fmtINR(c.total_allocated)} accent="blue" icon={TrendingUp} />
        <StatCard label="Utilized" value={fmtINR(c.total_utilized)} accent="gray" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-10" data-testid="brand-credit-lines-table">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Credit Lines</h3>
          <p className="text-xs text-gray-500">Orders debit FIFO — oldest line fully used before the next</p>
        </div>
        {c.lines.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No credit lines yet. Your Locofast RM will upload soon.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Lender</th>
                <th className="px-4 py-2 text-right">Allocated</th>
                <th className="px-4 py-2 text-right">Utilized</th>
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

      {/* Sample credits section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StatCard label="Sample Credits (Available)" value={`${s.available}`} accent="amber" testId="brand-sample-available" />
        <StatCard label="Used" value={`${s.used}`} accent="gray" />
        <StatCard label="Total Loaded" value={`${s.total}`} accent="blue" />
      </div>

      <div className="bg-white border border-amber-200 rounded-xl p-5 mb-10" data-testid="brand-topup-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Plus size={14} /> Add sample credits
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">₹1 = 1 credit · Pay via Razorpay · Credits added instantly</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-gray-300 rounded-lg">
              <span className="pl-3 pr-1 text-gray-500 text-sm">₹</span>
              <input
                type="number"
                min={100}
                step={100}
                value={topupAmt}
                onChange={(e) => setTopupAmt(e.target.value)}
                className="w-28 py-2 pr-3 outline-none text-sm"
                data-testid="brand-topup-amount"
              />
            </div>
            <button
              onClick={topup}
              disabled={topupBusy}
              className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
              data-testid="brand-topup-submit"
            >
              {topupBusy ? "..." : "Pay & add"}
            </button>
          </div>
        </div>
      </div>

      {/* Ledger */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" data-testid="brand-ledger">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        </div>
        {ledger.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No activity yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">When</th>
                <th className="px-4 py-2 text-left">Event</th>
                <th className="px-4 py-2 text-left">Detail</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ledger.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2 text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      e.type === "credit_allocated" ? "bg-emerald-100 text-emerald-700" :
                      e.type === "debit_order" ? "bg-red-50 text-red-700" :
                      e.type === "sample_credit_added" ? "bg-amber-100 text-amber-700" :
                      e.type === "sample_credit_used" ? "bg-orange-50 text-orange-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {e.type.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {e.lender_name && <>via <strong>{e.lender_name}</strong> · </>}
                    {e.order_id && <>order <span className="font-mono">{String(e.order_id).slice(0, 8)}</span></>}
                    {e.debits && <span> · FIFO: {e.debits.map(d => `${d.lender_name} ₹${d.amount}`).join(" + ")}</span>}
                    {e.note && !e.lender_name && !e.order_id && e.note}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {["credit_allocated", "sample_credit_added"].includes(e.type)
                      ? <span className="text-emerald-700">+{e.type.startsWith("sample") ? e.amount : fmtINR(e.amount)}</span>
                      : <span className="text-red-600">-{e.type === "sample_credit_used" ? e.amount : fmtINR(e.amount)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </BrandLayout>
  );
};

export default BrandAccount;
