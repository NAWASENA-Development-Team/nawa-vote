'use client';

import React, { Suspense } from 'react';
import VoteWizard from '@/app/(voter)/vote/VoteWizard';
import { Loader2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="w-full flex-1 flex flex-col">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center min-h-screen p-4 bg-brand-navy-50 dark:bg-slate-950">
            <div className="text-center py-10 flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin text-brand-amber-500 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest text-brand-navy-500 dark:text-slate-400">
                Memuat bilik suara...
              </p>
            </div>
          </div>
        }
      >
        <VoteWizard />
      </Suspense>
    </main>
  );
}
