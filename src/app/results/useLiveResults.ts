'use client';

/**
 * useLiveResults.ts
 * Subscribes to candidates (UPDATE) and votes (INSERT) via Supabase Realtime.
 * Returns live-updating candidate list filtered to the active jabatan,
 * total votes cast, and which candidate was just updated (for burst animation).
 */

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { playVoteBurst, playCounterTick } from './sounds';

export interface LiveCandidate {
  id: string;
  name: string;
  category: string;
  vote_count: number;
  ordinal_number: number;
}

interface UseLiveResultsReturn {
  candidates: LiveCandidate[];
  totalVotesCast: number;
  lastUpdatedId: string | null;
}

export function useLiveResults(
  initialCandidates: LiveCandidate[],
  initialTotalVotesCast: number,
  activeJabatan: string
): UseLiveResultsReturn {
  const [candidates, setCandidates] = useState<LiveCandidate[]>(initialCandidates);
  const [totalVotesCast, setTotalVotesCast] = useState(initialTotalVotesCast);
  const [lastUpdatedId, setLastUpdatedId] = useState<string | null>(null);
  const tickCounter = useRef(0);
  const supabase = createClient();

  // Sync initial data when jabatan or server data changes
  useEffect(() => {
    setCandidates(initialCandidates);
  }, [initialCandidates]);

  useEffect(() => {
    setTotalVotesCast(initialTotalVotesCast);
  }, [initialTotalVotesCast]);

  useEffect(() => {
    const channel = supabase
      .channel('results-live-data')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'candidates' },
        (payload: any) => {
          const updated = payload.new as LiveCandidate;

          setCandidates((prev) =>
            prev.map((c) =>
              c.id === updated.id ? { ...c, vote_count: updated.vote_count } : c
            )
          );

          if (updated.category === activeJabatan) {
            setLastUpdatedId(updated.id);
            setTimeout(() => setLastUpdatedId(null), 1500);
            playVoteBurst();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        () => {
          setTotalVotesCast((prev) => {
            const next = prev + 1;
            tickCounter.current += 1;
            if (tickCounter.current % 5 === 0) playCounterTick();
            return next;
          });
        }
      )
      .subscribe();

    // Fallback polling every 3s to guarantee live data updates
    const fetchFreshData = async () => {
      try {
        const { data: candData } = await supabase
          .from('candidates')
          .select('id, name, category, vote_count, ordinal_number')
          .order('ordinal_number', { ascending: true });
        if (candData) {
          setCandidates(candData as LiveCandidate[]);
        }

        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true });
        if (count !== null && count !== undefined) {
          setTotalVotesCast(count);
        }
      } catch (err) {
        console.error('Live data poll error:', err);
      }
    };

    fetchFreshData();
    const pollInterval = setInterval(fetchFreshData, 3000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [supabase, activeJabatan]);

  // Filter to active jabatan
  const filtered = candidates.filter((c) => c.category === activeJabatan);

  return { candidates: filtered, totalVotesCast, lastUpdatedId };
}
