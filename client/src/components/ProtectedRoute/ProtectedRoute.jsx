import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute — wraps authenticated routes.
 * Redirects to /login if no valid token.
 * Shows a loading spinner while checking auth.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="auth-container">
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-primary-500)' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
