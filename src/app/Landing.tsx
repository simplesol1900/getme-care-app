import { useState, useEffect } from "react";
import {
  Heart, Shield, ArrowRight, CheckCircle, Award,
  Plus, UserCheck, Banknote, Lock, Zap, Briefcase,
  ShieldCheck, GraduationCap, CreditCard, Search, FileCheck,
  DollarSign, Clock, MapPin,
} from "lucide-react";
import type { AuthMode, Role, View } from "./types";
import { Badge } from "./shared";

export function Landing({ onAuth, onNavigate }: {
  onAuth: (mode: AuthMode, role?: Role) => void;
  onNavigate: (view: View) => void;
}) {
  const [howTab, setHowTab] = useState<"families" | "caregivers">("families");

  useEffect(() => {
    document.title = "PSW & Elderly Care Toronto, Ottawa, Mississauga | GetMeCare";
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) { desc = document.createElement("meta"); desc.setAttribute("name","description"); document.head.appendChild(desc); }
    desc.setAttribute("content", "Find certified independent PSWs, elderly care, and companions in Toronto, Ottawa & Mississauga. Browse verified profiles and hire direct on getmecare-ontario.com.");
    let kw = document.querySelector('meta[name="keywords"]');
    if (!kw) { kw = document.createElement("meta"); kw.setAttribute("name","keywords"); document.head.appendChild(kw); }
    kw.setAttribute("content", "personal support worker, elderly care toronto, private caregiver ottawa, home companions mississauga, hire psw ontario, independent caregiver marketplace");
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F5FA]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-[rgba(15,23,42,0.08)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1B3A6B] flex items-center justify-center"><Heart size={14} className="text-white" /></div>
            <span className="font-bold text-[#1B3A6B] text-lg">GetMeCare</span>
            <Badge color="navy">Ontario</Badge>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <button onClick={() => onNavigate("directory")} className="text-sm text-slate-600 hover:text-[#1B3A6B] px-3 py-2 transition-colors">Find Caregivers</button>
            <button onClick={() => onNavigate("how-it-works")} className="text-sm text-slate-600 hover:text-[#1B3A6B] px-3 py-2 transition-colors">How It Works</button>
            <button onClick={() => onAuth("login")} className="text-sm font-semibold text-[#1B3A6B] hover:text-[#0EA5A0] px-4 py-2 transition-colors">Sign In</button>
            <button onClick={() => onAuth("signup", "family")} className="text-sm font-semibold bg-[#1B3A6B] text-white px-4 py-2 rounded-xl hover:bg-[#0EA5A0] transition-colors">Get Started</button>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <button onClick={() => onAuth("login")} className="text-sm font-semibold text-[#1B3A6B] px-3 py-2">Sign In</button>
            <button onClick={() => onAuth("signup", "family")} className="text-sm font-semibold bg-[#1B3A6B] text-white px-4 py-2 rounded-xl">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-5">
            Find Trusted, Certified PSWs and Caregivers in Ontario
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            Hire background-checked independent caregivers directly through <span className="font-semibold text-[#1B3A6B]">getmecare-ontario.com</span>. Save up to 35% on private home care with no long-term agency contracts.
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            <button onClick={() => onAuth("signup", "family")} className="flex items-center gap-2 bg-[#1B3A6B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0EA5A0] transition-colors shadow-md">
              Find a Caregiver <ArrowRight size={17} />
            </button>
            <button onClick={() => onAuth("signup", "caregiver")} className="flex items-center gap-2 border-2 border-[#1B3A6B] text-[#1B3A6B] px-6 py-3 rounded-xl font-semibold hover:bg-[#E8EEF8] transition-colors">
              Join GetMeCare as a PSW
            </button>
          </div>
          <div className="space-y-3">
            {[
              { icon: ShieldCheck, label: "100% Ontario Vulnerable Sector Checked" },
              { icon: GraduationCap, label: "Verified College PSW Certifications" },
              { icon: CreditCard, label: "Secure Direct Payments via getmecare-ontario.com" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon size={20} className="text-[#0EA5A0] shrink-0" />
                <span className="text-sm font-semibold text-slate-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative hidden lg:block">
          <div className="rounded-3xl overflow-hidden shadow-2xl bg-slate-200">
            <img src="https://images.unsplash.com/photo-1576765608622-067973a79f53?w=640&h=480&fit=crop&auto=format" alt="Caregiver with elderly person" className="w-full h-[420px] object-cover" />
          </div>
          <div className="absolute -bottom-5 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-[rgba(15,23,42,0.08)]">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle size={17} className="text-emerald-600" /></div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Verified Badge</p>
              <p className="text-sm font-semibold text-slate-900">PSW Certificate Active</p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="bg-white border-y border-[rgba(15,23,42,0.08)] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">
              Tired of Expensive Ontario Home Care Agencies?
            </h2>
            <div className="space-y-4 text-slate-600 leading-relaxed text-lg">
              <p>
                Traditional senior care agencies across Ontario charge families sky-high rates, yet they pay caregivers minimum wage. This leads to high worker turnover and inconsistent care for your loved ones.
              </p>
              <p>
                <span className="font-bold text-[#1B3A6B]">GetMeCare</span> changes everything. Our platform connects Ontario families directly with independent Personal Support Workers (PSWs) and home health aides. By removing the corporate agency middleman, families pay less for premium care, and caregivers earn the higher wages they truly deserve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Hire */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">How to Hire Private Caregivers on GetMeCare</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Search, num: "01",
              title: "Step 1: Search Local Profiles",
              desc: "Filter certified Ontario caregivers by city, language, available hours, and specific caregiving expertise.",
            },
            {
              icon: FileCheck, num: "02",
              title: "Step 2: Review Verified Badges",
              desc: "Check active PSW certificates, verified police background logs, and real reviews from local families.",
            },
            {
              icon: CreditCard, num: "03",
              title: "Step 3: Book & Pay Securely",
              desc: "Schedule custom shifts and safely process automated payments directly through the getmecare-ontario.com dashboard.",
            },
          ].map(({ icon: Icon, num, title, desc }) => (
            <div key={num} className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#1B3A6B] flex items-center justify-center mx-auto mb-6">
                <Icon size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
              <p className="text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Safest Marketplace */}
      <section className="bg-white border-y border-[rgba(15,23,42,0.08)] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">
            The Safest Marketplace for Independent Senior Care
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: DollarSign, title: "Affordable Hourly Rates",
                desc: "Set your own care budget and negotiate hourly rates directly with independent contractors.",
              },
              {
                icon: ShieldCheck, title: "Elite Caregiver Vetting",
                desc: "We screen and verify every driver's licence, CPR certificate, and background check before any profile goes live.",
              },
              {
                icon: Clock, title: "On-Demand Respite Care",
                desc: "Easily book a caregiver for a single evening break, a weekend visit, or ongoing daily support.",
              },
              {
                icon: UserCheck, title: "Complete Client Control",
                desc: "You choose your caregiver. You control the schedule. You are always in charge of your home care.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-5 items-start p-6 bg-[#F2F5FA] rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-[#1B3A6B] flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* City Pages */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">We Serve Ontario's Largest Communities</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Verified, background-checked caregivers are available now in these cities.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { view: "toronto" as View, city: "Toronto", tag: "Elderly Care", count: "200+", img: "https://images.unsplash.com/photo-1503512890780-4b51e7f94373?w=400&h=200&fit=crop&auto=format" },
            { view: "ottawa" as View, city: "Ottawa", tag: "PSW Caregivers", count: "80+", img: "https://images.unsplash.com/photo-1611566069891-2c1f0f3c0d4f?w=400&h=200&fit=crop&auto=format" },
            { view: "mississauga" as View, city: "Mississauga", tag: "Home Companions", count: "120+", img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=200&fit=crop&auto=format" },
          ].map(({ view, city, tag, count, img }) => (
            <button key={city} onClick={() => onNavigate(view)}
              className="group text-left bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="h-32 bg-slate-200 overflow-hidden">
                <img src={img} alt={city} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={14} className="text-[#0EA5A0]" />
                  <span className="text-xs font-semibold text-[#0EA5A0] uppercase tracking-wide">{tag}</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{city}</p>
                <p className="text-sm text-slate-500 mt-0.5">{count} verified caregivers available</p>
                <div className="flex items-center gap-1 mt-3 text-[#1B3A6B] font-semibold text-sm group-hover:gap-2 transition-all">
                  Browse caregivers <ArrowRight size={14} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Dual CTA */}
      <section className="bg-[#1B3A6B] py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          {[
            { icon: Heart, color: "#0EA5A0", title: "Find care for your family", desc: "Post a job, review PSW bids, and hire directly. Pay caregivers 100% via Interac — we charge caregivers, not families.", cta: "Find a Caregiver", role: "family" as Role },
            { icon: Briefcase, color: "#F59E0B", title: "Grow your care career", desc: "Set your rate, bid on local jobs, keep 85% of every shift. Platform fee charged after approval — no upfront cost.", cta: "Join GetMeCare as a PSW", role: "caregiver" as Role },
          ].map(({ icon: Icon, color, title, desc, cta, role }) => (
            <div key={title} onClick={() => onAuth("signup", role)}
              className="bg-white/10 border border-white/15 rounded-2xl p-8 cursor-pointer hover:bg-white/15 transition-colors group">
              <Icon size={30} style={{ color }} className="mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-white/55 text-sm mb-6 leading-relaxed">{desc}</p>
              <span className="inline-flex items-center gap-2 font-semibold text-sm group-hover:gap-3 transition-all" style={{ color }}>
                {cta} <ArrowRight size={15} />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[rgba(15,23,42,0.08)] py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#1B3A6B] flex items-center justify-center"><Heart size={12} className="text-white" /></div>
                <span className="font-bold text-[#1B3A6B]">GetMeCare</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">Ontario's trusted marketplace connecting families with independent, pre-vetted PSWs and care companions.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Services</p>
              <div className="space-y-2">
                {[
                  ["Find Caregivers", "directory"],
                  ["Elderly Care Toronto", "toronto"],
                  ["PSW Ottawa", "ottawa"],
                  ["Companions Mississauga", "mississauga"],
                ].map(([label, view]) => (
                  <button key={label} onClick={() => onNavigate(view as View)} className="block text-sm text-slate-500 hover:text-[#1B3A6B] transition-colors">{label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Company</p>
              <div className="space-y-2">
                {[
                  ["How It Works", "how-it-works"],
                  ["Trust & Safety", "trust"],
                  ["Join as PSW", null],
                ].map(([label, view]) => (
                  <button key={label as string} onClick={() => view ? onNavigate(view as View) : onAuth("signup","caregiver")} className="block text-sm text-slate-500 hover:text-[#1B3A6B] transition-colors">{label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Legal</p>
              <div className="space-y-2">
                {[
                  ["Terms of Service", "terms"],
                  ["Privacy Policy", "privacy"],
                ].map(([label, view]) => (
                  <button key={label} onClick={() => onNavigate(view as View)} className="block text-sm text-slate-500 hover:text-[#1B3A6B] transition-colors">{label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-[rgba(15,23,42,0.07)] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">© 2025 GetMeCare Inc. Serving Toronto, Ottawa & Mississauga, Ontario.</p>
            <p className="text-xs text-slate-400">getmecare-ontario.com · Not an employment agency · Independent contractor marketplace</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
