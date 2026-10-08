import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ResultsClient from './ResultsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicResultsPage() {
  const supabase = createClient();

  // 1. Fetch System Configurations
  const { data: configs } = await supabase.from('system_config').select('key, value');

  const configMap = new Map((configs || []).map((c) => [c.key, c.value]));
  const showResults = configMap.get('show_results') || 'false';

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
