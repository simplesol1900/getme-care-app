import { useState } from "react";
import {
  Heart, ArrowLeft, CheckCircle, CreditCard, Search, UserCheck,
  Clock, DollarSign, Shield, FileText, Bell, ThumbsUp, Zap,
  AlertCircle, BadgeCheck, Upload, Wallet, ClipboardCheck,
  ChevronRight,
} from "lucide-react";
import type { AuthMode, Role, View } from "../types";
import { Badge } from "../shared";

const FAMILY_STEPS = [
  {
    icon: CreditCard,
    color: "#1B3A6B",
    bg: "#EEF2FF",
    step: "Step 1",
    title: "Pay the $39 Vetting Fee",
    desc: "A one-time verification fee confirms your identity and intent. This is charged during registration and unlocks your ability to post jobs and contact caregivers.",
    note: "Non-refundable · Processed securely via Stripe",
    bullets: [
      "Prevents spam and abuse on the platform",
      "Funds admin review of caregiver credentials",
      "Unlocks full profile access & messaging",
    ],
  },
  {
    icon: FileText,
    color: "#0EA5A0",
    bg: "#ECFDF5",
    step: "Step 2",
    title: "Post Your Care Job",
    desc: "Describe your care needs — care type (PSW or Companion), location (Ontario postal code), hours per day, schedule, and maximum hourly budget.",
    note: "Matched algorithmically to caregivers in your area",
    bullets: [
      "Specify language preferences & mobility requirements",
      "Set your preferred schedule (mornings, evenings, weekends)",
      "Matched caregivers in your postal radius are notified instantly",
    ],
  },
  {
    icon: Search,
    color: "#7C3AED",
    bg: "#F5F3FF",
    step: "Step 3",
    title: "Review Bids & Choose a Caregiver",
    desc: "Verified caregivers submit custom hourly rate bids with personal introductions. You can accept, decline, or send a counter-offer directly from your dashboard.",
    note: "Match score shown for each applicant",
    bullets: [
      "View verified credential status on every profile",
      "Message caregivers (contact info hidden until accepted)",
      "Counter-offer tool to negotiate rates",
    ],
  },
  {
    icon: Clock,
    color: "#F59E0B",
    bg: "#FFFBEB",
    step: "Step 4",
    title: "Caregiver Clock-In Notification",
    desc: "When your caregiver arrives for a shift, they tap Clock-In from their mobile dashboard. You receive an instant email and dashboard alert with the exact timestamp.",
    note: "GPS-stamped · Tamper-proof timestamping",
    bullets: [
      "Real-time push notification to your email",
      "Timestamp logged immutably to the blockchain-style ledger",
      "Late arrivals are flagged automatically",
    ],
  },
  {
    icon: ClipboardCheck,
    color: "#059669",
    bg: "#ECFDF5",
    step: "Step 5",
    title: "Verify & Approve the Timesheet",
    desc: "After your caregiver clocks out, the system auto-calculates total hours × hourly rate. You review the timesheet and click Verify & Approve Shift to release payment.",
    note: "You only pay for hours actually worked",
    bullets: [
      "See exact clock-in / clock-out timestamps",
      "Dispute option available for any discrepancies",
      "One-click approval triggers the automated payment chain",
    ],
  },
  {
    icon: DollarSign,
    color: "#DC2626",
    bg: "#FEF2F2",
    step: "Step 6",
    title: "Pay Your Caregiver Directly",
    desc: "GetMeCare does not hold your money. You pay your caregiver directly via cash or Interac e-Transfer for the agreed hourly rate. The platform only charges the caregiver's 15% fee.",
    note: "You owe only what you negotiated · No hidden charges",
    bullets: [
      "Cash and Interac e-Transfer accepted",
      "No platform fee charged to families",
      "Gross amount = hours × rate — that is what you pay",
    ],
  },
];

const CAREGIVER_STEPS = [
  {
    icon: Upload,
    color: "#1B3A6B",
    bg: "#EEF2FF",
    step: "Step 1",
    title: "Complete Onboarding & Upload Credentials",
    desc: "Fill out your profile with your PSW role, service cities, languages, and hourly rate. Upload your Ontario Police Check (VSC), PSW Certificate (if applicable), and Government ID.",
    note: "Documents reviewed within 48 business hours",
    bullets: [
      "Gov ID + VSC required for all caregivers",
      "PSW Certificate unlocks higher-paying clinical shifts",
      "First Aid certification adds a verified badge to your profile",
    ],
  },
  {
    icon: Wallet,
    color: "#0EA5A0",
    bg: "#ECFDF5",
    step: "Step 2",
    title: "Link Your Payout Card",
    desc: "Connect the debit or credit card that will be charged the 15% platform fee after each approved shift. Only a secure token is stored — no raw card data is ever saved.",
    note: "Tokenized via Stripe · PCI-DSS compliant",
    bullets: [
      "Your card is debited ONLY after a shift is approved",
      "Failed charges result in temporary profile suspension",
      "Update your card anytime from your dashboard",
    ],
  },
  {
    icon: BadgeCheck,
    color: "#7C3AED",
    bg: "#F5F3FF",
    step: "Step 3",
    title: "Admin Verification Gate",
    desc: "The GetMeCare admin team reviews your submitted documents. Until verification is complete, your profile is hidden from family searches. You will receive an email once approved.",
    note: "Profile unlocked only after manual admin review",
    bullets: [
      "Typically completed within 24–48 business hours",
      "Incomplete documents result in a rejection email with reasons",
      "Verified profiles display a blue checkmark badge",
    ],
  },
  {
    icon: Bell,
    color: "#F59E0B",
    bg: "#FFFBEB",
    step: "Step 4",
    title: "Receive Matched Job Alerts",
    desc: "Once verified, you are automatically matched to open jobs within your listed service cities. You receive email and dashboard notifications when new jobs match your profile.",
    note: "Matching algorithm uses Ontario postal code radius",
    bullets: [
      "Browse and filter matched assignments from your dashboard",
      "See family location, care type, hours, and budget",
      "New jobs within your area alert you in real time",
    ],
  },
  {
    icon: ThumbsUp,
    color: "#059669",
    bg: "#ECFDF5",
    step: "Step 5",
    title: "Submit a Bid",
    desc: "On any open job, enter your custom hourly rate bid and a short personal pitch to the family. Families can accept, reject, or send a counter-offer. Accepted bids unlock direct messaging.",
    note: "Your contact info stays hidden until bid is accepted",
    bullets: [
      "Competitive bidding — set your own rate",
      "Short pitch helps families choose you over others",
      "Counter-offers arrive as dashboard notifications",
    ],
  },
  {
    icon: Clock,
    color: "#DC2626",
    bg: "#FEF2F2",
    step: "Step 6",
    title: "Clock In & Clock Out",
    desc: "On shift day, tap Clock-In from your mobile dashboard when you arrive at the client's home. Tap Clock-Out when you leave. The system automatically calculates hours and generates the timesheet.",
    note: "Mobile-optimized · Large one-tap buttons",
    bullets: [
      "Timestamps are immutable and visible to both parties",
      "Family is notified instantly on each clock event",
      "Timesheet sent to family for approval automatically",
    ],
  },
  {
    icon: Zap,
    color: "#1B3A6B",
    bg: "#EEF2FF",
    step: "Step 7",
    title: "Automatic 15% Platform Fee",
    desc: "Once the family approves the timesheet, the platform automatically charges your linked card a 15% fee on the gross shift amount. You keep 85% of your earnings.",
    note: "Charged within minutes of shift approval",
    bullets: [
      "Example: $200 gross → $30 platform fee → $170 net to you",
      "Fee covers platform maintenance, admin vetting, and Stripe processing",
      "Detailed earnings breakdown in your Earnings tab",
    ],
  },
];

interface Step {
  icon: React.ElementType;
  color: string;
  bg: string;
  step: string;
  title: string;
  desc: string;
  note: string;
  bullets: string[];
}

function StepCard({ s, idx }: { s: Step; idx: number }) {
  const Icon = s.icon;
  return (
    <div className="flex gap-5 group">
      {/* timeline */}
      <div className="flex flex-col items-center">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: s.bg, border: `1.5px solid ${s.color}22` }}>
          <Icon size={20} style={{ color: s.color }} />
        </div>
        {idx < (FAMILY_STEPS.length - 1) && (
          <div className="w-0.5 flex-1 mt-2 bg-gradient-to-b from-slate-200 to-transparent min-h-8" />
        )}
      </div>
      {/* content */}
      <div className="pb-8 flex-1">
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: s.color }}>{s.step}</span>
        <h3 className="text-lg font-bold text-slate-900 mt-0.5 mb-1">{s.title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-3">{s.desc}</p>
        <ul className="space-y-1 mb-3">
          {s.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color: s.color }} />
              {b}
            </li>
          ))}
        </ul>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
          <AlertCircle size={11} />
          {s.note}
        </span>
      </div>
    </div>
  );
}

export function HowItWorksPage({ onAuth, onNavigate }: {
  onAuth: (mode: AuthMode, role?: Role) => void;
  onNavigate: (view: View) => void;
}) {
  const [tab, setTab] = useState<"families" | "caregivers">("families");

  const steps = tab === "families" ? FAMILY_STEPS : CAREGIVER_STEPS;

  return (
    <div className="min-h-screen bg-[#F2F5FA]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => onNavigate("landing")} className="flex items-center gap-2 text-[#1B3A6B] font-bold text-lg hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-[#1B3A6B] flex items-center justify-center">
              <Heart size={14} className="text-white" />
            </div>
            GetMeCare
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate("landing")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
            <button onClick={() => onAuth("signup", "family")} className="text-sm font-semibold bg-[#1B3A6B] text-white px-4 py-2 rounded-xl hover:bg-[#0EA5A0] transition-colors">
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-8 text-center">
        <Badge color="teal">Platform Guide</Badge>
        <h1 className="text-4xl font-extrabold text-slate-900 mt-4 mb-4">
          How GetMeCare Works
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A transparent, step-by-step breakdown of the platform — from registration to payment — for both families and caregivers in Ontario.
        </p>

        {/* Tab switcher */}
        <div className="inline-flex mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-1 gap-1">
          <button
            onClick={() => setTab("families")}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab === "families" ? { background: "#1B3A6B", color: "#fff" } : { color: "#64748B" }}
          >
            For Families
          </button>
          <button
            onClick={() => setTab("caregivers")}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={tab === "caregivers" ? { background: "#0EA5A0", color: "#fff" } : { color: "#64748B" }}
          >
            For Caregivers (PSWs)
          </button>
        </div>
      </section>

      {/* Summary callout */}
      <section className="max-w-5xl mx-auto px-6 mb-8">
        {tab === "families" ? (
          <div className="rounded-2xl border border-[#1B3A6B]/15 bg-[#EEF2FF] px-6 py-5 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#1B3A6B] flex items-center justify-center shrink-0">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-[#1B3A6B] text-base">Family Cost Summary</p>
              <p className="text-sm text-slate-700 mt-1">
                One-time <strong>$39 registration fee</strong> to access verified caregivers. You pay your caregiver directly (cash / Interac) at the agreed hourly rate.
                <span className="text-[#059669] font-semibold"> GetMeCare never takes a cut from families.</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#0EA5A0]/20 bg-[#ECFDF5] px-6 py-5 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#0EA5A0] flex items-center justify-center shrink-0">
              <DollarSign size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-[#0EA5A0] text-base">Caregiver Fee Structure</p>
              <p className="text-sm text-slate-700 mt-1">
                A <strong>15% platform fee</strong> is automatically charged to your linked card after each approved shift.
                Example: $200 gross shift → $30 fee → <span className="text-[#059669] font-semibold">$170 net to you.</span> No monthly subscriptions.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Steps */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            {tab === "families" ? (
              <UserCheck size={20} style={{ color: "#1B3A6B" }} />
            ) : (
              <BadgeCheck size={20} style={{ color: "#0EA5A0" }} />
            )}
            <h2 className="text-xl font-bold text-slate-900">
              {tab === "families" ? "Family Step-by-Step Guide" : "Caregiver Step-by-Step Guide"}
            </h2>
            <span className="ml-auto text-xs text-slate-400">{steps.length} steps</span>
          </div>
          <div>
            {steps.map((s, i) => (
              <StepCard key={i} s={s as Step} idx={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1B3A6B] py-14 px-6 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-3">
          {tab === "families" ? "Ready to Find Trusted Care?" : "Ready to Start Earning?"}
        </h2>
        <p className="text-slate-300 text-base mb-8 max-w-xl mx-auto">
          {tab === "families"
            ? "Register today, pay the $39 vetting fee, and get matched to verified PSWs and companions in your area."
            : "Complete your profile, upload your credentials, and start receiving matched job alerts from Ontario families."}
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={() => onAuth("signup", tab === "families" ? "family" : "caregiver")}
            className="inline-flex items-center gap-2 bg-[#0EA5A0] text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-[#0d9490] transition-colors text-sm"
          >
            {tab === "families" ? "Create Family Account" : "Apply as a Caregiver"}
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => onNavigate("directory")}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-colors text-sm"
          >
            Browse Caregivers
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 px-6 text-center">
        <div className="flex justify-center gap-6 text-sm text-slate-400">
          <button onClick={() => onNavigate("terms")} className="hover:text-white transition-colors">Terms of Service</button>
          <button onClick={() => onNavigate("privacy")} className="hover:text-white transition-colors">Privacy Policy</button>
          <button onClick={() => onNavigate("trust")} className="hover:text-white transition-colors">Trust & Safety</button>
          <button onClick={() => onNavigate("directory")} className="hover:text-white transition-colors">Find Caregivers</button>
        </div>
        <p className="text-slate-600 text-xs mt-4">© 2025 GetMeCare Ontario · Independent Caregiver Marketplace</p>
      </footer>
    </div>
  );
}
