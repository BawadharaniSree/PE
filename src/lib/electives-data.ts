export type Elective = {
  id: string;
  code: string;
  name: string;
  category: "PE-IV" | "PE-V" | "PE-VI";
  total_seats: number;
  remaining_seats: number;
};

export const CATEGORIES = ["PE-IV", "PE-V", "PE-VI"] as const;

export function seatBadge(e: Elective) {
  const pct = e.remaining_seats / Math.max(1, e.total_seats);
  if (e.remaining_seats === 0) return { label: "FULL", tone: "destructive" as const };
  if (pct <= 0.15) return { label: "Filling fast", tone: "warning" as const };
  return { label: "Available", tone: "success" as const };
}
