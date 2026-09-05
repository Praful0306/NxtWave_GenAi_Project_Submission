import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Brandmark from './Brandmark';
import ThemeToggle from './ThemeToggle/ThemeToggle';
import { Card, Button, cx } from './ui';
import { oauthUrl } from '../services/api';

/** Full-page frame shared by every auth screen. */
export default function AuthLayout({ title, subtitle, children, footer, wide = false }) {
  return (
    <div className="auth-shell relative">
      <div className="blueprint pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative w-full" style={{ maxWidth: wide ? '30rem' : '26rem' }}>
        <div className="mb-6 flex items-center justify-between">
          <Brandmark />
          <ThemeToggle size="sm" />
        </div>

        <motion.div
          initial={{ y: 14 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-6 shadow-lg sm:p-8">
            <header className="mb-6">
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
              {subtitle && <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{subtitle}</p>}
            </header>

            {children}
          </Card>
        </motion.div>

        {footer && <p className="mt-6 text-center text-[13px] text-ink-soft">{footer}</p>}
      </div>
    </div>
  );
}

export function Divider({ children = 'or' }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** Google + Zoho sign-in. Redirects to server-node, which owns the OAuth exchange. */
export function OAuthButtons({ className }) {
  const go = (provider) => {
    window.location.href = oauthUrl(provider);
  };

  return (
    <div className={cx('grid gap-2.5', className)}>
      <Button variant="outline" onClick={() => go('google')} className="w-full">
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </Button>

      <Button variant="outline" onClick={() => go('zoho')} className="w-full">
        <span className="font-display text-[13px] font-extrabold tracking-tight text-[#E42527]">ZOHO</span>
        Continue with Zoho
      </Button>
    </div>
  );
}

export function AuthLink({ to, children }) {
  return (
    <Link to={to} className="font-semibold text-brand underline-offset-2 hover:underline">
      {children}
    </Link>
  );
}
