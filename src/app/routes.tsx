import { createBrowserRouter, Navigate, Outlet, useNavigate } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import type { AuthMode, Role, View } from "./types";

import { Landing } from "./Landing";
import { Onboarding } from "./Onboarding";
import { FamilyDash } from "./FamilyDash";
import { CaregiverDash } from "./CaregiverDash";
import { AdminDash } from "./AdminDash";
import { DirectoryPage } from "./pages/DirectoryPage";
import { CityPage } from "./pages/CityPage";
import { TrustPage } from "./pages/TrustPage";
import { LegalPage } from "./pages/LegalPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { ChatPage } from "./pages/ChatPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";

// ── Root layout — provides AuthContext to all routes ──────────────────────────
function Root() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

// ── Navigation helpers ────────────────────────────────────────────────────────
// Maps legacy View strings and role/mode combos to URL paths
function useAppNav() {
  const nav = useNavigate();

  const onAuth = (mode: AuthMode, role?: Role) => {
    if (mode === "login") nav("/login");
    else if (role === "caregiver") nav("/register/caregiver");
    else nav("/register/employer");
  };

  // Accepts both legacy View strings and plain URL paths
  const onNavigate = (view: View | string) => {
    const map: Record<string, string> = {
      landing:        "/",
      auth:           "/login",
      family:         "/dashboard/employer",
      caregiver:      "/dashboard/caregiver",
      admin:          "/admin-portal",
      directory:      "/browse-caregivers",
      toronto:        "/toronto",
      ottawa:         "/ottawa",
      mississauga:    "/mississauga",
      trust:          "/trust",
      terms:          "/terms-of-service",
      privacy:        "/privacy-policy",
      "how-it-works": "/how-it-works",
      chat:           "/dashboard/chat",
    };
    nav(map[view] ?? view);
  };

  return { onAuth, onNavigate };
}

// ── Auth guard — redirects to /login if not authenticated ─────────────────────
function RequireAuth({ allowedRole }: { allowedRole?: Role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole && user.role !== "admin") {
    const fallback =
      user.role === "caregiver" ? "/dashboard/caregiver" :
      user.role === "admin"     ? "/admin-portal"        :
                                  "/dashboard/employer";
    return <Navigate to={fallback} replace />;
  }
  return <Outlet />;
}

// ── Public page wrappers ──────────────────────────────────────────────────────
function LandingRoute() {
  const { onAuth, onNavigate } = useAppNav();
  return <Landing onAuth={onAuth} onNavigate={onNavigate} />;
}

function DirectoryRoute() {
  const { onAuth, onNavigate } = useAppNav();
  return <DirectoryPage onAuth={onAuth} onNavigate={onNavigate} />;
}

function TorontoRoute() {
  const { onAuth, onNavigate } = useAppNav();
  return <CityPage city="toronto" onAuth={onAuth} onNavigate={onNavigate} />;
}

function OttawaRoute() {
  const { onAuth, onNavigate } = useAppNav();
  return <CityPage city="ottawa" onAuth={onAuth} onNavigate={onNavigate} />;
}

function MississaugaRoute() {
  const { onAuth, onNavigate } = useAppNav();
  return <CityPage city="mississauga" onAuth={onAuth} onNavigate={onNavigate} />;
}

function HowItWorksRoute() {
  const { onAuth, onNavigate } = useAppNav();
  return <HowItWorksPage onAuth={onAuth} onNavigate={onNavigate} />;
}

function TrustRoute() {
  const { onAuth, onNavigate } = useAppNav();
  return <TrustPage onAuth={onAuth} onNavigate={onNavigate} />;
}

function TermsRoute() {
  const { onAuth, onNavigate } = useAppNav();
  return <LegalPage tab="terms" onAuth={onAuth} onNavigate={onNavigate} />;
}

function PrivacyRoute() {
  const { onAuth, onNavigate } = useAppNav();
  return <LegalPage tab="privacy" onAuth={onAuth} onNavigate={onNavigate} />;
}

// ── Auth page wrappers ────────────────────────────────────────────────────────
function LoginRoute() {
  const { setUser } = useAuth();
  const nav = useNavigate();
  return (
    <Onboarding
      initialMode="login"
      onSuccess={(u) => {
        setUser(u);
        nav(
          u.role === "caregiver" ? "/dashboard/caregiver" :
          u.role === "admin"     ? "/admin-portal"        :
                                   "/dashboard/employer"
        );
      }}
      onBack={() => nav("/")}
    />
  );
}

function RegisterEmployerRoute() {
  const { setUser } = useAuth();
  const nav = useNavigate();
  return (
    <Onboarding
      initialMode="signup"
      initialRole="family"
      onSuccess={(u) => { setUser(u); nav("/dashboard/employer"); }}
      onBack={() => nav("/")}
    />
  );
}

function RegisterCaregiverRoute() {
  const { setUser } = useAuth();
  const nav = useNavigate();
  return (
    <Onboarding
      initialMode="signup"
      initialRole="caregiver"
      onSuccess={(u) => { setUser(u); nav("/dashboard/caregiver"); }}
      onBack={() => nav("/")}
    />
  );
}

// ── Dashboard wrappers ────────────────────────────────────────────────────────
function FamilyDashRoute({ initialTab }: { initialTab?: string }) {
  const { user, signOut } = useAuth();
  const { onNavigate } = useAppNav();
  if (!user) return <Navigate to="/login" replace />;
  return <FamilyDash user={user} onSignOut={signOut} onNavigate={onNavigate} initialTab={initialTab} />;
}

function FamilyPostJobRoute()    { return <FamilyDashRoute initialTab="post" />; }
function FamilyBidsRoute()       { return <FamilyDashRoute initialTab="jobs" />; }
function FamilyTimesheetsRoute() { return <FamilyDashRoute initialTab="timesheets" />; }

function CaregiverDashRoute({ initialTab }: { initialTab?: string }) {
  const { user, signOut } = useAuth();
  const { onNavigate } = useAppNav();
  if (!user) return <Navigate to="/login" replace />;
  return <CaregiverDash user={user} onSignOut={signOut} onNavigate={onNavigate} initialTab={initialTab} />;
}

function CaregiverMatchesRoute()  { return <CaregiverDashRoute initialTab="browse" />; }
function CaregiverShiftRoute()    { return <CaregiverDashRoute initialTab="clock" />; }

function AdminDashRoute() {
  const { user, signOut } = useAuth();
  if (!user || user.role !== "admin") return <Navigate to="/login" replace />;
  return <AdminDash user={user} onSignOut={signOut} />;
}

function ChatRoute() {
  const { user, signOut } = useAuth();
  const { onNavigate } = useAppNav();
  if (!user) return <Navigate to="/login" replace />;
  return <ChatPage user={user} onNavigate={onNavigate} onSignOut={signOut} />;
}

// ── 404 ───────────────────────────────────────────────────────────────────────
function NotFound() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-[#F2F5FA] flex items-center justify-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="text-center">
        <p className="text-8xl font-extrabold text-[#1B3A6B] mb-4">404</p>
        <p className="text-xl text-slate-600 mb-8">Page not found</p>
        <button
          onClick={() => nav("/")}
          className="bg-[#1B3A6B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0EA5A0] transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      // Public
      { index: true,                        Component: LandingRoute },
      { path: "browse-caregivers",          Component: DirectoryRoute },
      { path: "toronto",                    Component: TorontoRoute },
      { path: "ottawa",                     Component: OttawaRoute },
      { path: "mississauga",                Component: MississaugaRoute },
      { path: "how-it-works",               Component: HowItWorksRoute },
      { path: "trust",                      Component: TrustRoute },
      { path: "terms-of-service",           Component: TermsRoute },
      { path: "privacy-policy",             Component: PrivacyRoute },
      // Auth
      { path: "login",                      Component: LoginRoute },
      { path: "register/employer",          Component: RegisterEmployerRoute },
      { path: "register/caregiver",         Component: RegisterCaregiverRoute },
      // Employer dashboard
      { path: "dashboard/employer",         Component: FamilyDashRoute },
      { path: "dashboard/employer/post-job",   Component: FamilyPostJobRoute },
      { path: "dashboard/employer/bids",       Component: FamilyBidsRoute },
      { path: "dashboard/employer/timesheets", Component: FamilyTimesheetsRoute },
      // Caregiver dashboard
      { path: "dashboard/caregiver",           Component: CaregiverDashRoute },
      { path: "dashboard/caregiver/matches",   Component: CaregiverMatchesRoute },
      { path: "dashboard/caregiver/shift-tracker", Component: CaregiverShiftRoute },
      // Unified
      { path: "dashboard/chat",             Component: ChatRoute },
      { path: "admin-portal",               Component: AdminDashRoute },
      { path: "payment-success",            Component: PaymentSuccessPage },
      // Fallback
      { path: "*",                          Component: NotFound },
    ],
  },
]);
