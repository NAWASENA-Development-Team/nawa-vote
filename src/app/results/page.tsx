import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ResultsClient from './ResultsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicResultsPage() {
  const supabase = createClient();

  // Check if current visitor has admin/supervisor cookie session
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const role = user?.app_metadata?.role;
  const isAdmin = role === 'admin' || role === 'supervisor';

  // 1. Fetch System Configurations
  const { data: configs } = await supabase.from('system_config').select('key, value');

  const configMap = new Map((configs || []).map((c) => [c.key, c.value]));
  const showResults = configMap.get('show_results') || 'false';

  // 2. Fetch Candidates
  const { data: candidates } = await supabase
    .from('candidates')
    .select('id, name, category, vote_count, ordinal_number')
    .order('ordinal_number', { ascending: true });

  // 3. Fetch Total Votes Count (with fallback if anon role is RLS-restricted on votes table)
  let totalVotesCast = 0;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/server');
      const adminClient = createAdminClient();
      const { count } = await adminClient.from('votes').select('*', { count: 'exact', head: true });
      if (count !== null && count !== undefined) {
        totalVotesCast = count;
      }
    } catch {
      // fallback below
    }
  }

  if (!totalVotesCast) {
    const { count } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });
    totalVotesCast = count || 0;
  }

  // If votes table count returned 0 or null due to public RLS, derive total unique voter ballots from 'ketua'
  const ketuaVotesSum = (candidates || [])
    .filter((c: any) => c.category === 'ketua')
    .reduce((acc: number, curr: any) => acc + (Number(curr.vote_count) || 0), 0);

  const safeTotalVotes = Math.max(totalVotesCast, ketuaVotesSum);

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
      initialTotalVotesCast={safeTotalVotes}
      isAdmin={isAdmin}
    />
  );
}
