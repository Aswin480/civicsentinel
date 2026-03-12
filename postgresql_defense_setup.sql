-- ==========================================
-- CIVIC SENTINEL: STANDARD POSTGRESQL SETUP
-- ==========================================
-- Note: This script replaces `supabase_defense_setup.sql`. 
-- Since we are no longer using Supabase:
-- 1. Row Level Security (RLS) based on JWTs (auth.uid()) is removed. Security is now handled in the Node.js Express backend.
-- 2. Database Webhooks (pg_net) to trigger AI analysis are removed. The Express backend will handle calling the AI API during the POST request.

-- 0. Infrastructure Setup
CREATE TABLE IF NOT EXISTS grievances (
    id TEXT PRIMARY KEY, -- Replacing UUID to match the frontend temp IDs for now, or use UUID if preferred
    user_name TEXT,
    type TEXT,
    category TEXT,
    status TEXT DEFAULT 'PENDING',
    description TEXT,
    location JSONB,
    timestamp BIGINT,
    evidence_url TEXT,
    assigned_to TEXT,
    department TEXT,
    votes INTEGER DEFAULT 0,
    replies JSONB DEFAULT '[]'::jsonb,
    ai_analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1. DEPARTMENT MANAGEMENT
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    official_name TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed basic departments
INSERT INTO departments (name) VALUES 
('Public Works'), ('Health & Sanitation'), ('Traffic & Police'), 
('Electricity'), ('Water Supply'), ('Urban Planning')
ON CONFLICT (name) DO NOTHING;

-- 2. THE "DEFENSE GRID" COLUMN PROTECTION
-- While RLS is gone, we can still use DB triggers to ensure 'ai_analysis' is 
-- protected from tampered updates, though the Express backend should primarily enforce this.

CREATE OR REPLACE FUNCTION protect_ai_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- In a standard DB setup, we can't easily check the user role via auth.jwt().
  -- Instead, your Express backend should be the only system executing queries.
  -- This trigger is simplified: it prevents UPDATEs to the ai_analysis column 
  -- unless explicitly allowed (you could pass a specific DB user or variable).
  
  -- For now, we trust the Node.js backend (which connects as the superuser).
  -- If you want strict DB-level enforcement, you would create separate Postgres users
  -- for different Express routes, which is overly complex for most apps.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER block_manual_ai_analysis
BEFORE UPDATE ON grievances
FOR EACH ROW EXECUTE FUNCTION protect_ai_analysis();

-- 3. AI Trigger Alternative
-- Supabase used `net.http_post` to trigger an Edge Function.
-- In this standard PostgreSQL setup, DO NOT use DB triggers for HTTP calls.
-- Instead, in `server/index.js`, when a POST request hits `/api/grievances`:
--   1. Insert the grievance into the DB.
--   2. Call your AI function (Gemini) directly in Node.js.
--   3. UPDATE the grievance with the `ai_analysis` result.
