import { useState, useEffect } from "react";
import {
  Home, Plus, Briefcase, ClipboardList, Bell, UserCheck,
  CheckCircle, XCircle, ChevronDown, Users, CreditCard,
  Clock, AlertCircle, TrendingUp, Loader2, Mail, MessageSquare,
} from "lucide-react";
import type { AppUser } from "./types";
import { Shell, StatCard, Badge } from "./shared";
import {
  postJob, fetchFamilyJobs, fetchBidsForJob,
  fetchFamilyShifts, approveShift, disputeShift,
  acceptBid, counterBid,
  fetchNotifications, markNotificationsRead,
  type Job, type Notification,
} from "./lib/db";

const INP =
  "w-full px-4 py-2.5 rounded-xl bg-[#F2F5FA] border border-[rgba(15,23,42,0.10)] " +
  "text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/40 focus:border-[#0EA5A0] transition";

// ─── Profile row for display ──────────────────────────────────────────────────
function ProfileRow({ label, value }: { label: string; value?: string | string[] }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div className="flex items-start justify-between py-3 border-b border-[rgba(15,23,42,0.07)] last:border-0 gap-4">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide shrink-0 mt-0.5">{label}</p>
      <p className="text-sm text-slate-900 text-right">{display}</p>
    </div>
  );
}

export function FamilyDash({ user, onSignOut, onNavigate, initialTab }: { user: AppUser; onSignOut: () => void; onNavigate?: (v: string) => void; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab ?? "overview");

  // Live data
  const [jobs, setJobs] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [bidsMap, setBidsMap] = useState<Record<string, any[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  // Job form state
  const [form, setForm] = useState({
    title: "", care_type: "PSW", city: "Toronto",
    postal_prefix: user.postal ?? "", hours: "", schedule: "", rate: "",
  });
  const [posting, setPosting] = useState(false);
  const [postErr, setPostErr] = useState("");

  // Counter bid state
  const [counterJobBid, setCounterJobBid] = useState<string | null>(null);
  const [counterAmt, setCounterAmt] = useState("");

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const nav = [
    { icon: Home,          label: "Overview",      id: "overview",    href: "/dashboard/employer" },
    { icon: Plus,          label: "Post a Job",    id: "post",        href: "/dashboard/employer/post-job" },
    { icon: Briefcase,     label: "My Jobs & Bids",id: "jobs",        href: "/dashboard/employer/bids" },
    { icon: ClipboardList, label: "Timesheets",    id: "timesheets",  href: "/dashboard/employer/timesheets" },
    { icon: MessageSquare, label: "Messages",      id: "chat",        href: "/dashboard/chat" },
    { icon: Bell,          label: unread > 0 ? `Notifications (${unread})` : "Notifications", id: "notifications" },
    { icon: UserCheck,     label: "My Profile",    id: "profile"       },
  ];

  // Load jobs
  useEffect(() => {
    setLoadingJobs(true);
    fetchFamilyJobs(user.id).then(({ data }) => { setJobs(data); setLoadingJobs(false); });
  }, [user.id]);

  // Load shifts (timesheets)
  useEffect(() => {
    setLoadingShifts(true);
    fetchFamilyShifts(user.id).then(({ data }) => { setShifts(data); setLoadingShifts(false); });
  }, [user.id]);

  // Load notifications
  useEffect(() => {
    fetchNotifications(user.id).then(({ data, unread: u }) => { setNotifications(data); setUnread(u); });
  }, [user.id]);

  // Load bids when a job is expanded
  const expandJob = async (jobId: string) => {
    if (expanded === jobId) { setExpanded(null); return; }
    setExpanded(jobId);
    if (!bidsMap[jobId]) {
      const { data } = await fetchBidsForJob(jobId);
      setBidsMap(p => ({ ...p, [jobId]: data }));
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault(); setPosting(true); setPostErr("");
    const { error } = await postJob({ ...form, rate: Number(form.rate), postal_prefix: form.postal_prefix.slice(0, 3).toUpperCase() });
    if (error) { setPostErr(error.message); setPosting(false); return; }
    const { data } = await fetchFamilyJobs(user.id);
    setJobs(data); setPosting(false);
    setForm({ title: "", care_type: "PSW", city: "Toronto", postal_prefix: user.postal ?? "", hours: "", schedule: "", rate: "" });

    setTab("jobs");
  };

  const handleAcceptBid = async (bidId: string, jobId: string) => {
    setActionMsg("Accepting bid…");
    await acceptBid(bidId, jobId);
    const { data } = await fetchFamilyJobs(user.id);
    setJobs(data);
    const { data: bids } = await fetchBidsForJob(jobId);
    setBidsMap(p => ({ ...p, [jobId]: bids }));
    setActionMsg("Bid accepted! Job marked as filled.");
    setTimeout(() => setActionMsg(""), 3000);
  };

  const handleCounterBid = async (bidId: string) => {
    if (!counterAmt) return;
    setActionMsg("Sending counter-offer…");
    await counterBid(bidId, Number(counterAmt));
    setCounterJobBid(null); setCounterAmt("");
    setActionMsg("Counter-offer sent.");
    setTimeout(() => setActionMsg(""), 3000);
  };

  const handleApprove = async (shiftId: string) => {
    setActionMsg("Approving timesheet and triggering platform fee charge…");
    const result = await approveShift(shiftId, user.id);
    const { data } = await fetchFamilyShifts(user.id);
    setShifts(data);
    if (result.charged) setActionMsg(`Approved! 15% platform fee charged to caregiver's card. ✓`);
    else if (result.suspended) setActionMsg(`Approved, but caregiver's card charge failed. Profile suspended until balance cleared.`);
    else setActionMsg("Timesheet approved.");
    setTimeout(() => setActionMsg(""), 5000);
  };

  const handleDispute = async (shiftId: string) => {
    setActionMsg("Submitting dispute…");
    await disputeShift(shiftId);
    const { data } = await fetchFamilyShifts(user.id);
    setShifts(data);
    setActionMsg("Shift disputed. Our team will review within 24 hours.");
    setTimeout(() => setActionMsg(""), 4000);
  };

  const MOBILITY: Record<string, string> = {
    independent: "Fully independent",
    assisted: "Mobile with assistance",
    wheelchair: "Wheelchair user",
    bedbound: "Bedbound",
  };
  const FREQUENCY: Record<string, string> = {
    fulltime: "Full-time / Daily",
    parttime: "Part-time",
    onetime: "One-time / Respite",
  };

  const pendingShifts = shifts.filter(s => s.status === "pending_approval");

  return (
    <Shell user={user} nav={nav} tab={tab} setTab={setTab} onSignOut={onSignOut} onNavigate={onNavigate}>

      {/* Global action message */}
      {actionMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B3A6B] text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-sm">
          {actionMsg}
        </div>
      )}

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.full_name.split(" ")[0]}</h1>
            <p className="text-slate-400 text-sm mt-1">Here's what's happening with your care arrangements.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Briefcase}     label="Active Jobs"      value={jobs.filter(j => j.status === "open").length}            color="#1B3A6B" />
            <StatCard icon={Users}         label="Total Bids"       value={jobs.reduce((a, j) => a + (j.bid_count ?? 0), 0)}        color="#0EA5A0" />
            <StatCard icon={ClipboardList} label="Pending Approval" value={pendingShifts.length} sub="timesheets"                   color="#F59E0B" />
            <StatCard icon={CheckCircle}   label="Shifts Approved"  value={shifts.filter(s => ["approved","paid"].includes(s.status)).length} color="#10B981" />
          </div>

          {/* Pending timesheet approvals */}
          {pendingShifts.length > 0 && (
            <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5">
              <h2 className="font-semibold text-slate-900 mb-4">⚡ Pending Timesheet Approvals</h2>
              <div className="space-y-3">
                {pendingShifts.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{s.caregiver?.display_name ?? s.caregiver?.full_name} · {new Date(s.clock_in).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(s.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {s.clock_out ? new Date(s.clock_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} · <span className="font-mono">{s.hours_worked?.toFixed(2)} hrs · ${s.gross?.toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-[#0EA5A0] font-medium mt-0.5">Platform fee to be charged: <span className="font-mono">${s.platform_fee?.toFixed(2)}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(s.id)} className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"><CheckCircle size={13} />Approve &amp; Charge</button>
                      <button onClick={() => handleDispute(s.id)} className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"><XCircle size={13} />Dispute</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active jobs summary */}
          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">My Active Jobs</h2>
              <button onClick={() => setTab("post")} className="text-xs text-[#0EA5A0] font-semibold flex items-center gap-1 hover:underline"><Plus size={13} />Post a job</button>
            </div>
            {loadingJobs ? <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={16} className="animate-spin" />Loading…</div> :
              jobs.filter(j => j.status === "open").slice(0, 3).map(j => (
                <div key={j.id} className="flex items-center justify-between py-3 border-b border-[rgba(15,23,42,0.07)] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{j.title}</p>
                    <p className="text-xs text-slate-400">{j.city} · {j.hours} · <span className="font-mono">${j.rate}/hr</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="green">Open</Badge>
                  </div>
                </div>
              ))
            }
            {!loadingJobs && jobs.filter(j => j.status === "open").length === 0 && (
              <p className="text-sm text-slate-400">No active jobs yet. <button onClick={() => setTab("post")} className="text-[#0EA5A0] underline">Post your first job →</button></p>
            )}
          </div>
        </div>
      )}

      {/* ── Post a Job ────────────────────────────────────────────────────── */}
      {tab === "post" && (
        <div className="max-w-lg space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Post a Care Job</h1>
            <p className="text-slate-400 text-sm mt-1">Verified PSWs in your area will be algorithmically matched and can submit bids.</p>
          </div>
          <form onSubmit={handlePostJob} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">Job Title</label>
              <input type="text" required placeholder="e.g., Daily Companion Care" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={INP} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">City</label>
                <select value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={INP}>
                  {["Toronto","Mississauga","Ottawa","Brampton","Markham","Hamilton"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Postal Code (first 3)</label>
                <input type="text" required placeholder="e.g., M5V" maxLength={3} value={form.postal_prefix} onChange={e => setForm(p => ({ ...p, postal_prefix: e.target.value.toUpperCase() }))} className={INP} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">Care Type</label>
              <select value={form.care_type} onChange={e => setForm(p => ({ ...p, care_type: e.target.value }))} className={INP}>
                {["PSW","Companion Care","Overnight Care","Post-Surgery Support","Specialized (Dementia/Palliative)"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Hours Needed</label>
                <select required value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} className={INP}>
                  <option value="">Select hours…</option>
                  {["1–2 hrs/day","2–4 hrs/day","4–6 hrs/day","6–8 hrs/day","8 hrs/day (full day)","Live-in (24 hr)","Flexible / As needed"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">Schedule</label>
                <select required value={form.schedule} onChange={e => setForm(p => ({ ...p, schedule: e.target.value }))} className={INP}>
                  <option value="">Select schedule…</option>
                  {["Monday – Friday","Monday – Saturday","Daily (7 days)","Weekdays only","Weekends only","Saturday & Sunday","Mornings only","Afternoons only","Evenings only","Overnights","Rotating / Flexible"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">Offered Rate ($/hr)</label>
              <select required value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} className={INP}>
                <option value="">Select rate…</option>
                {["18","20","22","24","25","26","28","30","32","35","38","40","45","50"].map(r => (
                  <option key={r} value={r}>${r}/hr</option>
                ))}
              </select>
            </div>
            {postErr && <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl border border-red-100"><AlertCircle size={13} />{postErr}</div>}
            <button type="submit" disabled={posting} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm hover:bg-[#0EA5A0] transition-colors disabled:opacity-50">
              {posting ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" />Posting…</span> : "Post Job & Match Caregivers →"}
            </button>
          </form>
        </div>
      )}

      {/* ── My Jobs + Bids ────────────────────────────────────────────────── */}
      {tab === "jobs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
              <p className="text-slate-400 text-sm mt-1">Manage postings and review caregiver bids.</p>
            </div>
            <button onClick={() => setTab("post")} className="flex items-center gap-2 bg-[#1B3A6B] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#0EA5A0] transition-colors"><Plus size={15} />Post Job</button>
          </div>

          {loadingJobs ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2"><Loader2 size={20} className="animate-spin" />Loading jobs…</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Briefcase size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium">No jobs posted yet.</p>
              <button onClick={() => setTab("post")} className="mt-3 text-[#0EA5A0] font-semibold hover:underline text-sm">Post your first job →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] overflow-hidden">
                  <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => expandJob(job.id)}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#E8EEF8] flex items-center justify-center shrink-0"><Briefcase size={17} className="text-[#1B3A6B]" /></div>
                      <div>
                        <p className="font-semibold text-slate-900">{job.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{job.city} · {job.care_type} · {job.hours} · <span className="font-mono">${job.rate}/hr</span></p>
                        <p className="text-xs text-slate-400">Posted {new Date(job.created_at).toLocaleDateString("en-CA")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={job.status === "open" ? "green" : "gray"}>{job.status === "open" ? "Open" : "Filled"}</Badge>
                      <ChevronDown size={15} className={`text-slate-400 transition-transform ${expanded === job.id ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {expanded === job.id && (
                    <div className="border-t border-[rgba(15,23,42,0.07)] p-5 bg-[#F2F5FA]">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Bids Received</p>
                      {!bidsMap[job.id] ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" />Loading bids…</div>
                      ) : bidsMap[job.id].length === 0 ? (
                        <p className="text-sm text-slate-400">No bids yet — verified caregivers in <strong>{job.postal_prefix}XX</strong> will be notified and can submit bids.</p>
                      ) : (
                        <div className="space-y-3">
                          {bidsMap[job.id].map(bid => (
                            <div key={bid.id} className="bg-white rounded-xl border border-[rgba(15,23,42,0.10)] p-4 flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#0EA5A0] flex items-center justify-center text-white text-sm font-bold shrink-0">
                                  {(bid.caregiver?.display_name ?? bid.caregiver?.full_name ?? "?").charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{bid.caregiver?.display_name ?? bid.caregiver?.full_name}</p>
                                  <p className="text-xs text-slate-500">{bid.caregiver?.psw_role === "psw" ? "Certified PSW" : "Companion"} · ★ {bid.caregiver?.rating?.toFixed(1) ?? "—"}</p>
                                  {bid.note && <p className="text-xs text-slate-400 mt-1 italic">"{bid.note}"</p>}
                                  <Badge color={bid.status === "accepted" ? "green" : bid.status === "rejected" ? "red" : bid.status === "countered" ? "navy" : "yellow"}>{bid.status}</Badge>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-lg font-bold text-[#1B3A6B] font-mono">${bid.amount}/hr</p>
                                {bid.counter_amount && <p className="text-xs text-slate-500 font-mono">Counter: ${bid.counter_amount}/hr</p>}
                                {bid.status === "pending" && (
                                  <div className="flex gap-2 mt-2">
                                    <button onClick={() => handleAcceptBid(bid.id, job.id)} className="bg-[#1B3A6B] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#0EA5A0] transition-colors">Accept</button>
                                    <button onClick={() => setCounterJobBid(bid.id)} className="border border-[rgba(15,23,42,0.12)] text-xs px-3 py-1.5 rounded-lg hover:bg-[#F2F5FA] transition-colors">Counter</button>
                                  </div>
                                )}
                                {counterJobBid === bid.id && (
                                  <div className="flex gap-2 mt-2">
                                    <input type="number" placeholder={String(bid.amount)} value={counterAmt} onChange={e => setCounterAmt(e.target.value)} className="w-20 px-2 py-1.5 rounded-lg bg-white border border-[rgba(15,23,42,0.10)] text-xs" />
                                    <button onClick={() => handleCounterBid(bid.id)} className="bg-[#0EA5A0] text-white text-xs px-3 py-1.5 rounded-lg">Send</button>
                                    <button onClick={() => setCounterJobBid(null)} className="text-slate-400 text-xs px-2">✕</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Timesheets ────────────────────────────────────────────────────── */}
      {tab === "timesheets" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Timesheets</h1>
            <p className="text-slate-400 text-sm mt-1">Approve caregiver hours to trigger the automated 15% platform fee charge.</p>
          </div>
          {loadingShifts ? (
            <div className="flex items-center gap-2 text-slate-400 py-8"><Loader2 size={18} className="animate-spin" />Loading timesheets…</div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ClipboardList size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium">No timesheets yet.</p>
              <p className="text-sm mt-1">They will appear here once a caregiver clocks out of a shift.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shifts.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900 text-sm">{s.caregiver?.display_name ?? s.caregiver?.full_name}</p>
                      <Badge color={s.status === "paid" ? "green" : s.status === "approved" ? "teal" : s.status === "disputed" ? "red" : "yellow"}>
                        {s.status === "pending_approval" ? "Awaiting approval" : s.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(s.clock_in).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} · {new Date(s.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {s.clock_out ? new Date(s.clock_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <span className="font-mono text-xs text-slate-500">{s.hours_worked?.toFixed(2)} hrs</span>
                      <span className="font-mono text-xs font-semibold text-slate-900">${s.gross?.toFixed(2)} gross</span>
                      <span className="font-mono text-xs text-amber-600">Fee: ${s.platform_fee?.toFixed(2)}</span>
                      {s.stripe_charge_id && <span className="font-mono text-xs text-emerald-600">Charged ✓</span>}
                      {s.stripe_status === "failed" && <span className="text-xs text-red-600 font-medium">Charge failed</span>}
                    </div>
                  </div>
                  {s.status === "pending_approval" && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleApprove(s.id)} className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors font-semibold"><CheckCircle size={13} />Approve &amp; Charge</button>
                      <button onClick={() => handleDispute(s.id)} className="flex items-center gap-1.5 border border-red-200 text-red-600 text-xs px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"><XCircle size={13} />Dispute</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Notifications ─────────────────────────────────────────────────── */}
      {tab === "notifications" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
              <p className="text-slate-400 text-sm mt-1">Real-time updates from your care arrangements.</p>
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
              <p className="text-sm mt-1">You will receive notifications when caregivers bid, clock in, or submit timesheets.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => {
                const colorMap: Record<string, string> = {
                  clock_in: "#0EA5A0", timesheet_ready: "#F59E0B", new_bid: "#1B3A6B",
                  shift_approved_fam: "#10B981", default: "#94a3b8",
                };
                const iconMap: Record<string, any> = {
                  clock_in: Clock, timesheet_ready: ClipboardList, new_bid: Users,
                  shift_approved_fam: CheckCircle, default: Bell,
                };
                const color = colorMap[n.type] ?? colorMap.default;
                const Icon  = iconMap[n.type] ?? iconMap.default;
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
          <div><h1 className="text-2xl font-bold text-slate-900">My Profile</h1><p className="text-slate-400 text-sm mt-1">Your registration details and care preferences on file.</p></div>
          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-6">
            <div className="flex items-center justify-between mb-5"><h2 className="font-semibold text-slate-900">Account Details</h2><Badge color="green"><CheckCircle size={11} />Active</Badge></div>
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[rgba(15,23,42,0.07)]">
              <div className="w-14 h-14 rounded-2xl bg-[#1B3A6B] flex items-center justify-center text-white text-2xl font-bold">{user.full_name.charAt(0)}</div>
              <div><p className="font-bold text-slate-900 text-lg">{user.full_name}</p><p className="text-sm text-slate-400">{user.email}</p>{user.phone && <p className="text-sm text-slate-400">{user.phone}</p>}</div>
            </div>
            <ProfileRow label="Relationship" value={user.relationship ? ({ self: "Seeking care for myself", parent: "Parent / family member", guardian: "Legal guardian / power of attorney" } as any)[user.relationship] : undefined} />
            <ProfileRow label="Account Status" value="Active · Vetting fee paid · $39 CAD" />
          </div>
          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Care Location</h2>
            <ProfileRow label="Street Address" value={user.streetAddress} />
            <ProfileRow label="City"           value={user.city} />
            <ProfileRow label="Postal Code"    value={user.postal} />
          </div>
          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Care Recipient Profile</h2>
            <ProfileRow label="Age"            value={user.recipientAge} />
            <ProfileRow label="Language"       value={user.language} />
            <ProfileRow label="Mobility Level" value={user.mobility ? MOBILITY[user.mobility] : undefined} />
            {user.services && user.services.length > 0 && (
              <div className="py-3 border-b border-[rgba(15,23,42,0.07)]">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Services Required</p>
                <div className="flex flex-wrap gap-2">{user.services.map(s => <span key={s} className="text-xs bg-[#E8EEF8] text-[#1B3A6B] px-2.5 py-1 rounded-lg font-medium">{s.split("—")[0].trim()}</span>)}</div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Schedule &amp; Budget</h2>
            <ProfileRow label="Frequency"      value={user.frequency ? FREQUENCY[user.frequency] : undefined} />
            <ProfileRow label="Preferred Shifts" value={user.shifts && user.shifts.length > 0 ? user.shifts : undefined} />
            <ProfileRow label="Hourly Budget"  value={user.budget ? `$${user.budget}/hr preferred` : undefined} />
          </div>
        </div>
      )}

    </Shell>
  );
}
