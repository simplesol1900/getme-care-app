import { useState, useEffect, useRef } from "react";
import {
  Heart, ArrowLeft, Send, Lock, AlertCircle,
  MessageSquare, CheckCircle, Clock, Search, Shield,
} from "lucide-react";
import type { AppUser, View } from "../types";

// Masks phone numbers and email addresses in message text
function maskContactInfo(text: string): string {
  return text
    .replace(/\b[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}\b/g, "[email hidden]")
    .replace(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, "[phone hidden]")
    .replace(/\b\d{10}\b/g, "[phone hidden]");
}

interface Thread {
  id: string;
  other_user_id: string;
  other_name: string;
  other_role: "family" | "caregiver";
  last_message: string;
  last_time: string;
  unread: number;
  bid_accepted: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
  is_mine: boolean;
}

// Mock data for demonstration when no live data is available
const MOCK_THREADS: Thread[] = [
  {
    id: "th1",
    other_user_id: "u_nguyen",
    other_name: "The Nguyen Family",
    other_role: "family",
    last_message: "Thank you for submitting your bid! We would love to discuss further.",
    last_time: "2h ago",
    unread: 2,
    bid_accepted: true,
  },
  {
    id: "th2",
    other_user_id: "u_chen",
    other_name: "Chen Household",
    other_role: "family",
    last_message: "Can you confirm your availability on weekends?",
    last_time: "Yesterday",
    unread: 0,
    bid_accepted: false,
  },
  {
    id: "th3",
    other_user_id: "u_williams",
    other_name: "The Williams Family",
    other_role: "family",
    last_message: "We have reviewed your profile and are very impressed.",
    last_time: "3 days ago",
    unread: 0,
    bid_accepted: true,
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  th1: [
    { id: "m1", sender_id: "u_nguyen", sender_name: "Nguyen Family", body: "Hello! We saw your profile and think you would be a great fit for our mother.", created_at: "10:32 AM", is_mine: false },
    { id: "m2", sender_id: "me", sender_name: "You", body: "Thank you so much! I have 7 years of experience with elderly care and would love to discuss your needs.", created_at: "10:45 AM", is_mine: true },
    { id: "m3", sender_id: "u_nguyen", sender_name: "Nguyen Family", body: "We need care 5 mornings a week, 4 hours per shift. Would that work for your schedule?", created_at: "11:02 AM", is_mine: false },
    { id: "m4", sender_id: "me", sender_name: "You", body: "Yes, mornings work perfectly for me. I am available Monday through Friday 8 AM to 2 PM.", created_at: "11:15 AM", is_mine: true },
    { id: "m5", sender_id: "u_nguyen", sender_name: "Nguyen Family", body: "Thank you for submitting your bid! We would love to discuss further.", created_at: "2h ago", is_mine: false },
  ],
  th2: [
    { id: "m1", sender_id: "u_chen", sender_name: "Chen Household", body: "Hi, we are looking for post-surgery PSW support starting next week.", created_at: "Yesterday", is_mine: false },
    { id: "m2", sender_id: "me", sender_name: "You", body: "Hello! I have experience with post-surgical care. Could you share more details about the patient's needs?", created_at: "Yesterday", is_mine: true },
    { id: "m3", sender_id: "u_chen", sender_name: "Chen Household", body: "Can you confirm your availability on weekends?", created_at: "Yesterday", is_mine: false },
  ],
  th3: [
    { id: "m1", sender_id: "u_williams", sender_name: "Williams Family", body: "We have reviewed your profile and are very impressed.", created_at: "3 days ago", is_mine: false },
  ],
};

export function ChatPage({
  user,
  onNavigate,
  onSignOut,
}: {
  user: AppUser;
  onNavigate: (v: View) => void;
  onSignOut: () => void;
}) {
  const [threads, setThreads] = useState<Thread[]>(MOCK_THREADS);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeThread) {
      setMessages(MOCK_MESSAGES[activeThread.id] ?? []);
      // Mark as read
      setThreads(prev =>
        prev.map(t => t.id === activeThread.id ? { ...t, unread: 0 } : t)
      );
    }
  }, [activeThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !activeThread) return;
    const masked = maskContactInfo(input.trim());
    const newMsg: Message = {
      id: `m_${Date.now()}`,
      sender_id: user.id,
      sender_name: "You",
      body: masked,
      created_at: "Just now",
      is_mine: true,
    };
    setMessages(prev => [...prev, newMsg]);
    setThreads(prev =>
      prev.map(t => t.id === activeThread.id
        ? { ...t, last_message: masked, last_time: "Just now" }
        : t
      )
    );
    setInput("");
  };

  const filtered = threads.filter(t =>
    t.other_name.toLowerCase().includes(search.toLowerCase())
  );

  const dashView: View = user.role === "caregiver" ? "caregiver" : "family";

  return (
    <div className="min-h-screen bg-[#F2F5FA] flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[rgba(15,23,42,0.08)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate(dashView)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1B3A6B] transition-colors">
              <ArrowLeft size={14} /> Dashboard
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1B3A6B] flex items-center justify-center">
                <Heart size={12} className="text-white" />
              </div>
              <span className="font-bold text-[#1B3A6B]">GetMeCare</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-[#F2F5FA] border border-[rgba(15,23,42,0.08)] rounded-full px-3 py-1.5">
              <Lock size={11} className="text-[#0EA5A0]" />
              End-to-end secure
            </div>
            <button onClick={onSignOut} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Sign Out</button>
          </div>
        </div>
      </nav>

      {/* Contact mask notice */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center gap-2.5">
          <Shield size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Privacy Protection Active:</span> Phone numbers and email addresses are automatically masked until a bid is officially accepted by both parties.
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">
        <div className="flex gap-5 h-[calc(100vh-160px)]">

          {/* Thread list */}
          <div className="w-80 shrink-0 bg-white rounded-2xl border border-[rgba(15,23,42,0.08)] shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[rgba(15,23,42,0.08)]">
              <h2 className="font-bold text-slate-900 text-base mb-3">Messages</h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#F2F5FA] border border-[rgba(15,23,42,0.08)] text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]/40"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 && (
                <div className="p-6 text-center">
                  <MessageSquare size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No conversations yet</p>
                </div>
              )}
              {filtered.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => setActiveThread(thread)}
                  className={`w-full text-left p-4 border-b border-[rgba(15,23,42,0.06)] hover:bg-[#F2F5FA] transition-colors ${activeThread?.id === thread.id ? "bg-[#EEF2FF]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#1B3A6B] flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{thread.other_name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 leading-tight">{thread.other_name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {thread.bid_accepted ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                              <CheckCircle size={9} /> Bid Accepted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                              <Clock size={9} /> Pending Bid
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-slate-400">{thread.last_time}</span>
                      {thread.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#1B3A6B] text-white text-[10px] font-bold flex items-center justify-center">{thread.unread}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 truncate ml-10">{thread.last_message}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Message pane */}
          <div className="flex-1 bg-white rounded-2xl border border-[rgba(15,23,42,0.08)] shadow-sm flex flex-col overflow-hidden">
            {!activeThread ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mb-4">
                  <MessageSquare size={28} className="text-[#1B3A6B]" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Your Secure Inbox</h3>
                <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                  Select a conversation from the left to start messaging. Contact details are only revealed after a bid is accepted.
                </p>
                <div className="mt-6 bg-[#F2F5FA] rounded-xl px-5 py-4 max-w-sm">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-[#0EA5A0] mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sharing phone numbers or emails before bid acceptance violates platform rules and may result in account suspension.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="px-6 py-4 border-b border-[rgba(15,23,42,0.08)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1B3A6B] flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{activeThread.other_name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{activeThread.other_name}</p>
                    <div className="flex items-center gap-1.5">
                      {activeThread.bid_accepted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <CheckCircle size={10} /> Bid Accepted · Full contact unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                          <Lock size={10} /> Contact masked until bid accepted
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.is_mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-md ${msg.is_mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        {!msg.is_mine && (
                          <span className="text-[11px] text-slate-400 ml-1">{msg.sender_name}</span>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.is_mine
                            ? "bg-[#1B3A6B] text-white rounded-br-sm"
                            : "bg-[#F2F5FA] text-slate-900 border border-[rgba(15,23,42,0.08)] rounded-bl-sm"
                        }`}>
                          {msg.body}
                        </div>
                        <span className="text-[10px] text-slate-400 mx-1">{msg.created_at}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 pb-4">
                  <div className="flex items-end gap-2 bg-[#F2F5FA] border border-[rgba(15,23,42,0.10)] rounded-2xl p-2">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Type a message... (phone/email auto-masked if bid pending)"
                      rows={2}
                      className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-slate-400 px-2 py-1"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim()}
                      className="w-9 h-9 rounded-xl bg-[#1B3A6B] flex items-center justify-center shrink-0 hover:bg-[#0EA5A0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send size={15} className="text-white" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center flex items-center justify-center gap-1">
                    <Lock size={9} /> Messages are monitored for contact info leakage · Platform rules apply
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
