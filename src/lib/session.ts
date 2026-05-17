// Client-side session: register number identifies the student.
// Server functions independently validate and enforce uniqueness.
const KEY = "svce_pe_session_v1";

export type Session = {
  registerNumber: string;
  name: string;
  section: string;
  email: string;
};

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

const ADMIN_KEY = "svce_pe_admin_v1";
export const isAdmin = () => typeof window !== "undefined" && localStorage.getItem(ADMIN_KEY) === "1";
export const setAdmin = (v: boolean) => {
  if (typeof window === "undefined") return;
  if (v) localStorage.setItem(ADMIN_KEY, "1");
  else localStorage.removeItem(ADMIN_KEY);
};
