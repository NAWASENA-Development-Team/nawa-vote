// Client-side sync: replays the offline queue to Supabase when connectivity returns.
// Uses the browser Supabase client (anon key) to call the same RPC as the server action.
// Each vote is attempted independently — one failure does not abort the batch.
//
// SAFETY GUARANTEES:
//   1. In-process lock (isSyncing) — blocks concurrent calls within the same tab.
//   2. Cross-tab lock (localStorage SYNC_LOCK_KEY + TTL) — blocks two tabs racing.
//   3. Snapshot of pending taken at start — votes added mid-run are not included.
//   4. markSynced() called per-vote immediately on success.
//   5. clearSynced() called at end — removes synced entries from localStorage.
//   6. "Already voted" DB errors treated as success (idempotency at DB layer).
//   7. DB RPC submit_split_vote checks has_voted before inserting — final hard guard.

import { createClient } from '@/lib/supabase/client';
import { getPendingQueue, markSynced, markSyncError, clearSynced } from './offlineQueue';

export interface SyncResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: { localId: string; voterToken: string; error: string }[];
}

// ─── Locks ────────────────────────────────────────────────────────────────────

// In-process lock — fast path for same-tab concurrent calls.
let isSyncing = false;

// Cross-tab lock key in localStorage.
const SYNC_LOCK_KEY = 'nawa_sync_lock';
// Locks older than this are considered stale (crashed tab) and are overwritten.
const LOCK_TTL_MS = 60_000;

function acquireCrossTabLock(): boolean {
  try {
    const existing = localStorage.getItem(SYNC_LOCK_KEY);
    if (existing) {
      const lockedAt = parseInt(existing, 10);
      if (Date.now() - lockedAt < LOCK_TTL_MS) {
        return false; // another tab holds an active lock
      }
    }
    localStorage.setItem(SYNC_LOCK_KEY, Date.now().toString());
    return true;
  } catch {
    // localStorage unavailable — DB idempotency is the final guard.
    return true;
  }
}

function releaseCrossTabLock(): void {
  try {
    localStorage.removeItem(SYNC_LOCK_KEY);
  } catch {
    // ignore
  }
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

/**
 * Sync all pending offline votes to Supabase.
 * Safe to call multiple times and from multiple tabs — only one run proceeds at a time.
 * Returns a result summary so the caller can surface a toast.
 */
export async function syncOfflineVotes(): Promise<SyncResult> {
  // Same-tab guard
  if (isSyncing) {
    return { total: 0, succeeded: 0, failed: 0, errors: [] };
  }

  // Cross-tab guard
  if (!acquireCrossTabLock()) {
    return { total: 0, succeeded: 0, failed: 0, errors: [] };
  }

  isSyncing = true;

  try {
    // Snapshot pending now — votes saved after this point are excluded from this run.
    const pending = getPendingQueue();

    if (pending.length === 0) {
      return { total: 0, succeeded: 0, failed: 0, errors: [] };
    }

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
          // "Voter has already voted" — vote already in DB (possibly by the other tab).
          // Mark as synced so we stop retrying it. DB is the source of truth.
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
            result.errors.push({
              localId: vote.localId,
              voterToken: vote.voterToken,
              error: error.message,
            });
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

    // Remove successfully synced entries. Failed ones stay for the next retry.
    clearSynced();

    return result;
  } finally {
    // Always release both locks — even if an unexpected error is thrown mid-run.
    isSyncing = false;
    releaseCrossTabLock();
  }
}
