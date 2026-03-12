-- Run this against your local PostgreSQL database

CREATE TABLE IF NOT EXISTS public.grievances (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    type TEXT,
    category TEXT,
    status TEXT,
    description TEXT,
    timestamp BIGINT,
    evidence_url TEXT,
    votes INTEGER DEFAULT 0,
    replies JSONB DEFAULT '[]'::jsonb,
    location JSONB DEFAULT '{}'::jsonb,
    ai_analysis JSONB DEFAULT '{}'::jsonb
);
