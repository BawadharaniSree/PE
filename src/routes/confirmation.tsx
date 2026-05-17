import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyRegistration } from "@/lib/registration.functions";
import { getSession } from "@/lib/session";
import { CheckCircle2, Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/confirmation")({
  head: () => ({ meta: [{ title: "Confirmation · SVCE ECE PE" }] }),
  component: ConfirmationPage,
});

type RegRow = {
  register_number: string;
  name: string;
  section: string;
  email: string;
  created_at: string;
  pe4_elective_id: string | null;
  pe4_replacement: string | null;
  pe5_elective_id: string | null;
  pe5_replacement: string | null;
  pe6_elective_id: string | null;
  pe6_replacement: string | null;
  electives: Record<string, { code: string; name: string; category: string }>;
};

function ConfirmationPage() {
  const navigate = useNavigate();
  const fetchReg = useServerFn(getMyRegistration);
  const [data, setData] = useState<RegRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate({ to: "/login" });
      return;
    }
    fetchReg({ data: { registerNumber: s.registerNumber } })
      .then((r) => setData(r as RegRow | null))
      .finally(() => setLoading(false));
  }, [fetchReg, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <SiteHeader />
        <div className="grid place-items-center py-32 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h1 className="font-display text-3xl">No registration found</h1>
          <Link to="/register" className="mt-6 inline-block text-primary hover:underline">
            Complete your registration →
          </Link>
        </div>
      </div>
    );
  }

  const rows: { cat: string; value: string }[] = [
    {
      cat: "PE-IV",
      value: data.pe4_elective_id
        ? `${data.electives[data.pe4_elective_id]?.code} — ${data.electives[data.pe4_elective_id]?.name}`
        : `Replacement: ${data.pe4_replacement}`,
    },
    {
      cat: "PE-V",
      value: data.pe5_elective_id
        ? `${data.electives[data.pe5_elective_id]?.code} — ${data.electives[data.pe5_elective_id]?.name}`
        : `Replacement: ${data.pe5_replacement}`,
    },
    {
      cat: "PE-VI",
      value: data.pe6_elective_id
        ? `${data.electives[data.pe6_elective_id]?.code} — ${data.electives[data.pe6_elective_id]?.name}`
        : `Replacement: ${data.pe6_replacement}`,
    },
  ];

  function downloadReceipt() {
    const lines = [
      "SVCE — Department of ECE",
      "Professional Elective Registration · Odd Semester 2026-27",
      "".padEnd(56, "-"),
      `Register No : ${data!.register_number}`,
      `Name        : ${data!.name}`,
      `Section     : ${data!.section}`,
      `Email       : ${data!.email}`,
      `Submitted   : ${new Date(data!.created_at).toLocaleString()}`,
      "".padEnd(56, "-"),
      ...rows.map((r) => `${r.cat.padEnd(8)}: ${r.value}`),
      "".padEnd(56, "-"),
      "This receipt is auto-generated. Retain for your records.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SVCE-ECE-PE-${data!.register_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-14">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-success text-success-foreground grid place-items-center shadow-elegant">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="font-display text-4xl mt-5 text-foreground">Registration Confirmed</h1>
          <p className="text-muted-foreground mt-2">
            Submitted {new Date(data.created_at).toLocaleString()}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-border bg-secondary/40">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Info label="Register No" value={data.register_number} mono />
              <Info label="Section" value={data.section} />
              <Info label="Name" value={data.name} />
              <Info label="Email" value={data.email} />
            </div>
          </div>
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <div key={r.cat} className="p-5 flex items-start gap-4">
                <span className="font-display text-sm text-accent w-14 shrink-0">{r.cat}</span>
                <span className="text-foreground">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={downloadReceipt}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-primary-foreground font-medium shadow-elegant hover:opacity-95"
          >
            <Download className="h-4 w-4" /> Download Receipt
          </button>
          <Link
            to="/electives"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 font-medium hover:bg-secondary"
          >
            View live seats
          </Link>
        </div>
      </main>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-foreground ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
