import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Brandmark from './Brandmark';
import ThemeToggle from './ThemeToggle/ThemeToggle';

/** Contact address shown on both legal pages. Change here to change both. */
export const LEGAL_CONTACT = 'prafuldkasamalagi2353@gmail.com';

/** Keep in sync when the policies are materially edited. */
export const LEGAL_UPDATED = '5 September 2026';

/** Shared reading frame for the privacy policy and terms pages. */
export default function LegalLayout({ title, intro, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Brandmark />
          <ThemeToggle size="sm" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to home
        </Link>

        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 text-[13px] text-ink-faint">Last updated {LEGAL_UPDATED}</p>
        {intro && <p className="mt-5 text-[16px] leading-relaxed text-ink-soft">{intro}</p>}

        <div className="mt-10 space-y-9">{children}</div>

        <p className="mt-12 border-t border-line pt-6 text-[13px] text-ink-faint">
          Questions about this page? Email{' '}
          <a href={`mailto:${LEGAL_CONTACT}`} className="font-semibold text-brand hover:underline">
            {LEGAL_CONTACT}
          </a>
          .
        </p>
      </main>

      <footer className="border-t border-line px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 text-[12px] text-ink-faint">
          <p>© {new Date().getFullYear()} VaaniTutor</p>
          <nav className="flex gap-4">
            <Link to="/privacy" className="hover:text-ink">Privacy</Link>
            <Link to="/terms" className="hover:text-ink">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** One titled section of a legal document. */
export function Section({ heading, children }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold text-ink">{heading}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

/** Bulleted list with consistent spacing. */
export function Bullets({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
