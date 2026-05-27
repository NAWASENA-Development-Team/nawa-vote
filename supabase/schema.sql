-- ==========================================
-- NAWA-VOTE REVISED DATABASE SCHEMA
-- Execute this SQL in your Supabase SQL Editor
-- ==========================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Tables

-- Voters Table (Simplified: Token-only)
CREATE TABLE IF NOT EXISTS public.voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL, -- Distributed voting token, e.g. 'NW-X8F2B1'
  has_voted BOOLEAN DEFAULT FALSE,
  voted_at TIMESTAMPTZ,
  vote_token UUID, -- Receipt token
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidates Table (Categorized Individually)
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordinal_number INT NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  vision TEXT,
  mission TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('ketua', 'wakil_1', 'wakil_2')),
  vote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, ordinal_number) -- Unique ordinal number per category
);

-- Votes Table (Fully Anonymous - references three categories)
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  ketua_id UUID REFERENCES public.candidates(id) ON DELETE RESTRICT,
  wakil1_id UUID REFERENCES public.candidates(id) ON DELETE RESTRICT,
  wakil2_id UUID REFERENCES public.candidates(id) ON DELETE RESTRICT,
  voted_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Config Table
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID REFERENCES public.voters(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT
);

-- 2. Populate Default Settings
INSERT INTO public.system_config (key, value) VALUES
('voting_status', 'closed'), -- 'open' | 'closed' | 'ended'
('show_results', 'false') -- 'true' | 'false'
ON CONFLICT (key) DO NOTHING;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Set RLS Policies

-- Voters Policies
CREATE POLICY "Admin full access on voters"
  ON public.voters
  FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Public read voter by token for verification"
  ON public.voters
  FOR SELECT
  TO public
  USING (true);

-- Candidates Policies
CREATE POLICY "Anyone can view candidates"
  ON public.candidates
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin full access on candidates"
  ON public.candidates
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Votes Policies
-- In token-based, votes are inserted via RPC which runs as SECURITY DEFINER.
-- So we only need select policies for admin.
CREATE POLICY "Only admin/service role can view votes"
  ON public.votes
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- System Config Policies
CREATE POLICY "Anyone can read system config"
  ON public.system_config
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin can modify system config"
  ON public.system_config
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Audit Log Policies
CREATE POLICY "Admin full access on audit logs"
  ON public.audit_log
  FOR ALL
  TO authenticated
  USING (public.is_admin());


-- 5. Atomic 3-Step Voting Database Function
CREATE OR REPLACE FUNCTION public.submit_split_vote(
  p_voter_id UUID,
  p_ketua_id UUID,
  p_wakil1_id UUID,
  p_wakil2_id UUID,
  p_ip_address TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_token UUID;
  v_voting_status TEXT;
BEGIN
  -- 1. Check if voting is OPEN
  SELECT value INTO v_voting_status FROM public.system_config WHERE key = 'voting_status';
  IF v_voting_status IS NULL OR v_voting_status != 'open' THEN
    RAISE EXCEPTION 'Voting is currently closed or ended';
  END IF;

  -- 2. Check if the voter exists and has already voted
  IF NOT EXISTS (SELECT 1 FROM public.voters WHERE id = p_voter_id) THEN
    RAISE EXCEPTION 'Voter token not registered';
  END IF;
  
  IF (SELECT has_voted FROM public.voters WHERE id = p_voter_id) THEN
    RAISE EXCEPTION 'This token has already been used to vote';
  END IF;

  -- 3. Check if all candidates exist and match correct categories
  IF NOT EXISTS (SELECT 1 FROM public.candidates WHERE id = p_ketua_id AND category = 'ketua') THEN
    RAISE EXCEPTION 'Invalid Ketua candidate selected';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.candidates WHERE id = p_wakil1_id AND category = 'wakil_1') THEN
    RAISE EXCEPTION 'Invalid Wakil 1 candidate selected';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.candidates WHERE id = p_wakil2_id AND category = 'wakil_2') THEN
    RAISE EXCEPTION 'Invalid Wakil 2 candidate selected';
  END IF;

  -- 4. Generate unique vote token
  v_token := gen_random_uuid();

  -- 5. Insert anonymous split vote
  INSERT INTO public.votes (vote_token, ketua_id, wakil1_id, wakil2_id)
  VALUES (v_token, p_ketua_id, p_wakil1_id, p_wakil2_id);

  -- 6. Increment candidate vote counts
  UPDATE public.candidates SET vote_count = vote_count + 1 WHERE id = p_ketua_id;
  UPDATE public.candidates SET vote_count = vote_count + 1 WHERE id = p_wakil1_id;
  UPDATE public.candidates SET vote_count = vote_count + 1 WHERE id = p_wakil2_id;

  -- 7. Update voter status to completed
  UPDATE public.voters
  SET has_voted = TRUE,
      vote_token = v_token,
      voted_at = NOW()
  WHERE id = p_voter_id;

  -- 8. Record audit log entry
  INSERT INTO public.audit_log (voter_id, action, ip_address)
  VALUES (p_voter_id, 'SPLIT_VOTE_SUBMITTED', p_ip_address);

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Helper function to grant role in auth.users app_metadata
CREATE OR REPLACE FUNCTION public.set_user_role(
  p_user_id UUID,
  p_role TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p_role)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
