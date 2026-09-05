import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../services/api';
import AuthLayout, { AuthLink } from '../components/AuthLayout';
import { Button, Field, Alert, inputWithIconClass, cx } from '../components/ui';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      navigate('/login', { state: { message: 'Password updated — sign in with your new one.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'That code didn’t work. Check it and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Enter the code we emailed you, then pick a new password."
      footer={<AuthLink to="/login">Back to sign in</AuthLink>}
    >
      {error && (
        <Alert tone="critical" icon={AlertCircle} className="mb-5">
          {error}
        </Alert>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" htmlFor="email" icon={Mail}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className={inputWithIconClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Reset code" htmlFor="code" icon={ShieldCheck}>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            placeholder="123456"
            className={cx(inputWithIconClass, 'tabular font-mono font-bold tracking-[0.3em]')}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
        </Field>

        <Field label="New password" htmlFor="password" icon={Lock} hint="At least 8 characters.">
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="••••••••"
            className={inputWithIconClass}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
