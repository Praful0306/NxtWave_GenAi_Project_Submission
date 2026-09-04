import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import Navbar from '../components/Navbar';
import {
  Crown,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  MessageSquare,
  Infinity as InfinityIcon,
  TrendingUp,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function Paywall() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Return URL after upgrade (e.g. previous practice session)
  const from = location.state?.from || '/dashboard';

  useEffect(() => {
    // If user is already premium, redirect to dashboard or intended target
    if (user?.isPremium) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Dynamically load Razorpay Checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);

    try {
      // 1. Ensure Razorpay Checkout script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment gateway. Please check your internet connection.');
      }

      // 2. Create server-side order (strictly fixed price on server)
      const orderRes = await api.post('/payments/create-order');
      const { orderId, amount, currency, razorpayKeyId } = orderRes.data.data;

      // 3. Configure Razorpay modal options
      const options = {
        key: razorpayKeyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'VaaniTutor',
        description: 'Lifetime Premium Upgrade — Unlimited Practice & AI Roleplay',
        image: 'https://cdn-icons-png.flaticon.com/512/9440/9440535.png',
        order_id: orderId,
        handler: async function (response) {
          try {
            setLoading(true);
            // 4. Send signature to server-side HMAC verification endpoint
            const verifyRes = await api.post('/payments/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              setSuccess(true);
              // Update client Zustand auth store with new premium state
              if (user) {
                updateUser({
                  ...user,
                  isPremium: true,
                  premiumSince: new Date().toISOString(),
                });
              }

              // Redirect to practice or dashboard after celebration
              setTimeout(() => {
                navigate(from, { replace: true });
              }, 2500);
            }
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.error || 'Payment signature verification failed.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#4f46e5', // Indigo-600 brand color
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (resp) {
        setError(resp.error?.description || 'Payment transaction failed or was cancelled.');
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to initialize payment.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center">
        {/* Header Badge */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide uppercase shadow-lg shadow-amber-500/5">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>VaaniTutor Premium</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Unlock Full Fluency with{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-400 bg-clip-text text-transparent">
              Unlimited AI Practice
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            You've completed your 2 free introductory sessions! Upgrade to Premium for a one-time payment to unlock conversational roleplays, unlimited lessons, and in-depth fluency analytics across all 11 Indian languages.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 max-w-lg mx-auto p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-3">
            <Lock className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mt-6 max-w-lg mx-auto p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-3 shadow-xl shadow-emerald-500/10 animate-bounce">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-200">Payment Verified! Welcome to Premium!</p>
              <p className="text-emerald-400/80 mt-0.5">Redirecting you to your curriculum...</p>
            </div>
          </div>
        )}

        {/* Pricing & Feature Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto w-full">
          {/* Free Tier Recap */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6 opacity-80">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Free Tier</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">
                  Expired
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Starter Plan</h3>
                <p className="text-xs text-slate-400 mt-1">Introductory taste of AI tutoring</p>
              </div>

              <ul className="space-y-3 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>2 Free Practice Sessions (Completed)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Single-turn Speak feedback (1 exchange)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Basic Word Order Games & Quizzes</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-500 font-medium">Free limit reached (2 / 2 sessions used)</span>
            </div>
          </div>

          {/* Premium Tier Plan */}
          <div className="relative p-8 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-2 border-indigo-500/50 flex flex-col justify-between space-y-6 shadow-2xl shadow-indigo-500/10">
            {/* Best Value Ribbon */}
            <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg shadow-amber-500/20">
              One-Time Payment
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Lifetime Access
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tracking-tight">₹299</span>
                  <span className="text-xs text-slate-400 line-through">₹999</span>
                  <span className="text-xs font-bold text-emerald-400">70% OFF</span>
                </div>
                <p className="text-xs text-indigo-300/80 mt-1">Pay once, learn and practice forever. No monthly subscriptions.</p>
              </div>

              <ul className="space-y-3.5 pt-4 border-t border-indigo-500/20 text-xs text-slate-200">
                <li className="flex items-center gap-2.5">
                  <InfinityIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-white">Unlimited daily practice sessions forever</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    <strong className="text-white">Conversational Roleplay:</strong> 5-turn deep AI tutor dialogues
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full Fluency Analytics & Adaptive Difficulty engine</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>All 11 Indic Languages with native neural voices</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Roadmap regeneration on goal & level changes</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || success}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Opening Secure Razorpay Checkout...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Upgrade Complete!</span>
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>Upgrade to Premium (₹299)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security & Trust Guarantee */}
        <div className="mt-12 text-center text-xs text-slate-500 flex items-center justify-center gap-6">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-400" /> 256-bit Encrypted Payments
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-slate-400" /> Verified via Razorpay Hosted Gateway
          </span>
          <span className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-slate-400" /> Instant Automatic Activation
          </span>
        </div>
      </main>
    </div>
  );
}
