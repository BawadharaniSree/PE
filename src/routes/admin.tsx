import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminGetDashboard, adminLogin } from "@/lib/registration.functions";
import { toast } from "sonner";
import { Download, Loader2, Shield } from "lucide-react";
import { useLiveElectives } from "@/lib/useLiveElectives";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · SVCE ECE PE" }] }),
  component: AdminPage,
});

const PWD_KEY = "svce_admin_pwd_v1";

type Reg = {
  id: string;
  register_number: string;
  name: string;
  section: string;
  email: string;
  created_at: string;
  pe4_elective_id: string | null; pe4_replacement: string | null;
  pe5_elective_id: string | null; pe5_replacement: string | null;
  pe6_elective_id: string | null; pe6_replacement: string | null;
};

function AdminPage() {
  const loginFn = useServerFn(adminLogin);
  const dashFn = useServerFn(adminGetDashboard);
  const { electives: liveElectives } = useLiveElectives();
  const [pwd, setPwd] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regs, setRegs] = useState<Reg[]>([]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(PWD_KEY) : null;
    if (saved) {
      setPwd(saved);
      void load(saved);
    }
  }, []);

  async function load(password: string) {
    setLoading(true);
    try {
      const res = await dashFn({ data: { password } });
      setRegs(res.registrations as Reg[]);
      setAuthed(true);
      sessionStorage.setItem(PWD_KEY, password);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      sessionStorage.removeItem(PWD_KEY);
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      await loginFn({ data: { password: pwd } });
      await load(pwd);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid");
    }
  }

  const electivesById = useMemo(() => {
    const m: Record<string, (typeof liveElectives)[number]> = {};
    liveElectives.forEach((e) => (m[e.id] = e));
    return m;
  }, [liveElectives]);

  const stats = useMemo(() => {
    const total = regs.length;
    const sec = { A: 0, B: 0, C: 0 } as Record<string, number>;
    let replacements = 0;
    regs.forEach((r) => {
      sec[r.section] = (sec[r.section] || 0) + 1;
      if (r.pe4_replacement || r.pe5_replacement || r.pe6_replacement) replacements++;
    });
    return { total, sec, replacements };
  }, [regs]);

  function exportCSV() {
    const head = [
      "register_number","name","section","email","submitted_at",
      "pe4_code","pe4_name","pe4_replacement",
      "pe5_code","pe5_name","pe5_replacement",
      "pe6_code","pe6_name","pe6_replacement",
    ];
    const rows = regs.map((r) => {
      const e4 = r.pe4_elective_id ? electivesById[r.pe4_elective_id] : null;
      const e5 = r.pe5_elective_id ? electivesById[r.pe5_elective_id] : null;
      const e6 = r.pe6_elective_id ? electivesById[r.pe6_elective_id] : null;
      return [
        r.register_number, r.name, r.section, r.email, new Date(r.created_at).toISOString(),
        e4?.code ?? "", e4?.name ?? "", r.pe4_replacement ?? "",
        e5?.code ?? "", e5?.name ?? "", r.pe5_replacement ?? "",
        e6?.code ?? "", e6?.name ?? "", r.pe6_replacement ?? "",
      ];
    });
    const csv = [head, ...rows].map((row) =>
      row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `svce-ece-pe-registrations-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <SiteHeader />
        <div className="mx-auto max-w-md px-6 py-20">
          <div className="text-center mb-8">
            <div className="mx-auto h-14 w-14 rounded-xl bg-gradient-hero text-primary-foreground grid place-items-center shadow-elegant">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="font-display text-3xl mt-4 text-foreground">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-2">Department of ECE only.</p>
          </div>
          <form onSubmit={handleLogin} className="rounded-2xl border border-border bg-card shadow-elegant p-6 space-y-4">
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Admin password"
              className="w-full rounded-md border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary"
              autoFocus
            />
            <button className="w-full rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium shadow-elegant">
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Live registration overview</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => load(pwd)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-medium hover:bg-secondary text-sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Refresh
            </button>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-accent-foreground font-medium shadow-glow text-sm"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Stat label="Total registrations" value={stats.total} />
          <Stat label="Section A" value={stats.sec.A || 0} />
          <Stat label="Section B" value={stats.sec.B || 0} />
          <Stat label="Section C" value={stats.sec.C || 0} />
        </div>

        {/* Live electives */}
        <section className="mb-10">
          <h2 className="font-display text-xl text-foreground mb-3">Seat Occupancy (live)</h2>
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Course</th>
                  <th className="px-4 py-3 text-right">Filled</th>
                  <th className="px-4 py-3 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {liveElectives.map((e) => {
                  const filled = e.total_seats - e.remaining_seats;
                  const pct = (filled / e.total_seats) * 100;
                  return (
                    <tr key={e.id}>
                      <td className="px-4 py-3"><span className="text-accent font-display">{e.category}</span></td>
                      <td className="px-4 py-3 font-mono text-xs">{e.code}</td>
                      <td className="px-4 py-3">{e.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-gradient-accent" style={{ width: `${pct}%` }} />
                          </div>
                          {filled}/{e.total_seats}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-display text-lg tabular-nums">{e.remaining_seats}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Registrations */}
        <section>
          <h2 className="font-display text-xl text-foreground mb-3">Registrations ({regs.length})</h2>
          <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Reg No</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Sec</th>
                  <th className="px-4 py-3 text-left">PE-IV</th>
                  <th className="px-4 py-3 text-left">PE-V</th>
                  <th className="px-4 py-3 text-left">PE-VI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {regs.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.register_number}</td>
                    <td className="px-4 py-2.5">{r.name}</td>
                    <td className="px-4 py-2.5">{r.section}</td>
                    <td className="px-4 py-2.5">{cell(r.pe4_elective_id, r.pe4_replacement, electivesById)}</td>
                    <td className="px-4 py-2.5">{cell(r.pe5_elective_id, r.pe5_replacement, electivesById)}</td>
                    <td className="px-4 py-2.5">{cell(r.pe6_elective_id, r.pe6_replacement, electivesById)}</td>
                  </tr>
                ))}
                {regs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      No registrations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function cell(
  eid: string | null,
  repl: string | null,
  map: Record<string, { code: string; name: string }>,
) {
  if (eid && map[eid]) return <span className="font-mono text-xs">{map[eid].code}</span>;
  if (repl) return <span className="text-xs text-accent">↪ {repl}</span>;
  return <span className="text-muted-foreground">—</span>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-4xl text-foreground tabular-nums">{value}</div>
    </div>
  );
}
