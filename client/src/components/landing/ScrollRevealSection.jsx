import React from 'react';
import { Mic, Puzzle, HelpCircle, Flame, Shield, Award, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ScrollRevealSection() {
  const steps = [
    {
      icon: Mic,
      title: '1. Conversational Voice Tutor (Speak)',
      tag: 'Activity 1',
      desc: 'Practice real conversational sentences. Powered by Sarvam Bulbul v3 neural voice streaming and multi-turn roleplays on Premium.',
      color: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/30',
      iconColor: 'text-amber-400',
    },
    {
      icon: Puzzle,
      title: '2. Word-Order Scramble Game',
      tag: 'Activity 2',
      desc: 'Rearrange scrambled native Indic words into accurate grammatical sentences with intuitive tap/drag mechanics.',
      color: 'from-indigo-500/10 to-purple-500/10',
      border: 'border-indigo-500/30',
      iconColor: 'text-indigo-400',
    },
    {
      icon: HelpCircle,
      title: '3. Recall Retention Quiz',
      tag: 'Activity 3',
      desc: '2 to 4 rapid recall questions reinforcing that day’s vocabulary and grammar focus. Unlocks tomorrow’s curriculum upon completion.',
      color: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
  ];

  const highlights = [
    {
      icon: Flame,
      title: 'Real Daily Streaks',
      desc: 'Consecutive calendar day tracking independent of how many roadmap lessons you complete in a single sitting.',
    },
    {
      icon: Shield,
      title: 'Zero Data Leakage',
      desc: 'Strict multi-tenant account isolation. Multi-language roadmaps and sessions are fully isolated per learner.',
    },
    {
      icon: Award,
      title: 'Adaptive Engine',
      desc: 'Dynamic difficulty rolling window automatically upgrades or reinforces your curriculum based on real fluency scores.',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-16 py-8">
      {/* 3-Activity Architecture Showcase */}
      <div className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Daily 3-Activity Habit</span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            How Every Practice Session Works
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm">
            Leave mid-lesson anytime — your progress resumes at the exact activity and dialogue turn where you paused.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-3xl bg-gradient-to-b ${step.color} bg-slate-900/80 border ${step.border} flex flex-col justify-between space-y-4 hover:scale-102 transition-transform duration-300 shadow-xl`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl bg-slate-950/60 border border-slate-800 ${step.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-950/80 text-slate-300 border border-slate-800">
                      {step.tag}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white leading-snug">{step.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust & Architecture Grid */}
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-8">
        <div className="text-center space-y-1">
          <h4 className="text-xl sm:text-2xl font-black text-white">Built for Maximum Speed & Retention</h4>
          <p className="text-xs text-slate-400">Spec-driven architecture engineered for sub-250ms voice interactions.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {highlights.map((h, idx) => {
            const Icon = h.icon;
            return (
              <div key={idx} className="space-y-2.5 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto sm:mx-0">
                  <Icon className="w-5 h-5" />
                </div>
                <h5 className="font-bold text-white text-sm">{h.title}</h5>
                <p className="text-xs text-slate-400 leading-relaxed">{h.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-4 border-t border-slate-800">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs tracking-wider uppercase shadow-xl shadow-indigo-600/30 transition transform hover:scale-102"
          >
            <span>Start Learning For Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
