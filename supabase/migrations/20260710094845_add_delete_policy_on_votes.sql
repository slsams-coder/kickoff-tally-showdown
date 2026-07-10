/*
# Add DELETE policy on votes table

## Purpose
The admin "Reset round" button deletes all rows from `public.votes`, but the
table only had SELECT and INSERT policies — no DELETE policy. With RLS enabled,
the anon-key client's `DELETE` was silently blocked, so the button appeared to
do nothing.

## Changes
- Adds a DELETE policy allowing anon + authenticated to delete rows from
  `public.votes`.

## Security
This is a single-tenant, no-auth app (access-gated by a shared code stored in
the browser). All vote data is intentionally public/shared, so `USING (true)`
is the correct predicate here — same as the existing SELECT and INSERT
policies.
*/

DROP POLICY IF EXISTS "anyone can delete votes" ON public.votes;
CREATE POLICY "anyone can delete votes" ON public.votes
  FOR DELETE TO anon, authenticated USING (true);
