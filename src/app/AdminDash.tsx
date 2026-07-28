import { useState, useEffect } from "react";
import {
  BarChart3, UserCheck, Briefcase, CreditCard, Users,
  CheckCircle, XCircle, AlertCircle, TrendingUp,
  FileText, RefreshCcw, Loader2, Play, FlaskConical,
  Database, Mail, Zap, Shield, Trash2, Search,
  ChevronDown, ChevronUp,
} from "lucide-react";
import type { AppUser } from "./types";
import { Shell, StatCard, Badge } from "./shared";
import { supabase } from "./supabase";
import { UserPlus } from "lucide-react";
import {
  fetchPendingCaregivers, verifyCaregiverAdmin,
  suspendCaregiverAdmin, reinstateCaregiver,
  fetchAllShiftsAdmin, fetchOpenJobs,
  runBookingSimulation, runDatabaseSetup,
  fetchAllUsers, suspendUserAdmin, reinstateUserAdmin,
  promoteToAdmin, deleteUserAdmin,
} from "./lib/db";
import { EdgeFunctionTest } from "./components/EdgeFunctionTest";

export function AdminDash({ user, onSignOut }: { user: AppUser; onSignOut: () => void }) {
  const [tab, setTab] = useState("overview");

  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [allUsers,   setAllUsers]   = useState<any[]>([]);
  const [shifts,     setShifts]     = useState<any[]>([]);
  const [jobs,       setJobs]       = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState<string | null>(null);
  const [actionMsg,  setActionMsg]  = useState("");
  const [confirmId,  setConfirmId]  = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Invite / create user state
  const [showInvite,   setShowInvite]   = useState(false);
  const [inviteEmail,  setInviteEmail]  = useState("");
  const [inviteName,   setInviteName]   = useState("");
  const [inviteRole,   setInviteRole]   = useState<"family"|"caregiver"|"admin">("family");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteResult,  setInviteResult]  = useState("");

  // DB Setup state
  const [setupRunning, setSetupRunning] = useState(false);
  const [setupResult,  setSetupResult]  = useState<{ success: boolean; errors: string[] } | null>(null);

  // Email test state
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult,  setEmailResult]  = useState("");

  // Simulation state
  const [simFamilyId,    setSimFamilyId]    = useState("");
  const [simCaregiverId, setSimCaregiverId] = useState("");
  const [simRunning,     setSimRunning]     = useState(false);
  const [simResult,      setSimResult]      = useState<any>(null);

  const nav = [
    { icon: BarChart3,    label: "Overview",          id: "overview"    },
    { icon: Users,        label: "All Users",          id: "users"       },
    { icon: UserCheck,    label: "Verify Caregivers",  id: "verify"      },
    { icon: Briefcase,    label: "Job Posts",          id: "jobs"        },
    { icon: CreditCard,   label: "Billing",            id: "billing"     },
    { icon: FlaskConical, label: "Setup & Simulation", id: "simulation"  },
  ];

  const flash = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(""), 3500); };

  const reload = async () => {
    setLoading(true); setLoadError(null);
    const [cg, sh, jb, au] = await Promise.all([
      fetchPendingCaregivers(),
      fetchAllShiftsAdmin(),
      fetchOpenJobs(),
      fetchAllUsers(),
    ]);
    // Only surface errors that aren't schema-cache / table-missing issues
    const isSchemaErr = (msg?: string) =>
      !msg || msg.includes("does not exist") || msg.includes("relationship") || msg.includes("schema cache") || msg.includes("column");
    const errs = [
      cg.error && !isSchemaErr(cg.error.message) && `Caregivers: ${cg.error.message}`,
      sh.error && !isSchemaErr(sh.error.message) && `Shifts: ${sh.error.message}`,
      jb.error && !isSchemaErr(jb.error.message) && `Jobs: ${jb.error.message}`,
      au.error && !isSchemaErr(au.error.message) && `Users: ${au.error.message}`,
    ].filter(Boolean) as string[];
    if (errs.length) setLoadError(errs.join(" · "));
    setCaregivers(cg.data);
    setShifts(sh.data);
    setJobs(jb.data);
    setAllUsers(au.data);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  // ── Caregiver actions ──────────────────────────────────────────────────────
  const verify = async (id: string) => {
    await verifyCaregiverAdmin(id);
    setCaregivers(p => p.map(c => c.id === id ? { ...c, verified: true } : c));
    setAllUsers(p => p.map(u => u.id === id ? { ...u, verified: true } : u));
    flash("Caregiver verified — profile is now live in the directory.");
  };

  const suspend = async (id: string) => {
    await suspendCaregiverAdmin(id);
    setCaregivers(p => p.map(c => c.id === id ? { ...c, suspended: true } : c));
    setAllUsers(p => p.map(u => u.id === id ? { ...u, suspended: true } : u));
    flash("Profile suspended and hidden from directory.");
  };

  const reinstate = async (id: string) => {
    await reinstateCaregiver(id);
    setCaregivers(p => p.map(c => c.id === id ? { ...c, suspended: false } : c));
    setAllUsers(p => p.map(u => u.id === id ? { ...u, suspended: false } : u));
    flash("Profile reinstated — live again.");
  };

  // ── All-user actions ───────────────────────────────────────────────────────
  const suspendUser = async (id: string) => {
    await suspendUserAdmin(id);
    setAllUsers(p => p.map(u => u.id === id ? { ...u, suspended: true } : u));
    flash("User account suspended.");
    setConfirmId(null);
  };

  const reinstateUser = async (id: string) => {
    await reinstateUserAdmin(id);
    setAllUsers(p => p.map(u => u.id === id ? { ...u, suspended: false } : u));
    flash("User account reinstated.");
  };

  const promote = async (id: string) => {
    await promoteToAdmin(id);
    setAllUsers(p => p.map(u => u.id === id ? { ...u, role: "admin" } : u));
    flash("User promoted to admin.");
    setConfirmId(null);
  };

  const deleteUser = async (id: string) => {
    await deleteUserAdmin(id);
    setAllUsers(p => p.filter(u => u.id !== id));
    flash("User profile deleted.");
    setConfirmId(null);
  };

  const sendInvite = async () => {
    if (!inviteEmail) return;
    setInviteSending(true); setInviteResult("");
    const { error } = await supabase.auth.signInWithOtp({
      email: inviteEmail,
      options: {
        data: { full_name: inviteName, role: inviteRole },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setInviteResult("Error: " + error.message);
    } else {
      setInviteResult("Magic link sent to " + inviteEmail + ". They can click it to set their password and access the platform.");
      setInviteEmail(""); setInviteName("");
      setTimeout(() => { setShowInvite(false); setInviteResult(""); }, 3000);
    }
    setInviteSending(false);
  };

  const pendingVerification = caregivers.filter(c => !c.verified && !c.suspended);
  const verified            = caregivers.filter(c => c.verified && !c.suspended);
  const suspendedList       = caregivers.filter(c => c.suspended);
  const totalRevenue        = shifts.filter(s => s.status === "paid").reduce((a: number, s: any) => a + (s.platform_fee ?? 0), 0);
  const failedCharges       = shifts.filter(s => s.stripe_status === "failed");

  const filteredUsers = allUsers.filter(u => {
    const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
    const q = userSearch.toLowerCase();
    const matchSearch = !q || (u.full_name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q) || (u.city ?? "").toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  return (
    <Shell user={user} nav={nav} tab={tab} setTab={setTab} onSignOut={onSignOut}>

      {/* Toast */}
      {actionMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B3A6B] text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-sm">
          {actionMsg}
        </div>
      )}

      {/* RLS / DB error banner */}
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Database query failed — RLS is likely blocking admin reads.</p>
              <p className="text-xs text-red-600 mt-1 font-mono">{loadError}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-red-100 text-xs text-red-700 leading-relaxed">
            <strong>Fix:</strong> Go to <strong>Supabase → SQL Editor</strong> and run:<br />
            <code className="block mt-1 bg-red-50 px-2 py-1 rounded font-mono text-red-800">
              ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
            </code>
            Then click <button onClick={reload} className="underline font-semibold">Refresh</button> here.
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <p className="font-semibold text-slate-900 mb-1">
              {confirmAction === "delete" ? "Delete this profile?" : confirmAction === "promote" ? "Promote to admin?" : "Suspend this user?"}
            </p>
            <p className="text-sm text-slate-400 mb-5">
              {confirmAction === "delete"
                ? "This removes the profile from the platform. The auth account is preserved."
                : confirmAction === "promote"
                ? "They will have full admin access to this panel."
                : "The user will be blocked from the platform until reinstated."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirmAction === "delete") deleteUser(confirmId);
                  else if (confirmAction === "promote") promote(confirmId);
                  else suspendUser(confirmId);
                }}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${confirmAction === "delete" ? "bg-red-600 hover:bg-red-700" : confirmAction === "promote" ? "bg-[#1B3A6B] hover:bg-[#0EA5A0]" : "bg-red-600 hover:bg-red-700"}`}
              >
                {confirmAction === "delete" ? "Delete" : confirmAction === "promote" ? "Promote" : "Suspend"}
              </button>
              <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Overview ────────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
              <p className="text-slate-400 text-sm mt-1">Live platform health.</p>
            </div>
            <button onClick={reload} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#1B3A6B] transition-colors">
              <RefreshCcw size={13} />Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 py-8"><Loader2 size={18} className="animate-spin" />Loading…</div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users}       label="Total Users"        value={allUsers.length}                                       color="#1B3A6B" />
                <StatCard icon={UserCheck}   label="Verified Caregivers" value={verified.length}                                      color="#10B981" />
                <StatCard icon={AlertCircle} label="Pending Review"      value={pendingVerification.length}                           color="#F59E0B" />
                <StatCard icon={XCircle}     label="Suspended Accounts"  value={allUsers.filter(u => u.suspended).length}            color="#DC2626" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <StatCard icon={Briefcase}   label="Open Job Posts"    value={jobs.filter(j => j.status === "open").length}          color="#0EA5A0" />
                <StatCard icon={TrendingUp}  label="Platform Revenue"  value={`$${totalRevenue.toFixed(2)}`} sub="from 15% Stripe fees" color="#8B5CF6" />
                <StatCard icon={CreditCard}  label="Failed Charges"    value={failedCharges.length}                                  color="#DC2626" />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Users by Role</p>
                  {["family","caregiver","admin"].map(role => {
                    const count = allUsers.filter(u => u.role === role).length;
                    const pct = allUsers.length ? Math.round(count / allUsers.length * 100) : 0;
                    return (
                      <div key={role} className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-slate-700">{role}</span>
                          <span className="font-mono text-slate-500">{count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: role === "caregiver" ? "#0EA5A0" : role === "family" ? "#1B3A6B" : "#8B5CF6" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="sm:col-span-2 bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Recent Activity</p>
                  {shifts.slice(0, 5).map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[rgba(15,23,42,0.07)] last:border-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.status === "paid" ? "#10B98115" : s.stripe_status === "failed" ? "#DC262615" : "#F59E0B15" }}>
                        {s.status === "paid" ? <CheckCircle size={12} className="text-emerald-600" /> : s.stripe_status === "failed" ? <XCircle size={12} className="text-red-600" /> : <CreditCard size={12} className="text-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">
                          <span className="font-semibold">{s.caregiver?.full_name ?? "Caregiver"}</span>
                          {s.platform_fee ? ` · $${Number(s.platform_fee).toFixed(2)} fee` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(s.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</span>
                    </div>
                  ))}
                  {shifts.length === 0 && <p className="text-sm text-slate-400">No shift activity yet.</p>}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Invite Modal ──────────────────────────────────────────────────────── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">Invite / Add User</p>
              <button onClick={() => { setShowInvite(false); setInviteResult(""); }} className="text-slate-400 hover:text-slate-700"><XCircle size={18} /></button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">Sends a magic-link email. The user clicks it to create their password and access the platform with the role you assign.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input type="text" placeholder="Jane Smith" value={inviteName} onChange={e => setInviteName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F2F5FA] border border-[rgba(15,23,42,0.10)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/40 focus:border-[#0EA5A0] transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input type="email" placeholder="jane@email.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-[#F2F5FA] border border-[rgba(15,23,42,0.10)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/40 focus:border-[#0EA5A0] transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <div className="flex gap-2">
                  {(["family","caregiver","admin"] as const).map(r => (
                    <button key={r} onClick={() => setInviteRole(r)} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${inviteRole === r ? "bg-[#1B3A6B] text-white" : "bg-[#F2F5FA] text-slate-600 hover:bg-slate-200"}`}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
            {inviteResult && (
              <div className={`rounded-xl p-3 text-xs leading-relaxed ${inviteResult.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                {inviteResult}
              </div>
            )}
            <button
              disabled={!inviteEmail || inviteSending}
              onClick={sendInvite}
              className="w-full py-2.5 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm hover:bg-[#0EA5A0] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {inviteSending ? <><Loader2 size={14} className="animate-spin" />Sending…</> : <><Mail size={14} />Send Invite Link</>}
            </button>
          </div>
        </div>
      )}

      {/* ── All Users ─────────────────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">All Users</h1>
              <p className="text-slate-400 text-sm mt-0.5">Manage every account on the platform — suspend, reinstate, promote or delete.</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#1B3A6B] text-white text-xs rounded-xl font-semibold hover:bg-[#0EA5A0] transition-colors">
                <UserPlus size={13} />Add User
              </button>
              <button onClick={reload} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#1B3A6B] transition-colors">
                <RefreshCcw size={13} />Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, email or city…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-[rgba(15,23,42,0.10)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/40 focus:border-[#0EA5A0] transition"
              />
            </div>
            <div className="flex gap-1.5">
              {["all","family","caregiver","admin"].map(r => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${userRoleFilter === r ? "bg-[#1B3A6B] text-white" : "bg-white border border-[rgba(15,23,42,0.10)] text-slate-600 hover:border-[#1B3A6B]"}`}
                >
                  {r === "all" ? `All (${allUsers.length})` : `${r.charAt(0).toUpperCase() + r.slice(1)} (${allUsers.filter(u => u.role === r).length})`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-400"><Loader2 size={16} className="animate-spin" />Loading…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>No users match your filter.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u: any) => {
                const isExpanded = expandedUser === u.id;
                return (
                  <div key={u.id} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] overflow-hidden">
                    <div className="p-4 flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 text-sm ${u.role === "caregiver" ? "bg-[#0EA5A0]" : u.role === "admin" ? "bg-[#8B5CF6]" : "bg-[#1B3A6B]"}`}>
                        {(u.display_name ?? u.full_name ?? u.email ?? "?").charAt(0).toUpperCase()}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 text-sm truncate">{u.full_name ?? u.email}</p>
                          <Badge color={u.role === "caregiver" ? "teal" : u.role === "admin" ? "purple" : "blue"}>{u.role}</Badge>
                          {u.verified   && <Badge color="green"><CheckCircle size={9} />Verified</Badge>}
                          {u.suspended  && <Badge color="red"><XCircle size={9} />Suspended</Badge>}
                          {!u.verified && u.role === "caregiver" && !u.suspended && <Badge color="yellow">Pending</Badge>}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{u.email} {u.city ? `· ${u.city}` : ""}</p>
                      </div>
                      {/* Quick actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {u.role === "caregiver" && !u.verified && !u.suspended && (
                          <button onClick={() => verify(u.id)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                            Approve
                          </button>
                        )}
                        {u.suspended ? (
                          <button onClick={() => reinstateUser(u.id)} className="px-3 py-1.5 bg-[#1B3A6B] text-white text-xs rounded-lg font-semibold hover:bg-[#0EA5A0] transition-colors">
                            Reinstate
                          </button>
                        ) : u.role !== "admin" && (
                          <button onClick={() => { setConfirmId(u.id); setConfirmAction("suspend"); }} className="px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded-lg hover:bg-red-50 transition-colors">
                            Suspend
                          </button>
                        )}
                        <button onClick={() => setExpandedUser(isExpanded ? null : u.id)} className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <div className="border-t border-[rgba(15,23,42,0.07)] px-4 py-4 bg-[#F8FAFC]">
                        <div className="grid sm:grid-cols-2 gap-3 mb-4 text-xs">
                          <div className="space-y-1">
                            <p><span className="text-slate-400">User ID:</span> <code className="font-mono text-slate-700">{u.id}</code></p>
                            <p><span className="text-slate-400">Email:</span> <span className="text-slate-700">{u.email}</span></p>
                            <p><span className="text-slate-400">Phone:</span> <span className="text-slate-700">{u.phone ?? "—"}</span></p>
                            <p><span className="text-slate-400">City:</span> <span className="text-slate-700">{u.city ?? "—"}</span></p>
                            <p><span className="text-slate-400">Postal:</span> <span className="text-slate-700">{u.postal_code ?? "—"}</span></p>
                          </div>
                          {u.role === "caregiver" && (
                            <div className="space-y-1">
                              <p><span className="text-slate-400">PSW Role:</span> <span className="text-slate-700">{u.psw_role ?? "—"}</span></p>
                              <p><span className="text-slate-400">Rate:</span> <span className="text-slate-700">${u.hourly_rate ?? "—"}/hr</span></p>
                              <p><span className="text-slate-400">Languages:</span> <span className="text-slate-700">{u.languages?.join(", ") ?? "—"}</span></p>
                              <p><span className="text-slate-400">Care types:</span> <span className="text-slate-700">{u.care_types?.join(", ") ?? "—"}</span></p>
                              <p><span className="text-slate-400">Rating:</span> <span className="text-slate-700">{u.rating ?? "—"} ({u.review_count ?? 0} reviews)</span></p>
                            </div>
                          )}
                          {u.role === "family" && (
                            <div className="space-y-1">
                              <p><span className="text-slate-400">Joined:</span> <span className="text-slate-700">{new Date(u.created_at).toLocaleDateString("en-CA")}</span></p>
                              <p><span className="text-slate-400">Street:</span> <span className="text-slate-700">{u.street_address ?? "—"}</span></p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-[rgba(15,23,42,0.07)]">
                          {u.role !== "admin" && (
                            <button
                              onClick={() => { setConfirmId(u.id); setConfirmAction("promote"); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B5CF6] text-white text-xs rounded-lg font-semibold hover:bg-[#7C3AED] transition-colors"
                            >
                              <Shield size={11} />Promote to Admin
                            </button>
                          )}
                          <button
                            onClick={() => { setConfirmId(u.id); setConfirmAction("delete"); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={11} />Delete Profile
                          </button>
                          <span className="ml-auto text-xs text-slate-400 self-center">Joined {new Date(u.created_at).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Verify Caregivers ──────────────────────────────────────────────────── */}
      {tab === "verify" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Caregiver Verification</h1>
              <p className="text-slate-400 text-sm mt-1">Review uploaded credentials before approving profiles.</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-semibold">{pendingVerification.length} pending</span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">{verified.length} verified</span>
              <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full font-semibold">{suspendedList.length} suspended</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-400"><Loader2 size={16} className="animate-spin" />Loading…</div>
          ) : caregivers.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <UserCheck size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium">No caregivers registered yet.</p>
            </div>
          ) : (
            <>
              {/* Pending section */}
              {pendingVerification.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-1.5"><AlertCircle size={12} />Awaiting Review ({pendingVerification.length})</p>
                  <div className="space-y-3">
                    {pendingVerification.map(c => (
                      <CaregiverCard key={c.id} c={c} onVerify={verify} onSuspend={() => { setConfirmId(c.id); setConfirmAction("suspend"); }} onReinstate={reinstate} />
                    ))}
                  </div>
                </div>
              )}
              {/* Verified section */}
              {verified.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3 flex items-center gap-1.5"><CheckCircle size={12} />Verified & Active ({verified.length})</p>
                  <div className="space-y-3">
                    {verified.map(c => (
                      <CaregiverCard key={c.id} c={c} onVerify={verify} onSuspend={() => { setConfirmId(c.id); setConfirmAction("suspend"); }} onReinstate={reinstate} />
                    ))}
                  </div>
                </div>
              )}
              {/* Suspended section */}
              {suspendedList.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-1.5"><XCircle size={12} />Suspended ({suspendedList.length})</p>
                  <div className="space-y-3">
                    {suspendedList.map(c => (
                      <CaregiverCard key={c.id} c={c} onVerify={verify} onSuspend={() => { setConfirmId(c.id); setConfirmAction("suspend"); }} onReinstate={reinstate} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Job Posts ─────────────────────────────────────────────────────────── */}
      {tab === "jobs" && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-slate-900">All Job Posts</h1>
          {loading ? <div className="flex items-center gap-2 text-slate-400"><Loader2 size={16} className="animate-spin" />Loading…</div> :
            jobs.length === 0 ? <p className="text-slate-400 text-sm">No jobs posted yet.</p> : (
              <div className="space-y-3">
                {jobs.map((j: any) => (
                  <div key={j.id} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{j.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{j.city} ({j.postal_prefix}XX) · {j.care_type}</p>
                      <p className="text-xs text-slate-400">{j.hours} · {j.schedule} · <span className="font-mono">${j.rate}/hr</span> · Posted {new Date(j.created_at).toLocaleDateString("en-CA")}</p>
                    </div>
                    <Badge color={j.status === "open" ? "green" : "gray"}>{j.status}</Badge>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* ── Billing ───────────────────────────────────────────────────────────── */}
      {tab === "billing" && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-slate-900">Billing &amp; Payments</h1>
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard icon={TrendingUp}  label="Total Platform Revenue" value={`$${totalRevenue.toFixed(2)}`}    color="#10B981" />
            <StatCard icon={CreditCard}  label="Pending Approval"       value={shifts.filter(s => s.status === "pending_approval").length} color="#F59E0B" />
            <StatCard icon={AlertCircle} label="Failed Stripe Charges"  value={failedCharges.length}              color="#DC2626" />
          </div>

          {failedCharges.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-slate-900">Failed Charges — Auto-Suspended Caregivers</h2>
              {failedCharges.map((s: any) => (
                <div key={s.id} className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-3">
                  <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Failed Charge · {s.caregiver?.full_name}</p>
                    <p className="text-xs text-red-700 mt-1">Shift on {s.clock_in ? new Date(s.clock_in).toLocaleDateString("en-CA") : "—"} · Platform fee: <span className="font-mono">${s.platform_fee?.toFixed(2)}</span></p>
                    <p className="text-xs text-red-600 mt-0.5">Stripe charge ID: {s.stripe_charge_id ?? "N/A"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] overflow-hidden">
            <div className="p-5 border-b border-[rgba(15,23,42,0.07)]"><h2 className="font-semibold text-slate-900">All Platform Charges</h2></div>
            {loading ? (
              <div className="p-5 flex items-center gap-2 text-slate-400"><Loader2 size={16} className="animate-spin" />Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F2F5FA]">
                    <tr>{["Caregiver","Family","Date","Hours","Gross","Fee (15%)","Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {shifts.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400 text-sm">No shifts recorded yet.</td></tr>
                    ) : shifts.map((s: any) => (
                      <tr key={s.id} className="border-t border-[rgba(15,23,42,0.07)] hover:bg-[#F2F5FA]/50 transition-colors">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{s.caregiver?.full_name ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{s.family?.full_name ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{s.clock_in ? new Date(s.clock_in).toLocaleDateString("en-CA", { month: "short", day: "numeric" }) : "—"}</td>
                        <td className="px-4 py-3 font-mono">{s.hours_worked?.toFixed(2) ?? "—"}</td>
                        <td className="px-4 py-3 font-mono">${s.gross?.toFixed(2) ?? "—"}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-[#1B3A6B]">${s.platform_fee?.toFixed(2) ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge color={s.stripe_status === "succeeded" || s.status === "paid" ? "green" : s.stripe_status === "failed" ? "red" : "yellow"}>
                            {s.stripe_status === "succeeded" || s.status === "paid" ? "Charged"
                              : s.stripe_status === "failed" ? "Failed"
                              : s.status === "pending_approval" ? "Pending"
                              : s.status ?? "—"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Setup & Simulation ─────────────────────────────────────────────────── */}
      {tab === "simulation" && (
        <div className="space-y-8 max-w-2xl">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Setup &amp; Simulation</h1>
            <p className="text-slate-400 text-sm mt-1">One-click database setup, email pathway testing, and live booking simulation.</p>
          </div>

          {/* Section 1 — DB Setup */}
          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[rgba(15,23,42,0.07)] bg-[#F8FAFC]">
              <div className="w-9 h-9 rounded-xl bg-[#1B3A6B] flex items-center justify-center shrink-0">
                <Database size={15} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Step 1 — Run Database Setup</p>
                <p className="text-xs text-slate-400 mt-0.5">Creates all tables, disables RLS on jobs/bids/shifts, creates notifications. Safe to re-run.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#E8EEF8] rounded-xl p-4 text-xs text-[#1B3A6B] leading-relaxed">
                Replaces needing to paste SQL into the Supabase SQL Editor. Calls the <code className="bg-white px-1 py-0.5 rounded font-mono">/setup-db</code> edge endpoint which runs all migrations automatically.
              </div>
              <button
                disabled={setupRunning}
                onClick={async () => {
                  setSetupRunning(true); setSetupResult(null);
                  const result = await runDatabaseSetup();
                  setSetupResult(result); setSetupRunning(false);
                }}
                className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold text-sm hover:bg-[#0EA5A0] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {setupRunning ? <><Loader2 size={15} className="animate-spin" />Running setup…</> : <><Database size={15} />Run Database Setup Now</>}
              </button>
              {setupResult && (
                <div className={`rounded-xl p-4 border text-sm ${setupResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    {setupResult.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {setupResult.success ? "Database setup complete! All tables ready." : "Setup encountered errors:"}
                  </div>
                  {setupResult.errors?.length > 0 && (
                    <ul className="mt-2 space-y-1">{setupResult.errors.map((e, i) => <li key={i} className="text-xs font-mono opacity-80">{e}</li>)}</ul>
                  )}
                  {setupResult.success && <p className="text-xs mt-1 opacity-70">Tables: jobs, bids, shifts, notifications · FK constraints dropped · Indexes built.</p>}
                </div>
              )}
            </div>
          </div>

          {/* Section 2 — Email Test */}
          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[rgba(15,23,42,0.07)] bg-[#F8FAFC]">
              <div className="w-9 h-9 rounded-xl bg-[#0EA5A0] flex items-center justify-center shrink-0">
                <Mail size={15} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Step 2 — Verify Email Pathways</p>
                <p className="text-xs text-slate-400 mt-0.5">7 automated emails fire across a full booking lifecycle.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside leading-relaxed">
                {["New bid received → family","Bid accepted → caregiver","Caregiver clocked in → family","Timesheet ready → family","Timesheet approved → caregiver","Charge failed → caregiver","Caregiver verified by admin → caregiver"].map((e,i) => <li key={i}>{e}</li>)}
              </ol>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
                <strong>To enable:</strong> Supabase → Edge Functions → <code className="bg-white px-1 rounded">make-server-f62a5d52</code> → Secrets → add <code className="bg-white px-1 rounded">RESEND_API_KEY</code>. Then redeploy.
              </div>
              <EdgeFunctionTest />
            </div>
          </div>

          {/* Section 3 — Booking Simulation */}
          <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[rgba(15,23,42,0.07)] bg-[#F8FAFC]">
              <div className="w-9 h-9 rounded-xl bg-[#8B5CF6] flex items-center justify-center shrink-0">
                <FlaskConical size={15} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Step 3 — Run Live Booking Simulation</p>
                <p className="text-xs text-slate-400 mt-0.5">Full end-to-end: post job → bid → accept → clock in → clock out → approve. Fires all emails + notifications.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#E8EEF8] rounded-xl p-4 text-xs text-[#1B3A6B] leading-relaxed">
                <strong>Get User IDs:</strong> Supabase → Table Editor → profiles → copy the <code className="bg-white px-1 rounded font-mono">id</code> of one family and one caregiver account.
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1.5">Family Account — User ID (UUID)</label>
                  <input type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={simFamilyId} onChange={e => setSimFamilyId(e.target.value.trim())} className="w-full px-4 py-2.5 rounded-xl bg-[#F2F5FA] border border-[rgba(15,23,42,0.10)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/40 focus:border-[#0EA5A0] transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1.5">Caregiver Account — User ID (UUID)</label>
                  <input type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={simCaregiverId} onChange={e => setSimCaregiverId(e.target.value.trim())} className="w-full px-4 py-2.5 rounded-xl bg-[#F2F5FA] border border-[rgba(15,23,42,0.10)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/40 focus:border-[#0EA5A0] transition" />
                </div>
              </div>
              <button
                disabled={!simFamilyId || !simCaregiverId || simRunning}
                onClick={async () => {
                  setSimRunning(true); setSimResult(null);
                  const result = await runBookingSimulation(simFamilyId, simCaregiverId);
                  setSimResult(result); setSimRunning(false);
                }}
                className="w-full py-3 bg-[#8B5CF6] text-white rounded-xl font-semibold text-sm hover:bg-[#7C3AED] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {simRunning ? <><Loader2 size={16} className="animate-spin" />Simulating…</> : <><Play size={16} />Run Full Booking Simulation</>}
              </button>

              {simResult && (
                <div className="space-y-3 mt-2">
                  <div className={`rounded-xl p-4 border ${simResult.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {simResult.success ? <CheckCircle size={15} className="text-emerald-600" /> : <XCircle size={15} className="text-red-600" />}
                      <p className={`font-semibold text-sm ${simResult.success ? "text-emerald-800" : "text-red-800"}`}>
                        {simResult.success ? "Simulation completed successfully!" : `Failed: ${simResult.error}`}
                      </p>
                    </div>
                    {simResult.summary && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                        {([["Gross",`$${simResult.summary.gross?.toFixed(2)}`],["Platform fee",`$${simResult.summary.platform_fee?.toFixed(2)}`],["Net",`$${simResult.summary.net?.toFixed(2)}`],["Emails fired",simResult.summary.emails_sent],["Notifications",simResult.summary.notifications_created],["Hours",simResult.summary.hours_worked]] as [string,any][]).map(([k,v]) => (
                          <div key={k} className="bg-white rounded-lg px-3 py-2 border border-emerald-200">
                            <p className="text-xs text-emerald-600 font-medium">{k}</p>
                            <p className="text-sm font-bold text-emerald-900 font-mono">{v}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-xl border border-[rgba(15,23,42,0.10)] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[rgba(15,23,42,0.07)] bg-[#F8FAFC]">
                      <p className="font-semibold text-slate-900 text-xs uppercase tracking-wide">Step-by-Step Log</p>
                    </div>
                    <div className="divide-y divide-[rgba(15,23,42,0.07)]">
                      {(simResult.log ?? []).map((entry: any, i: number) => (
                        <div key={i} className="px-4 py-3 flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${entry.status === "ok" ? "bg-emerald-100" : "bg-red-100"}`}>
                            {entry.status === "ok" ? <CheckCircle size={10} className="text-emerald-600" /> : <XCircle size={10} className="text-red-600" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 leading-tight">{entry.step}</p>
                            {entry.detail && <p className="text-xs text-slate-400 mt-0.5 font-mono">{entry.detail}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </Shell>
  );
}

// ── Module-level helper component ─────────────────────────────────────────────
function CaregiverCard({ c, onVerify, onSuspend, onReinstate }: { c: any; onVerify: (id: string) => void; onSuspend: (id: string) => void; onReinstate: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#0EA5A0] flex items-center justify-center text-white font-bold shrink-0">
          {(c.display_name ?? c.full_name ?? "?").charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-semibold text-slate-900 text-sm">{c.display_name ?? c.full_name}</p>
            {c.verified  && <Badge color="green"><CheckCircle size={10} />Verified</Badge>}
            {c.suspended && <Badge color="red"><XCircle size={10} />Suspended</Badge>}
            {!c.verified && !c.suspended && <Badge color="yellow">Pending Review</Badge>}
          </div>
          <p className="text-xs text-slate-400">{c.city ?? "—"} · {c.psw_role === "psw" ? "PSW" : "Companion"} · ${c.hourly_rate ?? "—"}/hr</p>
          <p className="text-xs text-slate-400">{c.email}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {([
              { label: "Gov ID",    key: "gov_id_url"   },
              { label: "VSC",       key: "vsc_url"      },
              { label: "PSW Cert",  key: "psw_cert_url" },
              { label: "First Aid", key: "first_aid_url"},
            ] as { label: string; key: keyof typeof c }[]).map(({ label, key }) =>
              c[key] ? (
                <a key={label} href={c[key] as string} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors">
                  <FileText size={9} />{label} ↗
                </a>
              ) : (
                <span key={label} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                  <FileText size={9} />{label}
                </span>
              )
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {!c.verified && !c.suspended && (
          <button onClick={() => onVerify(c.id)} className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
            <CheckCircle size={12} />Approve
          </button>
        )}
        {c.suspended ? (
          <button onClick={() => onReinstate(c.id)} className="flex items-center gap-1.5 bg-[#1B3A6B] text-white text-xs px-4 py-2 rounded-xl font-semibold hover:bg-[#0EA5A0] transition-colors">
            <RefreshCcw size={12} />Reinstate
          </button>
        ) : (
          <button onClick={() => onSuspend(c.id)} className="flex items-center gap-1.5 border border-red-200 text-red-600 text-xs px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
            <XCircle size={12} />Suspend
          </button>
        )}
      </div>
    </div>
  );
}