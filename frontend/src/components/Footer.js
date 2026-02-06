import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-white" data-testid="footer">
      <div className="container-main py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <span className="font-serif text-3xl font-medium tracking-tight">Locofast</span>
            </Link>
            <p className="text-neutral-400 max-w-md leading-relaxed">
              A platform connecting fabric buyers with textile suppliers. Browse catalogs, review specifications, submit enquiries.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="subheading text-neutral-400 mb-6">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/fabrics" className="text-neutral-300 hover:text-white transition-colors" data-testid="footer-fabrics-link">
                  Browse Fabrics
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-neutral-300 hover:text-white transition-colors" data-testid="footer-about-link">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-neutral-300 hover:text-white transition-colors" data-testid="footer-how-link">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-neutral-300 hover:text-white transition-colors" data-testid="footer-contact-link">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="subheading text-neutral-400 mb-6">Contact</h4>
            <ul className="space-y-3 text-neutral-300">
              <li>mail@locofast.com</li>
              <li>+91 8920 392 418</li>
              <li className="pt-2">
                <span className="block text-neutral-500 text-sm">Headquarters</span>
                New Delhi, India
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-sm">
            © {new Date().getFullYear()} Locofast. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/admin/login" className="text-neutral-600 hover:text-neutral-400 text-sm transition-colors" data-testid="admin-link">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
