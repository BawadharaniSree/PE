import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ArrowRight, ShieldCheck, Timer, Activity, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SVCE ECE — Professional Elective Registration 2026-27" },
      {
        name: "description",
        content:
          "Real-time PE-IV, PE-V & PE-VI registration portal for the Department of Electronics & Communication Engineering, SVCE. Live seats, fair allocation.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-surface">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(0.44 0.13 258) 0px, transparent 40%), radial-gradient(circle at 80% 30%, oklch(0.76 0.17 62) 0px, transparent 35%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-24 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Odd Semester · Academic Year 2026 – 27
            </div>
            <h1 className="mt-6 font-display text-5xl md:text-6xl leading-[1.05] text-foreground">
              Professional Elective Registration,{" "}
              <span className="italic text-primary">live and fair.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
              The Department of Electronics &amp; Communication Engineering, Sri Venkateswara College of
              Engineering, presents a real-time portal for PE-IV, PE-V and PE-VI registration. Watch seats
              update instantly across all students — first come, first served.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium shadow-elegant hover:opacity-95 transition-opacity"
              >
                Begin Registration <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/electives"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-foreground font-medium hover:bg-secondary"
              >
                View Live Seats
              </Link>
            </div>

            <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-2xl">
              <Feature icon={<Activity className="h-4 w-4" />} title="Realtime">
                Seat counts update across every device the moment someone registers.
              </Feature>
              <Feature icon={<ShieldCheck className="h-4 w-4" />} title="Fair">
                Database row-locks guarantee zero overbooking under concurrent load.
              </Feature>
              <Feature icon={<Timer className="h-4 w-4" />} title="2-min hold">
                Selecting an elective reserves your seat for 2 minutes to complete the form.
              </Feature>
            </div>
          </div>

          {/* Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-card shadow-elegant border border-border p-8">
              <div className="absolute -top-3 left-6 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground shadow-glow">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/70 animate-pulse" /> Live now
              </div>
              <h3 className="font-display text-2xl text-foreground">How it works</h3>
              <ol className="mt-5 space-y-4 text-sm text-muted-foreground">
                <Step n={1} title="Sign in with your Register Number">
                  No password. One register number, one registration — forever.
                </Step>
                <Step n={2} title="Pick one elective per PE">
                  Or declare a replacement course (NPTEL / GIP / CPS / IITM / Special).
                </Step>
                <Step n={3} title="Your seat is locked for 2 minutes">
                  Submit before the timer ends or your seat is released to others.
                </Step>
                <Step n={4} title="Receive your confirmation">
                  Download a receipt with your final allocation.
                </Step>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Warning */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-xl border-2 border-warning/50 bg-warning/10 p-5 md:p-6 flex gap-4">
          <AlertTriangle className="h-6 w-6 text-warning shrink-0 mt-0.5" />
          <div className="text-sm md:text-[15px] text-foreground leading-relaxed">
            <div className="font-semibold mb-1">Important — Do not re-select completed courses</div>
            <p className="text-muted-foreground">
              Students must <strong>not</strong> select courses already completed through{" "}
              <strong>NPTEL</strong>, <strong>GIP Programme</strong>, <strong>Cyber Physical Systems</strong>,{" "}
              <strong>IITM Workshop</strong>, or <strong>Special Electives</strong>. If an equivalent has
              been completed, mark the corresponding PE as a <em>replacement</em> and enter the course title.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground flex flex-wrap justify-between gap-2">
          <div>© Department of ECE · Sri Venkateswara College of Engineering</div>
          <Link to="/admin" className="hover:text-foreground">Admin</Link>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 h-7 w-7 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold grid place-items-center font-display">
        {n}
      </span>
      <div>
        <div className="text-foreground font-medium">{title}</div>
        <div className="text-xs mt-0.5">{children}</div>
      </div>
    </li>
  );
}
