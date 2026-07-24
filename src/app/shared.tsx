import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Heart, Menu, LogOut } from "lucide-react";
import type { AppUser } from "./types";

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = "gray" }: {
  children: React.ReactNode;
  color?: "gray"|"green"|"teal"|"yellow"|"red"|"navy"|"blue"|"purple";
}) {
  const map: Record<string, string> = {
    gray:   "bg-slate-100 text-slate-600",
    green:  "bg-emerald-50 text-emerald-700",
    teal:   "bg-teal-50 text-teal-700",
    yellow: "bg-amber-50 text-amber-700",
    red:    "bg-red-50 text-red-700",
    navy:   "bg-[#E8EEF8] text-[#1B3A6B]",
    blue:   "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${map[color]}`}>
      {children}
    </span>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, color = "#0EA5A0" }: {
  icon: any; label: string; value: string|number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5 flex items-start gap-4">
      <div className="rounded-xl p-2.5" style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── SideLink ──────────────────────────────────────────────────────────────────
function SideLink({ icon: Icon, label, active, onClick }: {
  icon: any; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
        ${active ? "bg-white/15 text-white" : "text-white/55 hover:text-white hover:bg-white/8"}`}>
      <Icon size={17} />{label}
    </button>
  );
}

// ── Dashboard Shell ───────────────────────────────────────────────────────────
export function Shell({ user, nav, tab, setTab, onSignOut, onNavigate, children }: {
  user: AppUser;
  nav: { icon: any; label: string; id: string; external?: string; href?: string }[];
  tab: string;
  setTab: (t: string) => void;
  onSignOut: () => void;
  onNavigate?: (v: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const routerNav = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F2F5FA]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#1B3A6B] flex flex-col transition-transform md:relative md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 flex items-center gap-2.5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <Heart size={14} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">GetMeCare</p>
            <p className="text-white/40 text-[10px] mt-0.5 uppercase tracking-wider">
              {user.role === "admin" ? "Admin" : user.role === "family" ? "Family" : "Caregiver"}
            </p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {nav.map(n => {
            const isActive = n.href
              ? location.pathname === n.href
              : tab === n.id;
            return (
              <SideLink key={n.id} icon={n.icon} label={n.label} active={isActive}
                onClick={() => {
                  setOpen(false);
                  if (n.href) { routerNav(n.href); }
                  else if (n.external && onNavigate) { onNavigate(n.external); }
                  else { setTab(n.id); }
                }} />
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#0EA5A0] flex items-center justify-center text-white text-xs font-bold">
              {user.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.full_name}</p>
              <p className="text-white/40 text-[10px] truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 hover:text-white text-sm rounded-xl hover:bg-white/8 transition-colors">
            <LogOut size={15} />Sign out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-[rgba(15,23,42,0.10)] bg-white sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-[#F2F5FA]">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-[#1B3A6B]" />
            <span className="font-bold text-[#1B3A6B] text-sm">GetMeCare</span>
          </div>
        </div>
        <div className="p-6 md:p-8 max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
