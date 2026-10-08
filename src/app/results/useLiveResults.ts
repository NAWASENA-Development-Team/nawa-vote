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
          if (updated.category !== activeJabatan) return;

          setCandidates((prev) =>
            prev.map((c) =>
              c.id === updated.id ? { ...c, vote_count: updated.vote_count } : c
            )
          );

          setLastUpdatedId(updated.id);
          setTimeout(() => setLastUpdatedId(null), 1500);
          playVoteBurst();
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, activeJabatan]);

  // Filter to active jabatan
  const filtered = candidates.filter((c) => c.category === activeJabatan);

  return { candidates: filtered, totalVotesCast, lastUpdatedId };
}
