import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";

// Public pages
import HomePage from "./pages/HomePage";
import FabricsPage from "./pages/FabricsPage";
import FabricDetailPage from "./pages/FabricDetailPage";
import CollectionsPage from "./pages/CollectionsPage";
import CollectionDetailPage from "./pages/CollectionDetailPage";
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

// Tools pages
import {
  ToolsPage,
  GSTCalculator,
  ProfitMarginCalculator,
  DiscountCalculator,
  GSMCalculator,
  CBMCalculator,
  VolumetricWeightCalculator,
  ProductDescriptionGenerator,
  ProductTitleGenerator,
  BarcodeGenerator
} from "./pages/tools";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFabrics from "./pages/admin/AdminFabrics";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminSellers from "./pages/admin/AdminSellers";
import AdminCollections from "./pages/admin/AdminCollections";
import AdminArticles from "./pages/admin/AdminArticles";
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
          <Route path="/fabrics" element={<FabricsPage />} />
          <Route path="/fabrics/:id" element={<FabricDetailPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:id" element={<CollectionDetailPage />} />
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
          <Route path="/admin/sellers" element={<ProtectedRoute><AdminSellers /></ProtectedRoute>} />
          <Route path="/admin/collections" element={<ProtectedRoute><AdminCollections /></ProtectedRoute>} />
          <Route path="/admin/articles" element={<ProtectedRoute><AdminArticles /></ProtectedRoute>} />
          <Route path="/admin/enquiries" element={<ProtectedRoute><AdminEnquiries /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
