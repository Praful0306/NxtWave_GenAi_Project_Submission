import React from 'react';
import Navbar from '../components/Navbar';
import OnboardingWizard from '../components/OnboardingWizard/OnboardingWizard';

export default function Onboarding() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 flex flex-col justify-center">
        <OnboardingWizard />
      </main>
    </div>
  );
}
