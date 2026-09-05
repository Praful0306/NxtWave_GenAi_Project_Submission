import AppShell from '../components/AppShell/AppShell';
import OnboardingWizard from '../components/OnboardingWizard/OnboardingWizard';
import { Eyebrow } from '../components/ui';
import { Sparkles } from 'lucide-react';

export default function Onboarding() {
  return (
    <AppShell className="space-y-6">
      <div className="space-y-2 text-center">
        <Eyebrow icon={Sparkles} className="justify-center">
          Three questions
        </Eyebrow>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          Let’s build your plan
        </h1>
        <p className="mx-auto max-w-md text-sm text-ink-soft">
          Tell us the language, where you’re starting from, and how long you’ve got.
        </p>
      </div>

      <OnboardingWizard />
    </AppShell>
  );
}
