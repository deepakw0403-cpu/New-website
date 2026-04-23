import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBrandAuth } from "../../context/BrandAuthContext";
import BrandLayout from "./BrandLayout";
import { Package, Loader2, ShoppingCart, Beaker, MessageSquare } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const FabricCard = ({ f, onOpen }) => {
  const unit = f.fabric_type === "knitted" && f.category_id !== "cat-denim" ? "kg" : "m";
  const stock = Number(f.quantity_available || 0);
  const rate = Number(f.rate_per_meter || 0);
  const samplePrice = Number(f.sample_price || 0);
  const oz = f.ounce ? `${f.ounce} oz` : null;
  const width = f.width ? `${f.width}"` : null;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
      data-testid={`brand-fabric-${f.id}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={f.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=500"}
          alt={f.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {stock > 0 ? (
          <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-semibold px-2 py-1 rounded-md">
            {stock.toLocaleString("en-IN")}{unit} Available
          </span>
        ) : (
          <span className="absolute top-2 right-2 bg-gray-900/80 text-white text-[11px] font-semibold px-2 py-1 rounded-md">
            On Request
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 mb-1">{f.category_name || "Fabric"}</p>
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 min-h-[40px]">{f.name}</h3>

        {(oz || width) && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {oz && <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{oz}</span>}
            {width && <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{width}</span>}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-sm border-t border-gray-100 pt-2.5">
          <span className="text-gray-500 text-xs">Sample</span>
          {samplePrice > 0 ? (
            <span className="font-semibold text-emerald-700">₹{samplePrice}/{unit}</span>
          ) : (
            <span className="text-gray-400 text-xs">On Enquiry</span>
          )}
        </div>
        {rate > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 text-xs">Bulk</span>
            <span className="font-semibold text-gray-900">₹{rate}/{unit}</span>
          </div>
        )}

        <div className="mt-3 grid gap-1.5">
          {rate > 0 && stock > 0 ? (
            <button
              onClick={() => onOpen(f, "bulk")}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-md"
              data-testid={`brand-bulk-${f.id}`}
            >
              <ShoppingCart size={12} /> Book Bulk Now
            </button>
          ) : (
            <button
              onClick={() => onOpen(f, "quote")}
              className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold py-2 rounded-md"
              data-testid={`brand-quote-${f.id}`}
            >
              <MessageSquare size={12} /> Request Quote
            </button>
          )}
          {samplePrice > 0 ? (
            <button
              onClick={() => onOpen(f, "sample")}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-md"
              data-testid={`brand-sample-${f.id}`}
            >
              <Beaker size={12} /> Book Sample
            </button>
          ) : (
            <button
              onClick={() => onOpen(f, "open")}
              className="w-full flex items-center justify-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium py-2 rounded-md"
            >
              View details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const BrandFabrics = () => {
  const { user, token } = useBrandAuth();
  const navigate = useNavigate();
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!token) { navigate("/brand/login"); return; }
    if (user?.must_reset_password) { navigate("/brand/reset-password"); return; }
    (async () => {
      try {
        const res = await fetch(`${API}/api/brand/fabrics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setFabrics(Array.isArray(data) ? data : []);
      } catch { /* noop */ }
      setLoading(false);
    })();
  }, [token, user, navigate]);

  const filtered = fabrics.filter((f) =>
    !q ||
    (f.name || "").toLowerCase().includes(q.toLowerCase()) ||
    (f.fabric_code || "").toLowerCase().includes(q.toLowerCase())
  );

  const openFabric = (f) => navigate(`/brand/fabrics/${f.slug || f.id}`);

  return (
    <BrandLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Available Fabrics</h1>
          <p className="text-sm text-gray-500">
            Curated catalogue for {user?.brand_name} · {filtered.length} SKU{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or code"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64"
          data-testid="brand-search"
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Package className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No fabrics available yet</h3>
          <p className="text-sm text-gray-500">Your Locofast relationship manager will unlock relevant categories shortly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="brand-fabric-grid">
          {filtered.map((f) => (
            <FabricCard key={f.id} f={f} onOpen={openFabric} />
          ))}
        </div>
      )}
    </BrandLayout>
  );
};

export default BrandFabrics;
