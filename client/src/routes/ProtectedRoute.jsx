import { Navigate, useLocation } from 'react-router-dom';

import LoadingPage from '../components/LoadingPage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children }) {
  const { isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingPage />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

export function RoleRoute({ roles, children }) {
  const { isLoading, user } = useAuth();

  if (isLoading) return <LoadingPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
