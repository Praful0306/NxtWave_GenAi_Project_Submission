import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Play, ArrowRight, BookOpen, Settings } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../store/languageStore';

export default function LanguageCard({ userLanguage, onSelect }) {
  const navigate = useNavigate();

  const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === userLanguage.languageCode) || {
    name: userLanguage.languageCode,
    nativeName: '',
    script: '🇮🇳',
    colorGradient: 'from-indigo-500 to-purple-600',
    accentBorder: 'border-indigo-500/40',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
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
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect && onSelect(userLanguage)}
      className="p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 group cursor-pointer relative overflow-hidden backdrop-blur-xl flex flex-col justify-between space-y-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${langMeta.colorGradient} flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0`}
          >
            {langMeta.script || '🇮🇳'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                {langMeta.name}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${langMeta.badgeClass}`}>
                {userLanguage.level || 'Basic'}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-serif mt-0.5">{langMeta.nativeName}</div>
          </div>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold font-mono shadow-sm">
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{userLanguage.currentStreak || 0}d streak</span>
        </div>
      </div>

      {/* Progress Information */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Curriculum Progress</span>
          <span className="text-white font-mono font-bold">
            Day {currentDay} of {totalDays} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
          <div
            className={`h-full bg-gradient-to-r ${langMeta.colorGradient} transition-all duration-500`}
            style={{ width: `${Math.max(progressPercent, 4)}%` }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/progress/${userLanguage.languageCode}`);
            }}
            className="text-slate-400 hover:text-indigo-300 text-xs font-semibold px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
            title="View Fluency Analytics & Error Breakdown"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/settings?tab=languages&lang=${userLanguage.languageCode}`);
            }}
            className="text-slate-500 hover:text-slate-300 p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="Language Settings & Regeneration"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleContinue}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          <Play className="w-3 h-3 fill-white" />
          <span>Practice Day {currentDay}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
