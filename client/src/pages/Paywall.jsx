import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import AppShell from '../components/AppShell/AppShell';
import { Button, Card, Badge, Alert, Eyebrow, stagger, riseItem, cx } from '../components/ui';
import {
  Crown,
  Check,
  MessagesSquare,
  Infinity as InfinityIcon,
  ChartNoAxesCombined,
  Languages,
  RefreshCw,
  ShieldCheck,
  Lock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const PREMIUM_FEATURES = [
  { icon: InfinityIcon, title: 'Unlimited sessions', body: 'No cap after your first two.' },
  {
    icon: MessagesSquare,
    title: '5-turn AI roleplay',
    body: 'Speak becomes a real back-and-forth conversation in character, not one graded sentence.',
  },
  { icon: ChartNoAxesCombined, title: 'Full analytics', body: 'Fluency trend and error breakdown over time.' },
  { icon: Languages, title: 'All 11 languages', body: 'Run as many roadmaps at once as you like.' },
  { icon: RefreshCw, title: 'Roadmap regeneration', body: 'Change level or length whenever you want.' },
];

export default function Paywall() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const returnTo = location.state?.from || '/dashboard';

  useEffect(() => {
    if (user?.isPremium) navigate(returnTo, { replace: true });
  }, [user, navigate, returnTo]);

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const checkout = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!(await loadRazorpay())) throw new Error('Payment gateway failed to load. Check your connection.');

      const orderRes = await api.post('/payments/create-order');
      const { orderId, amount, currency, razorpayKeyId } = orderRes.data.data;

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount,
        currency: currency || 'INR',
        name: 'VaaniTutor',
        description: 'Lifetime Premium',
        order_id: orderId,
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme: { color: '#0f766e' },
        modal: { ondismiss: () => setLoading(false) },
        handler: async (response) => {
          try {
            setLoading(true);
            const verify = await api.post('/payments/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            if (verify.data.success) {
              setDone(true);
              if (user) updateUser({ ...user, isPremium: true, premiumSince: new Date().toISOString() });
              setTimeout(() => navigate(returnTo, { replace: true }), 2200);
            }
          } catch (err) {
            setError(err.response?.data?.error || 'We couldn’t verify that payment. Nothing was unlocked.');
          } finally {
            setLoading(false);
          }
        },
      });

      rzp.on('payment.failed', (resp) => {
        setError(resp.error?.description || 'Payment failed.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Couldn’t start checkout.');
      setLoading(false);
    }
  };

  return (
    <AppShell className="space-y-8">
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
        {/* Header */}
        <motion.div variants={riseItem} className="mx-auto max-w-2xl space-y-3 text-center">
          <Eyebrow icon={Crown} className="justify-center">
            VaaniTutor Premium
          </Eyebrow>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            You’ve used your two free sessions
          </h1>
          <p className="mx-auto max-w-lg text-[15px] leading-relaxed text-ink-soft">
            One payment, kept forever. No subscription, no renewal — and Speak turns into a proper conversation
            instead of a single graded sentence.
          </p>
        </motion.div>

        {error && (
          <motion.div variants={riseItem} className="mx-auto max-w-md">
            <Alert tone="critical" icon={Lock}>
              {error}
            </Alert>
          </motion.div>
        )}

        {done && (
          <motion.div variants={riseItem} className="mx-auto max-w-md">
            <Alert tone="positive" icon={CheckCircle2} title="You’re Premium">
              Taking you back to your practice…
            </Alert>
          </motion.div>
        )}

        {/* Plans */}
        <motion.div variants={riseItem} className="mx-auto grid w-full max-w-3xl gap-4 md:grid-cols-2">
          {/* Free */}
          <Card className="flex flex-col p-6">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wider text-ink-faint">Free</span>
              <Badge tone="neutral">Used up</Badge>
            </div>
            <div className="mt-3">
              <span className="font-display text-3xl font-bold text-ink">₹0</span>
            </div>
            <ul className="mt-5 space-y-2.5 border-t border-line pt-5 text-[13px] text-ink-faint">
              {['2 practice sessions', 'One correction per session', 'Word games and quizzes'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-5 text-center text-[12px] text-ink-faint">
              <span className="tabular">{user?.freeSessionsUsed ?? 2}</span> of 2 used
            </p>
          </Card>

          {/* Premium */}
          <Card className="relative flex flex-col border-brand p-6 shadow-md ring-1 ring-[var(--brand-ring)]">
            <span className="absolute -top-2.5 left-6 rounded-md bg-accent-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white dark:bg-accent-500 dark:text-accent-950">
              One-time
            </span>

            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wider text-brand">Premium</span>
              <Crown className="size-5 text-accent" aria-hidden="true" />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-ink">₹299</span>
              <span className="text-[13px] text-ink-faint line-through">₹999</span>
            </div>
            <p className="mt-1 text-[12px] text-ink-soft">Pay once. Yours for good.</p>

            <ul className="mt-5 space-y-3 border-t border-line pt-5">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f.title} className="flex items-start gap-2.5">
                  <f.icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">{f.title}</p>
                    <p className="text-[12px] leading-relaxed text-ink-soft">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              onClick={checkout}
              loading={loading}
              disabled={done}
              className="mt-6 w-full"
            >
              {loading ? 'Opening checkout…' : done ? 'Unlocked' : 'Upgrade for ₹299'}
              {!loading && !done && <ArrowRight className="size-4" aria-hidden="true" />}
            </Button>
          </Card>
        </motion.div>

        {/* Trust */}
        <motion.div
          variants={riseItem}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-ink-faint"
        >
          {[
            { icon: ShieldCheck, text: 'Card details never touch our servers' },
            { icon: Check, text: 'Verified server-side by Razorpay signature' },
            { icon: Crown, text: 'Unlocks instantly' },
          ].map((t) => (
            <span key={t.text} className="inline-flex items-center gap-1.5">
              <t.icon className="size-3.5" aria-hidden="true" />
              {t.text}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
