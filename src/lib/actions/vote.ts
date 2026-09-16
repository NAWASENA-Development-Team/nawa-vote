'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

interface VoteResponse {
  success: boolean;
  token?: string;
  error?: string;
}

interface VerificationResponse {
  success: boolean;
  verified: boolean;
  votedAt?: string;
  error?: string;
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
    const voterId = cookies().get('nawa_voter_id')?.value;
    const ip = headers().get('x-forwarded-for') || headers().get('x-real-ip') || 'unknown';

    if (!voterToken || !voterId) {
      return { success: false, error: 'Sesi voting tidak valid atau telah berakhir.' };
    }

    const supabase = createClient();

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
