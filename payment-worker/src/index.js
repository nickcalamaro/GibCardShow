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

  // 2. Insert consent record
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

  return new Response(JSON.stringify({ ok: true, status }), {
    headers: { "Content-Type": "application/json" },
  });
}

