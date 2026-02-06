import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: "/fabrics", label: "Fabrics" },
    { path: "/about", label: "About" },
    { path: "/how-it-works", label: "How It Works" },
    { path: "/contact", label: "Contact" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-100" data-testid="navbar">
      <div className="container-main">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="navbar-logo">
            <span className="font-serif text-2xl font-medium tracking-tight">Locofast</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-link-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                className={`text-sm font-medium tracking-wide transition-colors duration-200 ${
                  isActive(link.path)
                    ? "text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link
              to="/fabrics"
              className="btn-primary inline-block"
              data-testid="nav-browse-btn"
            >
              Browse Fabrics
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-neutral-900"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 animate-slideDown" data-testid="mobile-menu">
          <div className="container-main py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block text-lg font-medium ${
                  isActive(link.path) ? "text-neutral-900" : "text-neutral-500"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/fabrics"
              onClick={() => setMobileOpen(false)}
              className="btn-primary inline-block mt-4"
            >
              Browse Fabrics
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
