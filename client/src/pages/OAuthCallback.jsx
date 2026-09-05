import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { BrandGlyph } from '../components/Brandmark';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      login(token);
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, [params, login, navigate]);

  return (
    <div className="auth-shell" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrandGlyph className="size-12" />
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Finishing your sign-in…
        </div>
      </div>
    </div>
  );
}
