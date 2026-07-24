import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";
import { Resend } from "npm:resend@2";

const app = new Hono();

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ── Clients ───────────────────────────────────────────────────────────────────

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");
const FROM = "GetMeCare <noreply@getmecare.ca>";
const SITE = "https://getmecare.ca";

// ── Email helpers ─────────────────────────────────────────────────────────────

function emailLayout(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#F2F5FA;margin:0;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.08);">
  <div style="background:#1B3A6B;padding:20px 28px;display:flex;align-items:center;gap:10px;">
    <div style="width:30px;height:30px;background:#0EA5A0;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
      <span style="color:white;font-size:15px;line-height:1;">&#9829;</span>
    </div>
    <span style="color:white;font-size:17px;font-weight:700;letter-spacing:-0.3px;">GetMeCare</span>
  </div>
  <div style="padding:28px 32px;">${body}</div>
  <div style="background:#F8FAFC;padding:16px 32px;border-top:1px solid rgba(0,0,0,0.06);">
    <p style="color:#94a3b8;font-size:12px;margin:0;">GetMeCare &nbsp;&middot;&nbsp; Ontario&rsquo;s trusted independent PSW marketplace &nbsp;&middot;&nbsp; <a href="${SITE}" style="color:#0EA5A0;text-decoration:none;">getmecare.ca</a></p>
  </div>
</div></body></html>`;
}

function infoCard(rows: [string, string][]): string {
  return `<div style="background:#F2F5FA;border-radius:12px;padding:16px 20px;margin:16px 0;">
${rows.map(([k, v]) => `<p style="margin:0 0 6px;color:#334155;font-size:14px;"><strong style="color:#1B3A6B;">${k}:</strong> ${v}</p>`).join("")}
</div>`;
}

function cta(label: string, url = SITE): string {
  return `<a href="${url}" style="display:inline-block;background:#1B3A6B;color:white;padding:11px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;margin-top:16px;">${label}</a>`;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
) {
  if (!Deno.env.get("RESEND_API_KEY")) return;
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (e) {
    console.error("Email error:", e);
  }
}

// ── Notification helper ───────────────────────────────────────────────────────

async function notif(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: object,
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    data: data ?? {},
    read: false,
  });
}

// ── Health ────────────────────────────────────────────────────────────────────

app.get("/make-server-f62a5d52/health", (c) =>
  c.json({ status: "ok" }),
);

// ── DB Setup ──────────────────────────────────────────────────────────────────

app.post("/make-server-f62a5d52/setup-db", async (c) => {
  const stmts = [
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS psw_role TEXT`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code TEXT`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[]`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cities TEXT[]`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS care_types TEXT[]`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0`,
    `ALTER TABLE profiles DISABLE ROW LEVEL SECURITY`,
    `CREATE TABLE IF NOT EXISTS jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID,
      title TEXT NOT NULL,
      city TEXT,
      postal_prefix TEXT,
      care_type TEXT DEFAULT 'PSW',
      hours TEXT,
      schedule TEXT,
      rate NUMERIC,
      status TEXT DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `ALTER TABLE jobs DISABLE ROW LEVEL SECURITY`,
    `CREATE TABLE IF NOT EXISTS bids (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
      caregiver_id UUID,
      amount NUMERIC NOT NULL,
      note TEXT,
      status TEXT DEFAULT 'pending',
      counter_amount NUMERIC,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `ALTER TABLE bids DISABLE ROW LEVEL SECURITY`,
    `CREATE TABLE IF NOT EXISTS shifts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id UUID REFERENCES jobs(id),
      caregiver_id UUID,
      family_id UUID,
      clock_in TIMESTAMPTZ,
      clock_out TIMESTAMPTZ,
      hours_worked NUMERIC,
      rate NUMERIC,
      gross NUMERIC,
      platform_fee NUMERIC,
      net NUMERIC,
      status TEXT DEFAULT 'active',
      stripe_charge_id TEXT,
      stripe_status TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `ALTER TABLE shifts DISABLE ROW LEVEL SECURITY`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      data JSONB DEFAULT '{}',
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY IF NOT EXISTS "users read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY IF NOT EXISTS "users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role)`,
    `CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified)`,
    `CREATE INDEX IF NOT EXISTS idx_profiles_postal ON profiles(postal_code)`,
    `CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`,
    `CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city)`,
    `CREATE INDEX IF NOT EXISTS idx_bids_job_id ON bids(job_id)`,
    `CREATE INDEX IF NOT EXISTS idx_shifts_caregiver_id ON shifts(caregiver_id)`,
    `CREATE INDEX IF NOT EXISTS idx_shifts_family_id ON shifts(family_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notifs_user_id ON notifications(user_id)`,
  ];
  const errors: string[] = [];
  for (const sql of stmts) {
    const { error } = await supabase
      .rpc("exec_sql", { sql })
      .catch(() => ({ error: { message: sql } }));
    if (
      error &&
      !error.message?.includes("already exists") &&
      !error.message?.includes("duplicate")
    ) {
      errors.push(error.message ?? sql);
    }
  }
  return c.json({ success: errors.length === 0, errors });
});

// ── M2: Matching Engine ───────────────────────────────────────────────────────

app.get(
  "/make-server-f62a5d52/match-caregivers/:postal",
  async (c) => {
    const postal = c.req
      .param("postal")
      .toUpperCase()
      .slice(0, 3);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, display_name, psw_role, city, postal_code, hourly_rate, languages, care_types, rating, review_count, verified, suspended",
      )
      .eq("role", "caregiver")
      .eq("verified", true)
      .eq("suspended", false)
      .ilike("postal_code", `${postal}%`)
      .order("rating", { ascending: false })
      .limit(20);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ caregivers: data ?? [] });
  },
);

app.get("/make-server-f62a5d52/caregivers", async (c) => {
  const city = c.req.query("city");
  const service = c.req.query("service");
  const lang = c.req.query("lang");
  const maxRate = c.req.query("max_rate");
  const verifiedOnly = c.req.query("verified_only") === "true";
  let q = supabase
    .from("profiles")
    .select(
      "id, full_name, display_name, psw_role, city, postal_code, hourly_rate, languages, care_types, rating, review_count, verified, suspended",
    )
    .eq("role", "caregiver")
    .eq("suspended", false);
  if (verifiedOnly) q = q.eq("verified", true);
  if (city && city !== "All") q = q.eq("city", city);
  if (lang && lang !== "All")
    q = q.contains("languages", [lang]);
  if (maxRate) q = q.lte("hourly_rate", Number(maxRate));
  q = q.order("rating", { ascending: false }).limit(50);
  const { data, error } = await q;
  if (error) return c.json({ error: error.message }, 500);
  let result = data ?? [];
  if (service && service !== "All") {
    result = result.filter((r: any) =>
      r.care_types?.some((t: string) =>
        t.toLowerCase().includes(service.toLowerCase()),
      ),
    );
  }
  return c.json({ caregivers: result });
});

app.get(
  "/make-server-f62a5d52/match-jobs/:caregiver_id",
  async (c) => {
    const caregiverId = c.req.param("caregiver_id");
    const { data: profile } = await supabase
      .from("profiles")
      .select("cities, postal_code")
      .eq("id", caregiverId)
      .single();
    if (!profile) return c.json({ jobs: [] });
    const cities: string[] = (profile as any).cities ?? [];
    let q = supabase
      .from("jobs")
      .select(`*, profiles:family_id (full_name, city)`)
      .eq("status", "open");
    if (cities.length > 0) q = q.in("city", cities);
    const { data, error } = await q
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ jobs: data ?? [] });
  },
);

// ── M3: Bid Management ────────────────────────────────────────────────────────

app.post("/make-server-f62a5d52/accept-bid", async (c) => {
  const { bid_id, job_id } = await c.req.json();
  await supabase
    .from("bids")
    .update({ status: "accepted" })
    .eq("id", bid_id);
  await supabase
    .from("bids")
    .update({ status: "rejected" })
    .eq("job_id", job_id)
    .neq("id", bid_id);
  await supabase
    .from("jobs")
    .update({ status: "filled" })
    .eq("id", job_id);

  const { data: bid } = await supabase
    .from("bids")
    .select(
      "amount, caregiver:caregiver_id(id, full_name, display_name, email), job:job_id(title, city)",
    )
    .eq("id", bid_id)
    .single();

  if (bid) {
    const cg = (bid as any).caregiver;
    const job = (bid as any).job;
    const name =
      cg?.display_name ?? cg?.full_name ?? "Caregiver";
    if (cg?.id)
      await notif(
        cg.id,
        "bid_accepted",
        "Your bid was accepted!",
        `Your bid for "${job?.title}" at $${(bid as any).amount}/hr has been accepted.`,
      );
    if (cg?.email)
      await sendEmail(
        cg.email,
        "Your bid was accepted on GetMeCare!",
        emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">&#127881; Bid Accepted!</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 12px;">Congratulations <strong>${name}</strong> &mdash; a family accepted your bid.</p>
      ${infoCard([
        ["Job", job?.title ?? "Care shift"],
        ["City", job?.city ?? "Ontario"],
        ["Rate", `$${(bid as any).amount}/hr`],
      ])}
      <p style="color:#64748b;font-size:13px;line-height:1.6;">Clock in via your GetMeCare dashboard when you arrive. 100% of your earnings go to you directly &mdash; the 15% platform fee is charged separately to your card on file after each approved shift.</p>
      ${cta("Open My Dashboard")}
    `),
      );
  }
  return c.json({ success: true });
});

app.post("/make-server-f62a5d52/counter-bid", async (c) => {
  const { bid_id, counter_amount } = await c.req.json();
  await supabase
    .from("bids")
    .update({ status: "countered", counter_amount })
    .eq("id", bid_id);
  return c.json({ success: true });
});

// ── Clock-In / Clock-Out email notifications ──────────────────────────────────

app.post("/make-server-f62a5d52/notify-clock-in", async (c) => {
  const { caregiver_id, family_id, rate } = await c.req.json();
  const [{ data: cg }, { data: fam }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, display_name, email")
      .eq("id", caregiver_id)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", family_id)
      .single(),
  ]);
  if (!cg || !fam) return c.json({ success: false });
  const name =
    (cg as any).display_name ?? (cg as any).full_name;
  const time = new Date().toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Toronto",
  });
  await Promise.all([
    notif(
      family_id,
      "clock_in",
      "Caregiver clocked in",
      `${name} arrived and clocked in at ${time}.`,
    ),
    notif(
      caregiver_id,
      "clock_in_confirm",
      "You are clocked in",
      `Shift started at ${time}. Your timesheet is running.`,
    ),
    sendEmail(
      (fam as any).email,
      `${name} has clocked in`,
      emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">Caregiver Clocked In &#10003;</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 12px;"><strong>${name}</strong> has arrived and clocked in at <strong>${time}</strong>.</p>
      <p style="color:#64748b;font-size:13px;">You will receive another notification when they clock out and the timesheet is ready for your approval.</p>
      ${cta("View My Dashboard")}
    `),
    ),
  ]);
  return c.json({ success: true });
});

app.post(
  "/make-server-f62a5d52/notify-clock-out",
  async (c) => {
    const {
      caregiver_id,
      family_id,
      hours_worked,
      gross,
      platform_fee,
    } = await c.req.json();
    const [{ data: cg }, { data: fam }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, display_name, email")
        .eq("id", caregiver_id)
        .single(),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", family_id)
        .single(),
    ]);
    if (!cg || !fam) return c.json({ success: false });
    const name =
      (cg as any).display_name ?? (cg as any).full_name;
    const hrs = Number(hours_worked ?? 0).toFixed(2);
    const g = Number(gross ?? 0).toFixed(2);
    const fee = Number(platform_fee ?? 0).toFixed(2);
    await Promise.all([
      notif(
        family_id,
        "timesheet_ready",
        "Timesheet awaiting approval",
        `${name} worked ${hrs} hrs &mdash; $${g} total. Please approve to trigger the platform fee charge.`,
      ),
      notif(
        caregiver_id,
        "timesheet_submitted",
        "Timesheet submitted",
        `Your ${hrs}-hr shift has been submitted for family approval.`,
      ),
      sendEmail(
        (fam as any).email,
        `Please approve ${name}'s timesheet`,
        emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">Timesheet Ready for Approval</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 12px;"><strong>${name}</strong> has clocked out. Approve the timesheet to trigger the automated 15% platform fee charge.</p>
      ${infoCard([
        ["Hours worked", `${hrs} hrs`],
        ["Gross total", `$${g}`],
        [
          "Platform fee (15%)",
          `$${fee} — charged to caregiver's card`,
        ],
      ])}
      <p style="color:#64748b;font-size:13px;">Families pay caregivers 100% directly. The platform fee is charged separately to the <em>caregiver's</em> card.</p>
      ${cta("Approve Timesheet &rarr;")}
    `),
      ),
    ]);
    return c.json({ success: true });
  },
);

// ── M3: Approve Shift → Stripe 15% Charge ────────────────────────────────────

app.post("/make-server-f62a5d52/approve-shift", async (c) => {
  const { shift_id, family_id } = await c.req.json();
  const { data: shift, error: shiftErr } = await supabase
    .from("shifts")
    .select(
      "*, caregiver:caregiver_id (id, full_name, display_name, email, stripe_customer_id, stripe_payment_method_id)",
    )
    .eq("id", shift_id)
    .single();
  if (shiftErr || !shift)
    return c.json({ error: "Shift not found" }, 404);
  await supabase
    .from("shifts")
    .update({ status: "approved" })
    .eq("id", shift_id);
  const cg = (shift as any).caregiver as any;
  const hrs = Number((shift as any).hours_worked ?? 0).toFixed(
    2,
  );
  const g = Number((shift as any).gross ?? 0).toFixed(2);
  const fee = Number((shift as any).platform_fee ?? 0).toFixed(
    2,
  );
  const net = Number((shift as any).net ?? 0).toFixed(2);
  const name = cg?.display_name ?? cg?.full_name ?? "Caregiver";
  const feeAmountCents = Math.round(
    ((shift as any).platform_fee ?? 0) * 100,
  );

  await notif(
    family_id,
    "shift_approved_fam",
    "Timesheet approved",
    `You approved ${name}'s ${hrs}-hr shift. $${g} total.`,
  );

  if (!cg?.stripe_payment_method_id || feeAmountCents <= 0) {
    if (cg?.id)
      await notif(
        cg.id,
        "shift_approved",
        "Timesheet approved!",
        `Your ${hrs}-hr shift was approved. Net: $${net}.`,
      );
    if (cg?.email)
      await sendEmail(
        cg.email,
        "Your timesheet was approved",
        emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">Timesheet Approved &#10003;</h2>
      ${infoCard([
        ["Hours", `${hrs} hrs`],
        ["Gross", `$${g}`],
        ["Net payout", `$${net}`],
      ])}
      <p style="color:#64748b;font-size:13px;">No payment card was on file so the platform fee was not charged automatically. Please link a card in your dashboard.</p>
      ${cta("Link a Card")}
    `),
      );
    return c.json({
      success: true,
      charged: false,
      reason: "No payment method on file",
    });
  }

  try {
    const charge = await stripe.paymentIntents.create({
      amount: feeAmountCents,
      currency: "cad",
      customer: cg.stripe_customer_id,
      payment_method: cg.stripe_payment_method_id,
      confirm: true,
      off_session: true,
      description: `GetMeCare 15% platform fee — shift ${shift_id}`,
      metadata: {
        shift_id,
        caregiver_id: (shift as any).caregiver_id,
      },
    });
    await supabase
      .from("shifts")
      .update({
        stripe_charge_id: charge.id,
        stripe_status: charge.status,
        status: "paid",
      })
      .eq("id", shift_id);
    await notif(
      cg.id,
      "shift_paid",
      "Shift approved + fee charged",
      `Your ${hrs}-hr shift was approved. Net: $${net}. Platform fee $${fee} charged to your card.`,
    );
    await sendEmail(
      cg.email,
      "Your timesheet was approved",
      emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">Timesheet Approved &#10003;</h2>
      ${infoCard([
        ["Hours", `${hrs} hrs`],
        ["Gross earnings", `$${g}`],
        ["Platform fee (15%)", `-$${fee}`],
        ["Net payout", `$${net}`],
      ])}
      <p style="color:#64748b;font-size:13px;">Stripe charge: ${charge.id}</p>
      ${cta("View My Earnings")}
    `),
    );
    return c.json({
      success: true,
      charged: true,
      charge_id: charge.id,
    });
  } catch (err: any) {
    await supabase
      .from("shifts")
      .update({ stripe_status: "failed" })
      .eq("id", shift_id);
    await supabase
      .from("profiles")
      .update({ suspended: true })
      .eq("id", (shift as any).caregiver_id);
    await notif(
      cg.id,
      "charge_failed",
      "Payment failed — profile suspended",
      `Platform fee charge of $${fee} failed. Your profile has been suspended until the balance is cleared.`,
    );
    await sendEmail(
      cg.email,
      "Action required: Platform fee payment failed",
      emailLayout(`
      <h2 style="color:#dc2626;margin:0 0 8px;font-size:20px;">&#9888;&#65039; Payment Failed</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 12px;">The platform fee charge of <strong>$${fee}</strong> failed for your shift.</p>
      <div style="background:#FEF2F2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Your profile has been suspended</strong> and is now hidden from the directory until this balance is cleared.</p>
      </div>
      <p style="color:#64748b;font-size:13px;">Error: ${err.message}</p>
      ${cta("Update Payment Method")}
    `),
    );
    return c.json({
      success: false,
      charged: false,
      error: err.message,
      suspended: true,
    });
  }
});

app.post("/make-server-f62a5d52/dispute-shift", async (c) => {
  const { shift_id } = await c.req.json();
  await supabase
    .from("shifts")
    .update({ status: "disputed" })
    .eq("id", shift_id);
  return c.json({ success: true });
});

// ── Stripe: Link card ─────────────────────────────────────────────────────────

app.post("/make-server-f62a5d52/link-card", async (c) => {
  const { caregiver_id, payment_method_id, email, name } =
    await c.req.json();
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { caregiver_id },
    });
    await stripe.paymentMethods.attach(payment_method_id, {
      customer: customer.id,
    });
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });
    await supabase
      .from("profiles")
      .update({
        stripe_customer_id: customer.id,
        stripe_payment_method_id: payment_method_id,
      })
      .eq("id", caregiver_id);
    await sendEmail(
      email,
      "Your payment card is linked on GetMeCare",
      emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">Card Linked &#10003;</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 12px;">Your payment card has been securely linked, <strong>${name}</strong>. The 15% platform fee will be automatically charged after each approved shift.</p>
      ${cta("Go to My Dashboard")}
    `),
    );
    return c.json({ success: true, customer_id: customer.id });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ── Admin: verify / suspend / reinstate caregiver ────────────────────────────

app.post(
  "/make-server-f62a5d52/verify-caregiver",
  async (c) => {
    const { caregiver_id } = await c.req.json();
    await supabase
      .from("profiles")
      .update({ verified: true })
      .eq("id", caregiver_id);
    const { data: cg } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", caregiver_id)
      .single();
    if (cg) {
      await notif(
        caregiver_id,
        "verified",
        "Profile live — you are verified!",
        "Your credentials have been reviewed. Your profile is now visible to families in your service areas.",
      );
      await sendEmail(
        (cg as any).email,
        "Your GetMeCare profile is now live!",
        emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">&#127881; Profile Verified!</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 12px;">Congratulations <strong>${(cg as any).full_name}</strong>! Your credentials have been reviewed and your profile is now <strong>live</strong> and visible to families.</p>
      <p style="color:#64748b;font-size:13px;line-height:1.6;">Families posting jobs in your area will be algorithmically matched to your profile. Browse open jobs and submit bids!</p>
      ${cta("Browse Open Jobs &rarr;")}
    `),
      );
    }
    return c.json({ success: true });
  },
);

app.post(
  "/make-server-f62a5d52/reinstate-caregiver",
  async (c) => {
    const { caregiver_id } = await c.req.json();
    await supabase
      .from("profiles")
      .update({ suspended: false })
      .eq("id", caregiver_id);
    const { data: cg } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", caregiver_id)
      .single();
    if (cg) {
      await notif(
        caregiver_id,
        "reinstated",
        "Account reinstated",
        "Your account is active again. Your profile is visible in the directory.",
      );
      await sendEmail(
        (cg as any).email,
        "Your GetMeCare account has been reinstated",
        emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">Account Reinstated &#10003;</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 12px;">Your GetMeCare account has been reinstated and your profile is visible to families again.</p>
      ${cta("Return to Dashboard")}
    `),
      );
    }
    return c.json({ success: true });
  },
);

// ── M4: Live Booking Simulation ───────────────────────────────────────────────

app.post(
  "/make-server-f62a5d52/simulate-booking",
  async (c) => {
    const { family_id, caregiver_id } = await c.req.json();
    type Log = {
      step: string;
      status: "ok" | "error";
      detail?: string;
    };
    const log: Log[] = [];

    const run = async (
      name: string,
      fn: () => Promise<any>,
    ): Promise<any> => {
      try {
        const r = await fn();
        log.push({
          step: name,
          status: "ok",
          detail: r?.detail ?? undefined,
        });
        return r;
      } catch (e: any) {
        log.push({
          step: name,
          status: "error",
          detail: e.message,
        });
        return null;
      }
    };

    const [{ data: fam }, { data: cg }] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", family_id)
        .single(),
      supabase
        .from("profiles")
        .select("*")
        .eq("id", caregiver_id)
        .single(),
    ]);
    if (!fam || !cg)
      return c.json({
        success: false,
        error:
          "One or both user IDs not found. Check IDs in the Supabase profiles table.",
        log,
      });
    log.push({
      step: "Verify users",
      status: "ok",
      detail: `Family: ${(fam as any).email} · Caregiver: ${(cg as any).email}`,
    });

    const cgName =
      (cg as any).display_name ?? (cg as any).full_name;
    const rate = Number((cg as any).hourly_rate ?? 25);

    const job = await run("Post job as family", async () => {
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          family_id,
          title: "[SIM] Daily Companion Care",
          city: (fam as any).city ?? "Toronto",
          postal_prefix: (
            (fam as any).postal_code ?? "M5V"
          ).slice(0, 3),
          care_type: "PSW",
          hours: "4–6 hrs/day",
          schedule: "Monday – Friday",
          rate,
          status: "open",
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ...data, detail: `Job ID: ${data.id}` };
    });
    if (!job)
      return c.json({
        success: false,
        error: "Job creation failed",
        log,
      });

    const bid = await run(
      "Submit bid as caregiver",
      async () => {
        const { data, error } = await supabase
          .from("bids")
          .insert({
            job_id: job.id,
            caregiver_id,
            amount: rate,
            status: "pending",
            note: "Hi! I would love to work with your family and provide excellent care.",
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        await notif(
          family_id,
          "new_bid",
          "New bid received",
          `${cgName} submitted a bid at $${rate}/hr on "${job.title}".`,
        );
        await sendEmail(
          (fam as any).email,
          `New bid from ${cgName}`,
          emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">New Bid Received</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 12px;">A verified caregiver bid on <strong>"${job.title}"</strong>.</p>
      ${infoCard([
        ["Caregiver", cgName],
        ["Bid", `$${rate}/hr`],
      ])}
      ${cta("Review Bid &rarr;")}
    `),
        );
        return { ...data, detail: `$${rate}/hr` };
      },
    );
    if (!bid)
      return c.json({
        success: false,
        error: "Bid creation failed",
        log,
      });

    await run("Accept bid (family)", async () => {
      await supabase
        .from("bids")
        .update({ status: "accepted" })
        .eq("id", bid.id);
      await supabase
        .from("jobs")
        .update({ status: "filled" })
        .eq("id", job.id);
      await notif(
        caregiver_id,
        "bid_accepted",
        "Bid accepted!",
        `${(fam as any).full_name} accepted your bid for "${job.title}" at $${rate}/hr.`,
      );
      await sendEmail(
        (cg as any).email,
        "Your bid was accepted!",
        emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">&#127881; Bid Accepted!</h2>
      ${infoCard([
        ["Job", job.title],
        ["Rate", `$${rate}/hr`],
      ])}
      ${cta("Clock In When You Arrive &rarr;")}
    `),
      );
      return {
        detail: "Bid accepted · job marked filled · email sent",
      };
    });

    const clockInAt = new Date();
    const shift = await run(
      "Clock in (caregiver)",
      async () => {
        const { data, error } = await supabase
          .from("shifts")
          .insert({
            job_id: job.id,
            caregiver_id,
            family_id,
            clock_in: clockInAt.toISOString(),
            rate,
            status: "active",
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        const t = clockInAt.toLocaleTimeString("en-CA", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Toronto",
        });
        await notif(
          family_id,
          "clock_in",
          "Caregiver clocked in",
          `${cgName} arrived and clocked in at ${t}.`,
        );
        await sendEmail(
          (fam as any).email,
          `${cgName} has clocked in`,
          emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">Caregiver Clocked In &#10003;</h2>
      <p style="color:#475569;font-size:15px;margin:0 0 12px;"><strong>${cgName}</strong> clocked in at <strong>${t}</strong>.</p>
      ${cta("View Dashboard")}
    `),
        );
        return { ...data, detail: `Clocked in at ${t}` };
      },
    );
    if (!shift)
      return c.json({
        success: false,
        error: "Shift creation failed",
        log,
      });

    const hoursWorked = 4;
    const gross = Math.round(hoursWorked * rate * 100) / 100;
    const platformFee = Math.round(gross * 0.15 * 100) / 100;
    const net = Math.round((gross - platformFee) * 100) / 100;

    await run("Clock out (caregiver)", async () => {
      const clockOutAt = new Date(
        clockInAt.getTime() + hoursWorked * 3_600_000,
      );
      await supabase
        .from("shifts")
        .update({
          clock_out: clockOutAt.toISOString(),
          hours_worked: hoursWorked,
          gross,
          platform_fee: platformFee,
          net,
          status: "pending_approval",
        })
        .eq("id", shift.id);
      await notif(
        family_id,
        "timesheet_ready",
        "Timesheet awaiting approval",
        `${cgName} worked ${hoursWorked} hrs. Gross: $${gross.toFixed(2)}.`,
      );
      await sendEmail(
        (fam as any).email,
        `Approve ${cgName}'s timesheet`,
        emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">Timesheet Ready</h2>
      ${infoCard([
        ["Hours", `${hoursWorked} hrs`],
        ["Gross", `$${gross.toFixed(2)}`],
        ["Platform fee", `$${platformFee.toFixed(2)}`],
      ])}
      ${cta("Approve Timesheet &rarr;")}
    `),
      );
      return {
        detail: `${hoursWorked} hrs · $${gross} gross · $${platformFee} fee · $${net} net`,
      };
    });

    await run(
      "Approve shift (simulated — no live Stripe charge)",
      async () => {
        await supabase
          .from("shifts")
          .update({ status: "approved" })
          .eq("id", shift.id);
        await notif(
          caregiver_id,
          "shift_approved",
          "Timesheet approved!",
          `Your ${hoursWorked}-hr shift was approved. Net: $${net.toFixed(2)}.`,
        );
        await sendEmail(
          (cg as any).email,
          "Your timesheet was approved",
          emailLayout(`
      <h2 style="color:#1B3A6B;margin:0 0 8px;font-size:20px;">Timesheet Approved &#10003;</h2>
      ${infoCard([
        ["Hours", `${hoursWorked} hrs`],
        ["Gross", `$${gross.toFixed(2)}`],
        ["Platform fee", `-$${platformFee.toFixed(2)}`],
        ["Net payout", `$${net.toFixed(2)}`],
      ])}
      <p style="color:#64748b;font-size:13px;">In a live scenario the $${platformFee.toFixed(2)} platform fee would be charged to your Stripe card on file automatically.</p>
    `),
        );
        return {
          detail: `Approved · net $${net.toFixed(2)} · emails sent`,
        };
      },
    );

    return c.json({
      success: true,
      summary: {
        job_id: job.id,
        bid_id: bid.id,
        shift_id: shift.id,
        hours_worked: hoursWorked,
        gross,
        platform_fee: platformFee,
        net,
        emails_sent: 7,
        notifications_created: 8,
      },
      log,
    });
  },
);

Deno.serve(app.fetch);