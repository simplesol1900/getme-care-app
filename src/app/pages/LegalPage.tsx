import { useEffect } from "react";
import { Heart, ArrowLeft } from "lucide-react";
import type { AuthMode, Role, View } from "../types";

type LegalTab = "terms" | "privacy";

export function LegalPage({ tab, onAuth, onNavigate }: {
  tab: LegalTab;
  onAuth: (mode: AuthMode, role?: Role) => void;
  onNavigate: (view: View) => void;
}) {
  useEffect(() => {
    document.title = tab === "terms"
      ? "Terms of Service | GetMeCare"
      : "Privacy Policy | GetMeCare";
  }, [tab]);

  const prose = "text-sm text-slate-600 leading-relaxed";
  const h3 = "font-bold text-slate-900 text-base mt-6 mb-2";

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

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-white border border-[rgba(15,23,42,0.10)] p-1 mb-10 max-w-xs">
          {(["terms","privacy"] as LegalTab[]).map(t => (
            <button key={t} onClick={() => onNavigate(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-[#1B3A6B] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "terms" ? "Terms of Service" : "Privacy Policy"}
            </button>
          ))}
        </div>

        {tab === "terms" ? (
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Terms of Service</h1>
            <p className="text-slate-500 text-sm mb-8">Last updated: June 2025 · Effective immediately upon account creation</p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
              <p className="text-sm text-amber-900 font-semibold mb-1">Important Notice — Independent Contractor Marketplace</p>
              <p className="text-sm text-amber-800 leading-relaxed">GetMeCare is a matchmaking marketplace, not an employer. GetMeCare does not provide medical services, does not supervise caregivers, and is not responsible for worker-client disputes. All caregivers registered on GetMeCare are self-employed independent contractors.</p>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Nature of the Platform</h2>
            <p className={prose}>GetMeCare Inc. ("GetMeCare," "we," "us") operates an online marketplace that connects Ontario families and individuals ("Clients") with independent personal support workers, companions, and home health aides ("Caregivers"). GetMeCare is not a home care agency and does not employ Caregivers.</p>
            <p className={`${prose} mt-3`}><strong>GetMeCare explicitly:</strong></p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-slate-600">
              <li>Does not provide medical advice, diagnosis, or treatment of any kind.</li>
              <li>Does not supervise, direct, or control the work performed by Caregivers.</li>
              <li>Is not responsible for the conduct, performance, or suitability of any Caregiver.</li>
              <li>Does not guarantee the availability, quality, or outcome of any care arrangement.</li>
              <li>Is not responsible for any disputes arising between Clients and Caregivers.</li>
            </ul>

            <h2 className={`${h3} text-xl mt-8`}>2. Independent Contractor Relationship</h2>
            <p className={prose}>All Caregivers using GetMeCare are self-employed independent contractors and are solely responsible for their own tax obligations, insurance, equipment, and compliance with all applicable Ontario and Canadian laws. By registering, Caregivers acknowledge and agree that:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-slate-600">
              <li>They are not employees, agents, or representatives of GetMeCare.</li>
              <li>GetMeCare does not provide employment insurance, CPP contributions, or any employee benefits.</li>
              <li>They are responsible for reporting and remitting all applicable income taxes to the CRA.</li>
              <li>They maintain their own professional liability insurance as recommended.</li>
            </ul>

            <h2 className={`${h3} text-xl mt-8`}>3. Platform Fee & Billing</h2>
            <p className={prose}>GetMeCare monetizes by charging Caregivers a <strong>15% platform facilitation fee</strong> on each completed and approved shift. By registering, Caregivers authorize GetMeCare to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-slate-600">
              <li>Store a tokenized credit/debit card on file via Stripe.</li>
              <li>Automatically charge the 15% fee immediately following Client approval of a shift timesheet.</li>
              <li>Temporarily suspend the Caregiver's public profile if a platform fee charge fails, until the outstanding balance is cleared.</li>
            </ul>
            <p className={`${prose} mt-3`}>Clients are responsible for paying Caregivers 100% of agreed shift wages directly via Interac e-Transfer, cash, or other agreed methods. GetMeCare does not process or guarantee Client-to-Caregiver wage payments.</p>

            <h2 className={`${h3} text-xl mt-8`}>4. Family Account Activation Fee</h2>
            <p className={prose}>Client families are required to pay a one-time, non-refundable account vetting fee of <strong>$39.00 CAD</strong> upon registration. This fee covers the cost of running mandatory Ontario Vulnerable Sector Checks and PSW credential verification for caregivers on our platform. This fee does not constitute payment for any care services.</p>

            <h2 className={`${h3} text-xl mt-8`}>5. Caregiver Vetting & Access Control</h2>
            <p className={prose}>Caregiver profiles are hidden from the public directory until GetMeCare's administration team has manually verified all required credentials, including Government-Issued Photo ID, Ontario PSW Certificate (where applicable), Vulnerable Sector Check (issued within the last 12 months), and linked payment card. GetMeCare reserves the right to reject, suspend, or permanently remove any Caregiver profile at its sole discretion.</p>

            <h2 className={`${h3} text-xl mt-8`}>6. Prohibited Activities</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-slate-600">
              <li>Arranging or completing care shifts outside the GetMeCare platform ("off-platform" agreements) to circumvent platform fees.</li>
              <li>Submitting false, misleading, or fraudulent credentials, reviews, or timesheet records.</li>
              <li>Engaging in elder abuse, neglect, financial exploitation, or any form of harassment.</li>
              <li>Using the platform for any purpose other than legitimate home care matching in Ontario.</li>
            </ul>

            <h2 className={`${h3} text-xl mt-8`}>7. Limitation of Liability</h2>
            <p className={prose}>To the maximum extent permitted by Ontario law, GetMeCare's total liability to any user for any claim arising from or related to these Terms or the use of the platform shall not exceed the amount of fees paid by that user to GetMeCare in the 30 days preceding the claim. GetMeCare shall not be liable for any indirect, incidental, special, or consequential damages.</p>

            <h2 className={`${h3} text-xl mt-8`}>8. Governing Law</h2>
            <p className={prose}>These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein. Any disputes shall be resolved in the courts of Ontario.</p>

            <h2 className={`${h3} text-xl mt-8`}>9. Changes to These Terms</h2>
            <p className={prose}>GetMeCare reserves the right to modify these Terms at any time. Continued use of the platform following notification of changes constitutes acceptance of the updated Terms.</p>

            <h2 className={`${h3} text-xl mt-8`}>10. Contact</h2>
            <p className={prose}>For questions about these Terms, contact us at <span className="text-[#1B3A6B] font-semibold">legal@getmecare-ontario.com</span> or through our platform support dashboard.</p>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Privacy Policy</h1>
            <p className="text-slate-500 text-sm mb-8">Last updated: June 2025 · Compliant with PIPEDA (Personal Information Protection and Electronic Documents Act)</p>

            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Introduction</h2>
            <p className={prose}>GetMeCare Inc. ("GetMeCare," "we," "us") is committed to protecting the personal information of all platform users in accordance with Canada's <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA) and applicable Ontario privacy legislation. This Policy explains what information we collect, how we use it, and your rights regarding your data.</p>

            <h2 className={`${h3} text-xl mt-8`}>2. Information We Collect</h2>
            <p className={`${prose} font-semibold mt-2`}>From Families (Clients):</p>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-slate-600">
              <li>Full name, email address, and phone number</li>
              <li>Care recipient's address and postal code (for geo-matching only)</li>
              <li>Care preferences, schedule, and budget information</li>
              <li>Payment card details (tokenized via Stripe — raw card data never stored)</li>
            </ul>
            <p className={`${prose} font-semibold mt-4`}>From Caregivers:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-slate-600">
              <li>Full legal name, email, phone, and profile display name</li>
              <li>Government-issued photo ID (stored securely for verification only)</li>
              <li>Professional credentials (PSW certificates, VSC, First Aid)</li>
              <li>Service areas, languages, hourly rates, and care specialties</li>
              <li>Payment card details (tokenized via Stripe)</li>
              <li>Clock-in/clock-out timestamps and shift records</li>
            </ul>

            <h2 className={`${h3} text-xl mt-8`}>3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-slate-600">
              <li>To create and manage your GetMeCare account</li>
              <li>To match families with caregivers using Ontario postal code geo-matching</li>
              <li>To verify caregiver credentials and maintain platform safety standards</li>
              <li>To process platform fee charges via Stripe</li>
              <li>To send transactional notifications (shift confirmations, timesheet approvals, payment receipts)</li>
              <li>To comply with legal obligations under Ontario and Canadian law</li>
            </ul>

            <h2 className={`${h3} text-xl mt-8`}>4. Information Sharing</h2>
            <p className={prose}>We do not sell, rent, or trade your personal information. We share data only with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-slate-600">
              <li><strong>Supabase</strong> — our database and authentication provider (data stored in secure cloud infrastructure)</li>
              <li><strong>Stripe</strong> — for payment tokenization and platform fee processing</li>
              <li><strong>Resend / Brevo</strong> — for transactional email delivery</li>
              <li><strong>Ontario law enforcement</strong> — only when required by court order or legal obligation</li>
            </ul>

            <h2 className={`${h3} text-xl mt-8`}>5. Data Retention</h2>
            <p className={prose}>We retain your personal information for as long as your account is active, plus 7 years thereafter to comply with Canadian tax and business record-keeping requirements. Credential documents (IDs, VSCs, certificates) are deleted from active storage upon account closure but may be retained in secure archives for the legally required period.</p>

            <h2 className={`${h3} text-xl mt-8`}>6. Your Rights Under PIPEDA</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-slate-600">
              <li><strong>Right of Access:</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong>Right to Correct:</strong> Request corrections to inaccurate or incomplete information.</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent to non-essential data processing at any time.</li>
              <li><strong>Right to Deletion:</strong> Request deletion of your account and associated data (subject to legal retention requirements).</li>
            </ul>
            <p className={`${prose} mt-3`}>To exercise any of these rights, contact our Privacy Officer at <span className="text-[#1B3A6B] font-semibold">privacy@getmecare-ontario.com</span>.</p>

            <h2 className={`${h3} text-xl mt-8`}>7. Security</h2>
            <p className={prose}>We implement industry-standard security measures including TLS encryption in transit, AES-256 encryption at rest, row-level security on our Supabase database, and Stripe's PCI-DSS-compliant tokenization for all payment card data. No system is 100% secure — in the event of a data breach, we will notify affected users and the Office of the Privacy Commissioner of Canada as required by law.</p>

            <h2 className={`${h3} text-xl mt-8`}>8. Cookies</h2>
            <p className={prose}>GetMeCare uses essential session cookies for authentication and platform functionality. We do not use advertising tracking cookies. Our analytics, if any, are privacy-preserving and do not identify individual users.</p>

            <h2 className={`${h3} text-xl mt-8`}>9. Contact Our Privacy Officer</h2>
            <p className={prose}>For any privacy-related questions, complaints, or requests, contact our Privacy Officer at <span className="text-[#1B3A6B] font-semibold">privacy@getmecare-ontario.com</span> or write to: GetMeCare Inc., Privacy Officer, Ontario, Canada.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[rgba(15,23,42,0.08)] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#1B3A6B] flex items-center justify-center"><Heart size={11} className="text-white"/></div>
            <span className="font-bold text-[#1B3A6B] text-sm">GetMeCare</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-400">
            {[["Home","landing"],["Trust & Safety","trust"],["Terms","terms"],["Privacy","privacy"]].map(([label,view]) => (
              <button key={label} onClick={() => onNavigate(view as View)} className="hover:text-[#0EA5A0] transition-colors">{label}</button>
            ))}
          </div>
          <p className="text-xs text-slate-400">© 2025 GetMeCare Inc. · Not an employment agency</p>
        </div>
      </footer>
    </div>
  );
}
