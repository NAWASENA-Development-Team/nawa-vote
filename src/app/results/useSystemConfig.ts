'use client';

/**
 * useSystemConfig.ts
 * Subscribes to system_config table changes via Supabase Realtime.
 * Merges initial server-fetched config with live updates.
 * Returns a typed config object that updates in real time.
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ColorSlot } from './colorSlots';

export interface ResultsConfig {
  showResults: boolean;
  resultsMode: 'session' | 'present';
  activeJabatan: 'ketua' | 'wakil_1' | 'wakil_2';
  activeInterface: 'cycle' | 'balloon' | 'barchart';
  cycleInterval: number; // seconds
  candidateColors: Record<string, ColorSlot>;
  revealIdentity: boolean;
}

interface RawConfig {
  show_results?: string;
  results_mode?: string;
  active_jabatan?: string;
  active_interface?: string;
  cycle_interval?: string;
  candidate_colors?: string;
  reveal_identity?: string;
}

function parseConfig(raw: RawConfig): ResultsConfig {
  let candidateColors: Record<string, ColorSlot> = {};
  try {
    if (raw.candidate_colors) {
      candidateColors = JSON.parse(raw.candidate_colors);
    }
  } catch {
    candidateColors = {};
  }

  return {
    showResults: raw.show_results === 'true',
    resultsMode: (raw.results_mode as 'session' | 'present') || 'session',
    activeJabatan: (raw.active_jabatan as 'ketua' | 'wakil_1' | 'wakil_2') || 'ketua',
    activeInterface: (raw.active_interface as 'cycle' | 'balloon' | 'barchart') || 'cycle',
    cycleInterval: parseInt(raw.cycle_interval || '30', 10),
    candidateColors,
    revealIdentity: raw.reveal_identity === 'true',
  };
}

export function useSystemConfig(initialRaw: RawConfig): ResultsConfig {
  const [config, setConfig] = useState<ResultsConfig>(() => parseConfig(initialRaw));
  const supabase = createClient();

  useEffect(() => {
    // Re-parse if initial props change (SSR revalidation)
    setConfig(parseConfig(initialRaw));
  }, [
    initialRaw.show_results,
    initialRaw.results_mode,
    initialRaw.active_jabatan,
    initialRaw.active_interface,
    initialRaw.cycle_interval,
    initialRaw.candidate_colors,
    initialRaw.reveal_identity,
  ]);

  useEffect(() => {
    const channel = supabase
      .channel('results-system-config')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_config' },
        (payload: any) => {
          const row = payload.new as { key: string; value: string };
          setConfig((prev) => {
            // Map DB row to the raw config key
            const keyMap: Record<string, keyof RawConfig> = {
              show_results: 'show_results',
              results_mode: 'results_mode',
              active_jabatan: 'active_jabatan',
              active_interface: 'active_interface',
              cycle_interval: 'cycle_interval',
              candidate_colors: 'candidate_colors',
              reveal_identity: 'reveal_identity',
            };
            const mappedKey = keyMap[row.key];
            if (!mappedKey) return prev;

            const updatedRaw: RawConfig = {
              show_results: prev.showResults ? 'true' : 'false',
              results_mode: prev.resultsMode,
              active_jabatan: prev.activeJabatan,
              active_interface: prev.activeInterface,
              cycle_interval: String(prev.cycleInterval),
              candidate_colors: JSON.stringify(prev.candidateColors),
              reveal_identity: prev.revealIdentity ? 'true' : 'false',
              [mappedKey]: row.value,
            };
            return parseConfig(updatedRaw);
          });
        }
      )
      .subscribe();

    // Fallback polling every 2.5s to ensure endpoint updates even if websocket has delay/subscription limits
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase.from('system_config').select('key, value');
        if (data && data.length > 0) {
          const rawMap: RawConfig = {};
          data.forEach((row) => {
            (rawMap as any)[row.key] = row.value;
          });
          setConfig((prev) => {
            const next = parseConfig(rawMap);
            if (
              prev.showResults !== next.showResults ||
              prev.resultsMode !== next.resultsMode ||
              prev.activeJabatan !== next.activeJabatan ||
              prev.activeInterface !== next.activeInterface ||
              prev.cycleInterval !== next.cycleInterval ||
              prev.revealIdentity !== next.revealIdentity ||
              JSON.stringify(prev.candidateColors) !== JSON.stringify(next.candidateColors)
            ) {
              return next;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Config poll error:', err);
      }
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return config;
}
