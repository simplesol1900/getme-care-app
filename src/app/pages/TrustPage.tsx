import { useEffect } from "react";
import { Heart, ArrowLeft, ArrowRight, ShieldCheck, GraduationCap, CreditCard, FileCheck, UserCheck, Lock, AlertCircle, CheckCircle } from "lucide-react";
import type { AuthMode, Role, View } from "../types";

export function TrustPage({ onAuth, onNavigate }: {
  onAuth: (mode: AuthMode, role?: Role) => void;
  onNavigate: (view: View) => void;
}) {
  useEffect(() => {
    document.title = "Trust, Safety & Vetting | GetMeCare";
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) { desc = document.createElement("meta"); desc.setAttribute("name","description"); document.head.appendChild(desc); }
    desc.setAttribute("content","Learn how GetMeCare vets every caregiver with Ontario Vulnerable Sector Checks, PSW certificate verification, and secure Stripe-powered payments.");
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F5FA]" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-[rgba(15,23,42,0.08)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate("landing")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1B3A6B] transition-colors">
              <ArrowLeft size={15}/>Home
            </button>
            <div className="w-px h-5 bg-slate-200"/>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1B3A6B] flex items-center justify-center"><Heart size={13} className="text-white"/></div>
              <span className="font-bold text-[#1B3A6B]">GetMeCare</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onAuth("login")} className="text-sm font-semibold text-[#1B3A6B] px-4 py-2 hover:text-[#0EA5A0] transition-colors">Sign In</button>
            <button onClick={() => onAuth("signup","family")} className="text-sm font-semibold bg-[#1B3A6B] text-white px-4 py-2 rounded-xl hover:bg-[#0EA5A0] transition-colors">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-[#1B3A6B] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} className="text-[#0EA5A0]"/>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4">Trust, Safety &amp; Vetting</h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto">
            Canadian families deserve to know exactly how we ensure every caregiver on GetMeCare is safe, qualified, and trustworthy. Here is our complete verification process.
          </p>
        </div>
      </div>

      {/* Vetting Process */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">Our 5-Step Caregiver Verification Process</h2>
        <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto">Every caregiver profile on GetMeCare is hidden from the public directory until all required steps are completed and manually approved by our admin team.</p>

        <div className="space-y-6">
          {[
            {
              step: "01", icon: FileCheck, color: "bg-[#0EA5A0]",
              title: "Government-Issued Photo ID Verification",
              desc: "Every caregiver must upload a valid Ontario Driver's Licence or Canadian Passport. Our admin team manually confirms the ID is authentic and matches the applicant's registration details before any profile is activated.",
              badge: "Required for all caregivers",
            },
            {
              step: "02", icon: GraduationCap, color: "bg-[#1B3A6B]",
              title: "Ontario College PSW Certificate Check",
              desc: "For Certified PSWs, we verify their Ontario College PSW Certificate, Diploma, or equivalent nursing registration. Certificates must be active and in good standing. Companion caregivers undergo a separate skills assessment.",
              badge: "Required for PSW-designated profiles",
            },
            {
              step: "03", icon: ShieldCheck, color: "bg-violet-600",
              title: "Vulnerable Sector Check (VSC)",
              desc: "A valid Ontario police Vulnerable Sector Check — issued within the last 12 months — is mandatory for every caregiver. This check specifically screens for offences that would disqualify someone from working with vulnerable populations, including seniors.",
              badge: "Required for all caregivers · 12-month expiry",
            },
            {
              step: "04", icon: UserCheck, color: "bg-emerald-600",
              title: "First Aid & CPR Certification Review",
              desc: "We strongly encourage all caregivers to hold an active First Aid / CPR certificate from St. John Ambulance or the Canadian Red Cross. Verified certificates are displayed prominently on caregiver profiles as a trust signal to families.",
              badge: "Recommended · Prominently displayed on profile",
            },
            {
              step: "05", icon: Lock, color: "bg-amber-600",
              title: "Secure Card Tokenization & Billing Setup",
              desc: "Before a caregiver can receive shift assignments, they must link a valid Canadian Visa/Mastercard to their profile via our secure payment gateway. Card details are tokenized — raw card numbers are never stored in our database. This ensures our 15% platform fee can be reliably collected after each approved shift.",
              badge: "Required for payment processing",
            },
          ].map(({ step, icon: Icon, color, title, desc, badge }) => (
            <div key={step} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-6 flex gap-5">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Icon size={22} className="text-white"/>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-mono text-xs text-slate-400 font-bold">STEP {step}</span>
                  <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
                </div>
                <p className="text-slate-600 leading-relaxed mb-3">{desc}</p>
                <span className="inline-flex items-center gap-1.5 text-xs bg-[#E8EEF8] text-[#1B3A6B] px-3 py-1 rounded-full font-semibold">
                  <CheckCircle size={11}/>{badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Payment Security */}
      <section className="bg-white border-y border-[rgba(15,23,42,0.08)] py-14">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-3 text-center">Payment Security</h2>
          <p className="text-slate-500 text-center mb-10 max-w-xl mx-auto">GetMeCare uses a fully automated, transparent payment model designed to protect both families and caregivers.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: CreditCard, title: "Families Pay Caregivers Directly",
                desc: "Families pay caregivers 100% of their earned wages off-platform via Interac e-Transfer or cash. GetMeCare does not touch family payment cards for shift costs — we charge caregivers only.",
              },
              {
                icon: Lock, title: "Stripe-Powered Fee Collection",
                desc: "GetMeCare's 15% facilitation fee is automatically charged to the caregiver's card on file immediately after a family approves a shift timesheet. This is powered by Stripe's enterprise-grade payment infrastructure.",
              },
              {
                icon: AlertCircle, title: "Automatic Suspension on Failure",
                desc: "If a platform fee charge fails (e.g., insufficient funds), the caregiver's profile is automatically hidden from the public directory until the outstanding balance is cleared. This protects platform integrity.",
              },
              {
                icon: ShieldCheck, title: "Tokenized Cards — No Raw Data Stored",
                desc: "Caregiver card details are tokenized at the point of entry. Raw card numbers, CVVs, and expiry dates are never stored in our database — only secure payment tokens.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 bg-[#F2F5FA] rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#1B3A6B] flex items-center justify-center shrink-0"><Icon size={19} className="text-white"/></div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-3xl font-bold text-slate-900 mb-3 text-center">Community Guidelines</h2>
        <p className="text-slate-500 text-center mb-10 max-w-xl mx-auto">GetMeCare operates on a foundation of mutual respect, transparency, and accountability.</p>
        <div className="space-y-4">
          {[
            { title: "No Off-Platform Cash Agreements", desc: "All shift bookings and payment arrangements must be made through the GetMeCare dashboard. Attempting to bypass the platform's payment system is grounds for immediate account suspension for both parties." },
            { title: "Accurate Timesheet Reporting", desc: "Caregivers must use the integrated Clock-In / Clock-Out system to accurately record all shift hours. Falsifying timesheet data is a serious violation that results in permanent account removal." },
            { title: "Zero Tolerance for Abuse or Neglect", desc: "Any reports of elder abuse, neglect, financial exploitation, or professional misconduct are investigated immediately. Confirmed violations result in permanent bans and referral to appropriate Ontario authorities." },
            { title: "Honest Profile Representations", desc: "Caregivers must only claim certifications, languages, and skills they genuinely hold. GetMeCare verifies submitted credentials, and misrepresentation is grounds for immediate profile removal." },
            { title: "Respectful Communications", desc: "All parties — families, caregivers, and GetMeCare staff — are expected to communicate professionally and respectfully. Harassment, discrimination, or threatening behaviour will not be tolerated." },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5 flex gap-4">
              <CheckCircle size={20} className="text-[#0EA5A0] shrink-0 mt-0.5"/>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1B3A6B] py-14">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ShieldCheck size={32} className="text-[#0EA5A0] mx-auto mb-4"/>
          <h2 className="text-2xl font-bold text-white mb-3">Ready to experience safer home care?</h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">Every caregiver on GetMeCare has been background-checked, certified, and manually approved by our admin team.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => onAuth("signup","family")} className="flex items-center gap-2 bg-[#0EA5A0] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0d9489] transition-colors">
              Find a Verified Caregiver <ArrowRight size={16}/>
            </button>
            <button onClick={() => onNavigate("directory")} className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/20">
              Browse Directory
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[rgba(15,23,42,0.08)] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#1B3A6B] flex items-center justify-center"><Heart size={11} className="text-white"/></div>
            <span className="font-bold text-[#1B3A6B] text-sm">GetMeCare</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-400">
            {[["Home","landing"],["Find Caregivers","directory"],["Terms","terms"],["Privacy","privacy"]].map(([label,view]) => (
              <button key={label} onClick={() => onNavigate(view as View)} className="hover:text-[#0EA5A0] transition-colors">{label}</button>
            ))}
          </div>
          <p className="text-xs text-slate-400">© 2025 GetMeCare Inc.</p>
        </div>
      </footer>
    </div>
  );
}
