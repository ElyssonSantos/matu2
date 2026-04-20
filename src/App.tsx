import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/layouts/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Account from "./pages/Account";
import AccessDenied from "./pages/AccessDenied";
import ProductDetail from "./pages/ProductDetail";
import Search from "./pages/Search";
import ClientDashboard from "./pages/ClientDashboard";
import PublicWishlist from "./pages/PublicWishlist";
import Category from "./pages/Category";
import OrderTracking from "./pages/OrderTracking";
import CompareProducts from "./pages/CompareProducts";
import DashboardStats from "./pages/admin/DashboardStats";
import ProductsMultiImage from "./pages/admin/ProductsMultiImage";
import Categories from "./pages/admin/Categories";
import Banners from "./pages/admin/Banners";
import Coupons from "./pages/admin/Coupons";
import Users from "./pages/admin/Users";
import Roles from "./pages/admin/Roles";
import Orders from "./pages/admin/Orders";
import Encartes from "./pages/admin/Encartes";
import SiteSettings from "./pages/admin/SiteSettings";
import Analytics from "./pages/admin/Analytics";
import Reviews from "./pages/admin/Reviews";
import SystemNotifications from "./pages/admin/SystemNotifications";
import ReviewsDashboard from "./pages/admin/ReviewsDashboard";
import AuditLogs from "./pages/admin/AuditLogs";
import RotatingMessages from "./pages/admin/RotatingMessages";
import PopupCoupons from "./pages/admin/PopupCoupons";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/produto/:slug" element={<ProductDetail />} />
              <Route path="/buscar" element={<Search />} />
              <Route path="/categoria/:slug" element={<Category />} />
              <Route path="/wishlist/:userId" element={<PublicWishlist />} />
              <Route path="/pedido/:id" element={<OrderTracking />} />
              <Route path="/comparar" element={<CompareProducts />} />
              <Route path="/account" element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              } />
              <Route path="/cliente/dashboard" element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/access-denied" element={<AccessDenied />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireStaff>
                  <AdminLayout>
                    <DashboardStats />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/products" element={
                <ProtectedRoute requireStaff>
                  <AdminLayout>
                    <ProductsMultiImage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/categories" element={
                <ProtectedRoute requireStaff>
                  <AdminLayout>
                    <Categories />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/banners" element={
                <ProtectedRoute requireStaff>
                  <AdminLayout>
                    <Banners />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/coupons" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <Coupons />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <Users />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/roles" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <Roles />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute requireStaff>
                  <AdminLayout>
                    <Orders />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/encartes" element={
                <ProtectedRoute requireStaff>
                  <AdminLayout>
                    <Encartes />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedRoute requireStaff>
                  <AdminLayout>
                    <Analytics />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/site-settings" element={
                <ProtectedRoute requireStaff>
                  <AdminLayout>
                    <SiteSettings />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/reviews" element={
                <ProtectedRoute requireStaff>
                  <AdminLayout>
                    <Reviews />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/system-notifications" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <SystemNotifications />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/reviews-dashboard" element={
                <ProtectedRoute requireStaff>
                  <AdminLayout>
                    <ReviewsDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/audit-logs" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AuditLogs />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/rotating-messages" element={
                <ProtectedRoute requireStaff>
                  <AdminLayout>
                    <RotatingMessages />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/audit-logs" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <AuditLogs />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/popup-coupons" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout>
                    <PopupCoupons />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
