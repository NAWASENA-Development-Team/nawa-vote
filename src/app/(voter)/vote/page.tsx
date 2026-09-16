import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import VoteWizard, { CategorizedCandidate } from './VoteWizard';
import { logout } from '@/lib/actions/auth';
import { Award, LogOut, Info } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function VotePage() {
  const cookieStore = cookies();
  const voterToken = cookieStore.get('nawa_voter_token')?.value;
  const voterId = cookieStore.get('nawa_voter_id')?.value;

  if (!voterToken || !voterId) {
    redirect('/?error=unauthorized');
  }

  const supabase = createClient();

  // Execute all queries in parallel (voter verification, system config, and candidates list)
  const [
    { data: voter, error: voterError },
    { data: config },
    { data: candidates, error: candError }
  ] = await Promise.all([
    supabase
      .from('voters')
      .select('id, token, has_voted, vote_token')
      .eq('id', voterId)
      .eq('token', voterToken)
      .maybeSingle(),
    supabase
      .from('system_config')
      .select('value')
      .eq('key', 'voting_status')
      .single(),
    supabase
      .from('candidates')
      .select('id, ordinal_number, name, photo_url, vision, mission, category')
      .order('category', { ascending: true })
      .order('ordinal_number', { ascending: true })
  ]);

  if (voterError || !voter) {
    redirect('/?error=unauthorized');
  }

  // Double-vote safeguard redirect to success receipt
  if (voter.has_voted) {
    redirect(`/success?token=${voter.vote_token || ''}`);
  }

  const votingStatus = config?.value || 'closed';

  if (votingStatus !== 'open') {
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-brand-amber-600 flex items-center justify-center mb-6 shadow-brand-gold">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-black text-2xl text-brand-navy-900 leading-tight">
          Bilik Suara Ditutup
        </h2>
        <p className="text-slate-500 text-xs mt-3 leading-relaxed font-semibold">
          Pemilihan Ketua &amp; Wakil Ketua OSIS saat ini sedang ditutup atau belum dibuka resmi oleh Panitia.
        </p>
        <div className="mt-8 flex gap-4 w-full">
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold uppercase tracking-wider transition-colors text-center font-heading border border-slate-200"
          >
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  if (candError) {
    console.error('Failed to load candidates:', candError);
  }

  return (
    <VoteWizard
      candidates={(candidates as CategorizedCandidate[]) || []}
      voterToken={voterToken}
    />
  );
}
