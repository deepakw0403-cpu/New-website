import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBrandAuth } from "../../context/BrandAuthContext";
import BrandLayout from "./BrandLayout";
import { Package, Loader2, Eye } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

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
    !q || (f.name || "").toLowerCase().includes(q.toLowerCase()) || (f.fabric_code || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <BrandLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Available Fabrics</h1>
          <p className="text-sm text-gray-500">Curated catalogue for {user?.brand_name}</p>
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
            <Link
              key={f.id}
              to={`/brand/fabrics/${f.slug || f.id}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
              data-testid={`brand-fabric-${f.id}`}
            >
              <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                <img
                  src={f.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400"}
                  alt={f.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm text-gray-900 truncate">{f.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{f.category_name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-700">₹{f.rate_per_meter || "—"}/m</span>
                  <span className="text-xs flex items-center gap-1 text-gray-600 group-hover:text-emerald-700">
                    <Eye size={12} /> Open
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </BrandLayout>
  );
};

export default BrandFabrics;
