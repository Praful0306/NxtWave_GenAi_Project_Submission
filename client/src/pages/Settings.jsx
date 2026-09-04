import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore, SUPPORTED_LANGUAGES } from '../store/languageStore';
import {
  User,
  Globe,
  Moon,
  Sun,
  Monitor,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Award,
  Calendar,
  Crown,
  CreditCard,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { languages, fetchLanguages, regenerateRoadmap, isLoading } = useLanguageStore();

  const [activeTab, setActiveTab] = useState('languages');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMessage, setProfileMessage] = useState(null);

  // Billing & Purchase History state
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Regeneration modal state
  const [editingLang, setEditingLang] = useState(null);
  const [newLevel, setNewLevel] = useState('Basic');
  const [newDays, setNewDays] = useState(30);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [regenSuccess, setRegenSuccess] = useState(null);

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (activeTab === 'billing') {
      fetchPaymentHistory();
    }
  }, [activeTab]);

  const fetchPaymentHistory = async () => {
    setLoadingPayments(true);
    try {
      const res = await api.get('/payments/history');
      if (res.data?.data) {
        setPayments(res.data.data);
      }
    } catch (_) {
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch('/auth/profile', { name: profileName, themePreference: theme });
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to update profile' });
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      const res = await api.patch('/auth/profile', { themePreference: newTheme });
      if (res.data?.user) {
        updateUser(res.data.user);
      }
    } catch (_) {}
  };

  const openEditModal = (lang) => {
    setEditingLang(lang);
    setNewLevel(lang.level || 'Basic');
    setNewDays(lang.goalDurationDays || 30);
    setShowConfirmModal(true);
  };

  const executeRegeneration = async () => {
    if (!editingLang) return;
    try {
      await regenerateRoadmap(editingLang.languageCode, {
        newLevel,
        newGoalDurationDays: parseInt(newDays, 10),
      });
      setShowConfirmModal(false);
      setRegenSuccess(`Roadmap for ${editingLang.languageCode} successfully regenerated!`);
      setTimeout(() => setRegenSuccess(null), 4000);
    } catch (err) {
      alert(`Regeneration failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Settings & Preferences</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your account profile, theme, and language curriculum roadmaps.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('languages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'languages'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" /> Enrolled Languages & Roadmaps
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <User className="w-4 h-4" /> Account & Theme
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" /> Membership & Billing
          </button>
        </div>

        {regenSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {regenSuccess}
          </div>
        )}

        {/* ─── LANGUAGES TAB ─── */}
        {activeTab === 'languages' && (
          <div className="space-y-6">
            <div className="space-y-4">
              {languages.map((lang) => {
                const meta = SUPPORTED_LANGUAGES.find((l) => l.code === lang.languageCode) || {
                  name: lang.languageCode,
                  flag: '🇮🇳',
                };
                return (
                  <div
                    key={lang.languageCode}
                    className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl p-3 rounded-2xl bg-slate-800 border border-slate-700">
                        {meta.flag}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">{meta.name}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {lang.level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Goal: {lang.goalDurationDays || 30} Days • Day {lang.currentDayNumber || 1} • {lang.currentStreak || 0}d streak
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditModal(lang)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400" /> Adjust Level / Goal
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── PROFILE & THEME TAB ─── */}
        {activeTab === 'profile' && (
          <div className="space-y-8 max-w-xl">
            {profileMessage && (
              <div
                className={`p-4 rounded-2xl text-xs ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>

            {/* Theme Preference */}
            <div className="space-y-3 pt-6 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Theme Preference (Persisted to Profile)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Monitor },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleThemeChange(t.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/20'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── MEMBERSHIP & BILLING TAB (SPEC SECTION 5 & 6.10) ─── */}
        {activeTab === 'billing' && (
          <div className="space-y-8 max-w-2xl">
            {/* Membership Card */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3.5 rounded-2xl border ${
                    user?.isPremium
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {user?.isPremium ? 'VaaniTutor Premium' : 'Starter Free Tier'}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        user?.isPremium
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {user?.isPremium ? 'Active' : 'Free Trial'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {user?.isPremium
                        ? `Member since ${new Date(user.premiumSince || user.createdAt).toLocaleDateString()} • Lifetime Access`
                        : `${user?.freeSessionsUsed || 0} of 2 free sessions used`}
                    </p>
                  </div>
                </div>

                {!user?.isPremium && (
                  <button
                    type="button"
                    onClick={() => navigate('/paywall')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" /> Upgrade to Premium (₹299)
                  </button>
                )}
              </div>

              {/* Perks Checklist */}
              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className={`w-4 h-4 ${user?.isPremium ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>Unlimited daily practice sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className={`w-4 h-4 ${user?.isPremium ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>5-turn Conversational AI Roleplay</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className={`w-4 h-4 ${user?.isPremium ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>Adaptive difficulty & progress tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className={`w-4 h-4 ${user?.isPremium ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span>All 11 Indic language neural voices</span>
                </div>
              </div>
            </div>

            {/* Purchase History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" /> Purchase & Payment History
                </h3>
              </div>

              {loadingPayments ? (
                <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Loading transaction history...
                </div>
              ) : payments.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                  No payment transactions on record yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {payments.map((p) => (
                        <tr key={p._id || p.razorpayOrderId} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3 text-slate-400">
                            {new Date(p.capturedAt || p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
                            {p.razorpayOrderId}
                          </td>
                          <td className="px-4 py-3 font-bold text-white">
                            ₹{(p.amount / 100).toFixed(0)} {p.currency}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.status === 'captured'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : p.status === 'failed'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── ROADMAP REGENERATION CONFIRMATION MODAL (SPEC SECTION 6.8) ─── */}
      {showConfirmModal && editingLang && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Regenerate {editingLang.languageCode} Curriculum?
                </h3>
                <p className="text-xs text-slate-400">Spec Section 6.8 Confirmation</p>
              </div>
            </div>

            {/* Spec Section 6.8 Exact Confirmation Notice */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs leading-relaxed">
              "This will recalculate your curriculum for your new goal and restart your day-by-day plan at Day 1. Your completed practice history and stats will not be lost, but your active daily roadmap will reset."
            </div>

            {/* Form controls for new level and duration (3-180 days) */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-400" /> New Starting Level
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Basic">Basic (Beginner)</option>
                  <option value="Intermediate">Intermediate (Conversational)</option>
                  <option value="Advanced">Advanced (Fluent & Professional)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" /> New Goal Duration (3–180 Days)
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-400">{newDays} Days</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="180"
                  value={newDays}
                  onChange={(e) => setNewDays(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>3d</span>
                  <span>14d</span>
                  <span>30d</span>
                  <span>60d</span>
                  <span>180d</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRegeneration}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" /> Confirm & Regenerate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
