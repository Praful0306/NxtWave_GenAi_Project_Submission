import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ArrowRight, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import { Card, Button, Badge, Alert, cx } from '../ui';

const shuffle = (arr) => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export default function GameActivity({ targetSentence = '', onComplete, isSubmitting = false }) {
  const tokens = useMemo(
    () =>
      targetSentence
        .replace(/[।.,?!]/g, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean),
    [targetSentence]
  );

  const [pool, setPool] = useState([]);
  const [built, setBuilt] = useState([]);
  const [correct, setCorrect] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const reset = useMemo(
    () => () => {
      const indexed = tokens.map((word, i) => ({ id: `${word}-${i}`, word }));
      // Re-shuffle until the order actually differs, so short phrases aren't handed to the learner solved.
      let scrambled = shuffle(indexed);
      if (indexed.length > 1) {
        let guard = 0;
        while (scrambled.every((t, i) => t.id === indexed[i].id) && guard++ < 8) {
          scrambled = shuffle(indexed);
        }
      }
      setPool(scrambled);
      setBuilt([]);
      setCorrect(null);
    },
    [tokens]
  );

  useEffect(() => {
    reset();
    setAttempts(0);
    setShowHint(false);
  }, [reset]);

  const pick = (item) => {
    setPool((p) => p.filter((w) => w.id !== item.id));
    setBuilt((b) => [...b, item]);
    setCorrect(null);
  };

  const unpick = (item) => {
    setBuilt((b) => b.filter((w) => w.id !== item.id));
    setPool((p) => [...p, item]);
    setCorrect(null);
  };

  const check = () => {
    const next = attempts + 1;
    setAttempts(next);
    const ok = built.map((w) => w.word).join(' ') === tokens.join(' ');
    setCorrect(ok);
    if (!ok && next >= 2) setShowHint(true);
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Badge tone="brand">Activity 2 of 3</Badge>
          <h2 className="mt-2 font-display text-lg font-bold text-ink">Put the words in order</h2>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            Tap the words below to rebuild the sentence you just practised.
          </p>
        </div>
        {attempts > 0 && (
          <span className="tabular font-mono text-[11px] text-ink-faint">
            {attempts} attempt{attempts > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Build area */}
      <div
        className={cx(
          'mt-5 min-h-[92px] rounded-xl border-2 border-dashed p-4 transition-colors duration-200',
          correct === true
            ? 'border-positive bg-positive-soft'
            : correct === false
              ? 'border-critical bg-critical-soft'
              : 'border-line-strong bg-surface-inset'
        )}
      >
        {built.length === 0 ? (
          <p className="grid h-full min-h-[60px] place-items-center text-center text-[13px] text-ink-faint">
            Your sentence appears here
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {built.map((item) => (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ scale: 0.85 }}
                  animate={{ scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.16 }}
                  type="button"
                  onClick={() => unpick(item)}
                  className="min-h-11 cursor-pointer rounded-lg border border-brand bg-surface px-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-surface-hover"
                >
                  {item.word}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Word pool */}
      <div className="mt-4 flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {pool.map((item) => (
            <motion.button
              key={item.id}
              layout
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.16 }}
              type="button"
              onClick={() => pick(item)}
              className="min-h-11 cursor-pointer rounded-lg border border-line-strong bg-surface px-3.5 text-[15px] font-semibold text-ink-soft transition-[background-color,border-color,color] hover:border-brand hover:bg-surface-hover hover:text-ink"
            >
              {item.word}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Feedback */}
      {correct === true && (
        <Alert tone="positive" icon={CheckCircle2} title="That's the right order" className="mt-4">
          You rebuilt the phrase exactly.
        </Alert>
      )}
      {correct === false && (
        <Alert tone="critical" icon={AlertCircle} title="Not quite yet" className="mt-4">
          Tap a word in your sentence to send it back, then try a different order.
        </Alert>
      )}
      {showHint && correct !== true && (
        <Alert tone="caution" icon={Lightbulb} title="Hint" className="mt-2">
          The sentence starts with “{tokens[0]}”.
        </Alert>
      )}

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-2 border-t border-line pt-5 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={reset} disabled={built.length === 0 || isSubmitting}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset
        </Button>

        {correct === true ? (
          <Button
            onClick={() => onComplete?.({ completed: true, correct: true, attempts: attempts || 1 })}
            loading={isSubmitting}
          >
            Continue to quiz
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button onClick={check} disabled={pool.length > 0 || built.length === 0 || isSubmitting}>
            Check order
          </Button>
        )}
      </div>
    </Card>
  );
}
