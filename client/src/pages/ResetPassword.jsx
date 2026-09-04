import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { KeyRound, Lock, AlertCircle, Loader2 } from 'lucide-react';
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
      <div className="auth-card animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-xl)', color: 'var(--color-primary-600)', marginBottom: '0.75rem' }}>
            <KeyRound size={32} />
          </div>
          <h2>Set new password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Enter the 6-digit code sent to your email and your new password
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-lg)', color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="code">6-digit reset code</label>
            <input
              id="code"
              type="text"
              className="input"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="password">New password (min. 8 characters)</label>
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
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Reset password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)' }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
