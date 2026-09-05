import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Brandmark from '../components/Brandmark';
import { Button } from '../components/ui';

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-4">
      <div className="blueprint pointer-events-none absolute inset-0" aria-hidden="true" />

      <motion.div
        initial={{ y: 12 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center gap-6 text-center"
      >
        <Brandmark />

        <div className="space-y-2">
          <p className="font-mono text-[13px] font-bold uppercase tracking-[0.2em] text-brand">404</p>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            This page doesn’t exist
          </h1>
          <p className="max-w-sm text-sm text-ink-soft">
            The link may be out of date. Your roadmaps and progress are safe.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button as={Link} to="/dashboard">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to dashboard
          </Button>
          <Button as={Link} to="/" variant="ghost">
            Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
