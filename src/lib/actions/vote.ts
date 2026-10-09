'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

interface VoteResponse {
  success: boolean;
  token?: string;
  error?: string;
  offline?: boolean;
}

interface VerificationResponse {
  success: boolean;
  verified: boolean;
  votedAt?: string;
  error?: string;
}

export interface OfflineSyncItem {
  localId: string;
  voterToken: string;
  ketuaId: string;
  wakil1Id: string;
  wakil2Id: string;
}

export interface OfflineSyncResponse {
  success: boolean;
  succeededIds: string[];
  failedItems: Array<{ localId: string; voterToken: string; error: string }>;
}

/**
 * Submit voter's choices for Ketua, Wakil 1, and Wakil 2.
 * Executes atomically via the PL/pgSQL submit_split_vote function.
 */
export async function castSplitVote(
  ketuaId: string,
  wakil1Id: string,
  wakil2Id: string
): Promise<VoteResponse> {
  try {
    const voterToken = cookies().get('nawa_voter_token')?.value;
    let voterId = cookies().get('nawa_voter_id')?.value;
    const ip = headers().get('x-forwarded-for') || headers().get('x-real-ip') || 'unknown';

    if (!voterToken || !voterId) {
      return { success: false, error: 'Sesi voting tidak valid atau telah berakhir.' };
    }

    const isUuid = (val?: string) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const supabase = createClient();

    // If voterId is not a valid UUID (e.g. offline placeholder, token string, or corrupted cookie),
    // resolve the actual voter UUID from the voters table using voterToken.
    if (!isUuid(voterId)) {
      const { data: voter, error: vErr } = await supabase
        .from('voters')
        .select('id, has_voted')
        .eq('token', voterToken.trim().toUpperCase())
        .maybeSingle();

      if (vErr || !voter) {
        return { success: false, error: 'Token pemilih tidak valid atau tidak terdaftar.' };
      }
      if (voter.has_voted) {
        return { success: false, error: 'Token ini sudah digunakan untuk memberikan suara.' };
      }
      voterId = voter.id;
    }

    // Call the revised RPC split vote function
    const { data: voteToken, error: rpcError } = await supabase.rpc('submit_split_vote', {
      p_voter_id: voterId,
      p_ketua_id: ketuaId,
      p_wakil1_id: wakil1Id,
      p_wakil2_id: wakil2Id,
      p_ip_address: ip,
    });

    if (rpcError) {
      console.error('RPC split voting error:', rpcError);
      return { success: false, error: rpcError.message || 'Gagal menyimpan pilihan suara Anda.' };
    }

    // Success! Revalidate paths
    revalidatePath('/vote');
    revalidatePath('/admin/dashboard');

    return { success: true, token: voteToken };
  } catch (error: any) {
    console.error('Voting server action error:', error);
    return { success: false, error: 'Terjadi kesalahan internal pada server' };
  }
}

/**
 * Server Action: Batch sync queued offline votes to Supabase.
 * Uses administrative privileges to resolve tokens and execute the atomic voting RPC.
 */
export async function syncOfflineVotesBatch(
  votes: OfflineSyncItem[]
): Promise<OfflineSyncResponse> {
  try {
    if (!votes || votes.length === 0) {
      return { success: true, succeededIds: [], failedItems: [] };
    }

    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
      : createClient();

    const succeededIds: string[] = [];
    const failedItems: Array<{ localId: string; voterToken: string; error: string }> = [];

    for (const item of votes) {
      try {
        const cleanToken = item.voterToken.trim().toUpperCase();

        // 1. Resolve voter record
        const { data: voter, error: vErr } = await supabase
          .from('voters')
          .select('id, has_voted')
          .eq('token', cleanToken)
          .maybeSingle();

        if (vErr || !voter) {
          failedItems.push({
            localId: item.localId,
            voterToken: item.voterToken,
            error: 'Token pemilih tidak terdaftar di database',
          });
          continue;
        }

        // If voter already has_voted in DB, treat as succeeded (idempotent replay)
        if (voter.has_voted) {
          succeededIds.push(item.localId);
          continue;
        }

        // 2. Submit vote atomically via RPC
        const { error: rpcErr } = await supabase.rpc('submit_split_vote', {
          p_voter_id: voter.id,
          p_ketua_id: item.ketuaId,
          p_wakil1_id: item.wakil1Id,
          p_wakil2_id: item.wakil2Id,
          p_ip_address: 'offline-sync-kiosk',
        });

        if (rpcErr) {
          const already =
            rpcErr.message?.toLowerCase().includes('sudah') ||
            rpcErr.message?.toLowerCase().includes('already');

          if (already) {
            succeededIds.push(item.localId);
          } else {
            failedItems.push({
              localId: item.localId,
              voterToken: item.voterToken,
              error: rpcErr.message || 'Gagal menyimpan suara',
            });
          }
        } else {
          succeededIds.push(item.localId);
        }
      } catch (err: any) {
        failedItems.push({
          localId: item.localId,
          voterToken: item.voterToken,
          error: err?.message || 'Kesalahan pemrosesan suara',
        });
      }
    }

    // Revalidate paths if any votes were synced
    if (succeededIds.length > 0) {
      revalidatePath('/admin/dashboard');
      revalidatePath('/results');
    }

    return {
      success: true,
      succeededIds,
      failedItems,
    };
  } catch (error: any) {
    return {
      success: false,
      succeededIds: [],
      failedItems: votes.map((v) => ({
        localId: v.localId,
        voterToken: v.voterToken,
        error: error?.message || 'Server action error',
      })),
    };
  }
}

/**
 * Verify if an anonymous vote token exists in the database.
 * Crucially, it only selects the voted_at timestamp to guarantee voter anonymity.
 */
export async function verifyVoteToken(token: string): Promise<VerificationResponse> {
  try {
    const cleanedToken = token.trim();
    
    // UUID v4 format verification
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanedToken)) {
      return { success: false, verified: false, error: 'Format kode token tidak valid (wajib UUID v4)' };
    }

    const adminClient = createAdminClient();

    // Query anonymous votes table
    const { data, error } = await adminClient
      .from('votes')
      .select('voted_at')
      .eq('vote_token', cleanedToken)
      .maybeSingle();

    if (error) {
      console.error('Database token verification error:', error);
      return { success: false, verified: false, error: 'Kesalahan sistem saat memeriksa token' };
    }

    if (!data) {
      return { success: true, verified: false };
    }

    return { success: true, verified: true, votedAt: data.voted_at };
  } catch (error: any) {
    console.error('Token verification action error:', error);
    return { success: false, verified: false, error: 'Terjadi kesalahan sistem' };
  }
}
