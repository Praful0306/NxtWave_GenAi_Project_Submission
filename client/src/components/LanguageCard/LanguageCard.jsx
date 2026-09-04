import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Play, ArrowRight, BookOpen, Settings } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../store/languageStore';

export default function LanguageCard({ userLanguage, onSelect }) {
  const navigate = useNavigate();

  const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === userLanguage.languageCode) || {
    name: userLanguage.languageCode,
    nativeName: '',
    flag: '🇮🇳',
  };

  const totalDays = userLanguage.totalDays || userLanguage.goalDurationDays || 30;
  const completedDays = userLanguage.completedDays || 0;
  const currentDay = userLanguage.currentDayNumber || Math.min(completedDays + 1, totalDays);
  const progressPercent = Math.min(Math.round((completedDays / totalDays) * 100), 100);

  const handleContinue = (e) => {
    e.stopPropagation();
    navigate(`/roadmap/${userLanguage.languageCode}`);
  };

  return (
    <div
      onClick={() => onSelect && onSelect(userLanguage)}
      className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 transition-all duration-200 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/5 group cursor-pointer relative overflow-hidden backdrop-blur-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/50">
            {langMeta.flag}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                {langMeta.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {userLanguage.level || 'Basic'}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-serif">{langMeta.nativeName}</div>
          </div>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold font-mono">
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{userLanguage.currentStreak || 0}d streak</span>
        </div>
      </div>

      {/* Progress Info */}
      <div className="space-y-2 mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Curriculum Progress</span>
          <span className="text-white font-mono font-bold">
            Day {currentDay} of {totalDays} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/progress/${userLanguage.languageCode}`);
            }}
            className="text-slate-400 hover:text-indigo-400 text-xs font-semibold px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 transition flex items-center gap-1.5"
            title="View Fluency Analytics & Error Breakdown"
          >
            <BookOpen className="w-3.5 h-3.5" /> Analytics
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/settings?tab=languages&lang=${userLanguage.languageCode}`);
            }}
            className="text-slate-500 hover:text-slate-300 p-2 rounded-xl hover:bg-slate-800 transition"
            title="Language Settings & Regeneration"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/30"
        >
          <Play className="w-3 h-3 fill-white" /> Practice Day {currentDay} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

