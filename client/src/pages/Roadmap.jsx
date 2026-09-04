import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RoadmapTimeline from '../components/RoadmapTimeline/RoadmapTimeline';
import { useLanguageStore, SUPPORTED_LANGUAGES } from '../store/languageStore';
import { Loader2, ArrowLeft, Plus } from 'lucide-react';

export default function Roadmap() {
  const { languageCode } = useParams();
  const navigate = useNavigate();
  const { currentRoadmap, fetchRoadmap, isLoading, error } = useLanguageStore();

  const activeLang = languageCode || 'kn-IN';
  const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === activeLang) || { name: activeLang };

  useEffect(() => {
    if (activeLang) {
      fetchRoadmap(activeLang);
    }
  }, [activeLang]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Multi-Language Dashboard
          </button>

          <button
            onClick={() => navigate('/onboarding')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Language
          </button>
        </div>

        {/* Loading / Error States */}
        {isLoading && !currentRoadmap && (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-slate-400 text-sm">Loading your {langMeta.name} curriculum...</p>
          </div>
        )}

        {error && (
          <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Roadmap Timeline */}
        {currentRoadmap && (
          <RoadmapTimeline
            roadmap={currentRoadmap}
            currentDayNumber={1}
            languageCode={activeLang}
          />
        )}
      </main>
    </div>
  );
}
