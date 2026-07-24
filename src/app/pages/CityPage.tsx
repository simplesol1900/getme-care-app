import { useEffect } from "react";
import { Heart, ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, GraduationCap, CreditCard, MapPin, Star } from "lucide-react";
import type { AuthMode, Role, View } from "../types";

interface CityConfig {
  title: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  subheadline: string;
  count: string;
  tag: string;
  heroImg: string;
  serviceHeading: string;
  services: { title: string; desc: string }[];
  caregivers: { name: string; role: string; rate: number; rating: number; langs: string[]; initials: string; color: string }[];
  localTrust: string;
}

const CITY_CONFIGS: Record<string, CityConfig> = {
  toronto: {
    title: "Elderly Care Toronto",
    metaTitle: "Elderly Care & PSW Services in Toronto | GetMeCare",
    metaDescription: "Find certified PSWs and elderly care companions in Toronto. Browse background-checked independent caregivers and hire direct on getmecare-ontario.com.",
    headline: "Trusted Elderly Care & PSW Services in Toronto",
    subheadline: "Toronto's most trusted independent PSW marketplace. Find background-checked, college-certified Personal Support Workers in your Toronto neighbourhood.",
    count: "200+",
    tag: "Elderly Care Toronto",
    heroImg: "https://images.unsplash.com/photo-1576765608622-067973a79f53?w=800&h=400&fit=crop&auto=format",
    serviceHeading: "Toronto Elderly Care Services We Match",
    services: [
      { title: "Personal Support (PSW)", desc: "Bathing, dressing, grooming, toileting, and medication reminders delivered by Ontario College-certified PSWs across Toronto." },
      { title: "Elderly Companion Care", desc: "Socialization, cognitive games, light housekeeping, and meal preparation — keeping your loved one engaged and independent at home." },
      { title: "Specialized Dementia Care", desc: "Experienced caregivers trained in Alzheimer's, dementia, and palliative support available throughout Toronto's neighbourhoods." },
      { title: "Post-Surgery Recovery", desc: "Short-term intensive support following hospital discharge — available on-demand across Scarborough, North York, Etobicoke, and downtown Toronto." },
    ],
    caregivers: [
      { name: "Adaeze O.", role: "Certified PSW", rate: 24, rating: 4.9, langs: ["English","Igbo"], initials: "AO", color: "bg-[#0EA5A0]" },
      { name: "Emmanuel T.", role: "Certified PSW", rate: 27, rating: 4.9, langs: ["English","Twi","French"], initials: "ET", color: "bg-[#1B3A6B]" },
      { name: "Priya M.", role: "Companion Caregiver", rate: 21, rating: 4.6, langs: ["English","Hindi","Punjabi"], initials: "PM", color: "bg-violet-600" },
    ],
    localTrust: "Serving all Toronto neighbourhoods: Downtown, Scarborough, North York, Etobicoke, East York, and beyond.",
  },
  ottawa: {
    title: "PSW Caregivers Ottawa",
    metaTitle: "PSW Caregivers & Home Care in Ottawa | GetMeCare",
    metaDescription: "Find certified independent PSWs and home care companions in Ottawa. Browse verified bilingual caregiver profiles and hire direct on getmecare-ontario.com.",
    headline: "Certified PSW Caregivers in Ottawa",
    subheadline: "Ottawa's premier independent caregiver marketplace. Connect with bilingual, background-checked Personal Support Workers across Ottawa and Gatineau.",
    count: "80+",
    tag: "PSW Caregivers Ottawa",
    heroImg: "https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?w=800&h=400&fit=crop&auto=format",
    serviceHeading: "Ottawa Home Care Services We Match",
    services: [
      { title: "Bilingual PSW Support", desc: "French and English-speaking certified PSWs available across Ottawa and Gatineau for personal care and daily living assistance." },
      { title: "Senior Companion Care", desc: "Socialization, meal prep, light housekeeping, and errand support — keeping Ottawa seniors active and connected at home." },
      { title: "Specialized Memory Care", desc: "Trained caregivers experienced in Alzheimer's and dementia support available throughout Ottawa's residential communities." },
      { title: "Respite & Overnight Care", desc: "Flexible single-shift or overnight caregiver coverage — perfect for Ottawa families who need a break or emergency backup support." },
    ],
    caregivers: [
      { name: "James A.", role: "Certified PSW", rate: 26, rating: 5.0, langs: ["English","French"], initials: "JA", color: "bg-emerald-600" },
      { name: "Grace N.", role: "Companion Caregiver", rate: 20, rating: 4.5, langs: ["English","French"], initials: "GN", color: "bg-sky-600" },
      { name: "Ibrahim M.", role: "Certified PSW", rate: 25, rating: 4.8, langs: ["English","French","Arabic"], initials: "IM", color: "bg-amber-600" },
    ],
    localTrust: "Serving all Ottawa communities: Kanata, Barrhaven, Gloucester, Nepean, Orleans, and Gatineau across the river.",
  },
  mississauga: {
    title: "Home Companions Mississauga",
    metaTitle: "Home Companions & PSW Care in Mississauga | GetMeCare",
    metaDescription: "Find trusted home companions and certified PSWs in Mississauga. Browse verified independent caregiver profiles and hire direct on getmecare-ontario.com.",
    headline: "Trusted Home Companions & PSW Care in Mississauga",
    subheadline: "Mississauga's trusted caregiver marketplace. Find multilingual, background-checked companions and PSWs serving all Mississauga communities.",
    count: "120+",
    tag: "Home Companions Mississauga",
    heroImg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop&auto=format",
    serviceHeading: "Mississauga Care Services We Match",
    services: [
      { title: "Multilingual Companion Care", desc: "Tagalog, Mandarin, Urdu, Hindi, and English-speaking companions available to connect culturally with Mississauga seniors." },
      { title: "Personal Support (PSW)", desc: "Ontario College-certified PSWs providing bathing, grooming, and daily living support across Mississauga and Brampton." },
      { title: "Senior Socialization", desc: "Cognitive games, light exercise, meal preparation, and errand support to keep Mississauga seniors active and engaged." },
      { title: "Weekend & Overnight Respite", desc: "Flexible weekend and overnight coverage for Mississauga families who need planned or emergency backup caregiver support." },
    ],
    caregivers: [
      { name: "Maria S.", role: "Companion Caregiver", rate: 22, rating: 4.7, langs: ["English","Tagalog"], initials: "MS", color: "bg-rose-500" },
      { name: "Fatima K.", role: "Certified PSW", rate: 25, rating: 4.8, langs: ["English","Arabic","French"], initials: "FK", color: "bg-violet-600" },
      { name: "Sophie L.", role: "Companion Caregiver", rate: 23, rating: 4.8, langs: ["English","Mandarin"], initials: "SL", color: "bg-fuchsia-600" },
    ],
    localTrust: "Serving all Mississauga communities: Port Credit, Streetsville, Meadowvale, Cooksville, Malton, and surrounding Brampton.",
  },
};

export function CityPage({ city, onAuth, onNavigate }: {
  city: "toronto" | "ottawa" | "mississauga";
  onAuth: (mode: AuthMode, role?: Role) => void;
  onNavigate: (view: View) => void;
}) {
  const cfg = CITY_CONFIGS[city];

  useEffect(() => {
    document.title = cfg.metaTitle;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) { desc = document.createElement("meta"); desc.setAttribute("name","description"); document.head.appendChild(desc); }
    desc.setAttribute("content", cfg.metaDescription);
  }, [cfg]);

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
      <div className="relative">
        <div className="h-72 bg-slate-800 overflow-hidden">
          <img src={cfg.heroImg} alt={cfg.title} className="w-full h-full object-cover opacity-40"/>
        </div>
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
              <MapPin size={12}/>{cfg.tag}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight max-w-3xl mb-4">
              {cfg.headline}
            </h1>
            <p className="text-white/75 text-lg max-w-2xl leading-relaxed">{cfg.subheadline}</p>
          </div>
        </div>
      </div>

      {/* Stats + CTAs */}
      <div className="bg-white border-b border-[rgba(15,23,42,0.08)]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            {[
              { val: cfg.count, label: "Verified Caregivers" },
              { val: "48h", label: "Avg. Matching Time" },
              { val: "4.8★", label: "Average Rating" },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-[#1B3A6B]">{val}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => onAuth("signup","family")} className="flex items-center gap-2 bg-[#1B3A6B] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#0EA5A0] transition-colors text-sm">
              Find a Caregiver <ArrowRight size={15}/>
            </button>
            <button onClick={() => onNavigate("directory")} className="flex items-center gap-2 border-2 border-[#1B3A6B] text-[#1B3A6B] px-5 py-3 rounded-xl font-semibold hover:bg-[#E8EEF8] transition-colors text-sm">
              Browse All
            </button>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, label: "100% Ontario Vulnerable Sector Checked", desc: "Every caregiver passes a police background check before their profile goes live." },
            { icon: GraduationCap, label: "Verified College PSW Certifications", desc: "We verify active Ontario College PSW certificates for every registered PSW." },
            { icon: CreditCard, label: "Secure Direct Payments via getmecare-ontario.com", desc: "Families pay caregivers directly. No agency markup. Our 15% fee is charged to caregivers only." },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0"><Icon size={20} className="text-[#0EA5A0]"/></div>
              <div>
                <p className="font-semibold text-slate-900 text-sm mb-1">{label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-white border-y border-[rgba(15,23,42,0.08)] py-14">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">{cfg.serviceHeading}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {cfg.services.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                  {String(i+1).padStart(2,"0")}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Caregivers */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Featured {cfg.title.split(" ")[0]} Caregivers</h2>
          <button onClick={() => onNavigate("directory")} className="text-sm text-[#0EA5A0] font-semibold hover:underline flex items-center gap-1">
            View all <ArrowRight size={14}/>
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {cfg.caregivers.map(c => (
            <div key={c.name} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center text-white font-bold shrink-0`}>
                  {c.initials}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{c.name}</p>
                  <p className="text-sm text-[#0EA5A0] font-medium">{c.role}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={11} className="text-amber-400 fill-amber-400"/>
                    <span className="text-xs font-semibold text-slate-700">{c.rating}</span>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-lg font-bold text-[#1B3A6B] font-mono">${c.rate}<span className="text-xs font-normal text-slate-400">/hr</span></p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {c.langs.map(l => <span key={l} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{l}</span>)}
              </div>
              <div className="flex items-center gap-1.5 mb-4">
                <CheckCircle size={13} className="text-emerald-500"/>
                <span className="text-xs text-emerald-700 font-medium">Verified · Background Checked</span>
              </div>
              <button onClick={() => onAuth("signup","family")} className="w-full py-2 bg-[#1B3A6B] text-white rounded-xl text-sm font-semibold hover:bg-[#0EA5A0] transition-colors">
                Contact Caregiver
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Local trust */}
      <section className="bg-[#1B3A6B] py-14">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <MapPin size={28} className="text-[#0EA5A0] mx-auto mb-4"/>
          <h2 className="text-2xl font-bold text-white mb-3">{cfg.localTrust}</h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">Post a care job today and receive bids from verified caregivers in your postal code within hours.</p>
          <button onClick={() => onAuth("signup","family")} className="flex items-center gap-2 bg-[#0EA5A0] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#0d9489] transition-colors mx-auto">
            Find a Caregiver Now <ArrowRight size={17}/>
          </button>
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
            {[["Home","landing"],["Find Caregivers","directory"],["Trust & Safety","trust"],["Terms","terms"],["Privacy","privacy"]].map(([label,view]) => (
              <button key={label} onClick={() => onNavigate(view as View)} className="hover:text-[#0EA5A0] transition-colors">{label}</button>
            ))}
          </div>
          <p className="text-xs text-slate-400">© 2025 GetMeCare Inc.</p>
        </div>
      </footer>
    </div>
  );
}
