import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MailCheck, AlertCircle, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState(location.state?.email || '');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    if (value.length > 1) {
      // Paste handling
      const pasted = value.slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((char, i) => {
        if (i < 6 && /\d/.test(char)) newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', { email, code });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/resend-otp', { email });
      setSuccess('Verification code resent! Please check your email.');
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in" style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-xl)', color: 'var(--color-primary-600)', marginBottom: '0.75rem' }}>
          <MailCheck size={32} />
        </div>
        <h2>Verify your email</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          We sent a 6-digit code to <strong>{email || 'your email'}</strong>. Enter it below to complete registration.
        </p>

        {!location.state?.email && (
          <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
            <label className="label">Confirm your email address</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-lg)', color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'left' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-lg)', color: '#166534', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                style={{
                  width: '46px',
                  height: '52px',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border-primary)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            ))}
          </div>

          <button type="submit" className="btn-primary" disabled={loading || digits.join('').length !== 6} style={{ width: '100%', marginBottom: '1rem' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Verify and continue'}
          </button>
        </form>

        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            style={{
              background: 'none',
              border: 'none',
              color: resendCooldown > 0 ? 'var(--text-tertiary)' : 'var(--color-primary-600)',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.813rem' }}>
          <Link to="/login" style={{ color: 'var(--text-tertiary)' }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
