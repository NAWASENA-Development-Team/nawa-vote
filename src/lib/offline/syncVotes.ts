// Client-side sync: replays the offline queue to Supabase when connectivity returns.
// Uses the browser Supabase client (anon key) to call the same RPC as the server action.
// Each vote is attempted independently — one failure doesn't abort the batch.

import { createClient } from '@/lib/supabase/client';
import { getPendingQueue, markSynced, markSyncError } from './offlineQueue';

export interface SyncResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: { localId: string; voterToken: string; error: string }[];
}

/**
 * Sync all pending offline votes to Supabase.
 * Returns a summary of what happened so the caller can surface a toast.
 */
export async function syncOfflineVotes(): Promise<SyncResult> {
  const supabase = createClient();
  const pending = getPendingQueue();

  if (pending.length === 0) {
    return { total: 0, succeeded: 0, failed: 0, errors: [] };
  }

  const result: SyncResult = {
    total: pending.length,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  for (const vote of pending) {
    try {
      const { error } = await supabase.rpc('submit_split_vote', {
        p_voter_id: vote.voterId,
        p_ketua_id: vote.ketuaId,
        p_wakil1_id: vote.wakil1Id,
        p_wakil2_id: vote.wakil2Id,
        p_ip_address: 'offline-sync',
      });

      if (error) {
        // "Voter has already voted" is a no-op — treat as success to avoid retry loops
        const alreadyVoted =
          error.message?.toLowerCase().includes('sudah') ||
          error.message?.toLowerCase().includes('already') ||
          error.code === 'P0001'; // plpgsql RAISE

        if (alreadyVoted) {
          markSynced(vote.localId);
          result.succeeded++;
        } else {
          markSyncError(vote.localId, error.message);
          result.failed++;
          result.errors.push({ localId: vote.localId, voterToken: vote.voterToken, error: error.message });
        }
      } else {
        markSynced(vote.localId);
        result.succeeded++;
      }
    } catch (err: any) {
      const msg = err?.message || 'Sync error';
      markSyncError(vote.localId, msg);
      result.failed++;
      result.errors.push({ localId: vote.localId, voterToken: vote.voterToken, error: msg });
    }
  }

  return result;
}
