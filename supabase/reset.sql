-- NUCLEAR RESET: Drops everything in public schema and recreates it clean
-- Run this FIRST in the Supabase SQL Editor, then run schema.sql

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
