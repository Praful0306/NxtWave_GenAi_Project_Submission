import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { BrandGlyph } from './components/Brandmark';

// Routes are split so a learner opening /practice doesn't download the landing
// page's 3D hero or the charting library used only by /progress.
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const Progress = lazy(() => import('./pages/Progress'));
const Practice = lazy(() => import('./pages/Practice'));
const Paywall = lazy(() => import('./pages/Paywall'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas" role="status" aria-label="Loading">
      <BrandGlyph className="size-11 animate-pulse" />
    </div>
  );
}

const protect = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [initTheme, checkAuth]);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />

          {/* Authenticated */}
          <Route path="/onboarding" element={protect(<Onboarding />)} />
          <Route path="/dashboard" element={protect(<Dashboard />)} />
          <Route path="/roadmap/:languageCode" element={protect(<Roadmap />)} />
          <Route path="/progress/:languageCode" element={protect(<Progress />)} />
          <Route path="/practice/:languageCode" element={protect(<Practice />)} />
          <Route path="/paywall" element={protect(<Paywall />)} />
          <Route path="/settings" element={protect(<Settings />)} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
