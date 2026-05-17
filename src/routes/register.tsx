import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useLiveElectives } from "@/lib/useLiveElectives";
import { CATEGORIES, type Elective } from "@/lib/electives-data";
import { releaseSeat, reserveSeat, submitRegistration } from "@/lib/registration.functions";
import { getSession, setSession } from "@/lib/session";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Timer } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register · SVCE ECE PE" }] }),
  component: RegisterPage,
});

type Choice = { electiveId: string | null; replacement: string };

function RegisterPage() {
  const navigate = useNavigate();
  const { electives, loading } = useLiveElectives();
  const reserveFn = useServerFn(reserveSeat);
  const releaseFn = useServerFn(releaseSeat);
  const submitFn = useServerFn(submitRegistration);

  const [reg, setReg] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", section: "A" as "A" | "B" | "C", email: "" });
  const [pe4, setPe4] = useState<Choice>({ electiveId: null, replacement: "" });
  const [pe5, setPe5] = useState<Choice>({ electiveId: null, replacement: "" });
  const [pe6, setPe6] = useState<Choice>({ electiveId: null, replacement: "" });
  const [pe4Mode, setPe4Mode] = useState<"NO" | "YES">("NO");
  const [pe5Mode, setPe5Mode] = useState<"NO" | "YES">("NO");
  const [pe6Mode, setPe6Mode] = useState<"NO" | "YES">("NO");
  const [submitting, setSubmitting] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const heldElectiveIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate({ to: "/login" });
      return;
    }
    setReg(s.registerNumber);
    setForm({ name: s.name || "", section: (s.section as "A" | "B" | "C") || "A", email: s.email || "" });
  }, [navigate]);

  // Ticker
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // Release on unload
  useEffect(() => {
    return () => {
      if (!reg) return;
      heldElectiveIds.current.forEach((id) => {
        releaseFn({ data: { registerNumber: reg, electiveId: id } }).catch(() => {});
      });
    };
  }, [reg, releaseFn]);

  const groups = useMemo(() => {
    const g: Record<string, Elective[]> = { "PE-IV": [], "PE-V": [], "PE-VI": [] };
    electives.forEach((e) => g[e.category]?.push(e));
    return g;
  }, [electives]);

  async function pickElective(prev: Choice, set: (c: Choice) => void, newId: string) {
    if (!reg) return;
    // release previous
    if (prev.electiveId && prev.electiveId !== newId) {
      heldElectiveIds.current.delete(prev.electiveId);
      releaseFn({ data: { registerNumber: reg, electiveId: prev.electiveId } }).catch(() => {});
    }
    if (!newId) {
      set({ electiveId: null, replacement: "" });
      return;
    }
    try {
      const res = await reserveFn({ data: { registerNumber: reg, electiveId: newId } });
      if (!res.success) {
        toast.error(res.error || "Could not reserve seat");
        return;
      }
      heldElectiveIds.current.add(newId);
      set({ electiveId: newId, replacement: "" });
      if (res.expires_at) {
        const ts = new Date(res.expires_at).getTime();
        setExpiresAt((cur) => (cur == null || ts < cur ? ts : cur));
      }
      toast.success("Seat held for 1 second");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reserve failed");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reg) return;
    if (!form.name.trim()) return toast.error("Enter your name");
    if (!form.email.trim()) return toast.error("Enter your email");

    setSubmitting(true);
    try {
      await submitFn({
        data: {
          registerNumber: reg,
          name: form.name.trim(),
          section: form.section,
          email: form.email.trim(),
          pe4ElectiveId: pe4Mode === "NO" ? pe4.electiveId : null,
          pe4Replacement: pe4Mode === "YES" ? pe4.replacement.trim() || null : null,
          pe5ElectiveId: pe5Mode === "NO" ? pe5.electiveId : null,
          pe5Replacement: pe5Mode === "YES" ? pe5.replacement.trim() || null : null,
          pe6ElectiveId: pe6Mode === "NO" ? pe6.electiveId : null,
          pe6Replacement: pe6Mode === "YES" ? pe6.replacement.trim() || null : null,
        },
      });
      setSession({ registerNumber: reg, ...form });
      heldElectiveIds.current.clear();
      toast.success("Registration confirmed");
      navigate({ to: "/confirmation" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  const secondsLeft = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null;

  if (loading || !reg) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <SiteHeader />
        <div className="grid place-items-center py-32 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10 pb-32">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 2 of 3</div>
            <h1 className="font-display text-4xl mt-1 text-foreground">Your Registration</h1>
            <p className="text-muted-foreground mt-1">
              Signed in as <span className="font-mono text-foreground">{reg}</span>
            </p>
          </div>
          <Link to="/electives" className="text-sm text-primary hover:underline">
            Open Live Seat Matrix →
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          {/* Student details */}
          <section className="rounded-2xl border border-border bg-card shadow-card p-6">
            <h2 className="font-display text-xl text-foreground">Student Details</h2>
            <div className="mt-5 grid md:grid-cols-2 gap-5">
              <Field label="Full Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary"
                />
              </Field>
              <Field label="Section">
                <div className="flex gap-2">
                  {(["A", "B", "C"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, section: s })}
                      className={`flex-1 rounded-md border px-3 py-2.5 text-sm font-medium transition ${
                        form.section === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-foreground hover:bg-secondary"
                      }`}
                    >
                      Section {s}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="College Email ID" className="md:col-span-2">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@svce.ac.in"
                  className="w-full rounded-md border border-input bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary"
                />
              </Field>
            </div>
          </section>

          {/* Electives */}
          <PEBlock
            cat="PE-IV"
            electives={groups["PE-IV"]}
            mode={pe4Mode}
            setMode={setPe4Mode}
            choice={pe4}
            setChoice={setPe4}
            onPick={(id) => pickElective(pe4, setPe4, id)}
          />
          <PEBlock
            cat="PE-V"
            electives={groups["PE-V"]}
            mode={pe5Mode}
            setMode={setPe5Mode}
            choice={pe5}
            setChoice={setPe5}
            onPick={(id) => pickElective(pe5, setPe5, id)}
          />
          <PEBlock
            cat="PE-VI"
            electives={groups["PE-VI"]}
            mode={pe6Mode}
            setMode={setPe6Mode}
            choice={pe6}
            setChoice={setPe6}
            onPick={(id) => pickElective(pe6, setPe6, id)}
          />

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              By submitting you confirm the chosen courses were not already completed via NPTEL,
              GIP, CPS, IITM Workshop, or Special Electives.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3 text-primary-foreground font-medium shadow-elegant hover:opacity-95 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Registration
            </button>
          </div>
        </form>
      </main>

      {/* Floating timer */}
      <AnimatePresence>
        {secondsLeft != null && secondsLeft > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 rounded-full bg-foreground text-background px-5 py-2.5 shadow-elegant">
              <Timer className="h-4 w-4 text-accent" />
              <span className="text-xs uppercase tracking-widest opacity-70">Seats held</span>
              <span className="font-display text-base tabular-nums">
                {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
                {String(secondsLeft % 60).padStart(2, "0")}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</span>
      {children}
    </label>
  );
}

function PEBlock({
  cat,
  electives,
  mode,
  setMode,
  choice,
  setChoice,
  onPick,
}: {
  cat: "PE-IV" | "PE-V" | "PE-VI";
  electives: Elective[];
  mode: "NO" | "YES";
  setMode: (m: "NO" | "YES") => void;
  choice: Choice;
  setChoice: (c: Choice) => void;
  onPick: (id: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl text-foreground">{cat}</h2>
        <div className="inline-flex rounded-full bg-secondary p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("NO")}
            className={`px-4 py-1.5 rounded-full transition ${
              mode === "NO" ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
            }`}
          >
            Pick elective
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("YES");
              if (choice.electiveId) {
                onPick(""); // release
                setChoice({ electiveId: null, replacement: choice.replacement });
              }
            }}
            className={`px-4 py-1.5 rounded-full transition ${
              mode === "YES" ? "bg-accent text-accent-foreground shadow-glow" : "text-muted-foreground"
            }`}
          >
            Replacement course
          </button>
        </div>
      </div>

      {mode === "NO" ? (
        <div className="mt-5 grid md:grid-cols-3 gap-3">
          {electives.map((e) => {
            const full = e.remaining_seats === 0;
            const selected = choice.electiveId === e.id;
            return (
              <button
                key={e.id}
                type="button"
                disabled={full && !selected}
                onClick={() => onPick(e.id)}
                className={`text-left rounded-xl border p-4 transition relative ${
                  selected
                    ? "border-primary bg-primary/5 shadow-elegant"
                    : full
                      ? "border-border bg-secondary/60 opacity-60 cursor-not-allowed"
                      : "border-border bg-background hover:border-primary/40 hover:shadow-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {e.code}
                  </span>
                  {full ? (
                    <span className="text-[10px] font-bold tracking-widest text-destructive">FULL</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {e.remaining_seats}/{e.total_seats}
                    </span>
                  )}
                </div>
                <div className="mt-2 font-display text-[15px] leading-snug text-foreground">{e.name}</div>
                <div className="mt-3 h-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full ${full ? "bg-destructive" : "bg-gradient-accent"}`}
                    style={{ width: `${(e.remaining_seats / e.total_seats) * 100}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Replacement course (NPTEL / GIP / CPS / IITM / Special)
          </label>
          <input
            required
            value={choice.replacement}
            onChange={(e) => setChoice({ electiveId: null, replacement: e.target.value })}
            placeholder="e.g. NPTEL — Wireless Communications (Jul-Oct 2025)"
            className="w-full rounded-md border border-input bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary"
          />
          <p className="text-xs text-muted-foreground mt-2">
            No elective seat will be allocated for {cat}.
          </p>
        </div>
      )}
    </section>
  );
}
