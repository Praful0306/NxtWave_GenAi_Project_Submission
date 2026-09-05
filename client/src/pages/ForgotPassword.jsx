import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../services/api';
import AuthLayout, { AuthLink } from '../components/AuthLayout';
import { Button, Field, Alert, inputWithIconClass } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Couldn’t send a reset code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We’ll email you a 6-digit code to set a new one."
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
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? 'Sending…' : 'Send reset code'}
          {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
        </Button>
      </form>
    </AuthLayout>
  );
}
