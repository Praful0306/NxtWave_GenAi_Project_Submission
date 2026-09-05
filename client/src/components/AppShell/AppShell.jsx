import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../Navbar';
import { useLanguageStore } from '../../store/languageStore';
import { cx } from '../ui';

const WIDTHS = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-7xl',
};

/**
 * Shared authenticated layout: header, page canvas, footer.
 * Loads the learner's languages once so the header's switcher works on every route.
 */
export default function AppShell({ children, width = 'default', className }) {
  const { languages, isLoading, fetchLanguages } = useLanguageStore();

  useEffect(() => {
    if (languages.length === 0 && !isLoading) fetchLanguages();
    // Run once on mount — the store owns refetching after mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <motion.main
        initial={{ y: 6 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cx('mx-auto w-full flex-1 px-4 py-8 sm:px-6 lg:px-8', WIDTHS[width], className)}
      >
        {children}
      </motion.main>

      <footer className="border-t border-line px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-[12px] text-ink-faint sm:flex-row">
          <p>© {new Date().getFullYear()} VaaniTutor — AI voice language tutor</p>
          <nav className="flex gap-4">
            <Link to="/privacy" className="hover:text-ink">Privacy</Link>
            <Link to="/terms" className="hover:text-ink">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
