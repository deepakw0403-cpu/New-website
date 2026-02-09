import { Link } from "react-router-dom";
import { Linkedin, Facebook, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  const offices = [
    { 
      city: "New Delhi", 
      address: ["Desk Connect - First Floor,", "Plot No-2, Kh.No. 384/2, 100", "feet Rd, Mehrauli-Gurgaon", "Rd, Opp. Corporation Bank,", "Ghitorni, New Delhi 110030"],
      type: "Headquarters" 
    },
    { 
      city: "Noida", 
      address: ["1st Floor, Plot No.D-107,", "Vyapar Marg, D Block, Noida", "Sector-2 Uttar Pradesh", "201301"]
    },
    { 
      city: "Gurugram", 
      address: ["NH8-Udyog Vihar, 90B, Delhi", "- Jaipur Expy, Udyog Vihar,", "Sector 18, Gurugram,", "Haryana 122008"]
    },
    { 
      city: "Jaipur", 
      address: ["34/6, Kiran Path,", "Mansarovar Sector 3,", "Mansarovar, Jaipur,", "Rajasthan 302020"]
    },
    { 
      city: "Ahmedabad", 
      address: ["SSPACIA 4th floor, Agrawal", "Complex, Chimanlal", "Girdharlal Rd, Ahmedabad,", "Gujarat, 380009"]
    },
    { 
      city: "Bangladesh", 
      address: ["Workstation 101, Uttara", "Tower, Level 4, 1 Jashimuddin", "Avenue, Sector 3, Uttara C/A", "Dhaka 1230, Bangladesh"]
    },
  ];

  return (
    <footer className="bg-[#1F2937] text-white" data-testid="footer">
      {/* Offices Section */}
      <div className="border-b border-gray-700">
        <div className="container-main py-16">
          <h3 className="text-xl font-semibold mb-8">Our Offices</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8">
            {offices.map((office, index) => (
              <div key={index}>
                <p className="font-medium text-white mb-2">
                  {office.city}
                </p>
                <div className="text-neutral-400 text-sm leading-relaxed">
                  {office.address.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-main py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand & Social */}
          <div className="md:col-span-1">
            <a href="https://www.locofast.com" className="inline-block mb-6" target="_blank" rel="noopener noreferrer">
              <img 
                src="https://customer-assets.emergentagent.com/job_locofast-cms/artifacts/xkuf449w_Locofast%20-%20Medium.svg" 
                alt="Locofast" 
                className="h-8 brightness-0 invert"
              />
            </a>
            <div className="flex items-center gap-4 mt-4">
              <a 
                href="https://in.linkedin.com/company/locofast" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a 
                href="https://www.facebook.com/Locofast/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://www.instagram.com/locofast_official" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.youtube.com/channel/UCpbLo84Y_BVTcIzHHrBjIkw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="subheading text-neutral-500 mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-neutral-300 hover:text-white transition-colors text-sm" data-testid="footer-about">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/customers" className="text-neutral-300 hover:text-white transition-colors text-sm" data-testid="footer-customers">
                  Customers
                </Link>
              </li>
              <li>
                <Link to="/suppliers" className="text-neutral-300 hover:text-white transition-colors text-sm" data-testid="footer-suppliers">
                  Suppliers
                </Link>
              </li>
              <li>
                <Link to="/media" className="text-neutral-300 hover:text-white transition-colors text-sm" data-testid="footer-media">
                  Media & Awards
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="subheading text-neutral-500 mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/careers" className="text-neutral-300 hover:text-white transition-colors text-sm" data-testid="footer-careers">
                  Life at Locofast
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-neutral-300 hover:text-white transition-colors text-sm" data-testid="footer-faq">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-neutral-300 hover:text-white transition-colors text-sm" data-testid="footer-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-neutral-300 hover:text-white transition-colors text-sm" data-testid="footer-terms">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="subheading text-neutral-500 mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="tel:+918920392418" className="text-neutral-300 hover:text-white transition-colors text-sm">
                  +91 8920 392 418
                </a>
              </li>
              <li>
                <a href="mailto:mail@locofast.com" className="text-neutral-300 hover:text-white transition-colors text-sm">
                  mail@locofast.com
                </a>
              </li>
              <li className="pt-2">
                <Link to="/contact" className="text-neutral-300 hover:text-white transition-colors text-sm" data-testid="footer-contact">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-sm">
            © {new Date().getFullYear()} Locofast Online Services Pvt. Ltd.
          </p>
          <Link to="/admin/login" className="text-neutral-600 hover:text-neutral-400 text-sm transition-colors" data-testid="admin-link">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
