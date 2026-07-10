
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  team text NOT NULL CHECK (team IN ('NOR','ENG')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.votes TO anon, authenticated;
GRANT ALL ON public.votes TO service_role;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "anyone can insert votes" ON public.votes FOR INSERT WITH CHECK (true);
