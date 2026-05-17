import { motion } from "framer-motion";
import { type Elective, seatBadge, CATEGORIES } from "@/lib/electives-data";
import { Lock } from "lucide-react";

const toneStyles = {
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/15 text-warning-foreground border-warning/40",
  destructive: "bg-destructive/10 text-destructive border-destructive/30",
};

export function SeatBento({ electives }: { electives: Elective[] }) {
  return (
    <div className="space-y-10">
      {CATEGORIES.map((cat) => {
        const items = electives.filter((e) => e.category === cat);
        return (
          <section key={cat}>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-2xl text-foreground">
                {cat}
                <span className="ml-3 text-sm font-sans text-muted-foreground">
                  · {items.length} courses
                </span>
              </h2>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Live · realtime
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3 md:grid-rows-[minmax(0,auto)]">
              {items.map((e, idx) => {
                const tone = seatBadge(e);
                const full = e.remaining_seats === 0;
                const span = idx === 0 ? "md:col-span-2" : "";
                return (
                  <motion.article
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`${span} relative rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-elegant transition-shadow`}
                  >
                    {full && (
                      <div className="absolute inset-0 rounded-2xl bg-background/60 backdrop-blur-[1px] grid place-items-center">
                        <div className="rounded-full bg-destructive text-destructive-foreground text-xs font-bold tracking-widest px-4 py-1.5 flex items-center gap-1.5 shadow-elegant">
                          <Lock className="h-3 w-3" /> FULL
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {e.code}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${toneStyles[tone.tone]}`}
                      >
                        {tone.label}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-lg leading-snug text-foreground">
                      {e.name}
                    </h3>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Seats remaining
                        </div>
                        <div className="font-display text-4xl text-foreground tabular-nums">
                          <motion.span
                            key={e.remaining_seats}
                            initial={{ scale: 1.15, color: "var(--accent)" }}
                            animate={{ scale: 1, color: "var(--foreground)" }}
                            transition={{ duration: 0.4 }}
                            className="inline-block"
                          >
                            {e.remaining_seats}
                          </motion.span>
                          <span className="text-muted-foreground text-lg"> / {e.total_seats}</span>
                        </div>
                      </div>
                      <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-accent"
                          initial={false}
                          animate={{
                            width: `${(e.remaining_seats / e.total_seats) * 100}%`,
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
