// Client-side sync: replays the offline queue to Supabase when connectivity returns.
// Uses the browser Supabase client (anon key) to call the same RPC as the server action.
// Each vote is attempted independently — one failure does not abort the batch.
//
// SAFETY GUARANTEES:
//   1. Module-level lock (isSyncing) prevents concurrent runs from racing.
//   2. Snapshot of pending taken at start — votes added mid-run are not included.
//   3. markSynced() called per-vote immediately on success.
//   4. clearSynced() called at end — removes all synced entries from localStorage.
//   5. "Already voted" DB errors treated as success to prevent infinite retry loops.

import { createClient } from '@/lib/supabase/client';
import { getPendingQueue, markSynced, markSyncError, clearSynced } from './offlineQueue';

export interface SyncResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: { localId: string; voterToken: string; error: string }[];
}

// Module-level lock — only one sync run at a time across all callers.
let isSyncing = false;

/**
 * Sync all pending offline votes to Supabase.
 * Safe to call multiple times: concurrent calls are silently skipped.
 * Returns a summary so the caller can surface a toast.
 */
export async function syncOfflineVotes(): Promise<SyncResult> {
  if (isSyncing) {
    return { total: 0, succeeded: 0, failed: 0, errors: [] };
  }

  // Snapshot the queue now — votes saved after this point are NOT included in this run.
  const pending = getPendingQueue();

  if (pending.length === 0) {
    return { total: 0, succeeded: 0, failed: 0, errors: [] };
  }

  isSyncing = true;

  const supabase = createClient();
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
        // "Voter has already voted" in the DB — vote is already recorded, treat as success.
        // This prevents infinite retries when the DB already has the vote.
        const alreadyVoted =
          error.message?.toLowerCase().includes('sudah') ||
          error.message?.toLowerCase().includes('already') ||
          error.code === 'P0001'; // plpgsql RAISE exception code

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

  // Remove all successfully synced entries from localStorage immediately.
  // Failed ones stay so they are retried on the next reconnect.
  clearSynced();

  isSyncing = false;
  return result;
}
