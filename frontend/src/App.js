import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { VendorAuthProvider } from "./context/VendorAuthContext";
import WhatsAppChat from "./components/WhatsAppChat";

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
import AssistedSourcingPage from "./pages/AssistedSourcingPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import InventoryPage from "./pages/InventoryPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";

// Vendor pages
import VendorLogin from "./pages/vendor/VendorLogin";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorInventory from "./pages/vendor/VendorInventory";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorProtectedRoute from "./components/VendorProtectedRoute";

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
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminFabricSEO from "./pages/admin/AdminFabricSEO";
import AdminBlog from "./pages/admin/AdminBlog";
import ProtectedRoute from "./components/ProtectedRoute";

// SEO Landing Pages
import FabricsHub from "./pages/seo/FabricsHub";
// Denim SEO Pages
import DenimCategory from "./pages/seo/denim/DenimCategory";
import Denim8oz from "./pages/seo/denim/Denim8oz";
import Denim10oz from "./pages/seo/denim/Denim10oz";
import Denim12oz from "./pages/seo/denim/Denim12oz";
import DenimStretch from "./pages/seo/denim/DenimStretch";
import DenimRigid from "./pages/seo/denim/DenimRigid";
import DenimIndigoDyed from "./pages/seo/denim/DenimIndigoDyed";
import DenimForJeans from "./pages/seo/denim/DenimForJeans";
import DenimBulkSuppliers from "./pages/seo/denim/DenimBulkSuppliers";
import DenimManufacturers from "./pages/seo/denim/DenimManufacturers";
// Poly Knit SEO Pages
import PolyKnitCategory from "./pages/seo/poly-knit/PolyKnitCategory";
import PolyKnit180gsm from "./pages/seo/poly-knit/PolyKnit180gsm";
import PolyKnit220gsm from "./pages/seo/poly-knit/PolyKnit220gsm";
import PolyKnit240gsm from "./pages/seo/poly-knit/PolyKnit240gsm";
import PolyKnitInterlock from "./pages/seo/poly-knit/PolyKnitInterlock";
import PolyKnitJersey from "./pages/seo/poly-knit/PolyKnitJersey";
import PolyKnitMoistureWicking from "./pages/seo/poly-knit/PolyKnitMoistureWicking";
import PolyKnitSportswear from "./pages/seo/poly-knit/PolyKnitSportswear";
import PolyKnitBulkSuppliers from "./pages/seo/poly-knit/PolyKnitBulkSuppliers";
import PolyKnitManufacturers from "./pages/seo/poly-knit/PolyKnitManufacturers";

// Layout
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <HelmetProvider>
    <VendorAuthProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<><Navbar /><HomePage /><Footer /></>} />
          <Route path="/fabrics" element={<FabricsPage />} />
          <Route path="/fabrics/:id" element={<FabricDetailPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/inventory" element={<Navigate to="/fabrics" replace />} />
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
          <Route path="/assisted-sourcing" element={<AssistedSourcingPage />} />
          
          {/* Blog routes */}
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          
          {/* Checkout & Order routes */}
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
          
          {/* Tools routes - SEO friendly individual pages */}
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/gst-calculator" element={<GSTCalculator />} />
          <Route path="/tools/profit-margin-calculator" element={<ProfitMarginCalculator />} />
          <Route path="/tools/discount-calculator" element={<DiscountCalculator />} />
          <Route path="/tools/gsm-calculator" element={<GSMCalculator />} />
          <Route path="/tools/cbm-calculator" element={<CBMCalculator />} />
          <Route path="/tools/volumetric-weight-calculator" element={<VolumetricWeightCalculator />} />
          <Route path="/tools/product-description-generator" element={<ProductDescriptionGenerator />} />
          <Route path="/tools/product-title-generator" element={<ProductTitleGenerator />} />
          <Route path="/tools/barcode-generator" element={<BarcodeGenerator />} />
          
          {/* SEO Landing Pages - Fabrics */}
          <Route path="/fabrics-info/" element={<FabricsHub />} />
          
          {/* Denim SEO Pages */}
          <Route path="/fabrics/denim/" element={<DenimCategory />} />
          <Route path="/fabrics/denim/8-oz/" element={<Denim8oz />} />
          <Route path="/fabrics/denim/10-oz/" element={<Denim10oz />} />
          <Route path="/fabrics/denim/12-oz/" element={<Denim12oz />} />
          <Route path="/fabrics/denim/stretch/" element={<DenimStretch />} />
          <Route path="/fabrics/denim/rigid/" element={<DenimRigid />} />
          <Route path="/fabrics/denim/indigo-dyed/" element={<DenimIndigoDyed />} />
          <Route path="/fabrics/denim/for-jeans-manufacturers/" element={<DenimForJeans />} />
          <Route path="/fabrics/denim/bulk-suppliers-india/" element={<DenimBulkSuppliers />} />
          <Route path="/fabrics/denim/denim-fabric-manufacturers-in-india/" element={<DenimManufacturers />} />
          
          {/* Poly Knit SEO Pages */}
          <Route path="/fabrics/poly-knit-fabrics/" element={<PolyKnitCategory />} />
          <Route path="/fabrics/poly-knit-fabrics/180-gsm/" element={<PolyKnit180gsm />} />
          <Route path="/fabrics/poly-knit-fabrics/220-gsm/" element={<PolyKnit220gsm />} />
          <Route path="/fabrics/poly-knit-fabrics/240-gsm/" element={<PolyKnit240gsm />} />
          <Route path="/fabrics/poly-knit-fabrics/interlock/" element={<PolyKnitInterlock />} />
          <Route path="/fabrics/poly-knit-fabrics/jersey/" element={<PolyKnitJersey />} />
          <Route path="/fabrics/poly-knit-fabrics/moisture-wicking/" element={<PolyKnitMoistureWicking />} />
          <Route path="/fabrics/poly-knit-fabrics/for-sportswear/" element={<PolyKnitSportswear />} />
          <Route path="/fabrics/poly-knit-fabrics/bulk-suppliers-india/" element={<PolyKnitBulkSuppliers />} />
          <Route path="/fabrics/poly-knit-fabrics/polyester-knit-fabric-manufacturers-in-india/" element={<PolyKnitManufacturers />} />
          
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/fabrics" element={<ProtectedRoute><AdminFabrics /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/sellers" element={<ProtectedRoute><AdminSellers /></ProtectedRoute>} />
          <Route path="/admin/collections" element={<ProtectedRoute><AdminCollections /></ProtectedRoute>} />
          <Route path="/admin/articles" element={<ProtectedRoute><AdminArticles /></ProtectedRoute>} />
          <Route path="/admin/enquiries" element={<ProtectedRoute><AdminEnquiries /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/coupons" element={<ProtectedRoute><AdminCoupons /></ProtectedRoute>} />
          <Route path="/admin/seo" element={<ProtectedRoute><AdminFabricSEO /></ProtectedRoute>} />
          <Route path="/admin/blog" element={<ProtectedRoute><AdminBlog /></ProtectedRoute>} />

          {/* Vendor routes */}
          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/vendor" element={<VendorProtectedRoute><VendorDashboard /></VendorProtectedRoute>} />
          <Route path="/vendor/inventory" element={<VendorProtectedRoute><VendorInventory /></VendorProtectedRoute>} />
          <Route path="/vendor/orders" element={<VendorProtectedRoute><VendorOrders /></VendorProtectedRoute>} />
        </Routes>
        <WhatsAppChat />
      </BrowserRouter>
    </AuthProvider>
    </VendorAuthProvider>
    </HelmetProvider>
  );
}

export default App;
