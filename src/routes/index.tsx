import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ACCESS_CODE, setSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().toUpperCase() !== ACCESS_CODE) {
      setError("Invalid access code");
      return;
    }
    if (name.trim().length < 2) {
      setError("Enter your real name");
      return;
    }
    setSession({ name: name.trim() });
    navigate({ to: "/vote" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* backdrop */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.45_0.18_265/0.6),transparent_60%),radial-gradient(ellipse_at_bottom_right,oklch(0.62_0.22_25/0.55),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,oklch(0.1_0.03_250/0.9))]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[repeating-linear-gradient(90deg,white_0_2px,transparent_2px_80px)]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Live Matchday
          </div>
          <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
            <span className="bg-gradient-to-r from-[oklch(0.75_0.19_25)] via-white to-[oklch(0.7_0.15_265)] bg-clip-text text-transparent">
              Norway
            </span>
            <span className="mx-3 text-white/40">vs</span>
            <span className="bg-gradient-to-r from-white via-[oklch(0.9_0.02_265)] to-[oklch(0.65_0.22_27)] bg-clip-text text-transparent">
              England
            </span>
          </h1>
          <p className="mt-4 text-lg text-white/70 sm:text-xl">
            Pick your winner. Watch the match. Win the draw.
          </p>
        </motion.div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-12 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl"
        >
          <label className="block text-xs font-semibold uppercase tracking-widest text-white/60">
            Access Code
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="MATCHDAY"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-lg font-mono tracking-widest text-white outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
          <label className="mt-6 block text-xs font-semibold uppercase tracking-widest text-white/60">
            Your Real Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ada Lovelace"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-lg text-white outline-none placeholder:text-white/30 focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
          {error && <p className="mt-3 text-sm text-primary">{error}</p>}
          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-primary px-4 py-3.5 text-base font-bold uppercase tracking-wider text-primary-foreground transition hover:brightness-110 active:scale-[0.98]"
          >
            Enter the Match →
          </button>
        </motion.form>

        <p className="mt-8 text-xs text-white/40">Ask your teacher for the access code.</p>
      </div>
    </div>
  );
}
