import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Bell, Search } from "lucide-react";

export default function TopAppBar({ title, showBack = false, showSearch = true, showNotifications = true, onSearchClick, hasNotifications = false, right = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/m" || location.pathname === "/m/";

  return (
    <header className="m-appbar">
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
        {showBack && !isHome ? (
          <button className="m-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <div className="m-appbar-logo">
            <span className="m-appbar-logo-mark">L</span>
            <span>locofast</span>
          </div>
        )}
        {title && (
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--m-ink)", marginLeft: showBack ? 4 : 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </div>
        )}
      </div>
      <div className="m-appbar-actions">
        {right}
        {showSearch && (
          <button className="m-icon-btn" onClick={onSearchClick || (() => navigate("/m/catalog?focus=search"))} aria-label="Search">
            <Search size={20} />
          </button>
        )}
        {showNotifications && (
          <button className="m-icon-btn" onClick={() => navigate("/m/notifications")} aria-label="Notifications">
            <Bell size={20} />
            {hasNotifications && <span className="m-dot" />}
          </button>
        )}
      </div>
    </header>
  );
}
