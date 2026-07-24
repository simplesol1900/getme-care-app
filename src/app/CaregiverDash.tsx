import { useState, useEffect } from "react";
import {
  Home, Timer, Search, Briefcase, Banknote, UserCheck,
  CheckCircle, AlertCircle, CreditCard, TrendingUp, Lock,
  Play, Square, FileText, DollarSign, Clock, Calendar,
  MapPin, Loader2, Bell, Mail, MessageSquare,
} from "lucide-react";
import type { AppUser } from "./types";
import { Shell, StatCard, Badge } from "./shared";
import {
  matchJobsToCaregiver, submitBid, fetchBidsForCaregiver,
  clockIn, clockOut, fetchCaregiverShifts,
  fetchNotifications, markNotificationsRead,
  type Shift, type Notification,
} from "./lib/db";

const INP =
  "w-full px-4 py-2.5 rounded-xl bg-[#F2F5FA] border border-[rgba(15,23,42,0.10)] " +
  "text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/40 focus:border-[#0EA5A0] transition";

function ProfileRow({ label, value }: { label: string; value?: string | string[] | boolean }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : value === true ? "Yes" : String(value);
  return (
    <div className="flex items-start justify-between py-3 border-b border-[rgba(15,23,42,0.07)] last:border-0 gap-4">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide shrink-0 mt-0.5">{label}</p>
      <p className="text-sm text-slate-900 text-right">{display}</p>
    </div>
  );
}

export function CaregiverDash({ user, onSignOut, onNavigate, initialTab }: { user: AppUser; onSignOut: () => void; onNavigate?: (v: string) => void; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab ?? "overview");

  // Clock-in/out state
  const [clockedIn, setClockedIn] = useState(false);
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState("00:00:00");

  // Live data
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingBids, setLoadingBids] = useState(true);
  const [loadingShifts, setLoadingShifts] = useState(true);

  // Bid form
  const [bidJob, setBidJob] = useState<string | null>(null);
  const [bidAmt, setBidAmt] = useState("");
  const [bidNote, setBidNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bidErr, setBidErr] = useState("");

  // Clock-in form
  const [clockRate, setClockRate] = useState(user.hourlyRate ?? "24");
  const [clockMsg, setClockMsg] = useState("");

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const nav = [
    { icon: Home,          label: "Overview",     id: "overview", href: "/dashboard/caregiver" },
    { icon: Timer,         label: "Shift Tracker",id: "clock",   href: "/dashboard/caregiver/shift-tracker" },
    { icon: Search,        label: "Matched Jobs", id: "browse",  href: "/dashboard/caregiver/matches" },
    { icon: Briefcase,     label: "My Bids",      id: "bids"     },
    { icon: Banknote,      label: "Earnings",     id: "earnings" },
    { icon: MessageSquare, label: "Messages",     id: "chat",    href: "/dashboard/chat" },
    { icon: Bell,          label: unread > 0 ? `Notifications (${unread})` : "Notifications", id: "notifications" },
    { icon: UserCheck,     label: "My Profile",   id: "profile"  },
  ];

  // Timer
  useEffect(() => {
    if (!clockedIn || !clockInTime) return;
    const iv = setInterval(() => {
      const d = Math.floor((Date.now() - clockInTime.getTime()) / 1000);
      setElapsed(`${String(Math.floor(d / 3600)).padStart(2, "0")}:${String(Math.floor((d % 3600) / 60)).padStart(2, "0")}:${String(d % 60).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [clockedIn, clockInTime]);

  // Load matched jobs
  useEffect(() => {
    setLoadingJobs(true);
    matchJobsToCaregiver(user.id, user.cities ?? []).then(({ data }) => { setMatchedJobs(data); setLoadingJobs(false); });
  }, [user.id]);

  // Load bids
  useEffect(() => {
    setLoadingBids(true);
    fetchBidsForCaregiver(user.id).then(({ data }) => { setBids(data); setLoadingBids(false); });
  }, [user.id]);

  // Load shifts
  useEffect(() => {
    setLoadingShifts(true);
    fetchCaregiverShifts(user.id).then(({ data }) => { setShifts(data as Shift[]); setLoadingShifts(false); });
  }, [user.id]);

  // Load notifications
  useEffect(() => {
    fetchNotifications(user.id).then(({ data, unread: u }) => { setNotifications(data); setUnread(u); });
  }, [user.id]);

  const handleClockIn = async () => {
    setClockMsg("Clocking in…");
    const { data, error } = await clockIn(null, null, Number(clockRate));
    if (error) { setClockMsg(`Error: ${error.message}`); return; }
    setActiveShiftId(data.id);
    setClockedIn(true);
    setClockInTime(new Date());
    setElapsed("00:00:00");
    setClockMsg("Clocked in successfully! Your family has been notified.");
    setTimeout(() => setClockMsg(""), 3000);
  };

  const handleClockOut = async () => {
    if (!activeShiftId) return;
    setClockMsg("Clocking out and generating timesheet…");
    const { error } = await clockOut(activeShiftId, Number(clockRate));
    if (error) { setClockMsg(`Error: ${error.message}`); return; }
    setClockedIn(false);
    setActiveShiftId(null);
    setClockInTime(null);
    // Refresh shifts
    const { data } = await fetchCaregiverShifts(user.id);
    setShifts(data as Shift[]);
    setClockMsg("Clocked out! Timesheet submitted for family approval.");
    setTimeout(() => setClockMsg(""), 4000);
  };

  const handleSubmitBid = async (jobId: string) => {
    if (!bidAmt) return;
    setSubmitting(true); setBidErr("");
    const { error } = await submitBid({ job_id: jobId, amount: Number(bidAmt), note: bidNote });
    if (error) { setBidErr(error.message); setSubmitting(false); return; }
    const { data } = await fetchBidsForCaregiver(user.id);
    setBids(data);
    setBidJob(null); setBidAmt(""); setBidNote("");
    setSubmitting(false);
    setTab("bids");
  };

  const gross = shifts.reduce((a, s: any) => a + (s.gross ?? 0), 0);
  const net   = shifts.reduce((a, s: any) => a + (s.net   ?? 0), 0);
  const fee   = shifts.reduce((a, s: any) => a + (s.platform_fee ?? 0), 0);
  const paidShifts = shifts.filter((s: any) => s.status === "paid");
  const pswLabel = user.pswRole === "psw" ? "Certified PSW (Ontario College Certificate)" : "Companion / Caregiver (Non-medical)";

  return (
    <Shell user={user} nav={nav} tab={tab} setTab={setTab} onSignOut={onSignOut} onNavigate={onNavigate}>

      {/* Clock message */}
      {clockMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B3A6B] text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-sm">{clockMsg}</div>
      )}

      {/* Verification banner */}
      {!user.verified && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <AlertCircle size={17} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Profile pending verification</p>
            <p className="text-xs text-amber-700 mt-0.5">Your profile is hidden from families until admin verifies your uploaded credentials. Expected within 48 business hours.</p>
          </div>
        </div>
      )}

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Good morning, {(user.displayName ?? user.full_name).split(" ")[0]}</h1>
            <p className="text-slate-400 text-sm mt-1">Your activity at a glance.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Briefcase}   label="Active Bids"      value={bids.filter((b: any) => b.status === "pending").length}  color="#1B3A6B" />
            <StatCard icon={CheckCircle} label="Shifts This Week" value={shifts.filter((s: any) => s.status !== "active").length} color="#10B981" />
            <StatCard icon={Banknote}    label="Gross Earnings"   value={`$${gross.toFixed(0)}`}                                  color="#0EA5A0" />
            <StatCard icon={TrendingUp}  label="Net Earnings"     value={`$${net.toFixed(0)}`} sub="after 15% platform fee"        color="#F59E0B" />
          </div>

          {/* Active shift */}
          {clockedIn && (
            <div className="bg-[#1B3A6B] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /><p className="text-sm text-white/70">Active Shift · ${clockRate}/hr</p></div>
              <p className="font-mono text-5xl font-bold">{elapsed}</p>
              <p className="text-sm text-white/50 mt-1">Clocked in at {clockInTime?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              <button onClick={handleClockOut} className="mt-4 flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"><Square size={15} />Clock Out</button>
            </div>
          )}

          {/* Recent shifts */}
          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Recent Shifts</h2>
            {loadingShifts ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" />Loading…</div>
            ) : shifts.length === 0 ? (
              <p className="text-sm text-slate-400">No shifts yet. Clock in to start your first shift.</p>
            ) : (
              shifts.slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-[rgba(15,23,42,0.07)] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{new Date(s.clock_in).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}</p>
                    <p className="text-xs text-slate-400">{s.hours_worked?.toFixed(2)} hrs · <span className="font-mono">${s.gross?.toFixed(2)} gross</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 font-mono">${s.net?.toFixed(2)}</p>
                    <Badge color={s.status === "paid" ? "green" : s.status === "approved" ? "teal" : s.status === "disputed" ? "red" : "yellow"}>
                      {s.status === "pending_approval" ? "Pending" : s.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Clock In / Out ────────────────────────────────────────────────── */}
      {tab === "clock" && (
        <div className="space-y-6 max-w-lg">
          <div><h1 className="text-2xl font-bold text-slate-900">Clock In / Out</h1><p className="text-slate-400 text-sm mt-1">Your clock-in timestamp is recorded and sent to the family instantly.</p></div>
          <div className="bg-white rounded-3xl border border-[rgba(15,23,42,0.10)] p-8 text-center">
            {clockedIn ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-4"><div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" /><span className="text-sm font-semibold text-emerald-700">Shift Active · ${clockRate}/hr</span></div>
                <p className="font-mono text-6xl font-bold text-slate-900 mb-2">{elapsed}</p>
                <p className="text-sm text-slate-400 mb-2">Clocked in at {clockInTime?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                <p className="text-xs text-slate-400 mb-8">Est. gross: <span className="font-mono font-semibold">${(Number(clockRate) * (elapsed.split(":").reduce((a, t, i) => a + Number(t) * [3600, 60, 1][i], 0) / 3600)).toFixed(2)}</span> · Platform fee (15%): <span className="font-mono">${(Number(clockRate) * (elapsed.split(":").reduce((a, t, i) => a + Number(t) * [3600, 60, 1][i], 0) / 3600) * 0.15).toFixed(2)}</span></p>
                <button onClick={handleClockOut} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-3"><Square size={20} />Clock Out &amp; Submit Timesheet</button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-[#1B3A6B]/8 flex items-center justify-center mx-auto mb-6"><Clock size={38} className="text-[#1B3A6B]" /></div>
                <p className="text-lg font-semibold text-slate-900 mb-2">Ready to start your shift?</p>
                <p className="text-sm text-slate-400 mb-6">Your clock-in time is recorded and sent to the family. When you clock out, a timesheet is auto-generated for their approval.</p>
                <div className="mb-6 text-left">
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">Your rate for this shift ($/hr)</label>
                  <input type="number" value={clockRate} onChange={e => setClockRate(e.target.value)} className={INP} />
                </div>
                <button onClick={handleClockIn} className="w-full py-4 bg-[#1B3A6B] text-white rounded-2xl font-bold text-lg hover:bg-[#0EA5A0] transition-colors flex items-center justify-center gap-3"><Play size={20} />Clock In</button>
              </>
            )}
          </div>

          {/* Shift history */}
          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Shift History</h2>
            {loadingShifts ? <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" />Loading…</div> :
              shifts.filter((s: any) => s.status !== "active").slice(0, 10).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-[rgba(15,23,42,0.07)] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{new Date(s.clock_in).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}</p>
                    <p className="text-xs text-slate-400">{s.hours_worked?.toFixed(2)} hrs · <span className="font-mono">${s.rate}/hr</span></p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-slate-900">${s.gross?.toFixed(2)}</p>
                    <Badge color={s.status === "paid" ? "green" : s.status === "approved" ? "teal" : "yellow"}>{s.status === "pending_approval" ? "Pending" : s.status}</Badge>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── Browse Matched Jobs ───────────────────────────────────────────── */}
      {tab === "browse" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Browse Matched Jobs</h1>
            <p className="text-slate-400 text-sm mt-1">
              Jobs algorithmically matched to your service cities: <strong>{(user.cities ?? []).join(", ") || "None set"}</strong>
            </p>
          </div>
          {!user.verified && (
            <div className="bg-[#E8EEF8] rounded-2xl p-4 flex gap-3 items-start">
              <Lock size={15} className="text-[#1B3A6B] shrink-0 mt-0.5" />
              <p className="text-sm text-[#1B3A6B]">Your profile must be admin-verified before you can submit bids. Jobs are previewed below.</p>
            </div>
          )}
          {loadingJobs ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-400"><Loader2 size={20} className="animate-spin" />Matching jobs to your service areas…</div>
          ) : matchedJobs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Search size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium">No open jobs in your service areas yet.</p>
              <p className="text-sm mt-1">New jobs from families in {(user.cities ?? []).join(", ")} will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchedJobs.map((job: any) => (
                <div key={job.id} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{job.family?.full_name ?? "Family"} · {job.city} ({job.postal_prefix}XX)</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-[#1B3A6B] font-mono">${job.rate}/hr</p>
                      <Badge color="teal">{job.care_type}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {([[Clock, job.hours], [Calendar, job.schedule], [MapPin, job.city]] as [any, string][]).map(([Icon, val], i) => (
                      <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Icon size={11} />{val}
                      </span>
                    ))}
                    <span className="text-xs text-slate-400">Posted {new Date(job.created_at).toLocaleDateString("en-CA")}</span>
                  </div>

                  {bids.some((b: any) => b.job_id === job.id) ? (
                    <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2 text-sm text-teal-700 font-medium flex items-center gap-2">
                      <CheckCircle size={14} />Bid submitted · ${bids.find((b: any) => b.job_id === job.id)?.amount}/hr
                    </div>
                  ) : bidJob === job.id ? (
                    <div className="bg-[#F2F5FA] rounded-xl p-4 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-900 mb-1 block">Your bid ($/hr)</label>
                        <input type="number" value={bidAmt} onChange={e => setBidAmt(e.target.value)} placeholder={String(job.rate)} className="w-32 px-3 py-2 rounded-lg bg-white border border-[rgba(15,23,42,0.10)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/40" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-900 mb-1 block">Note to family (optional)</label>
                        <textarea rows={2} value={bidNote} onChange={e => setBidNote(e.target.value)} placeholder="Briefly introduce yourself and why you're a great fit…" className="w-full px-3 py-2 rounded-lg bg-white border border-[rgba(15,23,42,0.10)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/40 resize-none" />
                      </div>
                      {bidErr && <p className="text-xs text-red-600">{bidErr}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => handleSubmitBid(job.id)} disabled={submitting} className="flex-1 py-2 bg-[#1B3A6B] text-white rounded-lg text-sm font-semibold hover:bg-[#0EA5A0] transition-colors disabled:opacity-50">
                          {submitting ? <span className="flex items-center justify-center gap-1"><Loader2 size={13} className="animate-spin" />Submitting…</span> : "Submit Bid"}
                        </button>
                        <button onClick={() => setBidJob(null)} className="px-4 py-2 border border-[rgba(15,23,42,0.10)] rounded-lg text-sm hover:bg-[#F2F5FA] transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { if (user.verified) setBidJob(job.id); }} disabled={!user.verified}
                      className="flex items-center gap-2 bg-[#1B3A6B] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#0EA5A0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <DollarSign size={14} />Submit a Bid
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── My Bids ───────────────────────────────────────────────────────── */}
      {tab === "bids" && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-slate-900">My Bids</h1>
          {loadingBids ? (
            <div className="flex items-center gap-2 text-slate-400"><Loader2 size={16} className="animate-spin" />Loading bids…</div>
          ) : bids.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Briefcase size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium">No bids submitted yet.</p>
              <button onClick={() => setTab("browse")} className="mt-3 text-[#0EA5A0] font-semibold hover:underline text-sm">Browse matched jobs →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {bids.map((b: any) => (
                <div key={b.id} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900 text-sm">{b.job?.title ?? "Job"}</p>
                      <Badge color={b.status === "accepted" ? "green" : b.status === "rejected" ? "red" : b.status === "countered" ? "navy" : "yellow"}>{b.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">{b.job?.family?.full_name ?? "Family"} · {b.job?.city ?? ""} · Submitted {new Date(b.created_at).toLocaleDateString("en-CA")}</p>
                    {b.note && <p className="text-xs text-slate-400 mt-1 italic">"{b.note}"</p>}
                    {b.status === "countered" && b.counter_amount && (
                      <p className="text-xs text-[#1B3A6B] font-semibold mt-1">Family counter-offer: <span className="font-mono">${b.counter_amount}/hr</span></p>
                    )}
                  </div>
                  <p className="text-xl font-bold text-[#1B3A6B] font-mono shrink-0">${b.amount}/hr</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Earnings ──────────────────────────────────────────────────────── */}
      {tab === "earnings" && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard icon={Banknote}   label="Total Gross"      value={`$${gross.toFixed(2)}`} color="#1B3A6B" />
            <StatCard icon={CreditCard} label="Platform Fees (15%)" value={`$${fee.toFixed(2)}`} color="#F59E0B" />
            <StatCard icon={TrendingUp} label="Net Payout"       value={`$${net.toFixed(2)}`}  color="#10B981" />
          </div>
          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] overflow-hidden">
            <div className="p-5 border-b border-[rgba(15,23,42,0.07)]"><h2 className="font-semibold text-slate-900">Shift Breakdown</h2></div>
            {loadingShifts ? (
              <div className="p-5 flex items-center gap-2 text-slate-400"><Loader2 size={16} className="animate-spin" />Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F2F5FA]">
                    <tr>{["Date","Hours","Rate","Gross","Fee (15%)","Net","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {shifts.filter((s: any) => s.status !== "active").map((s: any) => (
                      <tr key={s.id} className="border-t border-[rgba(15,23,42,0.07)] hover:bg-[#F2F5FA]/50 transition-colors">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{new Date(s.clock_in).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</td>
                        <td className="px-4 py-3 font-mono">{s.hours_worked?.toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono">${s.rate}/hr</td>
                        <td className="px-4 py-3 font-mono font-medium">${s.gross?.toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono text-amber-600">-${s.platform_fee?.toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono font-bold text-[#1B3A6B]">${s.net?.toFixed(2)}</td>
                        <td className="px-4 py-3"><Badge color={s.status === "paid" ? "green" : s.status === "approved" ? "teal" : "yellow"}>{s.status === "pending_approval" ? "Pending" : s.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {shifts.filter((s: any) => s.status !== "active").length === 0 && (
                  <p className="text-sm text-slate-400 p-5">No completed shifts yet. Clock in to start earning.</p>
                )}
              </div>
            )}
          </div>
          <div className="bg-[#F2F5FA] rounded-2xl p-5 border border-[rgba(15,23,42,0.10)] flex gap-3">
            <CreditCard size={16} className="text-[#1B3A6B] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">GetMeCare automatically charges your card on file a <strong>15% platform facilitation fee</strong> after each approved timesheet via Stripe. Charges appear within minutes of family approval.</p>
          </div>
        </div>
      )}

      {/* ── Notifications ─────────────────────────────────────────────────── */}
      {tab === "notifications" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
              <p className="text-slate-400 text-sm mt-1">Updates on bids, shifts, and your account.</p>
            </div>
            {unread > 0 && (
              <button
                onClick={async () => {
                  await markNotificationsRead(user.id);
                  setNotifications(p => p.map(n => ({ ...n, read: true })));
                  setUnread(0);
                }}
                className="text-xs text-[#0EA5A0] font-semibold hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Mail size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium">No notifications yet.</p>
              <p className="text-sm mt-1">You will be notified when bids are accepted, timesheets approved, or fees charged.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => {
                const colorMap: Record<string, string> = {
                  bid_accepted: "#10B981", shift_approved: "#0EA5A0", shift_paid: "#0EA5A0",
                  charge_failed: "#DC2626", verified: "#10B981", reinstated: "#0EA5A0",
                  clock_in_confirm: "#1B3A6B", timesheet_submitted: "#F59E0B", default: "#94a3b8",
                };
                const iconMap: Record<string, any> = {
                  bid_accepted: CheckCircle, shift_approved: CheckCircle, shift_paid: CheckCircle,
                  charge_failed: AlertCircle, verified: CheckCircle, reinstated: CheckCircle,
                  clock_in_confirm: Clock, timesheet_submitted: FileText, default: Bell,
                };
                const color = colorMap[n.type] ?? colorMap.default;
                const Icon  = iconMap[n.type]  ?? iconMap.default;
                return (
                  <div key={n.id} className={`bg-white rounded-2xl border p-5 flex gap-4 items-start transition-all ${n.read ? "border-[rgba(15,23,42,0.07)]" : "border-[#0EA5A0]/30 shadow-sm"}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                      <Icon size={17} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${n.read ? "text-slate-700" : "text-slate-900"}`}>{n.title}</p>
                        <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                          {new Date(n.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {n.message && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>}
                      {!n.read && <div className="w-2 h-2 rounded-full bg-[#0EA5A0] mt-2" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── My Profile ────────────────────────────────────────────────────── */}
      {tab === "profile" && (
        <div className="space-y-6 max-w-2xl">
          <div><h1 className="text-2xl font-bold text-slate-900">My Profile</h1><p className="text-slate-400 text-sm mt-1">Your public caregiver profile as families see it.</p></div>

          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900">Identity &amp; Verification Status</h2>
              <Badge color={user.verified ? "green" : "yellow"}>{user.verified ? <><CheckCircle size={11} />Verified</> : <><AlertCircle size={11} />Pending</>}</Badge>
            </div>
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[rgba(15,23,42,0.07)]">
              <div className="w-14 h-14 rounded-2xl bg-[#0EA5A0] flex items-center justify-center text-white text-2xl font-bold">{user.full_name.charAt(0)}</div>
              <div>
                <p className="font-bold text-slate-900 text-lg">{user.displayName ?? user.full_name}</p>
                <p className="text-sm text-slate-400">Legal name: {user.full_name}</p>
                {user.phone && <p className="text-sm text-slate-400">{user.phone}</p>}
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
            <ProfileRow label="Caregiving Role" value={pswLabel} />
            <ProfileRow label="Baseline Rate"   value={user.hourlyRate ? `$${user.hourlyRate}/hr` : undefined} />
            <ProfileRow label="Service Areas"   value={user.cities && user.cities.length > 0 ? user.cities : undefined} />
            <ProfileRow label="Languages"       value={user.languages && user.languages.length > 0 ? user.languages : undefined} />
          </div>

          {user.careTypes && user.careTypes.length > 0 && (
            <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Services Offered</h2>
              <div className="space-y-2">
                {user.careTypes.map(c => (
                  <div key={c} className="flex items-center gap-3 py-2 border-b border-[rgba(15,23,42,0.07)] last:border-0">
                    <CheckCircle size={14} className="text-[#0EA5A0] shrink-0" />
                    <p className="text-sm text-slate-700">{c}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Credentials &amp; Documents</h2>
              {!user.verified && <span className="text-xs text-amber-600 font-medium">Under admin review</span>}
            </div>
            {[
              { label: "Government-Issued Photo ID",             uploaded: user.govId   ?? false, hidden: false },
              { label: "PSW Certificate / Nursing Registration",  uploaded: user.pswCert ?? false, hidden: user.pswRole !== "psw" },
              { label: "Vulnerable Sector Check (VSC)",           uploaded: user.vsc     ?? false, hidden: false },
              { label: "First Aid / CPR Certification",           uploaded: user.firstAid ?? false, hidden: false },
            ].filter(d => !d.hidden).map(doc => (
              <div key={doc.label} className="flex items-center justify-between py-3 border-b border-[rgba(15,23,42,0.07)] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${doc.uploaded ? "bg-emerald-500" : "bg-slate-200"}`} />
                  <p className="text-sm text-slate-900">{doc.label}</p>
                </div>
                <Badge color={doc.uploaded ? "green" : "gray"}>{doc.uploaded ? "Uploaded" : "Missing"}</Badge>
              </div>
            ))}
            {!user.verified && (
              <div className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-xs text-amber-800 leading-relaxed">Admin review within 48 business hours. Your profile goes live once verified.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Payment &amp; Billing</h2>
            <div className="flex items-center justify-between py-3 border-b border-[rgba(15,23,42,0.07)]">
              <div className="flex items-center gap-3"><CreditCard size={16} className="text-[#1B3A6B]" /><p className="text-sm text-slate-900">Card on File</p></div>
              {user.cardLinked ? <Badge color="green"><CheckCircle size={11} />•••• 4242</Badge> : <Badge color="yellow"><AlertCircle size={11} />Not linked</Badge>}
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3"><TrendingUp size={16} className="text-[#1B3A6B]" /><p className="text-sm text-slate-900">Platform Fee</p></div>
              <p className="text-sm font-semibold text-slate-900">15% per approved shift (via Stripe)</p>
            </div>
          </div>
        </div>
      )}

    </Shell>
  );
}
