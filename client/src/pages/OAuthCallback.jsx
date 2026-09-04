import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token);
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="auth-container">
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-primary-600)', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Completing your sign in...</p>
      </div>
    </div>
  );
}
