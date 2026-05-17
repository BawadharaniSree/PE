import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useLiveElectives } from "@/lib/useLiveElectives";
import { SeatBento } from "@/components/SeatBento";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/electives")({
  head: () => ({
    meta: [
      { title: "Live Seat Matrix · SVCE ECE" },
      { name: "description", content: "Live PE-IV, PE-V & PE-VI seat availability updated in realtime." },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { electives, loading } = useLiveElectives();
  return (
    <div className="min-h-screen bg-gradient-surface">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live · synchronized
            </div>
            <h1 className="font-display text-4xl mt-3 text-foreground">Seat Matrix</h1>
            <p className="text-muted-foreground mt-2">
              Updated the instant a student registers. PE-IV, PE-V and PE-VI · Odd Semester 2026-27.
            </p>
          </div>
        </div>
        {loading ? (
          <div className="py-20 grid place-items-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <SeatBento electives={electives} />
        )}
      </main>
    </div>
  );
}
