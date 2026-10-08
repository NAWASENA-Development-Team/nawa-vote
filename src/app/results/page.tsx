import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ResultsClient from './ResultsClient';

export const revalidate = 1200; // Next.js ISR cache acts as the delay. Updates every 20m instead of rolling delay.

export default async function PublicResultsPage() {
  const supabase = createClient();

  // 1. Fetch System Configurations
  const { data: configs } = await supabase.from('system_config').select('key, value');

  const configMap = new Map((configs || []).map((c) => [c.key, c.value]));
  const showResults = configMap.get('show_results');

  // If results not published yet, show placeholder screen
  if (showResults !== 'true') {
    return (
      <div className="min-h-screen bg-brand-navy-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm text-center max-w-lg border border-brand-navy-100">
          <div className="w-16 h-16 bg-brand-amber-100 text-brand-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-brand-navy-900 mb-3 font-heading">
            Hasil Belum Dipublikasikan
          </h2>
          <p className="text-brand-navy-500 font-medium">
            Panitia belum membuka akses untuk melihat hasil pemilu live. Silakan kembali lagi nanti.
          </p>
        </div>
      </div>
    );
  }

  // 2. Fetch Candidates
  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, name, category, vote_count, ordinal_number')
    .order('ordinal_number', { ascending: true });

  // 3. Fetch Total Votes Count
  const { count: totalVotesCast } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true });

  const rawConfigRecord: Record<string, string | undefined> = {
    show_results: showResults,
    results_mode: configMap.get('results_mode') || 'session',
    active_jabatan: configMap.get('active_jabatan') || 'ketua',
    active_interface: configMap.get('active_interface') || 'cycle',
    cycle_interval: configMap.get('cycle_interval') || '30',
    candidate_colors: configMap.get('candidate_colors') || '{}',
    reveal_identity: configMap.get('reveal_identity') || 'false',
  };

  return (
    <ResultsClient
      initialRawConfig={rawConfigRecord}
      initialCandidates={(candidates as any) || []}
      initialTotalVotesCast={totalVotesCast || 0}
    />
  );
}
