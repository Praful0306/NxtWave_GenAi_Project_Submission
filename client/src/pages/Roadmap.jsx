import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell/AppShell';
import RoadmapTimeline from '../components/RoadmapTimeline/RoadmapTimeline';
import { useLanguageStore, getLanguageMeta } from '../store/languageStore';
import {
  Button,
  Alert,
  LoadingState,
  EmptyState,
  PageHeader,
  Eyebrow,
  cx,
} from '../components/ui';
import { ArrowLeft, Map, TrendingUp, AlertCircle, Play } from 'lucide-react';

export default function Roadmap() {
  const { languageCode = 'kn-IN' } = useParams();
  const navigate = useNavigate();
  const { currentRoadmap, languages, fetchRoadmap, isLoading, error } = useLanguageStore();

  const meta = getLanguageMeta(languageCode);

  useEffect(() => {
    fetchRoadmap(languageCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageCode]);

  const enrollment = languages.find((l) => l.languageCode === languageCode);

  // First day without a completedAt is the unlocked day — falls back to the
  // enrollment's own counter, then day 1.
  const currentDay = useMemo(() => {
    const days = currentRoadmap?.weeks?.flatMap((w) => w.days || []) ?? [];
    const next = days.find((d) => !d.completedAt);
    return next?.dayNumber ?? enrollment?.currentDayNumber ?? 1;
  }, [currentRoadmap, enrollment]);

  const roadmapMatchesRoute = currentRoadmap?.languageCode === languageCode;

  return (
    <AppShell className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="-ml-3">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dashboard
      </Button>

      <PageHeader
        eyebrow={
          <Eyebrow icon={Map}>
            {meta.nativeName || meta.name} · <span className="font-mono">{languageCode}</span>
          </Eyebrow>
        }
        title={
          <span className="flex items-center gap-3">
            <span
              className={cx('grid size-11 place-items-center rounded-xl font-serif text-xl leading-none', meta.tile)}
              aria-hidden="true"
            >
              {meta.script}
            </span>
            {meta.name} roadmap
          </span>
        }
        description="Your day-by-day plan. Days unlock as you finish the one before."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`/progress/${languageCode}`)}>
              <TrendingUp className="size-4" aria-hidden="true" />
              Progress
            </Button>
            <Button size="sm" onClick={() => navigate(`/practice/${languageCode}`)}>
              <Play className="size-3.5 fill-current" aria-hidden="true" />
              Practise
            </Button>
          </>
        }
      />

      {error && (
        <Alert tone="critical" icon={AlertCircle} title="Couldn’t load this roadmap">
          {error}
        </Alert>
      )}

      {isLoading && !roadmapMatchesRoute ? (
        <LoadingState label={`Loading your ${meta.name} plan…`} />
      ) : roadmapMatchesRoute ? (
        <RoadmapTimeline
          roadmap={currentRoadmap}
          currentDayNumber={currentDay}
          languageCode={languageCode}
        />
      ) : (
        !error && (
          <EmptyState
            icon={Map}
            title="No roadmap yet"
            description={`You haven’t set up ${meta.name} yet. It takes three questions.`}
            action={<Button onClick={() => navigate('/onboarding')}>Set up {meta.name}</Button>}
          />
        )
      )}
    </AppShell>
  );
}
