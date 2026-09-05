import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Trophy } from 'lucide-react';
import { Card, Button, Badge, ProgressBar, cx } from '../ui';

export default function QuizActivity({
  quiz = [],
  dayNumber,
  targetSentence = '',
  onComplete,
  isSubmitting = false,
}) {
  // The roadmap normally supplies the quiz; this keeps the day completable if it didn't.
  const questions = useMemo(() => {
    if (quiz?.length) return quiz;
    return [
      {
        question: `Which phrase did you practise on day ${dayNumber}?`,
        options: [targetSentence, 'A different greeting', 'An unrelated sentence', 'None of these'],
        correctAnswerIndex: 0,
      },
      {
        question: 'When would you use this phrase?',
        options: [
          'Greeting someone or introducing yourself',
          'Only when leaving a room',
          'Only in written letters',
          'Never in polite conversation',
        ],
        correctAnswerIndex: 0,
      },
    ];
  }, [quiz, dayNumber, targetSentence]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const question = questions[index];
  const choice = answers[index];
  const isLast = index === questions.length - 1;

  const advance = () => {
    if (!isLast) {
      setIndex((i) => i + 1);
      setRevealed(false);
      return;
    }

    let right = 0;
    const summary = questions.map((q, i) => {
      const ok = answers[i] === q.correctAnswerIndex;
      if (ok) right += 1;
      return { questionIndex: i, selected: answers[i], correct: q.correctAnswerIndex, isRight: ok };
    });

    const pct = Math.round((right / questions.length) * 100);
    setScore(pct);
    setFinished(true);
    onComplete?.({ answers: summary, score: pct, totalQuestions: questions.length });
  };

  if (finished) {
    return (
      <Card className="p-8 text-center sm:p-10">
        <motion.span
          initial={{ scale: 0.7 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent-soft text-accent-softfg"
        >
          <Trophy className="size-8" aria-hidden="true" />
        </motion.span>

        <h2 className="mt-5 font-display text-2xl font-bold text-ink">Quiz complete</h2>
        <p className="mt-1.5 text-[15px] text-ink-soft">
          You scored <span className="tabular font-bold text-ink">{score}%</span> — day {dayNumber} is done.
        </p>

        <div className="mx-auto mt-5 max-w-xs">
          <ProgressBar value={score} tone={score >= 60 ? 'positive' : 'accent'} label="Quiz score" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="brand">Activity 3 of 3</Badge>
        <span className="tabular font-mono text-[11px] text-ink-faint">
          {index + 1} / {questions.length}
        </span>
      </div>

      <ProgressBar value={((index + 1) / questions.length) * 100} className="mt-3" label="Quiz progress" />

      <>
        <motion.div
          key={index}
          initial={{ x: 16 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="mt-5 font-display text-lg font-bold leading-snug text-ink">{question.question}</h2>

          <div role="radiogroup" aria-label="Answer options" className="mt-4 space-y-2">
            {question.options.map((opt, i) => {
              const selected = choice === i;
              const isAnswer = i === question.correctAnswerIndex;
              const showRight = revealed && isAnswer;
              const showWrong = revealed && selected && !isAnswer;

              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={revealed}
                  onClick={() => !revealed && setAnswers((a) => ({ ...a, [index]: i }))}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-[border-color,background-color] duration-200',
                    !revealed && 'cursor-pointer',
                    showRight
                      ? 'border-positive bg-positive-soft'
                      : showWrong
                        ? 'border-critical bg-critical-soft'
                        : selected
                          ? 'border-brand bg-brand-soft'
                          : 'border-line bg-surface hover:border-line-strong hover:bg-surface-hover'
                  )}
                >
                  <span
                    className={cx(
                      'grid size-7 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-bold',
                      showRight
                        ? 'bg-positive text-white'
                        : showWrong
                          ? 'bg-critical text-white'
                          : selected
                            ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-brand-950'
                            : 'bg-surface-inset text-ink-faint'
                    )}
                  >
                    {showRight ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : showWrong ? (
                      <X className="size-4" aria-hidden="true" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="text-[14px] font-medium text-ink">{opt}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </>

      <div className="mt-5 flex justify-end border-t border-line pt-5">
        {revealed ? (
          <Button onClick={advance} loading={isSubmitting}>
            {isLast ? 'Finish session' : 'Next question'}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button onClick={() => setRevealed(true)} disabled={choice === undefined}>
            Check answer
          </Button>
        )}
      </div>
    </Card>
  );
}
