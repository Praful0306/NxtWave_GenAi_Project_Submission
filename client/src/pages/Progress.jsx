import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppShell from '../components/AppShell/AppShell';
import ProgressChart from '../components/ProgressChart/ProgressChart';
import api from '../services/api';
import { getLanguageMeta } from '../store/languageStore';
import {
  Button,
  Card,
  Alert,
  StatTile,
  CountUp,
  LoadingState,
  PageHeader,
  Eyebrow,
  stagger,
  riseItem,
  cx,
} from '../components/ui';
import {
  ArrowLeft,
  Gauge,
  Flame,
  GraduationCap,
  Activity,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export default function Progress() {
  const { languageCode } = useParams();
  const navigate = useNavigate();
  const meta = getLanguageMeta(languageCode);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!languageCode) return;
    let cancelled = false;

    setLoading(true);
    setError(null);
    api
      .get(`/progress/${languageCode}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success) setData(res.data.data);
        else setError('We couldn’t load your progress.');
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || 'We couldn’t load your progress.');
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [languageCode]);

  const adaptive = data?.adaptiveStatus;

  return (
    <AppShell width="wide" className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="-ml-3">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dashboard
      </Button>

      <PageHeader
        eyebrow={
          <Eyebrow icon={TrendingUp}>
            {meta.nativeName || meta.name} · <span className="font-mono">{languageCode}</span>
          </Eyebrow>
        }
        title={`${meta.name} progress`}
        description="How your fluency is moving, and which kinds of mistakes come up most."
        actions={
          <Button size="sm" onClick={() => navigate(`/practice/${languageCode}`)}>
            Practise now
          </Button>
        }
      />

      {error && (
        <Alert tone="critical" icon={AlertCircle} title="Couldn’t load progress">
          <div className="space-y-2">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {loading ? (
        <LoadingState label="Crunching your sessions…" />
      ) : data ? (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={riseItem} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile
              label="Average fluency"
              value={data.stats?.avgFluencyScore ? <CountUp value={`${data.stats.avgFluencyScore}%`} /> : '—'}
              icon={Gauge}
              tone="brand"
            />
            <StatTile
              label="Current streak"
              value={<CountUp value={`${data.language?.currentStreak ?? 0}d`} />}
              icon={Flame}
              tone="accent"
            />
            <StatTile
              label="Level"
              value={<span className="capitalize">{data.language?.level || 'Basic'}</span>}
              icon={GraduationCap}
              tone="positive"
            />
            <StatTile
              label="Sessions recorded"
              value={<CountUp value={data.fluencyTrend?.length ?? 0} />}
              icon={Activity}
              tone="neutral"
            />
          </motion.div>

          {adaptive && (
            <motion.div variants={riseItem}>
              <Card
                className={cx(
                  'p-5',
                  adaptive.levelChanged && 'border-brand bg-brand-soft'
                )}
              >
                <Eyebrow icon={Sparkles}>Adaptive difficulty</Eyebrow>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                  {adaptive.levelChanged ? (
                    <>
                      Your level moved from{' '}
                      <span className="font-semibold capitalize text-ink">{adaptive.previousLevel}</span> to{' '}
                      <span className="font-semibold capitalize text-brand">{adaptive.newLevel}</span>, based on a
                      rolling average of{' '}
                      <span className="tabular font-semibold text-ink">{adaptive.rollingAvg}%</span>.
                    </>
                  ) : adaptive.rollingAvg ? (
                    <>
                      Your rolling three-session average is{' '}
                      <span className="tabular font-semibold text-ink">{adaptive.rollingAvg}%</span>. Content is
                      tuned to the{' '}
                      <span className="font-semibold capitalize text-ink">{data.language?.level}</span> level.
                    </>
                  ) : (
                    'Finish three sessions and we’ll start tuning difficulty to your actual fluency.'
                  )}
                </p>
              </Card>
            </motion.div>
          )}

          <motion.div variants={riseItem}>
            <ProgressChart
              fluencyTrend={data.fluencyTrend}
              errorTypeBreakdown={data.stats?.errorTypeBreakdown}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AppShell>
  );
}
