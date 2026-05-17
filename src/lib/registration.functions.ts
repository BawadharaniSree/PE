import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

//const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_PASSWORD = "svce-ece-2026";
if (!ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD environment variable is not set");
}

const registerNumberSchema = z
  .string()
  .trim()
  .min(4)
  .max(32)
  .regex(
    /^[A-Za-z0-9-]+$/,
    "Register number may only contain letters, digits, and hyphens",
  );

// ---- Login: check whether register number already registered ----

export const loginStudent = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ registerNumber: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const reg = registerNumberSchema.parse(data.registerNumber).toUpperCase();
    const { data: existing, error } = await supabaseAdmin
      .from("registrations")
      .select("register_number, name, section, email, created_at")
      .eq("register_number", reg)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      registerNumber: reg,
      alreadyRegistered: !!existing,
      registration: existing ?? null,
    };
  });

// ---- Reserve a seat for 1 second ----

export const reserveSeat = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        registerNumber: z.string(),
        electiveId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const reg = registerNumberSchema.parse(data.registerNumber).toUpperCase();
    const { data: res, error } = await supabaseAdmin.rpc("reserve_seat", {
      p_register_number: reg,
      p_elective_id: data.electiveId,
    });
    if (error) throw new Error(error.message);
    return res as { success: boolean; expires_at?: string; error?: string };
  });

export const releaseSeat = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        registerNumber: z.string(),
        electiveId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const reg = registerNumberSchema.parse(data.registerNumber).toUpperCase();
    const { error } = await supabaseAdmin.rpc("release_seat", {
      p_register_number: reg,
      p_elective_id: data.electiveId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Final registration (atomic) ----
const registerSchema = z.object({
  registerNumber: z.string(),
  name: z.string().trim().min(2).max(120),
  section: z.enum(["A", "B", "C"]),
  email: z.string().trim().email().max(255),
  pe4ElectiveId: z.string().uuid().nullable(),
  pe4Replacement: z.string().trim().max(300).nullable(),
  pe5ElectiveId: z.string().uuid().nullable(),
  pe5Replacement: z.string().trim().max(300).nullable(),
  pe6ElectiveId: z.string().uuid().nullable(),
  pe6Replacement: z.string().trim().max(300).nullable(),
});

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((input) => registerSchema.parse(input))
  .handler(async ({ data }) => {
    const reg = registerNumberSchema.parse(data.registerNumber).toUpperCase();

    // Per-PE: either elective or replacement, not both, not neither
    for (const [eId, repl, label] of [
      [data.pe4ElectiveId, data.pe4Replacement, "PE-IV"],
      [data.pe5ElectiveId, data.pe5Replacement, "PE-V"],
      [data.pe6ElectiveId, data.pe6Replacement, "PE-VI"],
    ] as const) {
      if (eId && repl)
        throw new Error(`${label}: pick elective OR replacement, not both`);
      if (!eId && !repl) throw new Error(`${label}: selection required`);
    }

    const { data: result, error } = await supabaseAdmin.rpc(
      "register_student_atomic",
      {
        p_register_number: reg,
        p_name: data.name,
        p_section: data.section,
        p_email: data.email,
        p_pe4_id: data.pe4ElectiveId,
        p_pe4_repl: data.pe4Replacement,
        p_pe5_id: data.pe5ElectiveId,
        p_pe5_repl: data.pe5Replacement,
        p_pe6_id: data.pe6ElectiveId,
        p_pe6_repl: data.pe6Replacement,
      },
    );
    if (error) throw new Error(error.message);
    const r = result as { success: boolean; error?: string };
    if (!r.success) throw new Error(r.error || "Registration failed");
    return { success: true };
  });

// ---- Get a student's confirmed registration ----
export const getMyRegistration = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ registerNumber: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const reg = registerNumberSchema.parse(data.registerNumber).toUpperCase();
    const { data: row, error } = await supabaseAdmin
      .from("registrations")
      .select(
        "register_number, name, section, email, pe4_replacement, pe5_replacement, pe6_replacement, created_at, pe4_elective_id, pe5_elective_id, pe6_elective_id",
      )
      .eq("register_number", reg)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;

    const ids = [
      row.pe4_elective_id,
      row.pe5_elective_id,
      row.pe6_elective_id,
    ].filter(Boolean) as string[];
    let electives: Record<
      string,
      { code: string; name: string; category: string }
    > = {};
    if (ids.length) {
      const { data: es } = await supabaseAdmin
        .from("electives")
        .select("id, code, name, category")
        .in("id", ids);
      es?.forEach(
        (e) =>
          (electives[e.id] = {
            code: e.code,
            name: e.name,
            category: e.category,
          }),
      );
    }
    return { ...row, electives };
  });

// ---- Admin: login ----
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ password: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data }) => {
    if (data.password !== ADMIN_PASSWORD)
      throw new Error("Invalid admin password");
    return { ok: true };
  });

// ---- Admin: dashboard data ----
export const adminGetDashboard = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ password: z.string() }).parse(input))
  .handler(async ({ data }) => {
    if (data.password !== ADMIN_PASSWORD) throw new Error("Unauthorized");

    const [electivesRes, regsRes] = await Promise.all([
      supabaseAdmin
        .from("electives")
        .select("*")
        .order("category")
        .order("code"),
      supabaseAdmin
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    if (electivesRes.error) throw new Error(electivesRes.error.message);
    if (regsRes.error) throw new Error(regsRes.error.message);

    return {
      electives: electivesRes.data ?? [],
      registrations: regsRes.data ?? [],
    };
  });
