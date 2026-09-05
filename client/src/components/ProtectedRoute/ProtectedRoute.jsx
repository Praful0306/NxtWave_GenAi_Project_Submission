import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { BrandGlyph } from '../Brandmark';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas" role="status" aria-label="Checking your session">
        <div className="flex flex-col items-center gap-4">
          <BrandGlyph className="size-12 animate-pulse" />
          <p className="text-sm text-ink-faint">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}
