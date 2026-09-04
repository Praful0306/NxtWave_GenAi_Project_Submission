import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-primary-600)', marginBottom: '0.5rem' }}>404</h1>
        <h2>Page not found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '2rem' }}>
          The page you are looking for doesn't exist or has moved.
        </p>
        <Link to="/" className="btn-primary" style={{ width: '100%' }}>
          <Home size={18} /> Return Home
        </Link>
      </div>
    </div>
  );
}
