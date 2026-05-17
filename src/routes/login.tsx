import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { loginStudent } from "@/lib/registration.functions";
import { setSession } from "@/lib/session";
import { toast } from "sonner";
import { Loader2, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · SVCE ECE PE Registration" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useServerFn(loginStudent);
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = reg.trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,32}$/.test(v)) {
      toast.error("Enter a valid Register Number");
      return;
    }
    setLoading(true);
    try {
      const res = await login({ data: { registerNumber: v } });
      if (res.alreadyRegistered && res.registration) {
        setSession({
          registerNumber: res.registerNumber,
          name: res.registration.name,
          section: res.registration.section,
          email: res.registration.email,
        });
        toast.success("Already registered — opening your confirmation");
        navigate({ to: "/confirmation" });
        return;
      }
      setSession({ registerNumber: res.registerNumber, name: "", section: "", email: "" });
      toast.success(`Welcome, ${res.registerNumber}`);
      navigate({ to: "/register" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-xl bg-gradient-hero text-primary-foreground grid place-items-center shadow-elegant">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl mt-4 text-foreground">Student Sign In</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your SVCE Register Number to continue.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-card shadow-elegant p-7 space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Register Number
            </label>
            <input
              autoFocus
              value={reg}
              onChange={(e) => setReg(e.target.value.toUpperCase())}
              placeholder="e.g. 2022ECE001"
              className="w-full rounded-md border border-input bg-background px-4 py-3 font-mono text-base outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary"
              maxLength={32}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium shadow-elegant hover:opacity-95 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Continue
          </button>
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            By signing in you confirm that the register number entered is yours. Only one
            registration is permitted per student.
          </p>
        </form>
      </div>
    </div>
  );
}
