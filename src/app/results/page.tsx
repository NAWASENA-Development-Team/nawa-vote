import { createClient } from '@/lib/supabase/server';
import React from 'react';

export const revalidate = 0;

export default async function PublicResultsPage() {
  const supabase = createClient();
  
  const { data: cfg } = await supabase.from('system_config').select('value').eq('key', 'show_results').single();
  if (cfg?.value !== 'true') {
    return <div className="p-10 text-center font-bold">Hasil pemilu belum dipublikasikan panitia.</div>;
  }

  const { data: candidates } = await supabase.from('candidates').select('id, name, category, vote_count').order('vote_count', { ascending: false });
  
  return (
    <div className="p-8 max-w-xl mx-auto font-sans">
      <h1 className="text-2xl font-black mb-6">Live Leaderboard</h1>
      <div className="space-y-3">
        {candidates?.map((c, i) => (
          <div key={c.id} className="flex justify-between items-center p-4 bg-slate-50 border rounded-xl">
            <div>
              <span className="font-bold text-lg">#{i + 1} {c.name}</span>
              <span className="block text-xs text-slate-500 uppercase">{c.category}</span>
            </div>
            <strong className="text-2xl text-indigo-600">{c.vote_count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
