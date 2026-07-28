import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

const EDGE = "https://byjjcosogvygegjnmunv.supabase.co/functions/v1/make-server-f62a5d52";

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sessionId = params.get("session_id");
    const userId = params.get("user_id");
    if (!sessionId || !userId) { setStatus("error"); setMessage("Invalid payment link."); return; }

    fetch(`${EDGE}/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, user_id: userId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) { setStatus("success"); }
        else { setStatus("error"); setMessage(data.error ?? "Payment could not be verified."); }
      })
      .catch(() => { setStatus("error"); setMessage("Network error. Contact support."); });
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F5FA] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-sm border border-[rgba(15,23,42,0.08)] p-10 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 size={48} className="text-[#0EA5A0] animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900">Verifying your payment…</h1>
            <p className="text-slate-400 text-sm mt-2">Please wait a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={36} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Payment Confirmed</h1>
            <p className="text-emerald-700 font-semibold mb-1">Account Activated</p>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Your $39.00 vetting fee has been received. You now have full access to our directory of verified PSWs and caregivers across Ontario.
            </p>
            <button
              onClick={() => navigate("/dashboard/employer")}
              className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold hover:bg-[#0EA5A0] transition-colors"
            >
              Go to My Dashboard →
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle size={36} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Payment Verification Failed</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-semibold hover:bg-[#0EA5A0] transition-colors"
            >
              Return Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
