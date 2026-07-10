import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { NorwayFlag, EnglandFlag } from "@/components/Flag";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Vote = { id: string; name: string; team: "NOR" | "ENG" };

function AdminPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [winnerTeam, setWinnerTeam] = useState<"NOR" | "ENG" | null>(null);
  const [phase, setPhase] = useState<"idle" | "shuffling" | "won">("idle");
  const [current, setCurrent] = useState<string>("");
  const [winner, setWinner] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const [loadErr, setLoadErr] = useState("");

  async function load() {
    if (!supabase) {
      setLoadErr("Supabase client is not initialized. Please check your Vercel Environment Variables.");
      return;
    }
    try {
      const { data, error } = await supabase.from("votes").select("*").order("created_at");
      if (error) {
        setLoadErr(error.message);
        return;
      }
      setVotes(Array.isArray(data) ? (data as Vote[]) : []);
    } catch (e) {
      setLoadErr("Failed to connect to your database.");
    }
  }

  useEffect(() => {
    load();
    
    // Protective check: Prevents the "Flash and Crash" if supabase isn't loaded
    if (!supabase || typeof supabase.channel !== 'function') return;

    const ch = supabase
      .channel("votes-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, load)
      .subscribe();

    return () => {
      if (supabase && typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(ch);
      }
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const safeVotes = Array.isArray(votes) ? votes : [];
  const eligible = winnerTeam ? safeVotes.filter((v) => v?.team === winnerTeam) : [];
  const norCount = safeVotes.filter((v) => v?.team === "NOR").length;
  const engCount = safeVotes.filter((v) => v?.team === "ENG").length;

  function startDraw() {
    if (!winnerTeam || eligible.length === 0 || phase === "shuffling") return;
    setPhase("shuffling");
    setWinner(null);

    const names = (eligible ?? []).map((e) => e?.name).filter(Boolean);
    if (names.length === 0) return;
    const finalWinner = names[Math.floor(Math.random() * names.length)];
    const duration = 5000;
    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const interval = 40 + Math.pow(progress, 3) * 500;
      setCurrent(names[Math.floor(Math.random() * names.length)] ?? "");
      if (progress < 1) {
        const id = window.setTimeout(tick, interval);
        timers.current.push(id);
      } else {
        setCurrent(finalWinner);
        setWinner(finalWinner);
        setPhase("won");
        celebrate();
      }
    };
    tick();
  }

  function celebrate() {
    const end = Date.now() + 2500;
    const colors = ["#ef4444", "#3b82f6", "#fbbf24", "#ffffff"];
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 65, origin: { x: 0 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 65, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors });
  }

  function reset() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    setPhase("idle");
    setWinner(null);
    setCurrent("");
  }

  async function resetAll() {
    if (!confirm("Clear ALL votes and start a new round? This cannot be undone.")) return;
    reset();
    setWinnerTeam(null);
    
    if (!supabase) {
      alert("Database connection missing.");
      return;
    }

    try {
      // FIXED: Instead of fetching a broken edge function, we delete rows directly
      const { error } = await supabase
        .from("votes")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Standard way to target all rows safely

      if (error) throw error;
      
      // Instantly clear out local visual state
      setVotes([]);
      alert("Round reset successfully!");
      load();
    } catch (err) {
      alert("Failed to reset: " + (err as Error).message);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,oklch(0.25_0.06_265),transparent_70%)]" />

      <header className="flex items-center justify-between px-8 py-6">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">Admin · Lucky Draw</div>
          <div className="mt-1 text-2xl font-black">Norway vs England</div>
        </div>
        <div className="flex gap-4 text-right text-sm">
          <Stat label="Total votes" value={safeVotes.length} />
          <Stat label="Norway" value={norCount} icon={<NorwayFlag className="h-3 w-5 rounded-sm" />} />
          <Stat label="England" value={engCount} icon={<EnglandFlag className="h-3 w-5 rounded-sm" />} />
          <button
            onClick={resetAll}
            className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-destructive-foreground hover:bg-destructive/20"
          >
            Reset round
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 pb-16">
        {loadErr && (
          <div className="mb-4 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
            Database Status Alert: {loadErr}
          </div>
        )}
        <VoteBar nor={norCount} eng={engCount} />

        {phase === "idle" && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-lg font-bold uppercase tracking-widest text-white/70">
              1. Who won the match?
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <PickButton
                active={winnerTeam === "NOR"}
                onClick={() => setWinnerTeam("NOR")}
                flag={<NorwayFlag className="h-10 w-14 rounded-md shadow-lg" />}
                label="Norway"
                count={norCount}
              />
              <PickButton
                active={winnerTeam === "ENG"}
                onClick={() => setWinnerTeam("ENG")}
                flag={<EnglandFlag className="h-10 w-14 rounded-md shadow-lg" />}
                label="England"
                count={engCount}
              />
            </div>

            <h2 className="mt-8 text-lg font-bold uppercase tracking-widest text-white/70">
              2. Eligible players ({eligible.length})
            </h2>
            <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {eligible.length === 0 && (
                <p className="text-white/40">Select a winning team to see eligible players.</p>
              )}
              {(eligible ?? []).map((v) => (
                <span
                  key={v?.id ?? v?.name}
                  className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm text-white/80"
                >
                  {v?.name}
                </span>
              ))}
            </div>

            <button
              onClick={startDraw}
              disabled={!winnerTeam || eligible.length === 0}
              className="mt-8 w-full rounded-2xl bg-gradient-to-r from-[oklch(0.72_0.19_25)] to-[oklch(0.85_0.17_90)] px-6 py-5 text-xl font-black uppercase tracking-widest text-black shadow-2xl transition hover:brightness-110 disabled:opacity-40"
            >
              🎲 Start Lucky Draw
            </button>
          </section>
        )}

        <AnimatePresence>
          {(phase === "shuffling" || phase === "won") && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
            >
              <div className="text-xs uppercase tracking-[0.5em] text-white/50">
                {phase === "won" ? "Winner" : "Drawing…"}
              </div>
              <div className="relative mt-8 h-64 w-full max-w-4xl">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={current + phase}
                    initial={{ opacity: 0, y: 40, scale: 0.8, filter: "blur(8px)" }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: phase === "won" ? 1.15 : 1,
                      filter: "blur(0px)",
                    }}
                    exit={{ opacity: 0, y: -40, scale: 0.8, filter: "blur(8px)" }}
                    transition={{ duration: phase === "won" ? 0.6 : 0.12 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span
                      className={`bg-gradient-to-r from-[oklch(0.72_0.19_25)] via-white to-[oklch(0.85_0.17_90)] bg-clip-text text-center text-6xl font-black tracking-tight text-transparent sm:text-8xl md:text-9xl ${
                        phase === "won" ? "drop-shadow-[0_0_60px_rgba(255,200,0,0.6)]" : ""
                      }`}
                    >
                      {current || "—"}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {phase === "won" && winner && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 flex flex-col items-center gap-6"
                >
                  <div className="rounded-full border border-[oklch(0.85_0.17_90)]/50 bg-[oklch(0.85_0.17_90)]/10 px-6 py-2 text-sm font-bold uppercase tracking-[0.4em] text-[oklch(0.85_0.17_90)]">
                    🏆 Congratulations
                  </div>
                  <button
                    onClick={reset}
                    className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-white/10"
                  >
                    Draw again
                  </button>
                </motion.div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
      <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-widest text-white/50">
        {icon}
        {label}
      </div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}

function VoteBar({ nor, eng }: { nor: number; eng: number }) {
  const total = nor + eng;
  const norPct = total ? (nor / total) * 100 : 50;
  const engPct = total ? (eng / total) * 100 : 50;
  return (
    <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="mb-3 flex items-center justify-between text-sm font-bold uppercase tracking-widest">
        <span className="flex items-center gap-2 text-white/80">
          <NorwayFlag className="h-4 w-6 rounded-sm" />
          Norway · {nor} ({norPct.toFixed(0)}%)
        </span>
        <span className="text-white/50">Live</span>
        <span className="flex items-center gap-2 text-white/80">
          ({engPct.toFixed(0)}%) {eng} · England
          <EnglandFlag className="h-4 w-6 rounded-sm" />
        </span>
      </div>
      <div className="flex h-8 w-full overflow-hidden rounded-full border border-white/10 bg-black/40">
        <motion.div
          animate={{ width: `${norPct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="h-full bg-gradient-to-r from-[oklch(0.62_0.22_25)] to-[oklch(0.72_0.19_25)]"
        />
        <motion.div
          animate={{ width: `${engPct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="h-full bg-gradient-to-r from-white to-[oklch(0.85_0.02_265)]"
        />
      </div>
    </section>
  );
}

function PickButton({
  active,
  onClick,
  flag,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  flag: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${
        active
          ? "border-primary bg-primary/20"
          : "border-white/10 bg-black/20 hover:border-white/30"
      }`}
    >
      <div className="flex items-center gap-4">
        {flag}
        <span className="text-2xl font-black">{label}</span>
      </div>
      <span className="text-sm text-white/60">{count} votes</span>
    </button>
  );
}
