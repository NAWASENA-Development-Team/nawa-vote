// Offline vote queue — stores pending votes in localStorage when connectivity is lost.
// One device handles many sequential voters (multi-vote kiosk). Each vote is keyed
// by its voter token so duplicate prevention works at sync time.

export interface OfflineVote {
  localId: string;         // Random UUID — receipt shown to voter
  voterToken: string;      // NW-XXXXXX token entered by operator
  voterId: string;         // Supabase UUID from nawa_voter_id cookie
  ketuaId: string;
  wakil1Id: string;
  wakil2Id: string;
  timestamp: number;
  synced: boolean;
  syncError?: string;
}

const QUEUE_KEY = 'nawa_offline_votes';

function readQueue(): OfflineVote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineVote[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: OfflineVote[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Save a vote locally. Returns a local UUID used as the offline receipt. */
export function saveVoteOffline(
  voterToken: string,
  voterId: string,
  ketuaId: string,
  wakil1Id: string,
  wakil2Id: string
): string {
  const localId = crypto.randomUUID();
  const queue = readQueue();
  queue.push({ localId, voterToken, voterId, ketuaId, wakil1Id, wakil2Id, timestamp: Date.now(), synced: false });
  writeQueue(queue);
  return localId;
}

/** All unsynced votes waiting to be sent to Supabase. */
export function getPendingQueue(): OfflineVote[] {
  return readQueue().filter((v) => !v.synced);
}

/** Total offline votes (synced + pending). */
export function getOfflineQueue(): OfflineVote[] {
  return readQueue();
}

/** Mark a single vote as synced. */
export function markSynced(localId: string): void {
  const queue = readQueue().map((v) =>
    v.localId === localId ? { ...v, synced: true, syncError: undefined } : v
  );
  writeQueue(queue);
}

/** Record a sync error so the UI can surface it. */
export function markSyncError(localId: string, error: string): void {
  const queue = readQueue().map((v) =>
    v.localId === localId ? { ...v, syncError: error } : v
  );
  writeQueue(queue);
}

/** Remove all synced entries to keep storage lean. */
export function clearSynced(): void {
  writeQueue(readQueue().filter((v) => !v.synced));
}

/** How many votes are still pending sync. */
export function pendingCount(): number {
  return getPendingQueue().length;
}
