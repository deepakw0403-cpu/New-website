import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";

// Public pages
import HomePage from "./pages/HomePage";
import FabricsPage from "./pages/FabricsPage";
import FabricDetailPage from "./pages/FabricDetailPage";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import CustomersPage from "./pages/CustomersPage";
import SuppliersPage from "./pages/SuppliersPage";
import MediaPage from "./pages/MediaPage";
import CareersPage from "./pages/CareersPage";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFabrics from "./pages/admin/AdminFabrics";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminSellers from "./pages/admin/AdminSellers";
import AdminEnquiries from "./pages/admin/AdminEnquiries";
import ProtectedRoute from "./components/ProtectedRoute";

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<><Navbar /><HomePage /><Footer /></>} />
          <Route path="/fabrics" element={<><Navbar /><FabricsPage /><Footer /></>} />
          <Route path="/fabrics/:id" element={<><Navbar /><FabricDetailPage /><Footer /></>} />
          <Route path="/about" element={<><Navbar /><AboutPage /><Footer /></>} />
          <Route path="/how-it-works" element={<><Navbar /><HowItWorksPage /><Footer /></>} />
          <Route path="/contact" element={<><Navbar /><ContactPage /><Footer /></>} />
          <Route path="/faq" element={<><Navbar /><FAQPage /><Footer /></>} />
          <Route path="/privacy" element={<><Navbar /><PrivacyPage /><Footer /></>} />
          <Route path="/terms" element={<><Navbar /><TermsPage /><Footer /></>} />
          <Route path="/customers" element={<><Navbar /><CustomersPage /><Footer /></>} />
          <Route path="/suppliers" element={<><Navbar /><SuppliersPage /><Footer /></>} />
          <Route path="/media" element={<><Navbar /><MediaPage /><Footer /></>} />
          <Route path="/careers" element={<><Navbar /><CareersPage /><Footer /></>} />
          
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/fabrics" element={<ProtectedRoute><AdminFabrics /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/enquiries" element={<ProtectedRoute><AdminEnquiries /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
