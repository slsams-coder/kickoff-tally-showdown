import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSession, setSession, clearSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { NorwayFlag, EnglandFlag } from "@/components/Flag";

export const Route = createFileRoute("/vote")({
  component: VotePage,
});

function VotePage() {
  const navigate = useNavigate();
  const [name, setName] = useState<string | null>(null);
  const [team, setTeam] = useState<"NOR" | "ENG" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [counts, setCounts] = useState<{ NOR: number; ENG: number }>({ NOR: 0, ENG: 0 });

  async function load() {
    if (!supabase || typeof supabase.from !== 'function') return;
    try {
      const { data, error } = await supabase.from("votes").select("team");
      if (error) {
        console.error(error.message);
        return;
      }
      const rows = (data ?? []) as { team: "NOR" | "ENG" }[];
      setCounts({
        NOR: rows.filter((r) => r && r.team === "NOR").length,
        ENG: rows.filter((r) => r && r.team === "ENG").length,
      });
    } catch (e) {
      console.warn("Failed to load live counts from database.");
    }
  }

  useEffect(() => {
    load();
    let ch: any = null;

    try {
      if (supabase && typeof supabase.channel === 'function') {
        ch = supabase
          .channel("votes-live")
          .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, load);
        
        if (ch && typeof ch.subscribe === 'function') {
          ch.subscribe();
        }
      }
    } catch (realtimeError) {
      console.warn("Realtime streaming unavailable; falling back to static loads:", realtimeError);
    }

    return () => {
      try {
        if (ch && supabase && typeof supabase.removeChannel === 'function') {
          supabase.removeChannel(ch);
        }
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    const s = getSession();
    if (!s || !s.name) {
      navigate({ to: "/" });
      return;
    }
    setName(s.name);
    if (s.team) setTeam(s.team);
  }, [navigate]);

  async function vote(t: "NOR" | "ENG") {
    if (submitting || team || !name) return;
    setSubmitting(true);
    setErr("");

    if (!supabase || typeof supabase.from !== 'function') {
      setErr("Database connection missing. Unable to save your vote.");
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("votes").insert({ name, team: t });
      if (error) {
        setErr(error.message);
        setSubmitting(false);
        return;
      }
      setSession({ name, team: t });
      setTeam(t);
    } catch (catchErr) {
      setErr("Failed to submit vote. Please check your internet connection.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!name) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm tracking-widest text-white/40 uppercase animate-pulse">Verifying Session...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(40,40,80,0.5),transparent_70%)]" />
      </div>

      <header className="flex items-center justify-between px-6 py-5">
        <div className="text-sm uppercase tracking-[0.25em] text-white/60">Matchday</div>
        <button
          onClick={() => {
            clearSession();
            navigate({ to: "/" });
          }}
          className="text-xs uppercase tracking-widest text-white/50 hover:text-white transition"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-white/60">Hi {name},</p>
          <h1 className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">
            {team ? "Your vote is locked in." : "Who takes the win?"}
          </h1>
          {!team && (
            <p className="mt-2 text-white/60">Tap a team to lock your prediction.</p>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {!team ? (
            <motion.div
              key="picker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-10 grid gap-6 md:grid-cols-2"
            >
              <TeamCard
                code="NOR"
                name="Norway"
                flag={NorwayFlag ? <NorwayFlag className="h-20 w-28 rounded-md shadow-2xl ring-1 ring-black/20" /> : <div className="text-2xl">🇳🇴</div>}
                gradient="from-red-600 via-blue-900 to-slate-900"
                onPick={() => vote("NOR")}
                disabled={submitting}
              />
              <TeamCard
                code="ENG"
                name="England"
                flag={EnglandFlag ? <EnglandFlag className="h-20 w-28 rounded-md shadow-2xl ring-1 ring-black/20" /> : <div className="text-2xl">🏴(England)</div>}
                gradient="from-white via-slate-100 to-blue-900"
                dark
                onPick={() => vote("ENG")}
                disabled={submitting}
              />
            </motion.div>
          ) : (
            <motion.div
              key="locked"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl"
            >
              <div className="flex justify-center">
                {team === "NOR" ? (
                  NorwayFlag ? <NorwayFlag className="h-20 w-32 rounded-md shadow-xl ring-1 ring-white/20" /> : <div className="text-4xl">🇳🇴</div>
                ) : (
                  EnglandFlag ? <EnglandFlag className="h-20 w-32 rounded-md shadow-xl ring-1 ring-white/20" /> : <div className="text-4xl">🏴(England)</div>
                )}
              </div>
              <h2 className="mt-4 text-3xl font-black">
                Vote locked in for {team === "NOR" ? "Norway" : "England"}!
              </h2>
              <p className="mt-2 text-white/70">Enjoy the match, {name}. Good luck 🍀</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs uppercase tracking-widest text-white/60">
                <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
                Waiting for full time
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {err && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {err}
          </div>
        )}

        <LiveBar nor={counts.NOR} eng={counts.ENG} />
      </main>
    </div>
  );
}

function TeamCard({
  name,
  flag,
  gradient,
  onPick,
  disabled,
  dark,
}: {
  code: string;
  name: string;
  flag: ReactNode;
  gradient: string;
  onPick: () => void;
  disabled: boolean;
  dark?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      onClick={onPick}
      className={`group relative flex h-72 flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-8 text-left shadow-2xl transition disabled:opacity-60`}
    >
      <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[repeating-linear-gradient(45deg,black_0_2px,transparent_2px_20px)]" />
      <div className="drop-shadow-2xl">{flag}</div>
      <div className={`mt-4 text-4xl font-black tracking-tight ${dark ? "text-black" : "text-white"}`}>
        {name}
      </div>
      <div className={`mt-2 text-sm font-semibold uppercase tracking-[0.3em] ${dark ? "text-black/60" : "text-white/70"}`}>
        Tap to vote
      </div>
    </motion.button>
  );
}

function LiveBar({ nor, eng }: { nor: number; eng: number }) {
  const total = nor + eng;
  const norPct = total ? (nor / total) * 100 : 50;
  const engPct = total ? (eng / total) * 100 : 50;
  return (
    <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-widest">
        <span className="flex items-center gap-2 text-white/80">
          {NorwayFlag ? <NorwayFlag className="h-4 w-6 rounded-sm" /> : <span>🇳🇴</span>}
          {nor} · {norPct.toFixed(0)}%
        </span>
        <span className="text-white/50">Live votes</span>
        <span className="flex items-center gap-2 text-white/80">
          {engPct.toFixed(0)}% · {eng}
          {EnglandFlag ? <EnglandFlag className="h-4 w-6 rounded-sm" /> : <span>🏴(England)</span>}
        </span>
      </div>
      <div className="flex h-6 w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
        <motion.div
          animate={{ width: `${norPct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="h-full bg-gradient-to-r from-red-600 to-red-400"
        />
        <motion.div
          animate={{ width: `${engPct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="h-full bg-gradient-to-r from-white to-gray-300"
        />
      </div>
    </section>
  );
}
