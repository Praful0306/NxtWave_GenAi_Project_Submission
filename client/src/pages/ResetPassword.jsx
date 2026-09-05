import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, Mail, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      navigate('/login', { state: { message: 'Password reset successful! You can now log in.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="auth-card"
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.875rem',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(245, 158, 11, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '1.25rem',
              color: '#818cf8',
              marginBottom: '1rem',
              boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.25)',
            }}
          >
            <KeyRound size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
            Set New Password
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.375rem' }}>
            Enter the 6-digit code sent to your email and your new password
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.875rem 1rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-xl)',
              color: '#f87171',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '2.75rem' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="code">6-Digit Reset Code</label>
            <div style={{ position: 'relative' }}>
              <input
                id="code"
                type="text"
                className="input"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{ paddingLeft: '2.75rem', letterSpacing: '0.2em', fontFamily: 'monospace', fontWeight: 700 }}
              />
              <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">New Password (min. 8 characters)</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                style={{ paddingLeft: '2.75rem' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Reset Password & Login'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem' }}>
          <Link to="/login" style={{ color: '#818cf8', fontWeight: 700 }}>
            ← Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
