import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, MailCheck } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import AuthLayout, { AuthLink } from '../components/AuthLayout';
import { Button, Field, Alert, inputClass, cx } from '../components/ui';

const LENGTH = 6;

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState(location.state?.email || '');
  const [digits, setDigits] = useState(() => new Array(LENGTH).fill(''));
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputs = useRef([]);
  const code = digits.join('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const setDigit = (i, value) => {
    // Handles paste of the whole code into any box.
    if (value.length > 1) {
      const chars = value.replace(/\D/g, '').slice(0, LENGTH).split('');
      const next = new Array(LENGTH).fill('');
      chars.forEach((c, idx) => (next[idx] = c));
      setDigits(next);
      inputs.current[Math.min(chars.length, LENGTH - 1)]?.focus();
      return;
    }
    if (!/^\d?$/.test(value)) return;
    setDigits((d) => {
      const next = [...d];
      next[i] = value;
      return next;
    });
    if (value && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (code.length !== LENGTH) return setError(`Enter all ${LENGTH} digits.`);
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, code });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'That code didn’t work. Check it and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError('');
    setSent('');
    try {
      await api.post('/auth/resend-otp', { email });
      setSent('A new code is on its way.');
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Couldn’t resend the code.');
    }
  };

  return (
    <AuthLayout
      title="Check your inbox"
      subtitle={
        email ? (
          <>
            We sent a {LENGTH}-digit code to <span className="font-semibold text-ink">{email}</span>.
          </>
        ) : (
          `Enter your email and the ${LENGTH}-digit code we sent you.`
        )
      }
      footer={<AuthLink to="/login">Back to sign in</AuthLink>}
    >
      {error && (
        <Alert tone="critical" icon={AlertCircle} className="mb-5">
          {error}
        </Alert>
      )}
      {sent && (
        <Alert tone="positive" icon={CheckCircle2} className="mb-5">
          {sent}
        </Alert>
      )}

      <form onSubmit={submit} className="space-y-5">
        {!location.state?.email && (
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              required
              className={inputClass}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        )}

        <fieldset>
          <legend className="mb-2 block text-[13px] font-semibold text-ink">Verification code</legend>
          <div className="flex justify-between gap-1.5 sm:gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={LENGTH}
                aria-label={`Digit ${i + 1}`}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                className={cx(
                  'tabular h-14 w-full rounded-xl border-2 bg-surface text-center font-display text-xl font-bold text-ink outline-none transition-[border-color,box-shadow] duration-200',
                  'focus:border-brand focus:ring-3 focus:ring-[var(--brand-ring)]',
                  d ? 'border-brand' : 'border-line-strong'
                )}
              />
            ))}
          </div>
        </fieldset>

        <Button type="submit" size="lg" loading={loading} disabled={code.length !== LENGTH} className="w-full">
          {loading ? 'Verifying…' : 'Verify and continue'}
          {!loading && <MailCheck className="size-4" aria-hidden="true" />}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-soft">
        Didn’t get it?{' '}
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className={cx(
            'font-semibold underline-offset-2',
            cooldown > 0 ? 'cursor-not-allowed text-ink-faint' : 'cursor-pointer text-brand hover:underline'
          )}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send a new code'}
        </button>
      </p>
    </AuthLayout>
  );
}
