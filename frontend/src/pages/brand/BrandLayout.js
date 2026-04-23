import { Link, useLocation, useNavigate } from "react-router-dom";
import { useBrandAuth } from "../../context/BrandAuthContext";
import { Building2, Package, Users, LogOut, ShoppingBag, Wallet } from "lucide-react";

/**
 * Brand Portal shell. The header deliberately does NOT surface "Credit & Samples"
 * as a primary nav item — balances are shown inline on the catalog/detail pages
 * and the full ledger lives at /brand/account (reachable via the small wallet
 * affordance on the right of the header).
 */
const BrandLayout = ({ children }) => {
  const { user, logout } = useBrandAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const nav = [
    { to: "/brand/fabrics", label: "Catalog", icon: Package },
    { to: "/brand/orders", label: "Orders", icon: ShoppingBag },
    ...(user?.role === "brand_admin" ? [{ to: "/brand/users", label: "Users", icon: Users }] : []),
  ];

  const handleLogout = () => { logout(); navigate("/brand/login"); };
  const isActive = (p) => pathname === p || pathname.startsWith(p + "/");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/brand/fabrics" className="flex items-center gap-3" data-testid="brand-header-home">
            {user?.brand_logo_url ? (
              <img
                src={user.brand_logo_url}
                alt={user.brand_name}
                className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                data-testid="brand-header-logo"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Building2 className="text-white" size={18} />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900" data-testid="brand-header-name">{user?.brand_name}</p>
              <p className="text-[11px] text-gray-500">
                {user?.designation || (user?.role === "brand_admin" ? "Admin" : "Buyer")}
              </p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                data-testid={`brand-nav-${n.to.split("/").pop()}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(n.to)
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <n.icon size={14} />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {/* Unobtrusive wallet affordance — users who WANT the ledger can reach
                it, but it doesn't dominate the top nav like before. */}
            <Link
              to="/brand/account"
              title="Credit & Sample balances"
              className={`p-2 rounded-md transition-colors ${isActive("/brand/account") ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
              data-testid="brand-nav-account"
            >
              <Wallet size={16} />
            </Link>
            <span className="text-sm text-gray-600 hidden md:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600"
              data-testid="brand-logout"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
};

export default BrandLayout;
