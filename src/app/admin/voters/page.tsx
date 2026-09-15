import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import VotersManager from './VotersManager';
import { Users2, ShieldAlert } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function AdminVotersPage() {
  const supabase = createClient();

  // Route security guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (user.app_metadata?.role !== 'admin' && user.app_metadata?.role !== 'supervisor')) {
    redirect('/login');
  }

  // Fetch DPT voters tokens list
  const { data: voters, error } = await supabase
    .from('voters')
    .select('id, token, has_voted, voted_at, vote_token')
    .order('token', { ascending: true });

  if (error) {
    console.error('Error fetching voters for admin DPT page:', error);
  }

  return (
    <div className="space-y-8">
      {/* Page Title Block */}
      <div>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-brand-navy-900 tracking-tight leading-tight flex items-center gap-2">
          <Users2 className="w-8 h-8 text-brand-navy-700" /> Database Token Pemilih (DPT)
        </h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-brand-navy-500" /> Pusat tata kelola kredensial token siswa. Bulk generate token langsung dari dashboard, cetak kartu PIN, serta pantau status kehadiran.
        </p>
      </div>

      {/* DPT management panel dashboard */}
      <VotersManager initialVoters={(voters as any) || []} />
    </div>
  );
}
