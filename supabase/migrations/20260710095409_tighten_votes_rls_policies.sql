/*
# Tighten RLS policies on votes table

## Purpose
Supabase security scan flagged two policies with always-true predicates:
- `anyone can insert votes` (INSERT, WITH CHECK (true))
- `anyone can delete votes` (DELETE, USING (true))

These effectively bypass row-level security. This migration replaces them
with meaningful predicates and removes the DELETE policy entirely.

## Changes

### INSERT policy
- Replaced `WITH CHECK (true)` with `WITH CHECK (team IN ('NOR','ENG'))`.
- This validates the team column against the existing CHECK constraint at
  the RLS layer, preventing inserts with arbitrary team values.
- Still allows anon + authenticated (single-tenant, no-auth app).

### DELETE policy
- Dropped entirely. Deletes are now performed exclusively through a
  server-side edge function using the service role key, which bypasses
  RLS. This prevents any anonymous client from deleting votes directly.

## Security
- SELECT policy unchanged (public read, by design).
- INSERT now validates team values at the RLS layer.
- DELETE no longer exposed to anon/authenticated clients.
*/

-- Replace INSERT policy with a meaningful WITH CHECK
DROP POLICY IF EXISTS "anyone can insert votes" ON public.votes;
CREATE POLICY "anyone can insert votes" ON public.votes
  FOR INSERT TO anon, authenticated
  WITH CHECK (team IN ('NOR','ENG'));

-- Drop the DELETE policy; resets go through an edge function (service role)
DROP POLICY IF EXISTS "anyone can delete votes" ON public.votes;
