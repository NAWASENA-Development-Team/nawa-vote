'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Generate secure random alphanumeric voting tokens.
 */
function generateSecureToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, O, 0, 1
  let token = 'NW-';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Server Action to bulk generate unique voter tokens.
 */
export async function generateVoterTokens(count: number): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    if (!Number.isSafeInteger(count) || count <= 0) {
      return { success: false, count: 0, error: 'Jumlah token harus berupa bilangan bulat positif.' };
    }

    const supabase = createClient();
    
    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return { success: false, count: 0, error: 'Akses ditolak. Hanya admin yang diperbolehkan.' };
    }

    const adminClient = createAdminClient();
    const uniqueTokens = new Set<string>();

    // Supabase limits each response, so read all existing tokens in pages.
    const existingTokens = new Set<string>();
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data: existingVoters, error } = await adminClient
        .from('voters')
        .select('token')
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      for (const voter of existingVoters) {
        existingTokens.add(voter.token);
      }
      if (existingVoters.length < pageSize) break;
    }

    let attempts = 0;
    const maxAttempts = count * 10; // Avoid infinite loop

    while (uniqueTokens.size < count && attempts < maxAttempts) {
      const tok = generateSecureToken();
      if (!existingTokens.has(tok)) {
        uniqueTokens.add(tok);
      }
      attempts++;
    }

    if (uniqueTokens.size < count) {
      return { success: false, count: 0, error: 'Terjadi kegagalan collision generator. Silakan coba kembali.' };
    }

    const payload = Array.from(uniqueTokens).map((token) => ({
      token,
      has_voted: false,
    }));

    // Keep each request small to avoid database/API payload limits.
    const chunkSize = 500;
    let insertedCount = 0;
    for (let offset = 0; offset < payload.length; offset += chunkSize) {
      const chunk = payload.slice(offset, offset + chunkSize);
      const { error } = await adminClient.from('voters').insert(chunk);

      if (error) {
        console.error(`Token generation batch ${offset / chunkSize + 1} error:`, error);
        if (insertedCount > 0) {
          revalidatePath('/admin/voters');
          revalidatePath('/admin/dashboard');
        }
        return {
          success: false,
          count: insertedCount,
          error: `Gagal menyimpan batch token. ${insertedCount} token telah tersimpan. ${error.message}`,
        };
      }
      insertedCount += chunk.length;
    }

    revalidatePath('/admin/voters');
    revalidatePath('/admin/dashboard');

    return { success: true, count: insertedCount };
  } catch (error: any) {
    console.error('Token generation action error:', error);
    return { success: false, count: 0, error: error.message || 'Gagal membuat token baru' };
  }
}

/**
 * Update system configurations like voting status.
 */
export async function updateSystemConfig(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return { success: false, error: 'Akses ditolak' };
    }

    const { error } = await supabase
      .from('system_config')
      .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) throw error;

    revalidatePath('/admin/dashboard');
    revalidatePath('/vote');
    revalidatePath('/results');

    return { success: true };
  } catch (error: any) {
    console.error('Config update error:', error);
    return { success: false, error: error.message || 'Gagal memperbarui konfigurasi' };
  }
}

/**
 * Create or Update Candidate (CRUD). Includes categorized scoping.
 */
export async function upsertCandidate(data: {
  id?: string;
  ordinal_number: number;
  name: string;
  photo_url: string;
  vision: string;
  mission: string[];
  category: 'ketua' | 'wakil_1' | 'wakil_2';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return { success: false, error: 'Akses ditolak' };
    }

    const payload = {
      ordinal_number: data.ordinal_number,
      name: data.name.trim(),
      photo_url: data.photo_url || null,
      vision: data.vision.trim(),
      mission: data.mission,
      category: data.category,
    };

    let error;
    if (data.id) {
      // Update
      const { error: err } = await supabase
        .from('candidates')
        .update(payload)
        .eq('id', data.id);
      error = err;
    } else {
      // Insert
      const { error: err } = await supabase
        .from('candidates')
        .insert(payload);
      error = err;
    }

    if (error) throw error;

    revalidatePath('/admin/candidates');
    revalidatePath('/vote');
    return { success: true };
  } catch (error: any) {
    console.error('Upsert candidate error:', error);
    return { success: false, error: error.message || 'Gagal menyimpan data kandidat' };
  }
}

/**
 * Delete a candidate.
 */
export async function deleteCandidate(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return { success: false, error: 'Akses ditolak' };
    }

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/candidates');
    revalidatePath('/vote');
    return { success: true };
  } catch (error: any) {
    console.error('Delete candidate error:', error);
    return { success: false, error: error.message || 'Gagal menghapus kandidat' };
  }
}

/**
 * Reset all voting data (clear votes, reset voters, clear audit log, reset candidate vote counts)
 */
export async function resetVotingData(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return { success: false, error: 'Akses ditolak' };
    }

    const adminClient = createAdminClient();

    // 1. Delete all audit logs
    const { error: logErr } = await adminClient.from('audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (logErr) throw logErr;

    // 2. Delete all votes
    const { error: votesErr } = await adminClient.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (votesErr) throw votesErr;

    // 3. Reset candidate vote counts to 0
    const { error: candidateErr } = await adminClient.from('candidates').update({ vote_count: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
    if (candidateErr) throw candidateErr;

    // 4. Reset voter flag has_voted = false, vote_token = null
    const { error: voterErr } = await adminClient.from('voters').update({
      has_voted: false,
      vote_token: null,
      voted_at: null,
    }).neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (voterErr) throw voterErr;

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/voters');
    revalidatePath('/vote');

    return { success: true };
  } catch (error: any) {
    console.error('Reset data error:', error);
    return { success: false, error: error.message || 'Gagal mereset data voting' };
  }
}

/**
 * Reset an individual voter token so it can vote again.
 * If the token already cast a vote, decrements the vote counts for the candidates
 * voted for and deletes the vote record.
 */
export async function resetIndividualToken(voterId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return { success: false, error: 'Akses ditolak' };
    }

    const adminClient = createAdminClient();

    // 1. Fetch the voter record
    const { data: voter, error: voterFetchErr } = await adminClient
      .from('voters')
      .select('id, token, has_voted, vote_token')
      .eq('id', voterId)
      .maybeSingle();

    if (voterFetchErr || !voter) {
      return { success: false, error: 'Token pemilih tidak ditemukan' };
    }

    // 2. If the voter had voted and has a vote_token, revert candidate vote counts and remove the vote
    if (voter.has_voted && voter.vote_token) {
      const { data: voteRecord } = await adminClient
        .from('votes')
        .select('id, ketua_id, wakil1_id, wakil2_id')
        .eq('vote_token', voter.vote_token)
        .maybeSingle();

      if (voteRecord) {
        // Decrement candidate counts
        const candIds = [voteRecord.ketua_id, voteRecord.wakil1_id, voteRecord.wakil2_id].filter(Boolean);
        for (const cId of candIds) {
          const { data: cand } = await adminClient
            .from('candidates')
            .select('vote_count')
            .eq('id', cId)
            .maybeSingle();
          if (cand && typeof cand.vote_count === 'number' && cand.vote_count > 0) {
            await adminClient
              .from('candidates')
              .update({ vote_count: cand.vote_count - 1 })
              .eq('id', cId);
          }
        }

        // Delete the vote row
        await adminClient.from('votes').delete().eq('id', voteRecord.id);
      }
    }

    // 3. Reset the voter's status
    const { error: updateErr } = await adminClient
      .from('voters')
      .update({
        has_voted: false,
        vote_token: null,
        voted_at: null,
      })
      .eq('id', voterId);

    if (updateErr) throw updateErr;

    // 4. Log audit event
    await adminClient.from('audit_log').insert({
      voter_id: voter.id,
      action: `TOKEN_RESET_INDIVIDUAL: ${voter.token}`,
    });

    revalidatePath('/admin/voters');
    revalidatePath('/admin/dashboard');
    revalidatePath('/results');

    return { success: true };
  } catch (error: any) {
    console.error('Reset individual token error:', error);
    return { success: false, error: error.message || 'Gagal mereset token' };
  }
}

