export default {
  async fetch(req, env) {
    try {
      const url = new URL(req.url);

      // Handle CORS preflight
      if (req.method === "OPTIONS") {
        return handleOptions(req);
      }

      if (url.pathname === "/create-checkout" && req.method === "POST") {
        const resp = await handleCreateCheckout(req, env);
        return withCors(req, resp);
      }

      if (url.pathname === "/payment-callback" && req.method === "POST") {
        const resp = await handlePaymentCallback(req, env);
        return withCors(req, resp);
      }

      if (url.pathname === "/redeem-promo" && req.method === "POST") {
        const resp = await handleRedeemPromo(req, env);
        return withCors(req, resp);
      }

      return withCors(req, new Response("Not found", { status: 404 }));
    } catch (err) {
      console.error("Worker error:", err);
      return withCors(
        req,
        new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
  },
};

// --- CORS Helpers ---

function handleOptions(req) {
  return new Response(null, { headers: corsHeaders(req) });
}

function withCors(req, resp) {
  const headers = new Headers(resp.headers);
  for (const [k, v] of Object.entries(corsHeaders(req))) {
    headers.set(k, v);
  }
  return new Response(resp.body, {
    status: resp.status,
    headers,
  });
}

function corsHeaders(req) {
  const origin = req.headers.get("Origin");
  const allowedOrigins = [
    "http://localhost:1313",
    "https://gibcardshow.com",
    "https://www.gibcardshow.com",
    "https://dev.gibcardshow.com",
  ];
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// --- SumUp Token Helper ---

async function getAccessToken(env) {
  const res = await fetch("https://api.sumup.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: env.SUMUP_CLIENT_ID,
      client_secret: env.SUMUP_CLIENT_SECRET,
      refresh_token: env.SUMUP_REFRESH_TOKEN,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error("Failed to refresh token: " + JSON.stringify(data));
  }
  return data.access_token;
}

// --- Create Checkout ---

async function handleCreateCheckout(req, env) {
  const { name, email, service, quantity, privacyConsent, marketingConsent } = await req.json();

  console.log("Incoming form data:", { name, email, service, quantity, privacyConsent, marketingConsent });

  // 1. Look up product info
  const productRow = await env.DB.prepare(
    `SELECT amount, currency FROM products WHERE service = ?`
  ).bind(service).first();

  if (!productRow) {
    return new Response(JSON.stringify({ error: "Unknown service" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const amount = productRow.amount * quantity;
  const currency = productRow.currency || "GBP";
  const checkoutRef = crypto.randomUUID();

  console.log("Checkout payload:", {
    checkout_reference: checkoutRef,
    amount,
    currency,
    merchant_code: env.SUMUP_MERCHANT_CODE,
    description: service,
  });

  const accessToken = await getAccessToken(env);

  const res = await fetch("https://api.sumup.com/v0.1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      checkout_reference: checkoutRef,
      amount,
      currency,
      merchant_code: env.SUMUP_MERCHANT_CODE,
      description: service,
    }),
  });

  const data = await res.json();
  console.log("SumUp response:", data);

  if (!res.ok) {
    return new Response(JSON.stringify({ error: data }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Insert consent record (update if exists)
  await env.DB.prepare(
    `INSERT INTO gcs_consent (name, email, privacy_consent, marketing_consent, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(email) DO UPDATE SET
       name = excluded.name,
       privacy_consent = excluded.privacy_consent,
       marketing_consent = excluded.marketing_consent,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(
    name,
    email,
    privacyConsent ? 1 : 0,
    marketingConsent ? 1 : 0
  ).run();

  // 3. Insert pending payment row
  await env.DB.prepare(
    `INSERT INTO payments (name, email, service, amount, currency, status, checkout_id, checkout_reference, quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(name, email, service, amount, currency, "PENDING", data.id, checkoutRef, quantity)
    .run();

  return new Response(JSON.stringify({ checkout_id: data.id }), {
    headers: { "Content-Type": "application/json" },
  });
}

// --- Payment Callback ---

async function handlePaymentCallback(req, env) {
  const { checkout_id } = await req.json();
  const accessToken = await getAccessToken(env);

  const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkout_id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();

  const status = data.status; // "PAID", "FAILED", "PENDING"
  const txnId =
    data.transaction_id ||
    (data.transactions && data.transactions[0] && data.transactions[0].id) ||
    null;

  // Update only the row for this checkout_id
  await env.DB.prepare(
    `UPDATE payments SET status = ?, transaction_id = ? WHERE checkout_id = ?`
  )
    .bind(status, txnId, checkout_id)
    .run();

  // If paid, send confirmation email
  if (status === "PAID") {
    const row = await env.DB.prepare(
      `SELECT name, email, service FROM payments WHERE checkout_id = ?`
    ).bind(checkout_id).first();

    if (row) {
      await sendConfirmationEmail(env, row.name, row.email, row.service);
    }
  }

  return new Response(JSON.stringify({ ok: true, status }), {
    headers: { "Content-Type": "application/json" },
  });
}

// --- Redeem Promo ---
async function handleRedeemPromo(req, env) {
  const { name, email, service, quantity, privacyConsent, marketingConsent, promoCode } = await req.json();

  // Only allow the specific promo code and service
  if (promoCode !== "CONVIVENCIAMTG" || service !== "Weekend Pass + MTG Tournament") {
    return new Response(JSON.stringify({ error: "Invalid promo code or service." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Insert consent record (update if exists)
  await env.DB.prepare(
    `INSERT INTO gcs_consent (name, email, privacy_consent, marketing_consent, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(email) DO UPDATE SET
       name = excluded.name,
       privacy_consent = excluded.privacy_consent,
       marketing_consent = excluded.marketing_consent,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(
    name,
    email,
    privacyConsent ? 1 : 0,
    marketingConsent ? 1 : 0
  ).run();

  // Mark ticket as PAID in payments table
  await env.DB.prepare(
    `INSERT INTO payments (name, email, service, amount, currency, status, checkout_id, checkout_reference, quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    name,
    email,
    service,
    0, // amount is zero for promo
    "GBP",
    "PAID",
    `PROMO-${promoCode}-${Date.now()}`,
    `PROMO-${promoCode}-${Date.now()}`,
    1
  ).run();

  // Send confirmation email
  await sendConfirmationEmail(env, name, email, service);

  return new Response(JSON.stringify({ ok: true, message: "Promo redeemed — ticket reserved. Check your email for confirmation." }), {
    headers: { "Content-Type": "application/json" },
  });
}

// --- MailerSend Helper ---

async function sendConfirmationEmail(env, name, email, service) {
  const htmlBody = `
  <div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #ddd;">
      <div style="background-color:#d71920; color:#fff; padding:20px; text-align:center;">
        <h1 style="margin:0;">Gibraltar Card Show 2025</h1>
      </div>
      <div style="padding:20px; color:#333;">
        <p>Hey Collector,</p>
        <p>First off—thank you for snagging your ticket to the Gibraltar Card Show 2025! 🥳</p>
        <p>You’ve officially unlocked:</p>
        <ul>
          <li>✔️ Access to the biggest collectors event on the Rock</li>
          <li>✔️ The right to brag to your friends (“I’ve got my ticket, do you?”)</li>
          <li>✔️ A guaranteed weekend full of shiny cardboard, epic trades, and possibly… new best friends</li>
        </ul>
        <p>Your ticket is confirmed, safe, and already doing little celebratory cartwheels in our inbox. 💃</p>
        <p>All that’s left? Bring your passion, your decks, and maybe a lucky charm (because who knows what you’ll pull).</p>
        <p><strong>We can’t wait to see you at the Catholic Community Centre on 1–2 November 2025.</strong></p>
        <p>Until then, keep your cards sleeved and your dice rolling. 😉</p>
        <p>Cheers,<br>The Gibraltar Card Show Team</p>
      </div>
    </div>
  </div>
  `;

  const res = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.MAILERSEND_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: {
        email: "noreply@gibcardshow.com",
        name: "Gibraltar Card Show",
      },
      to: [{ email, name }],
      subject: "Your Gibraltar Card Show 2025 Ticket Confirmation",
      html: htmlBody,
      text: `Hey Collector,\n\nThank you for snagging your ticket to the Gibraltar Card Show 2025! 🥳\n\nSee you at the Catholic Community Centre on 1–2 November 2025.\n\nCheers,\nThe Gibraltar Card Show Team`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("MailerSend error:", err);
  }
}