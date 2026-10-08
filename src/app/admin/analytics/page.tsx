import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AnalyticsDashboard from './AnalyticsDashboard';
import { Activity, ShieldAlert } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const supabase = createClient();

  // Route security guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'admin') {
    redirect('/login');
  }

  // Fetch candidates data
  const { data: candidates, error: candidateErr } = await supabase
    .from('candidates')
    .select('id, ordinal_number, name, vote_count, category')
    .order('ordinal_number', { ascending: true });

  if (candidateErr) {
    console.error('Error fetching candidates for analytics:', candidateErr);
  }

  // Fetch voters data
  const { count: totalVoters, error: votersErr } = await supabase
    .from('voters')
    .select('*', { count: 'exact', head: true });

  if (votersErr) {
    console.error('Error fetching voters count:', votersErr);
  }

  const { count: totalVotesCast, error: votesCastErr } = await supabase
    .from('voters')
    .select('*', { count: 'exact', head: true })
    .eq('has_voted', true);

  if (votesCastErr) {
    console.error('Error fetching votes cast:', votesCastErr);
  }

  return (
    <div className="space-y-8">
      {/* Page Title Block */}
      <div>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-brand-navy-900 dark:text-white tracking-tight leading-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-brand-navy-700 dark:text-brand-amber-400" /> Statistik & Analitik Suara
        </h1>
        <p className="text-brand-navy-500 dark:text-slate-400 text-xs mt-1 font-semibold flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-brand-amber-500" /> Visualisasi interaktif perolehan suara secara real-time.
        </p>
      </div>

      <AnalyticsDashboard 
        candidates={(candidates as any) || []} 
        totalVoters={totalVoters || 0}
        totalVotesCast={totalVotesCast || 0}
      />
    </div>
  );
}
