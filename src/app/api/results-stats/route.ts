import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. First attempt with service role admin client if configured
    const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;
    let votesCount: number | null = null;
    let candidatesData: any[] | null = null;

    if (adminClient) {
      const [{ count }, { data: cands }] = await Promise.all([
        adminClient.from('votes').select('*', { count: 'exact', head: true }),
        adminClient
          .from('candidates')
          .select('id, name, category, vote_count, ordinal_number')
          .order('ordinal_number', { ascending: true }),
      ]);
      votesCount = count;
      candidatesData = cands;
    }

    // 2. Fallback to standard server client
    if (votesCount === null) {
      const serverClient = createClient();
      const [{ count }, { data: cands }] = await Promise.all([
        serverClient.from('votes').select('*', { count: 'exact', head: true }),
        serverClient
          .from('candidates')
          .select('id, name, category, vote_count, ordinal_number')
          .order('ordinal_number', { ascending: true }),
      ]);
      votesCount = count;
      if (!candidatesData) {
        candidatesData = cands;
      }
    }

    // 3. Fallback calculation: If votes table is restricted by RLS (returns null or 0),
    // derive total unique voter ballots cast from candidates sum of 'ketua'
    // (Every valid vote ballot contains exactly 1 ketua vote).
    const ketuaVotesSum = (candidatesData || [])
      .filter((c: any) => c.category === 'ketua')
      .reduce((acc: number, curr: any) => acc + (Number(curr.vote_count) || 0), 0);

    const safeTotalVotesCast = Math.max(Number(votesCount) || 0, ketuaVotesSum);

    return NextResponse.json({
      success: true,
      totalVotesCast: safeTotalVotesCast,
      candidates: candidatesData || [],
      timestamp: Date.now(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    console.error('Error fetching results stats:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
