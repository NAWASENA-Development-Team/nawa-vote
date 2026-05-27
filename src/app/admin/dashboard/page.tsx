import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardConsole from './DashboardConsole';

// Force dynamic fetch to keep database values updated
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createClient();

  // Get admin session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'admin') {
    redirect('/login');
  }

  // 1. Fetch Voters Count
  const { count: totalVoters, error: votersCountError } = await supabase
    .from('voters')
    .select('*', { count: 'exact', head: true });

  if (votersCountError) {
    console.error('Error fetching total voters count:', votersCountError);
  }

  // 2. Fetch Votes Count (Turnout)
  const { count: totalVotesCast, error: votesCountError } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true });

  if (votesCountError) {
    console.error('Error fetching votes count:', votesCountError);
  }

  // 3. Fetch Candidate live counts for initial stats
  const { data: candidates, error: candError } = await supabase
    .from('candidates')
    .select('id, ordinal_number, name, vote_count, category')
    .order('ordinal_number', { ascending: true });

  if (candError) {
    console.error('Error fetching candidates:', candError);
  }

  // 4. Fetch System configs
  const { data: configs } = await supabase.from('system_config').select('*');

  const configMap = new Map((configs || []).map((c) => [c.key, c.value]));
  const currentStatus = configMap.get('voting_status') || 'closed';
  const showResults = configMap.get('show_results') === 'true';

  const votersNum = totalVoters || 0;
  const votesCastNum = totalVotesCast || 0;

  return (
    <DashboardConsole
      initialCandidates={(candidates as any) || []}
      initialTotalVoters={votersNum}
      initialTotalVotesCast={votesCastNum}
      currentStatus={currentStatus}
      showResults={showResults}
    />
  );
}

