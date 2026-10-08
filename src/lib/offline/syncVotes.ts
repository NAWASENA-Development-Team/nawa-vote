// Client-side sync: replays the offline queue to Supabase when connectivity returns.
// Prioritizes the dedicated server action (syncOfflineVotesBatch) which has full server-side
// resolution privileges, and falls back to client RPC if needed.
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
import { syncOfflineVotesBatch } from '@/lib/actions/vote';
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

    const result: SyncResult = {
      total: pending.length,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    // ── Primary Path: Dedicated Server Action with full authority ──────────────
    try {
      const batchPayload = pending.map((p) => ({
        localId: p.localId,
        voterToken: p.voterToken,
        ketuaId: p.ketuaId,
        wakil1Id: p.wakil1Id,
        wakil2Id: p.wakil2Id,
      }));

      const batchRes = await syncOfflineVotesBatch(batchPayload);

      if (batchRes && batchRes.success) {
        // Mark succeeded items
        for (const id of batchRes.succeededIds) {
          markSynced(id);
          result.succeeded++;
        }

        // Mark failed items
        for (const item of batchRes.failedItems) {
          markSyncError(item.localId, item.error);
          result.failed++;
          result.errors.push(item);
        }

        // Clean up synced votes from localStorage
        clearSynced();
        return result;
      }
    } catch {
      // Server action network failure (still offline or transient) — fallback to direct RPC below
    }

    // ── Secondary Path: Direct Browser Supabase Client ─────────────────────────
    const supabase = createClient();

    for (const vote of pending) {
      try {
        let voterId = vote.voterId;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        // If voterId is not a valid UUID (e.g. offline-xxx placeholder), resolve real UUID from voters table
        if (!voterId || !uuidRegex.test(voterId)) {
          const { data: voterRecord, error: vErr } = await supabase
            .from('voters')
            .select('id, has_voted')
            .eq('token', vote.voterToken)
            .maybeSingle();

          if (vErr || !voterRecord) {
            markSyncError(vote.localId, 'Token voter tidak terdaftar di sistem');
            result.failed++;
            result.errors.push({
              localId: vote.localId,
              voterToken: vote.voterToken,
              error: 'Token voter tidak terdaftar di database',
            });
            continue;
          }

          if (voterRecord.has_voted) {
            // Vote already recorded in database
            markSynced(vote.localId);
            result.succeeded++;
            continue;
          }

          voterId = voterRecord.id;
        }

        const { error } = await supabase.rpc('submit_split_vote', {
          p_voter_id: voterId,
          p_ketua_id: vote.ketuaId,
          p_wakil1_id: vote.wakil1Id,
          p_wakil2_id: vote.wakil2Id,
          p_ip_address: 'offline-sync',
        });

        if (error) {
          const alreadyVoted =
            error.message?.toLowerCase().includes('sudah') ||
            error.message?.toLowerCase().includes('already') ||
            error.code === 'P0001';

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

    // Remove successfully synced entries
    clearSynced();

    return result;
  } finally {
    // Always release both locks
    isSyncing = false;
    releaseCrossTabLock();
  }
}
