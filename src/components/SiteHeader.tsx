import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { clearSession, getSession } from "@/lib/session";
import { LogOut } from "lucide-react";

export function SiteHeader() {
  const navigate = useNavigate();
  const [reg, setReg] = useState<string | null>(null);
  useEffect(() => {
    const s = getSession();
    setReg(s?.registerNumber ?? null);
  }, []);

  return (
    <header className="sticky top-0 z-40 glass border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-md bg-gradient-hero text-primary-foreground grid place-items-center font-display text-lg shadow-elegant">
            S
          </div>
          <div className="leading-tight">
            <div className="font-display text-base text-foreground">SVCE · ECE</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Professional Elective Portal
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/"
            className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground"
            activeProps={{ className: "px-3 py-2 rounded-md text-foreground" }}
          >
            Home
          </Link>
          <Link
            to="/electives"
            className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground"
            activeProps={{ className: "px-3 py-2 rounded-md text-foreground" }}
          >
            Live Seats
          </Link>
          {reg ? (
            <>
              <Link
                to="/register"
                className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground"
                activeProps={{ className: "px-3 py-2 rounded-md text-foreground" }}
              >
                Register
              </Link>
              <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                {reg}
              </span>
              <button
                onClick={() => {
                  clearSession();
                  navigate({ to: "/" });
                }}
                className="ml-1 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="ml-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-elegant"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
