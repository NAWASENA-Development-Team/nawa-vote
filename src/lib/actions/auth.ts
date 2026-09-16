'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

interface AuthResponse {
  success: boolean;
  error?: string;
  role?: 'voter' | 'admin';
}

/**
 * Log in a voter using their alphanumeric Token (e.g. NW-XXXXXX)
 */
export async function loginVoterToken(token: string): Promise<AuthResponse> {
  try {
    const cleanToken = String(token).toUpperCase().trim();

    if (!cleanToken) {
      return { success: false, error: 'Token voting wajib diisi' };
    }

    // Alphanumeric format check e.g. NW-ABCDEF
    const tokenRegex = /^NW-[A-Z0-9]{6}$/;
    if (!tokenRegex.test(cleanToken)) {
      return { success: false, error: 'Format Token salah (contoh: NW-A8B9C2)' };
    }

    const supabase = createClient();

    // Check system status config first
    const { data: config } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'voting_status')
      .single();

    const votingStatus = config?.value || 'closed';
    if (votingStatus !== 'open') {
      return { success: false, error: 'Pemilihan suara saat ini sedang ditutup atau belum dimulai' };
    }

    // Query token from database
    const { data: voter, error: voterError } = await supabase
      .from('voters')
      .select('*')
      .eq('token', cleanToken)
      .maybeSingle();

    if (voterError || !voter) {
      return { success: false, error: 'Token voting tidak terdaftar di sistem' };
    }

    if (voter.has_voted) {
      return { success: false, error: 'Token ini sudah digunakan untuk memberikan suara!' };
    }

    // Set secure voter cookies
    cookies().set('nawa_voter_token', cleanToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 30, // 30 minutes voting session
    });

    cookies().set('nawa_voter_id', voter.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 30,
    });

    // Record login in audit log
    const ip = headers().get('x-forwarded-for') || headers().get('x-real-ip') || 'unknown';
    await supabase.from('audit_log').insert({
      voter_id: voter.id,
      action: 'VOTER_LOGIN',
      ip_address: ip,
    });

    return { success: true, role: 'voter' };
  } catch (error: any) {
    console.error('Voter token login error:', error);
    return { success: false, error: 'Terjadi kesalahan internal pada server' };
  }
}

/**
 * Log in an Admin or Supervisor using Supabase Auth
 */
export async function loginAdmin(email: string, password: string): Promise<AuthResponse> {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email dan password wajib diisi' };
    }

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (authError || !authData.user) {
      return { success: false, error: 'Email atau password salah' };
    }

    const role = authData.user.app_metadata?.role;
    if (role !== 'admin' && role !== 'supervisor') {
      await supabase.auth.signOut();
      return { success: false, error: 'Akun ini tidak memiliki hak akses panel admin' };
    }

    return { success: true, role: role as 'admin' };
  } catch (error: any) {
    console.error('Admin login error:', error);
    return { success: false, error: 'Terjadi kesalahan sistem' };
  }
}

/**
 * Clear secure cookies and logout session (for both voters and admin)
 */
export async function logout(): Promise<void> {
  const supabase = createClient();
  
  // Try to sign out from auth (admin/supervisor session)
  await supabase.auth.signOut();

  // Clear voter cookies
  cookies().delete('nawa_voter_token');
  cookies().delete('nawa_voter_id');
  
  redirect('/');
}
