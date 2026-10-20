import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import AppNavbar from './components/AppNavbar.jsx';
import LoadingPage from './components/LoadingPage.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ProtectedRoute, RoleRoute } from './routes/ProtectedRoute.jsx';

const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));
const AlertsPage = lazy(() => import('./pages/AlertsPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const FarmDetailPage = lazy(() => import('./pages/FarmDetailPage.jsx'));
const FarmFormPage = lazy(() => import('./pages/FarmFormPage.jsx'));
const FarmListPage = lazy(() => import('./pages/FarmListPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage.jsx'));
const ResourceDetailPage = lazy(() => import('./pages/ResourceDetailPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrdersPage = lazy(() => import('./pages/OrdersPage.jsx'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage.jsx'));
const ForumPage = lazy(() => import('./pages/ForumPage.jsx'));
const ForumPostPage = lazy(() => import('./pages/ForumPostPage.jsx'));
const ConsultationsPage = lazy(() => import('./pages/ConsultationsPage.jsx'));
const ConsultationFormPage = lazy(() => import('./pages/ConsultationFormPage.jsx'));
const ConsultationDetailPage = lazy(() => import('./pages/ConsultationDetailPage.jsx'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => error.response?.status !== 401 && failureCount < 2,
      refetchOnWindowFocus: false,
    },
  },
});

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function AppRoutes() {
  const { t } = useTranslation();
  return (
    <>
      <a className="skip-link" href="#main-content">
        {t('skipToContent')}
      </a>
      <AppNavbar />
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <AlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <ResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources/:resourceId"
            element={
              <ProtectedRoute>
                <ResourceDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <RoleRoute roles={['farmer']}>
                <CartPage />
              </RoleRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <RoleRoute roles={['farmer']}>
                <CheckoutPage />
              </RoleRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <RoleRoute roles={['farmer', 'admin']}>
                <OrdersPage />
              </RoleRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <RoleRoute roles={['farmer', 'admin']}>
                <OrderDetailPage />
              </RoleRoute>
            }
          />
          <Route
            path="/forum"
            element={
              <ProtectedRoute>
                <ForumPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forum/posts/:postId"
            element={
              <ProtectedRoute>
                <ForumPostPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consultations"
            element={
              <ProtectedRoute>
                <ConsultationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consultations/new"
            element={
              <RoleRoute roles={['farmer']}>
                <ConsultationFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/consultations/:consultationId"
            element={
              <ProtectedRoute>
                <ConsultationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farms"
            element={
              <ProtectedRoute>
                <FarmListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farms/new"
            element={
              <ProtectedRoute>
                <FarmFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farms/:farmId"
            element={
              <ProtectedRoute>
                <FarmDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farms/:farmId/edit"
            element={
              <ProtectedRoute>
                <FarmFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <RoleRoute roles={['admin']}>
                <AdminPage />
              </RoleRoute>
            }
          />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <div className="app-shell">
              <AppRoutes />
            </div>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
