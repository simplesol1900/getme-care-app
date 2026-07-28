import { useState, useRef } from "react";
import { supabase } from "./supabase";
import {
  Heart, X, CheckCircle, AlertCircle, CreditCard, FileText, Briefcase, Loader2,
} from "lucide-react";
import type { AppUser, AuthMode, Role } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage =
  | "login" | "account"
  | "f1" | "f2" | "f3"
  | "cg1" | "cg2" | "cg3" | "cg4";

// ─── Shared input class ───────────────────────────────────────────────────────

const INP =
  "w-full px-4 py-2.5 rounded-xl bg-[#F2F5FA] border border-[rgba(15,23,42,0.10)] " +
  "text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/40 focus:border-[#0EA5A0] transition";

// ─── Helper components — all defined at MODULE LEVEL (never inside a render) ──

function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-start mb-7">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${i < current ? "bg-[#0EA5A0] text-white" : i === current ? "bg-[#1B3A6B] text-white" : "bg-[#E8EEF8] text-slate-400"}`}>
              {i < current ? <CheckCircle size={13} /> : i + 1}
            </div>
            <p className={`text-[9px] mt-1 font-medium text-center leading-tight ${i === current ? "text-[#1B3A6B]" : "text-slate-400"}`}>{s}</p>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1.5 mb-4 ${i < current ? "bg-[#0EA5A0]" : "bg-[#E8EEF8]"}`} />}
        </div>
      ))}
    </div>
  );
}

function AckBox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label onClick={() => onChange(!checked)} className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${checked ? "border-[#0EA5A0] bg-teal-50" : "border-[rgba(15,23,42,0.10)] hover:border-[#0EA5A0]/30"}`}>
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${checked ? "border-[#0EA5A0] bg-[#0EA5A0]" : "border-slate-300"}`}>
        {checked && <CheckCircle size={11} className="text-white" />}
      </div>
      <span className="text-xs text-slate-700 leading-relaxed">{children}</span>
    </label>
  );
}

function UploadBtn({ label, sub, uploaded, userId, docKey, onUpload }: {
  label: string; sub: string; uploaded: boolean;
  userId: string; docKey: string;
  onUpload: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const ext = file.name.split(".").pop();
    const path = `${userId}/${docKey}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("caregiver-docs")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setError("Upload failed. Try again.");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("caregiver-docs").getPublicUrl(path);
    onUpload(data.publicUrl);
    setUploading(false);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${uploaded ? "border-emerald-300 bg-emerald-50" : "border-dashed border-slate-200 hover:border-[#0EA5A0]/50 hover:bg-[#F2F5FA]"}`}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${uploaded ? "bg-emerald-100" : "bg-[#E8EEF8]"}`}>
          {uploading ? <Loader2 size={17} className="text-[#0EA5A0] animate-spin" /> : uploaded ? <CheckCircle size={17} className="text-emerald-600" /> : <FileText size={17} className="text-[#1B3A6B]" />}
        </div>
        <div>
          <p className={`text-sm font-semibold ${uploaded ? "text-emerald-700" : "text-slate-800"}`}>{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{uploading ? "Uploading…" : uploaded ? "Uploaded successfully ✓" : sub}</p>
        </div>
      </button>
      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
    </div>
  );
}

function Chips({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o]);
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button key={o} type="button" onClick={() => toggle(o)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selected.includes(o) ? "border-[#0EA5A0] bg-teal-50 text-[#0EA5A0]" : "border-[rgba(15,23,42,0.12)] text-slate-500 hover:border-[#0EA5A0]/40"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Radios({ options, value, onChange }: { options: { val: string; label: string; sub?: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {options.map(o => (
        <label key={o.val} onClick={() => onChange(o.val)} className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${value === o.val ? "border-[#0EA5A0] bg-teal-50" : "border-[rgba(15,23,42,0.10)] hover:border-[#0EA5A0]/30"}`}>
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${value === o.val ? "border-[#0EA5A0]" : "border-slate-300"}`}>
            {value === o.val && <div className="w-2 h-2 rounded-full bg-[#0EA5A0]" />}
          </div>
          <div>
            <p className="text-sm text-slate-800 font-medium leading-snug">{o.label}</p>
            {o.sub && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{o.sub}</p>}
          </div>
        </label>
      ))}
    </div>
  );
}

// ─── Stage metadata ───────────────────────────────────────────────────────────

const STAGE_META: Record<Stage, { title: string; subtitle: string }> = {
  login:   { title: "Welcome back",                            subtitle: "Sign in to your GetMeCare account." },
  account: { title: "Create your account",                     subtitle: "Choose your role and set up your login credentials." },
  f1:      { title: "Step 1: Account Profile & Care Location", subtitle: "Tell us where care will be provided and your relationship to the care recipient." },
  f2:      { title: "Step 2: Patient Health Profile & Requirements", subtitle: "Help us match you with the most suitable, compatible caregiver." },
  f3:      { title: "Step 3: Schedule, Budget & Account Activation", subtitle: "Set your care schedule, budget preferences, and activate your account." },
  cg1:     { title: "Step 1: Basic Information & Service Focus", subtitle: "Tell local families who you are and what kind of care you provide." },
  cg2:     { title: "Step 2: Location, Target Rates & Autonomy", subtitle: "Set the areas you service, your hourly rate, and the types of care you provide." },
  cg3:     { title: "Step 3: Professional Document & Verification Upload", subtitle: "Upload your credentials for admin review. Your profile stays hidden until verified." },
  cg4:     { title: "Step 4: Mandatory Payout & Platform Fee Card Link", subtitle: "Link a valid Canadian card to receive shift earnings and automate platform billing." },
};

const STAGE_IDX: Record<Stage, number> = {
  login: 0, account: 0, f1: 1, f2: 2, f3: 3, cg1: 1, cg2: 2, cg3: 3, cg4: 4,
};

const PREV: Record<Stage, Stage> = {
  login: "login", account: "account",
  f1: "account", f2: "f1", f3: "f2",
  cg1: "account", cg2: "cg1", cg3: "cg2", cg4: "cg3",
};

const FAMILY_STEPS = ["Account", "Care Location", "Care Needs", "Schedule & Activation"];
const CG_STEPS     = ["Account", "Basic Info",    "Rates & Areas", "Documents", "Payment Setup"];

// ─── Main component ───────────────────────────────────────────────────────────

export function Onboarding({ initialMode, initialRole, onSuccess, onBack }: {
  initialMode: AuthMode;
  initialRole?: Role;
  onSuccess: (u: AppUser) => void;
  onBack: () => void;
}) {
  const [stage, setStage] = useState<Stage>(initialMode === "login" ? "login" : "account");
  const [role,  setRole]  = useState<Role>(initialRole ?? "family");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [uid,      setUid]      = useState("");

  // Family questionnaire state
  const [fm, setFm] = useState({
    firstName: "", lastName: "", phone: "",
    streetAddress: "", city: "Toronto", postal: "", relationship: "",
    recipientAge: "", language: "English", services: [] as string[], mobility: "",
    frequency: "", shifts: [] as string[], budget: "30",
    vettingPaid: false, clockAck: false, checkoutAck: false, offPlatformAck: false,
  });

  // Caregiver questionnaire state
  const [cg, setCg] = useState({
    firstName: "", lastName: "", phone: "",
    displayName: "", pswRole: "psw", languages: [] as string[],
    cities: [] as string[], hourlyRate: "", careTypes: [] as string[],
    govId: "", pswCert: "", vsc: "", firstAid: "",
    cardLinked: false, ack1: false, ack2: false, ack3: false, ack4: false,
  });

  const fm_ = (k: keyof typeof fm, v: any) => setFm(p => ({ ...p, [k]: v }));
  const cg_ = (k: keyof typeof cg, v: any) => setCg(p => ({ ...p, [k]: v }));

  const goBack = () => { const p = PREV[stage]; if (p === stage) onBack(); else setStage(p); };

  // ── Auth functions ──────────────────────────────────────────────────────────

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const full = role === "family"
        ? `${fm.firstName} ${fm.lastName}`.trim()
        : `${cg.firstName} ${cg.lastName}`.trim();
      const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { full_name: full || email, role } } });
      if (err) throw err;
      if (data.user) { setUid(data.user.id); setStage(role === "family" ? "f1" : "cg1"); }
    } catch (e: any) { setError(e.message ?? "Something went wrong"); }
    finally { setLoading(false); }
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      if (data.user) {
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
        const r: Role = (prof?.role as Role) ?? (data.user.user_metadata?.role as Role) ?? "family";
        onSuccess({ id: data.user.id, email: data.user.email!, role: r, full_name: prof?.full_name ?? data.user.user_metadata?.full_name ?? "User", verified: prof?.verified, suspended: prof?.suspended });
      }
    } catch (e: any) { setError(e.message ?? "Invalid email or password"); }
    finally { setLoading(false); }
  };

  const finishFamily = async () => {
    setLoading(true);
    const full = `${fm.firstName} ${fm.lastName}`.trim();
    await supabase.from("profiles").upsert({ id: uid, email, full_name: full, role: "family", verified: false, suspended: false, city: fm.city, postal_code: fm.postal });
    onSuccess({ id: uid, email, role: "family", full_name: full, verified: false, phone: fm.phone, streetAddress: fm.streetAddress, city: fm.city, postal: fm.postal, relationship: fm.relationship, recipientAge: fm.recipientAge, language: fm.language, services: fm.services, mobility: fm.mobility, frequency: fm.frequency, shifts: fm.shifts, budget: fm.budget });
    setLoading(false);
  };

  const finishCaregiver = async () => {
    setLoading(true);
    const full = `${cg.firstName} ${cg.lastName}`.trim();
    await supabase.from("profiles").upsert({ id: uid, email, full_name: full, role: "caregiver", verified: false, suspended: false, hourly_rate: Number(cg.hourlyRate), city: cg.cities[0] ?? "", gov_id_url: cg.govId || null, vsc_url: cg.vsc || null, psw_cert_url: cg.pswCert || null, first_aid_url: cg.firstAid || null });
    onSuccess({ id: uid, email, role: "caregiver", full_name: full, verified: false, phone: cg.phone, displayName: cg.displayName, pswRole: cg.pswRole, languages: cg.languages, cities: cg.cities, hourlyRate: cg.hourlyRate, careTypes: cg.careTypes, govId: cg.govId, pswCert: cg.pswCert, vsc: cg.vsc, firstAid: cg.firstAid, cardLinked: cg.cardLinked });
    setLoading(false);
  };

  // ── Single return — shell always rendered, inner content is plain conditional JSX ──
  // This is the fix: the outer <div> shell never unmounts between keystrokes,
  // so inputs maintain focus and the mobile keyboard stays open.

  const { title, subtitle } = STAGE_META[stage];
  const showStepBar = stage !== "login" && stage !== "account";
  const backLabel = stage === "login" || stage === "account" ? "Back to home" : "Back";

  return (
    <div className="min-h-screen bg-[#F2F5FA] flex items-start justify-center p-4 py-10" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="w-full max-w-xl mt-4">

        {/* Back button */}
        <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#1B3A6B] mb-5 transition-colors">
          <X size={13} />{backLabel}
        </button>

        {/* Card — always the same element, React reconciles in place */}
        <div className="bg-white rounded-3xl border border-[rgba(15,23,42,0.10)] shadow-sm p-8">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#1B3A6B] flex items-center justify-center"><Heart size={14} className="text-white" /></div>
            <span className="font-bold text-[#1B3A6B]">GetMeCare</span>
          </div>

          {/* Step progress bar */}
          {showStepBar && <StepBar steps={role === "family" ? FAMILY_STEPS : CG_STEPS} current={STAGE_IDX[stage]} />}

          {/* Heading */}
          <h2 className="text-xl font-bold text-slate-900 mb-1">{title}</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">{subtitle}</p>

          {/* ── LOGIN ─────────────────────────────────────────────────────── */}
          {stage === "login" && (
            <div className="space-y-4">
              <form onSubmit={login} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">Email Address</label>
                  <input type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={INP} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">Password</label>
                  <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={INP} />
                </div>
                {error && <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl border border-red-100"><AlertCircle size={13} />{error}</div>}
                <button type="submit" disabled={loading} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm hover:bg-[#0EA5A0] transition-colors disabled:opacity-50">{loading ? "Signing in…" : "Sign In"}</button>
              </form>
              <p className="text-center text-sm text-slate-400">No account? <button type="button" onClick={() => setStage("account")} className="text-[#0EA5A0] font-semibold hover:underline">Create one</button></p>
            </div>
          )}

          {/* ── ACCOUNT CREATION ──────────────────────────────────────────── */}
          {stage === "account" && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">I am registering as a…</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["family", "caregiver"] as const).map(r => (
                    <button key={r} type="button" onClick={() => setRole(r)} className={`flex flex-col items-center gap-2.5 p-5 rounded-xl border-2 transition-all ${role === r ? "border-[#0EA5A0] bg-teal-50" : "border-[rgba(15,23,42,0.10)] hover:border-[#0EA5A0]/40"}`}>
                      {r === "family" ? <Heart size={24} className={role === r ? "text-[#0EA5A0]" : "text-slate-300"} /> : <Briefcase size={24} className={role === r ? "text-[#0EA5A0]" : "text-slate-300"} />}
                      <span className={`text-sm font-bold ${role === r ? "text-[#0EA5A0]" : "text-slate-400"}`}>{r === "family" ? "Family / Employer" : "PSW / Caregiver"}</span>
                    </button>
                  ))}
                </div>
              </div>
              <form onSubmit={createAccount} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">First Name</label>
                    <input type="text" required placeholder="Jane" value={role === "family" ? fm.firstName : cg.firstName} onChange={e => role === "family" ? fm_("firstName", e.target.value) : cg_("firstName", e.target.value)} className={INP} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1.5">Last Name</label>
                    <input type="text" required placeholder="Smith" value={role === "family" ? fm.lastName : cg.lastName} onChange={e => role === "family" ? fm_("lastName", e.target.value) : cg_("lastName", e.target.value)} className={INP} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">Email Address</label>
                  <input type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={INP} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">Mobile Phone Number</label>
                  <input type="tel" required placeholder="+1 (416) 000-0000" value={role === "family" ? fm.phone : cg.phone} inputMode="numeric" onChange={e => { const v = e.target.value.replace(/[^\d+\-() ]/g, ""); role === "family" ? fm_("phone", v) : cg_("phone", v); }} className={INP} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">Password</label>
                  <input type="password" required placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} className={INP} />
                </div>
                {error && <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl border border-red-100"><AlertCircle size={13} />{error}</div>}
                <button type="submit" disabled={loading} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm hover:bg-[#0EA5A0] transition-colors disabled:opacity-50">{loading ? "Creating account…" : "Continue →"}</button>
              </form>
              <p className="text-center text-sm text-slate-400">Already have an account? <button type="button" onClick={() => setStage("login")} className="text-[#0EA5A0] font-semibold hover:underline">Sign in</button></p>
            </div>
          )}

          {/* ── FAMILY STEP 1 ─────────────────────────────────────────────── */}
          {stage === "f1" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Care Recipient's Street Address</label>
                <input type="text" placeholder="123 Maple Street" value={fm.streetAddress} onChange={e => fm_("streetAddress", e.target.value)} className={INP} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">City</label>
                  <select value={fm.city} onChange={e => fm_("city", e.target.value)} className={INP}>
                    {["Toronto","Mississauga","Ottawa","Brampton","Markham","Hamilton","Other Ontario municipality"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Postal Code</label>
                  <input type="text" placeholder="M5V 2A1" maxLength={7} value={fm.postal} onChange={e => fm_("postal", e.target.value.toUpperCase())} className={INP} />
                  <p className="text-[10px] text-[#0EA5A0] mt-1 font-medium">First 3 digits used for PSW geo-matching</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Your Relationship to Care Recipient</label>
                <Radios value={fm.relationship} onChange={v => fm_("relationship", v)} options={[
                  { val: "self",     label: "I am seeking care for myself." },
                  { val: "parent",   label: "I am seeking care for a parent / family member." },
                  { val: "guardian", label: "I am a legal guardian / power of attorney." },
                ]} />
              </div>
              <button type="button" disabled={!fm.streetAddress || !fm.postal || !fm.relationship} onClick={() => setStage("f2")} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm hover:bg-[#0EA5A0] transition-colors disabled:opacity-40">Continue →</button>
            </div>
          )}

          {/* ── FAMILY STEP 2 ─────────────────────────────────────────────── */}
          {stage === "f2" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Age of Care Recipient</label>
                  <input type="text" placeholder="e.g., 78" value={fm.recipientAge} onChange={e => fm_("recipientAge", e.target.value)} className={INP} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Primary Language at Home</label>
                  <select value={fm.language} onChange={e => fm_("language", e.target.value)} className={INP}>
                    {["English","French","Tagalog","Italian","Mandarin","Cantonese","Spanish","Portuguese","Urdu","Hindi","Punjabi"].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <Chips label="Primary Service Needed (Select all that apply)" options={["Personal Support (PSW) — Bathing, dressing, feeding, toileting, mechanical lifts, medication reminders","Elderly / Companion Care — Socialization, cognitive games, light housekeeping, meal prep, errands","Specialized Care — Alzheimer's, Dementia, Palliative care, Stroke recovery support"]} selected={fm.services} onChange={v => fm_("services", v)} />
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Mobility Level</label>
                <Radios value={fm.mobility} onChange={v => fm_("mobility", v)} options={[
                  { val: "independent", label: "Fully independent / Needs companionship and supervision" },
                  { val: "assisted",    label: "Mobile with assistance — Uses a cane, walker, or light physical guidance" },
                  { val: "wheelchair",  label: "Wheelchair user — Requires physical transfers or mechanical lifts" },
                  { val: "bedbound",    label: "Bedbound — Requires comprehensive physical support" },
                ]} />
              </div>
              <button type="button" disabled={fm.services.length === 0 || !fm.mobility} onClick={() => setStage("f3")} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm hover:bg-[#0EA5A0] transition-colors disabled:opacity-40">Continue →</button>
            </div>
          )}

          {/* ── FAMILY STEP 3 + 3b ────────────────────────────────────────── */}
          {stage === "f3" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Frequency of Care Required</label>
                <Radios value={fm.frequency} onChange={v => fm_("frequency", v)} options={[
                  { val: "fulltime", label: "Full-time / Daily ongoing care" },
                  { val: "parttime", label: "Part-time — Specific days or weeks" },
                  { val: "onetime",  label: "One-time / Respite care — Emergency backup shift" },
                ]} />
              </div>
              <Chips label="Preferred Shift Breakdown" options={["Mornings","Afternoons","Evenings","Overnights"]} selected={fm.shifts} onChange={v => fm_("shifts", v)} />
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Preferred Hourly Budget ($ CAD/hr)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min={18} max={60} step={1} value={fm.budget} onChange={e => fm_("budget", e.target.value)} className="flex-1 accent-[#0EA5A0]" />
                  <span className="font-mono font-bold text-[#1B3A6B] text-xl w-20 text-right">${fm.budget}/hr</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Independent PSWs set their own rates — this is your preferred range ($18–$60+).</p>
              </div>
              <div className="bg-[#F2F5FA] rounded-2xl p-5 border border-[rgba(15,23,42,0.10)]">
                <div className="flex items-center gap-2 mb-2"><CreditCard size={15} className="text-[#1B3A6B]" /><p className="font-bold text-slate-900 text-sm">Step 3b: Platform Activation &amp; Initial Vetting Fee</p></div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">To activate your account and unlock our directory of verified caregivers, a one-time non-refundable fee is required. This covers Ontario Vulnerable Sector Checks and PSW credential verification.</p>
                <div className="bg-white rounded-xl border border-[rgba(15,23,42,0.10)] p-4 flex items-center justify-between mb-4">
                  <div><p className="font-bold text-slate-900 text-sm">One-Time Account Vetting Fee</p><p className="text-xs text-slate-400 mt-0.5">Non-refundable · Ontario VSC + PSW credential verification</p></div>
                  <p className="text-2xl font-extrabold text-[#1B3A6B]">$39<span className="text-sm font-normal text-slate-400"> CAD</span></p>
                </div>
                {!fm.vettingPaid
                  ? <button type="button" disabled={loading} onClick={async () => {
                      setLoading(true); setError("");
                      try {
                        const res = await fetch("https://byjjcosogvygegjnmunv.supabase.co/functions/v1/make-server-f62a5d52/create-checkout", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ user_id: uid, email }),
                        });
                        const data = await res.json();
                        if (data.url) { window.location.href = data.url; }
                        else { setError(data.error ?? "Could not start checkout. Try again."); }
                      } catch { setError("Network error. Try again."); }
                      setLoading(false);
                    }} className="w-full py-3 bg-[#0EA5A0] text-white rounded-xl font-bold text-sm hover:bg-[#0d9489] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                      {loading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                      {loading ? "Redirecting to payment…" : "Pay $39.00 & Activate Account"}
                    </button>
                  : <div className="w-full py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2"><CheckCircle size={15} />Payment Confirmed · Account Activated</div>
                }
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live Shift Verification &amp; Ongoing Payment Terms</p>
                <AckBox checked={fm.clockAck} onChange={v => fm_("clockAck", v)}><strong>Clock-In / Clock-Out:</strong> I agree to use the integrated GetMeCare tracking system. Caregivers clock in upon arrival and clock out upon departure, generating a digital timesheet I must review and approve inside my dashboard.</AckBox>
                <AckBox checked={fm.checkoutAck} onChange={v => fm_("checkoutAck", v)}><strong>Automated Checkout:</strong> I authorize GetMeCare to charge my saved card for the total shift cost upon my approval of the caregiver's clocked timesheet. 100% of shift funds are routed directly to the caregiver's account.</AckBox>
                <AckBox checked={fm.offPlatformAck} onChange={v => fm_("offPlatformAck", v)}>I agree that off-platform cash payments violate platform safety rules and may result in account suspension.</AckBox>
              </div>
              <button type="button" disabled={!fm.frequency || !fm.vettingPaid || !fm.clockAck || !fm.checkoutAck || !fm.offPlatformAck || loading} onClick={finishFamily} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm hover:bg-[#0EA5A0] transition-colors disabled:opacity-40">{loading ? "Setting up your account…" : "Complete Registration →"}</button>
            </div>
          )}

          {/* ── CAREGIVER STEP 1 ──────────────────────────────────────────── */}
          {stage === "cg1" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Profile Display Name</label>
                <input type="text" placeholder='"Sarah M." — how your name appears to families' value={cg.displayName} onChange={e => cg_("displayName", e.target.value)} className={INP} />
                <p className="text-xs text-slate-400 mt-1">Your public-facing name, not your full legal name on file.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Primary Caregiving Role (Select One)</label>
                <Radios value={cg.pswRole} onChange={v => cg_("pswRole", v)} options={[
                  { val: "psw",      label: "Certified PSW",        sub: "I hold an active Ontario College PSW Certificate or equivalent nurse training." },
                  { val: "companion",label: "Companion / Caregiver", sub: "I offer non-medical senior care, light housekeeping, and companionship." },
                ]} />
              </div>
              <Chips label="Languages Spoken Fluently" options={["English","French","Tagalog","Italian","Mandarin","Cantonese","Spanish","Portuguese","Urdu","Hindi","Punjabi"]} selected={cg.languages} onChange={v => cg_("languages", v)} />
              <button type="button" disabled={!cg.displayName || cg.languages.length === 0} onClick={() => setStage("cg2")} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm hover:bg-[#0EA5A0] transition-colors disabled:opacity-40">Continue →</button>
            </div>
          )}

          {/* ── CAREGIVER STEP 2 ──────────────────────────────────────────── */}
          {stage === "cg2" && (
            <div className="space-y-5">
              <Chips label="What cities / regions do you service?" options={["Toronto","Mississauga","Ottawa","Brampton","Markham","Scarborough","North York","Etobicoke","Hamilton","Burlington"]} selected={cg.cities} onChange={v => cg_("cities", v)} />
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">What is your baseline hourly rate ($ CAD)?</label>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-base font-bold">$</span>
                  <input type="number" min={15} max={80} placeholder="25" value={cg.hourlyRate} onChange={e => cg_("hourlyRate", e.target.value)} className={INP} />
                  <span className="text-slate-500 text-sm font-bold whitespace-nowrap">/ hour</span>
                </div>
                <div className="mt-2.5 bg-[#E8EEF8] rounded-xl px-4 py-3">
                  <p className="text-xs text-[#1B3A6B] leading-relaxed">"As an independent contractor on GetMeCare, you control your pricing. Families pay you this rate through our secure checkout, minus our platform facilitation fee."</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">What types of care are you willing to fulfill? (Select all that apply)</label>
                <div className="space-y-2">
                  {["Personal care — Bathing, grooming, toileting, mechanical lifts","Companion care, companionship, and light domestic housekeeping","Specialized care — Alzheimer's, Dementia, Palliative care support","Errands and patient transportation — Requires a valid driver's licence and vehicle"].map(c => {
                    const sel = cg.careTypes.includes(c);
                    return (
                      <label key={c} onClick={() => cg_("careTypes", sel ? cg.careTypes.filter(x => x !== c) : [...cg.careTypes, c])} className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${sel ? "border-[#0EA5A0] bg-teal-50" : "border-[rgba(15,23,42,0.10)] hover:border-[#0EA5A0]/30"}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all ${sel ? "border-[#0EA5A0] bg-[#0EA5A0]" : "border-slate-300"}`}>{sel && <CheckCircle size={10} className="text-white" />}</div>
                        <span className="text-xs text-slate-700 leading-snug">{c}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <button type="button" disabled={cg.cities.length === 0 || !cg.hourlyRate || cg.careTypes.length === 0} onClick={() => setStage("cg3")} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm hover:bg-[#0EA5A0] transition-colors disabled:opacity-40">Continue →</button>
            </div>
          )}

          {/* ── CAREGIVER STEP 3 ──────────────────────────────────────────── */}
          {stage === "cg3" && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">Profiles remain <strong>hidden</strong> in our local search directory until these credentials are manually verified by our administration team.</p>
              </div>
              <UploadBtn label="Government-Issued Photo ID" sub="Ontario Driver's Licence or Canadian Passport · PDF, JPG, PNG" uploaded={!!cg.govId} userId={uid} docKey="gov-id" onUpload={url => cg_("govId", url)} />
              {cg.pswRole === "psw" && <UploadBtn label="Proof of Qualifications (Certified PSW)" sub="Ontario College Certificate, Diploma, or proof of nursing registration" uploaded={!!cg.pswCert} userId={uid} docKey="psw-cert" onUpload={url => cg_("pswCert", url)} />}
              <UploadBtn label="Vulnerable Sector Check (VSC)" sub="Valid Ontario police check issued within the last 12 months" uploaded={!!cg.vsc} userId={uid} docKey="vsc" onUpload={url => cg_("vsc", url)} />
              <UploadBtn label="First Aid / CPR Certification" sub="Active St. John Ambulance or Red Cross certificate (recommended)" uploaded={!!cg.firstAid} userId={uid} docKey="first-aid" onUpload={url => cg_("firstAid", url)} />
              <button type="button" disabled={!cg.govId || !cg.vsc || (cg.pswRole === "psw" && !cg.pswCert)} onClick={() => setStage("cg4")} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm hover:bg-[#0EA5A0] transition-colors disabled:opacity-40">Continue →</button>
              <p className="text-xs text-center text-slate-400">Gov ID and VSC {cg.pswRole === "psw" ? "and PSW Certificate are" : "is"} required. First Aid is optional but strongly recommended.</p>
            </div>
          )}

          {/* ── CAREGIVER STEP 4 ──────────────────────────────────────────── */}
          {stage === "cg4" && (
            <div className="space-y-5">
              <p className="text-sm text-slate-500 leading-relaxed">To receive payments and automate platform billing, link a valid Canadian Visa/Mastercard. Card details are tokenized securely — raw card numbers are never stored.</p>
              {!cg.cardLinked
                ? <button type="button" onClick={() => cg_("cardLinked", true)} className="w-full py-3 bg-[#0EA5A0] text-white rounded-xl font-bold text-sm hover:bg-[#0d9489] transition-colors flex items-center justify-center gap-2"><CreditCard size={15} />Link Your Card Now via Secure Gateway</button>
                : <div className="w-full py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2"><CheckCircle size={15} />Card Linked Successfully · •••• •••• •••• 4242</div>
              }
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mandatory Billing Acknowledgments</p>
                <AckBox checked={cg.ack1} onChange={v => cg_("ack1", v)}>"I understand that GetMeCare acts as a matchmaking marketplace. I am registering as an <strong>independent contractor and a self-employed business entity</strong> — not an employee of GetMeCare."</AckBox>
                <AckBox checked={cg.ack2} onChange={v => cg_("ack2", v)}>"I agree to use the integrated <strong>Clock-In / Clock-Out system</strong> to track my hours. Once an employer approves my timesheet, 100% of shift earnings will be pushed directly to my linked account."</AckBox>
                <AckBox checked={cg.ack3} onChange={v => cg_("ack3", v)}>"I authorize GetMeCare to automatically charge my linked card for its <strong>15% platform facilitation fee</strong> immediately following the successful deposit of my shift earnings."</AckBox>
                <AckBox checked={cg.ack4} onChange={v => cg_("ack4", v)}>"I understand that if a platform fee charge fails due to insufficient funds, my provider profile will be <strong>instantly hidden</strong> from the public directory until the balance is cleared."</AckBox>
              </div>
              <button type="button" disabled={!cg.cardLinked || !cg.ack1 || !cg.ack2 || !cg.ack3 || !cg.ack4 || loading} onClick={finishCaregiver} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm hover:bg-[#0EA5A0] transition-colors disabled:opacity-40">{loading ? "Completing registration…" : "Complete Registration →"}</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
