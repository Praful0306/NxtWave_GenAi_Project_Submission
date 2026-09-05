import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../services/api';
import AuthLayout, { Divider, OAuthButtons, AuthLink } from '../components/AuthLayout';
import { Button, Field, Alert, inputWithIconClass } from '../components/ui';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.error || 'We couldn’t create that account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Start speaking"
      subtitle="Two sessions free — no card needed."
      footer={<>Already have an account? <AuthLink to="/login">Sign in</AuthLink></>}
    >
      {error && (
        <Alert tone="critical" icon={AlertCircle} className="mb-5">
          {error}
        </Alert>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Field label="Your name" htmlFor="name" icon={User}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            className={inputWithIconClass}
            placeholder="Ravi Kumar"
            value={form.name}
            onChange={set('name')}
          />
        </Field>

        <Field label="Email" htmlFor="email" icon={Mail}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className={inputWithIconClass}
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          icon={Lock}
          hint="At least 8 characters."
        >
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputWithIconClass}
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
          />
        </Field>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? 'Creating your account…' : 'Create account'}
          {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      </form>

      <Divider>or sign up with</Divider>
      <OAuthButtons />
    </AuthLayout>
  );
}
