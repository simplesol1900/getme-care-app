/**
 * GetMeCare — Supabase database helpers
 * M2 (matching), M3 (bids / shifts / billing), M4 (notifications + email triggers)
 */

import { supabase } from "../supabase";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const DB  = `https://${projectId}.supabase.co/rest/v1`;
const API = `https://${projectId}.supabase.co/functions/v1/make-server-f62a5d52`;

// Direct REST insert with explicit Bearer token — bypasses JS client auth chain.
// This guarantees auth.uid() = family_id passes RLS even if the client
// hasn't fully hydrated its session from localStorage yet.
async function dbInsert(table: string, payload: object) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { data: null, error: { message: "Not signed in. Please sign out and sign back in." } };

  const res = await fetch(`${DB}/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": publicAnonKey,
      "Authorization": `Bearer ${session.access_token}`,
      "Prefer": "return=representation",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    return { data: null, error: { message: json?.message ?? json?.details ?? "Insert failed" } };
  }
  return { data: Array.isArray(json) ? json[0] : json, error: null };
}

async function callEdge(path: string, method = "GET", body?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  try { return await res.json(); } catch { return {}; }
}

// ─── Profile helpers ──────────────────────────────────────────────────────────

export async function updateProfile(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", id);
  return { error };
}

// ─── M2: Jobs ────────────────────────────────────────────────────────────────

export interface Job {
  id?: string;
  family_id?: string;
  title: string;
  city: string;
  postal_prefix: string;
  care_type: string;
  hours: string;
  schedule: string;
  rate: number;
  status?: string;
  created_at?: string;
  family_name?: string;
}

export async function postJob(job: Omit<Job, "id" | "status" | "created_at">) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return { data: null, error: { message: "Not signed in. Please sign out and sign back in." } };
  return dbInsert("jobs", {
    ...job,
    family_id: session.user.id,
    postal_prefix: job.postal_prefix.slice(0, 3).toUpperCase(),
    status: "open",
  });
}

export async function fetchFamilyJobs(familyId: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

export async function fetchOpenJobs(city?: string) {
  try {
    let q = supabase.from("jobs").select("*").eq("status", "open");
    if (city) q = q.eq("city", city);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error?.message && (error.message.includes("does not exist") || error.message.includes("relationship") || error.message.includes("schema cache"))) {
      return { data: [], error: null };
    }
    return { data: data ?? [], error };
  } catch {
    return { data: [], error: null };
  }
}

// ─── M2: Matching Engine ──────────────────────────────────────────────────────

export async function matchCaregiversToPostal(postal: string) {
  const prefix = postal.slice(0, 3).toUpperCase();
  // Try live edge function first, fall back to direct Supabase query
  try {
    const res = await callEdge(`/caregivers?city=All&verified_only=false`);
    if (res.caregivers) return { data: res.caregivers, error: null };
  } catch (_) {}

  // Fallback: direct query
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, psw_role, city, postal_code, hourly_rate, languages, care_types, rating, review_count, verified, suspended")
    .eq("role", "caregiver")
    .eq("suspended", false)
    .ilike("postal_code", `${prefix}%`)
    .order("rating", { ascending: false });
  return { data: data ?? [], error };
}

export async function matchJobsToCaregiver(caregiverId: string, cities: string[]) {
  if (cities.length === 0) return fetchOpenJobs();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, family:family_id(full_name, city)")
    .eq("status", "open")
    .in("city", cities)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

export async function fetchAllCaregivers(filters: {
  city?: string;
  service?: string;
  lang?: string;
  maxRate?: number;
  verifiedOnly?: boolean;
}) {
  let q = supabase
    .from("profiles")
    .select("id, full_name, display_name, psw_role, city, postal_code, hourly_rate, languages, care_types, rating, review_count, verified, suspended")
    .eq("role", "caregiver")
    .eq("suspended", false);

  if (filters.verifiedOnly) q = q.eq("verified", true);
  if (filters.city && filters.city !== "All") q = q.eq("city", filters.city);
  if (filters.lang && filters.lang !== "All") q = q.contains("languages", [filters.lang]);
  if (filters.maxRate) q = q.lte("hourly_rate", filters.maxRate);

  const { data, error } = await q.order("rating", { ascending: false }).limit(50);
  let result = data ?? [];
  if (filters.service && filters.service !== "All") {
    result = result.filter((c: any) =>
      c.care_types?.some((t: string) => t.toLowerCase().includes(filters.service!.toLowerCase()))
    );
  }
  return { data: result, error };
}

// ─── M3: Bids ────────────────────────────────────────────────────────────────

export interface Bid {
  id?: string;
  job_id: string;
  caregiver_id?: string;
  amount: number;
  note?: string;
  status?: string;
  counter_amount?: number;
  created_at?: string;
}

export async function submitBid(bid: Omit<Bid, "id" | "caregiver_id" | "status" | "created_at">) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return { data: null, error: { message: "Not signed in." } };
  return dbInsert("bids", {
    ...bid,
    caregiver_id: session.user.id,
    status: "pending",
  });
}

export async function fetchBidsForJob(jobId: string) {
  const { data, error } = await supabase
    .from("bids")
    .select("*, caregiver:caregiver_id(full_name, display_name, rating, review_count, city, psw_role)")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

export async function fetchBidsForCaregiver(caregiverId: string) {
  const { data, error } = await supabase
    .from("bids")
    .select("*, job:job_id(title, city, rate, care_type, family_id, family:family_id(full_name))")
    .eq("caregiver_id", caregiverId)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

export async function acceptBid(bidId: string, jobId: string) {
  return callEdge("/accept-bid", "POST", { bid_id: bidId, job_id: jobId });
}

export async function counterBid(bidId: string, counterAmount: number) {
  return callEdge("/counter-bid", "POST", { bid_id: bidId, counter_amount: counterAmount });
}

// ─── M3: Shifts (Clock-In / Clock-Out) ────────────────────────────────────────

export interface Shift {
  id?: string;
  job_id?: string;
  caregiver_id?: string;
  family_id?: string;
  clock_in?: string;
  clock_out?: string;
  hours_worked?: number;
  rate?: number;
  gross?: number;
  platform_fee?: number;
  net?: number;
  status?: string;
  stripe_charge_id?: string;
  stripe_status?: string;
}

export async function clockIn(jobId: string | null, familyId: string | null, rate: number) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return { data: null, error: { message: "Not signed in." } };
  const result = await dbInsert("shifts", {
    job_id: jobId,
    caregiver_id: session.user.id,
    family_id: familyId,
    clock_in: new Date().toISOString(),
    rate,
    status: "active",
  });
  // Fire email + in-app notification (best-effort, non-blocking)
  if (result.data && familyId) {
    callEdge("/notify-clock-in", "POST", { caregiver_id: session.user.id, family_id: familyId, rate }).catch(() => {});
  }
  return result;
}

export async function clockOut(shiftId: string, rate: number) {
  const now = new Date();
  const { data: shift } = await supabase.from("shifts").select("clock_in, caregiver_id, family_id").eq("id", shiftId).single();
  const hoursWorked = shift?.clock_in
    ? (now.getTime() - new Date(shift.clock_in).getTime()) / 3_600_000
    : 0;
  const gross       = Math.round(hoursWorked * rate * 100) / 100;
  const platformFee = Math.round(gross * 0.15 * 100) / 100;
  const net         = Math.round((gross - platformFee) * 100) / 100;

  const { data, error } = await supabase.from("shifts").update({
    clock_out: now.toISOString(),
    hours_worked: Math.round(hoursWorked * 100) / 100,
    gross, platform_fee: platformFee, net,
    status: "pending_approval",
  }).eq("id", shiftId).select().single();

  // Fire email + notification to family
  if (!error && shift?.family_id) {
    callEdge("/notify-clock-out", "POST", {
      caregiver_id: shift.caregiver_id,
      family_id: shift.family_id,
      hours_worked: Math.round(hoursWorked * 100) / 100,
      gross, platform_fee: platformFee,
    }).catch(() => {});
  }

  return { data, error };
}

export async function fetchCaregiverShifts(caregiverId: string) {
  try {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("caregiver_id", caregiverId)
      .order("created_at", { ascending: false });
    if (error?.message && (error.message.includes("does not exist") || error.message.includes("relationship") || error.message.includes("schema cache"))) {
      return { data: [], error: null };
    }
    return { data: data ?? [], error };
  } catch {
    return { data: [], error: null };
  }
}

export async function fetchFamilyShifts(familyId: string) {
  try {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("family_id", familyId)
      .in("status", ["pending_approval", "approved", "paid", "disputed"])
      .order("created_at", { ascending: false });
    if (error?.message && (error.message.includes("does not exist") || error.message.includes("relationship") || error.message.includes("schema cache"))) {
      return { data: [], error: null };
    }
    return { data: data ?? [], error };
  } catch {
    return { data: [], error: null };
  }
}

// ─── M3: Timesheet Approval → triggers Stripe 15% charge ─────────────────────

export async function approveShift(shiftId: string, familyId: string) {
  return callEdge("/approve-shift", "POST", { shift_id: shiftId, family_id: familyId });
}

export async function disputeShift(shiftId: string) {
  return callEdge("/dispute-shift", "POST", { shift_id: shiftId });
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

export async function fetchAllShiftsAdmin() {
  try {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    // Suppress schema-cache errors — table may not exist yet
    if (error?.message && (error.message.includes("does not exist") || error.message.includes("relationship") || error.message.includes("schema cache"))) {
      return { data: [], error: null };
    }
    return { data: data ?? [], error };
  } catch {
    return { data: [], error: null };
  }
}

export async function fetchPendingCaregivers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  // Filter client-side — avoids PostgREST schema-cache error when role column
  // isn't yet in its cache (column exists in DB but cache may be stale)
  if (error) return { data: [], error };
  const caregivers = (data ?? []).filter((p: any) => p.role === "caregiver");
  return { data: caregivers, error: null };
}

export async function suspendCaregiverAdmin(caregiverId: string) {
  const { error } = await supabase.from("profiles").update({ suspended: true }).eq("id", caregiverId);
  return { error };
}

export async function reinstateCaregiver(caregiverId: string) {
  // Use edge function so email + notification fire automatically
  const res = await callEdge("/reinstate-caregiver", "POST", { caregiver_id: caregiverId });
  if (!res.success) {
    const { error } = await supabase.from("profiles").update({ suspended: false }).eq("id", caregiverId);
    return { error };
  }
  return { error: null };
}

// ─── M4: Notifications ────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export async function fetchNotifications(userId: string): Promise<{ data: Notification[]; unread: number }> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const items = (data ?? []) as Notification[];
  return { data: items, unread: items.filter(n => !n.read).length };
}

export async function markNotificationsRead(userId: string) {
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}

// ─── M4: DB Setup via edge function (no SQL Editor needed) ───────────────────

export async function runDatabaseSetup(): Promise<{ success: boolean; errors: string[] }> {
  try {
    const res = await fetch(`${API}/setup-db`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, errors: [e.message ?? "Network error — is the edge function deployed?"] };
  }
}

// ─── M4: Booking Simulation (admin) ──────────────────────────────────────────

export async function runBookingSimulation(familyId: string, caregiverId: string) {
  return callEdge("/simulate-booking", "POST", { family_id: familyId, caregiver_id: caregiverId });
}

// ─── Admin: all users ─────────────────────────────────────────────────────────

export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

export async function disableProfilesRLS(): Promise<{ success: boolean; error?: string }> {
  // Runs via the /setup-db edge function which uses service role key
  try {
    const res = await fetch(`${API}/setup-db`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    return { success: json.success ?? false, error: json.errors?.[0] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function suspendUserAdmin(userId: string) {
  const { error } = await supabase.from("profiles").update({ suspended: true }).eq("id", userId);
  return { error };
}

export async function reinstateUserAdmin(userId: string) {
  const { error } = await supabase.from("profiles").update({ suspended: false }).eq("id", userId);
  return { error };
}

export async function promoteToAdmin(userId: string) {
  const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", userId);
  return { error };
}

export async function deleteUserAdmin(userId: string) {
  // Delete profile row; Supabase auth user remains but can no longer access the app
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  return { error };
}

// ─── Admin: verify via edge function (sends email) ────────────────────────────

export async function verifyCaregiverAdmin(caregiverId: string) {
  const res = await callEdge("/verify-caregiver", "POST", { caregiver_id: caregiverId });
  if (!res.success) {
    const { error } = await supabase.from("profiles").update({ verified: true }).eq("id", caregiverId);
    return { error };
  }
  return { error: null };
}
