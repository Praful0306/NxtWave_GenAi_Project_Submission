import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';

import AppShell from './components/AppShell/AppShell';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OAuthCallback from './pages/OAuthCallback';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import Progress from './pages/Progress';
import Practice from './pages/Practice';
import Paywall from './pages/Paywall';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [initTheme, checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />

        {/* Onboarding Wizard (Dedicated full-screen flow) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Authenticated routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/roadmap/:languageCode"
          element={
            <ProtectedRoute>
              <Roadmap />
            </ProtectedRoute>
          }
        />

        <Route
          path="/progress/:languageCode"
          element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          }
        />

        <Route
          path="/practice/:languageCode"
          element={
            <ProtectedRoute>
              <Practice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/paywall"
          element={
            <ProtectedRoute>
              <Paywall />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
