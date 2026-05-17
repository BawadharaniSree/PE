import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Elective } from "./electives-data";

export function useLiveElectives() {
  const [electives, setElectives] = useState<Elective[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase
        .from("electives")
        .select("id, code, name, category, total_seats, remaining_seats")
        .order("category")
        .order("code");
      if (mounted && data) {
        setElectives(data as Elective[]);
        setLoading(false);
      }
    }
    load();

    const channel = supabase
      .channel("electives-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "electives" },
        (payload) => {
          const next = payload.new as Elective;
          setElectives((prev) => prev.map((e) => (e.id === next.id ? { ...e, ...next } : e)));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { electives, loading };
}
