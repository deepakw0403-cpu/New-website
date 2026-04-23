import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBrandAuth } from "../../context/BrandAuthContext";
import { LogOut, Package, Building2, Loader2, Eye } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const BrandFabrics = () => {
  const { user, token, logout } = useBrandAuth();
  const navigate = useNavigate();
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate("/brand/login"); return; }
    if (user?.must_reset_password) { navigate("/brand/reset-password"); return; }
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/brand/fabrics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setFabrics(Array.isArray(data) ? data : []);
      } catch { /* noop */ }
      setLoading(false);
    };
    load();
  }, [token, user, navigate]);

  const handleLogout = () => { logout(); navigate("/brand/login"); };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Building2 className="text-white" size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user?.brand_name}</p>
              <p className="text-[11px] text-gray-500">Brand Portal · {user?.role === 'brand_admin' ? 'Admin' : 'Buyer'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden md:block">{user?.name}</span>
            {user?.role === 'brand_admin' && (
              <Link to="/brand/users" className="text-sm text-emerald-700 hover:underline" data-testid="brand-users-link">Manage Users</Link>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600" data-testid="brand-logout">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Available Fabrics</h1>
          <p className="text-sm text-gray-500">Browse SKUs curated for {user?.brand_name}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-emerald-600" size={24} />
          </div>
        ) : fabrics.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Package className="text-gray-300 mx-auto mb-3" size={40} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No fabrics available yet</h3>
            <p className="text-sm text-gray-500">Your Locofast relationship manager will unlock relevant categories shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="brand-fabric-grid">
            {fabrics.map(f => (
              <div key={f.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow" data-testid={`brand-fabric-${f.id}`}>
                <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                  <img src={f.images?.[0] || "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400"} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-900 truncate">{f.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{f.category_name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-700">₹{f.rate_per_meter || '—'}/m</span>
                    <Link to={`/brand/fabrics/${f.slug || f.id}`} className="text-xs flex items-center gap-1 text-gray-600 hover:text-emerald-700" data-testid={`brand-view-${f.id}`}>
                      <Eye size={12} /> View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrandFabrics;
