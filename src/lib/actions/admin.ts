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
    const supabase = createClient();
    
    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return { success: false, count: 0, error: 'Akses ditolak. Hanya admin yang diperbolehkan.' };
    }

    const adminClient = createAdminClient();
    const uniqueTokens = new Set<string>();

    // Fetch existing tokens to avoid collisions
    const { data: existingVoters } = await adminClient.from('voters').select('token');
    const existingTokens = new Set((existingVoters || []).map((v) => v.token));

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

    // Bulk insert
    const { error } = await adminClient.from('voters').insert(payload);
    
    if (error) throw error;

    revalidatePath('/admin/voters');
    revalidatePath('/admin/dashboard');

    return { success: true, count: payload.length };
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
