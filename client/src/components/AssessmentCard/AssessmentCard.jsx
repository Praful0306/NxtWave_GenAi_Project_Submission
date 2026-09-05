import { motion } from 'framer-motion';
import AudioPlayer from '../AudioPlayer/AudioPlayer';
import { Card, Badge, Button, cx } from '../ui';
import { RotateCcw, ArrowRight, Sparkles, Quote, CheckCircle2 } from 'lucide-react';

const ERROR_TYPES = {
  grammar: { label: 'Grammar', tone: 'critical' },
  vocabulary: { label: 'Vocabulary', tone: 'caution' },
  word_order: { label: 'Word order', tone: 'brand' },
  register: { label: 'Formality', tone: 'accent' },
  pronunciation_note: { label: 'Pronunciation', tone: 'positive' },
  other: { label: 'Suggestion', tone: 'neutral' },
};

/** Score ring — colour follows the band, so the read is instant. */
function ScoreRing({ score }) {
  const clamped = Math.max(0, Math.min(100, score || 0));
  const R = 30;
  const C = 2 * Math.PI * R;
  const band = clamped >= 80 ? 'positive' : clamped >= 60 ? 'caution' : 'critical';
  const stroke = {
    positive: 'stroke-[var(--positive-fg)]',
    caution: 'stroke-[var(--caution-fg)]',
    critical: 'stroke-[var(--critical-fg)]',
  }[band];
  const fg = { positive: 'text-positive', caution: 'text-caution', critical: 'text-critical' }[band];

  return (
    <div className="relative grid size-[76px] shrink-0 place-items-center">
      <svg viewBox="0 0 72 72" className="absolute size-full -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={R} fill="none" strokeWidth="6" className="stroke-[var(--line)]" />
        <motion.circle
          cx="36"
          cy="36"
          r={R}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={stroke}
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - (clamped / 100) * C }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="text-center leading-none">
        <div className={cx('tabular font-display text-xl font-bold', fg)}>{clamped}</div>
        <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink-faint">Fluency</div>
      </div>
    </div>
  );
}

export default function AssessmentCard({
  assessment,
  targetSentence,
  userTranscript,
  onRetry,
  onNext,
  nextLabel = 'Continue',
  isLoading = false,
}) {
  if (!assessment) return null;

  const {
    correctedText,
    errors = [],
    fluencyScore = 0,
    encouragement = '',
    aiReply = '',
    providerUsed = '',
    languageCode = 'hi-IN',
  } = assessment;

  return (
    <motion.div
      initial={{ y: 12 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      {/* Score + encouragement */}
      <Card className="flex items-center gap-4 p-5">
        <ScoreRing score={fluencyScore} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold text-ink">How that went</h3>
          {encouragement && <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{encouragement}</p>}
          {providerUsed && (
            <p className="mt-2 font-mono text-[11px] text-ink-faint">Assessed by {providerUsed}</p>
          )}
        </div>
      </Card>

      {/* Comparison */}
      <Card className="divide-y divide-[var(--line)]">
        {targetSentence && (
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Target</p>
            <p className="mt-1.5 text-[15px] font-medium text-ink">{targetSentence}</p>
          </div>
        )}

        <div className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">You said</p>
          <p className="mt-1.5 text-[15px] font-medium text-ink-soft">{userTranscript || '—'}</p>
        </div>

        {correctedText && (
          <div className="bg-positive-soft/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-positive">Corrected</p>
              <AudioPlayer text={correctedText} languageCode={languageCode} label="Hear it" />
            </div>
            <p className="mt-1.5 text-[15px] font-semibold text-ink">{correctedText}</p>
          </div>
        )}
      </Card>

      {/* Errors */}
      {errors.length === 0 ? (
        <Card className="flex items-center gap-3 p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-positive-soft text-positive">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </span>
          <p className="text-[13px] text-ink-soft">
            <span className="font-semibold text-ink">Nothing to correct.</span> Grammar, vocabulary and register all
            matched the target.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          <h4 className="text-[13px] font-bold text-ink">
            {errors.length} thing{errors.length > 1 ? 's' : ''} to work on
          </h4>
          {errors.map((err, i) => {
            const type = ERROR_TYPES[err.type] || ERROR_TYPES.other;
            return (
              <Card key={i} className="p-4">
                <Badge tone={type.tone}>{type.label}</Badge>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="rounded-md bg-critical-soft px-2 py-1 font-medium text-critical line-through">
                    {err.original}
                  </span>
                  <ArrowRight className="size-3.5 text-ink-faint" aria-hidden="true" />
                  <span className="rounded-md bg-positive-soft px-2 py-1 font-semibold text-positive">
                    {err.corrected}
                  </span>
                </div>
                {err.explanation && (
                  <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">{err.explanation}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Premium roleplay reply */}
      {aiReply && (
        <Card className="border-brand bg-brand-soft p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-softfg">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Your tutor replies
            </span>
            <AudioPlayer text={aiReply} languageCode={languageCode} label="Hear reply" />
          </div>
          <p className="mt-3 flex gap-2 text-[15px] font-medium leading-relaxed text-ink">
            <Quote className="mt-1 size-4 shrink-0 text-brand" aria-hidden="true" />
            {aiReply}
          </p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {onRetry && (
          <Button variant="outline" onClick={onRetry} disabled={isLoading}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        )}
        {onNext && (
          <Button onClick={onNext} loading={isLoading}>
            {nextLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
