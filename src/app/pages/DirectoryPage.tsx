import { useState, useEffect } from "react";
import { Heart, ArrowLeft, Search, MapPin, Star, CheckCircle, Filter, ArrowRight, Loader2 } from "lucide-react";
import type { AuthMode, Role, View } from "../types";
import { fetchAllCaregivers } from "../lib/db";

interface Props {
  onAuth: (mode: AuthMode, role?: Role) => void;
  onNavigate: (view: View) => void;
}

const AVATAR_COLORS = ["bg-[#0EA5A0]","bg-[#1B3A6B]","bg-violet-600","bg-rose-500","bg-amber-600","bg-emerald-600","bg-sky-600","bg-fuchsia-600"];

// Fallback mock data shown while DB loads or if empty
const MOCK_FALLBACK = [
  { id:"m1", full_name:"Adaeze O.",   display_name:"Adaeze O.",   city:"Toronto",     psw_role:"psw",       hourly_rate:24, rating:4.9, review_count:31, languages:["English","Igbo"],           care_types:["Personal Care","Companion Care"],               verified:true  },
  { id:"m2", full_name:"Maria S.",    display_name:"Maria S.",    city:"Mississauga", psw_role:"companion", hourly_rate:22, rating:4.7, review_count:18, languages:["English","Tagalog"],          care_types:["Companion Care","Meal Prep"],                   verified:true  },
  { id:"m3", full_name:"James A.",    display_name:"James A.",    city:"Ottawa",      psw_role:"psw",       hourly_rate:26, rating:5.0, review_count:44, languages:["English","French"],            care_types:["Personal Care","Specialized Care"],            verified:true  },
  { id:"m4", full_name:"Priya M.",    display_name:"Priya M.",    city:"Toronto",     psw_role:"companion", hourly_rate:21, rating:4.6, review_count:12, languages:["English","Hindi","Punjabi"],   care_types:["Companion Care","Light Housekeeping"],         verified:false },
  { id:"m5", full_name:"Fatima K.",   display_name:"Fatima K.",   city:"Mississauga", psw_role:"psw",       hourly_rate:25, rating:4.8, review_count:27, languages:["English","Arabic","French"],   care_types:["Personal Care","Specialized Care","Errands"],  verified:true  },
  { id:"m6", full_name:"Grace N.",    display_name:"Grace N.",    city:"Ottawa",      psw_role:"companion", hourly_rate:20, rating:4.5, review_count:9,  languages:["English","French"],            care_types:["Companion Care","Cognitive Games"],            verified:true  },
  { id:"m7", full_name:"Emmanuel T.", display_name:"Emmanuel T.", city:"Toronto",     psw_role:"psw",       hourly_rate:27, rating:4.9, review_count:38, languages:["English","French","Twi"],       care_types:["Personal Care","Specialized Care"],            verified:true  },
  { id:"m8", full_name:"Sophie L.",   display_name:"Sophie L.",   city:"Mississauga", psw_role:"companion", hourly_rate:23, rating:4.8, review_count:21, languages:["English","Mandarin"],          care_types:["Companion Care","Meal Prep","Errands"],        verified:true  },
];

export function DirectoryPage({ onAuth, onNavigate }: Props) {
  const [city,         setCity]         = useState("All");
  const [service,      setService]      = useState("All");
  const [lang,         setLang]         = useState("All");
  const [maxRate,      setMaxRate]      = useState(60);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [query,        setQuery]        = useState("");

  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    document.title = "Find PSW Caregivers Near You | GetMeCare";
  }, []);

  // Fetch live data from Supabase
  useEffect(() => {
    setLoading(true);
    fetchAllCaregivers({ city, service, lang, maxRate, verifiedOnly }).then(({ data }) => {
      setCaregivers(data.length > 0 ? data : MOCK_FALLBACK);
      setLoading(false);
    }).catch(() => {
      setCaregivers(MOCK_FALLBACK);
      setLoading(false);
    });
  }, [city, service, lang, maxRate, verifiedOnly]);

  // Client-side text search
  const filtered = caregivers.filter(c => {
    if (!query) return true;
    const name = (c.display_name ?? c.full_name ?? "").toLowerCase();
    return name.includes(query.toLowerCase()) || (c.city ?? "").toLowerCase().includes(query.toLowerCase());
  });

  const sel = "w-full px-3 py-2 rounded-xl bg-white border border-[rgba(15,23,42,0.10)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/40 text-slate-700";

  return (
    <div className="min-h-screen bg-[#F2F5FA]" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-[rgba(15,23,42,0.08)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate("landing")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1B3A6B] transition-colors">
              <ArrowLeft size={15} />Back
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1B3A6B] flex items-center justify-center"><Heart size={13} className="text-white" /></div>
              <span className="font-bold text-[#1B3A6B]">GetMeCare</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onAuth("login")} className="text-sm font-semibold text-[#1B3A6B] px-4 py-2 hover:text-[#0EA5A0] transition-colors">Sign In</button>
            <button onClick={() => onAuth("signup","family")} className="text-sm font-semibold bg-[#1B3A6B] text-white px-4 py-2 rounded-xl hover:bg-[#0EA5A0] transition-colors">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-[#1B3A6B] py-14">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-extrabold text-white mb-3">Find a Caregiver in Ontario</h1>
          <p className="text-white/65 text-lg mb-8">Browse verified, background-checked PSWs and companions across Toronto, Ottawa &amp; Mississauga.</p>
          <div className="max-w-lg mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or city…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/50 shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex gap-8">

          {/* Filter sidebar */}
          <aside className="w-64 shrink-0 hidden md:block">
            <div className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5 space-y-5 sticky top-24">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900 flex items-center gap-2"><Filter size={15} />Filters</p>
                <button onClick={() => { setCity("All"); setService("All"); setLang("All"); setMaxRate(60); setVerifiedOnly(false); setQuery(""); }}
                  className="text-xs text-[#0EA5A0] hover:underline">Clear all</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">City</label>
                <select value={city} onChange={e => setCity(e.target.value)} className={sel}>
                  {["All","Toronto","Ottawa","Mississauga"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Service Needed</label>
                <select value={service} onChange={e => setService(e.target.value)} className={sel}>
                  {["All","Personal Care","Companion Care","Specialized Care","Meal Prep","Errands"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Language</label>
                <select value={lang} onChange={e => setLang(e.target.value)} className={sel}>
                  {["All","English","French","Tagalog","Mandarin","Hindi","Arabic","Punjabi"].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Max Rate: <span className="text-[#1B3A6B] font-bold">${maxRate}/hr</span>
                </label>
                <input type="range" min={18} max={60} value={maxRate} onChange={e => setMaxRate(Number(e.target.value))} className="w-full accent-[#0EA5A0]" />
                <div className="flex justify-between text-xs text-slate-400 mt-1"><span>$18</span><span>$60+</span></div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer" onClick={() => setVerifiedOnly(v => !v)}>
                <div className={`w-10 h-5 rounded-full transition-colors flex items-center ${verifiedOnly ? "bg-[#0EA5A0]" : "bg-slate-200"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow mx-0.5 transition-transform ${verifiedOnly ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-sm font-medium text-slate-700">Verified Only</span>
              </label>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-500">
                {loading ? <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" />Loading caregivers…</span>
                  : <><span className="font-semibold text-slate-900">{filtered.length}</span> caregivers found</>}
              </p>
              {verifiedOnly && <span className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-200"><CheckCircle size={12} />Verified only</span>}
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5 animate-pulse">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-200" />
                      <div className="flex-1"><div className="h-4 bg-slate-200 rounded mb-2 w-24" /><div className="h-3 bg-slate-100 rounded w-32" /></div>
                    </div>
                    <div className="h-3 bg-slate-100 rounded mb-2" /><div className="h-3 bg-slate-100 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Search size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-medium">No caregivers match your filters.</p>
                <p className="text-sm mt-1">Try adjusting your search or <button onClick={() => { setCity("All"); setService("All"); setLang("All"); }} className="text-[#0EA5A0] underline">clear filters</button>.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                {filtered.map((c, i) => (
                  <div key={c.id} className="bg-white rounded-2xl border border-[rgba(15,23,42,0.10)] p-5 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                        {(c.display_name ?? c.full_name ?? "?").substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900">{c.display_name ?? c.full_name}</p>
                          {c.verified && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                              <CheckCircle size={9} />Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#0EA5A0] font-medium">{c.psw_role === "psw" ? "Certified PSW" : "Companion Caregiver"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <MapPin size={11} className="text-slate-400" />
                          <span className="text-xs text-slate-500">{c.city}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-[#1B3A6B] font-mono">${c.hourly_rate}<span className="text-xs font-normal text-slate-400">/hr</span></p>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <Star size={11} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs font-semibold text-slate-700">{Number(c.rating ?? 5).toFixed(1)}</span>
                          <span className="text-xs text-slate-400">({c.review_count ?? 0})</span>
                        </div>
                      </div>
                    </div>

                    {c.care_types && c.care_types.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {c.care_types.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-[11px] bg-[#E8EEF8] text-[#1B3A6B] px-2 py-0.5 rounded-lg font-medium">{s.split("—")[0].trim()}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(c.languages ?? []).slice(0, 2).map((l: string) => (
                          <span key={l} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{l}</span>
                        ))}
                        {(c.languages ?? []).length > 2 && <span className="text-[10px] text-slate-400">+{c.languages.length - 2}</span>}
                      </div>
                      <button onClick={() => onAuth("signup","family")}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1B3A6B] px-4 py-2 rounded-xl hover:bg-[#0EA5A0] transition-colors">
                        Contact <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
