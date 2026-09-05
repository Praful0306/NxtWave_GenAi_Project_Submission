import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import AuthLayout, { Divider, OAuthButtons, AuthLink } from '../components/AuthLayout';
import { Button, Field, Alert, inputWithIconClass } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  const flash = location.state?.message;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email', { state: { email } });
        return;
      }
      setError(err.response?.data?.error || 'That email and password don’t match.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Pick up your streak where you left it."
      footer={<>New here? <AuthLink to="/register">Create an account</AuthLink></>}
    >
      {flash && (
        <Alert tone="positive" icon={CheckCircle2} className="mb-5">
          {flash}
        </Alert>
      )}

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
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-[13px] font-semibold text-ink">
              Password
            </label>
            <AuthLink to="/forgot-password">Forgot it?</AuthLink>
          </div>
          <Field htmlFor="password" icon={Lock}>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputWithIconClass}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </div>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
          {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      </form>

      <Divider>or continue with</Divider>
      <OAuthButtons />
    </AuthLayout>
  );
}
