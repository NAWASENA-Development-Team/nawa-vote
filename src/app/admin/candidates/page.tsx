import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CandidateEditor from './CandidateEditor';
import { Sparkles, Users2 } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function AdminCandidatesPage() {
  const supabase = createClient();

  // Protect route
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'admin') {
    redirect('/login');
  }

  // Fetch candidates ordered by category and ordinal number
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('id, ordinal_number, name, photo_url, vision, mission, category')
    .order('category', { ascending: true })
    .order('ordinal_number', { ascending: true });

  if (error) {
    console.error('Error fetching candidates for admin:', error);
  }

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-brand-navy-900 tracking-tight leading-tight flex items-center gap-2">
          <Users2 className="w-8 h-8 text-brand-navy-700" /> Pengelolaan Kandidat OSIS
        </h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-amber-500" /> Tambah, edit, dan hapus calon Ketua, Wakil Ketua 1, dan Wakil Ketua 2.
        </p>
      </div>

      {/* Editor Grid Component */}
      <CandidateEditor initialCandidates={(candidates as any) || []} />
    </div>
  );
}
