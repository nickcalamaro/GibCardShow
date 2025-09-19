export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    console.log("Incoming request:", request.method, url.pathname);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // -------------------------------
    // 1. CREATE CHECKOUT
    // -------------------------------
    if (url.pathname === '/create-checkout' && request.method === 'POST') {
      try {
        const raw = await request.json();
        const { name = '', email = '', service = '', quantity: q } = raw;
        const quantity = Math.max(1, parseInt(q, 10) || 1);

        // Look up product
        const product = await env.sumupDB
          .prepare("SELECT amount, currency FROM products WHERE service = ?")
          .bind(service)
          .first();
        if (!product) {
          return new Response(JSON.stringify({ error: 'Invalid service' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const unitAmt = Number(product.amount);
        const totalAmt = unitAmt * quantity;
        const currency = product.currency || 'GBP';

        const checkout_reference = `${Date.now()}-${service.replace(/\s+/g, '-').toLowerCase()}`;
        const redirectUrl = `https://gibcardshow.com/tickets/thank-you/?cr=${encodeURIComponent(checkout_reference)}`;

        // 🔑 Use OAuth2 access token instead of secret key
        const tokenResp = await fetch("https://api.sumup.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: env.SUMUP_CLIENT_ID,
            client_secret: env.SUMUP_CLIENT_SECRET,
            refresh_token: env.SUMUP_REFRESH_TOKEN
          })
        });
        const tokenData = await tokenResp.json();
        const accessToken = tokenData.access_token;

        // Create checkout
        const sumupRes = await fetch('https://api.sumup.com/v0.1/checkouts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            checkout_reference,
            amount: totalAmt,
            currency,
            merchant_code: env.SUMUP_MERCHANT_CODE,
            description: `${quantity}x ${service} for ${name} (${email})`,
            hosted_checkout: { enabled: true },
            redirect_url: redirectUrl
          })
        });

        const data = await sumupRes.json();
        if (!sumupRes.ok) {
          return new Response(JSON.stringify({ error: 'SumUp error', details: data }), {
            status: sumupRes.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Insert pending row
        await env.sumupDB
          .prepare(
            `INSERT INTO payments
             (name, email, service, quantity, amount, currency, status, transaction_id, checkout_reference, checkout_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 'PENDING', '', ?, ?, datetime('now'))`
          )
          .bind(name, email, service, quantity, totalAmt, currency, checkout_reference, data.id || '')
          .run();

        return new Response(JSON.stringify({
          checkout_url: data.hosted_checkout_url,
          checkout_reference,
          checkout_id: data.id || null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
// -------------------------------
// 2. PAYMENT CALLBACK (Webhook)
// -------------------------------
if (url.pathname.replace(/\/$/, '') === '/payment-callback') {
  if (request.method === 'GET') {
    // Friendly response for browser tests
    return new Response("Payment callback endpoint is alive. Use POST for webhooks.", {
      status: 200,
      headers: corsHeaders
    });
  }

  if (request.method === 'POST') {
    try {
      console.log("=== Payment callback triggered ===");

      // 1. Verify webhook secret
      const incomingSecret = request.headers.get("x-sumup-secret");
      if (incomingSecret !== env.SUMUP_WEBHOOK_SECRET) {
        console.log("Unauthorized webhook attempt. Incoming secret:", incomingSecret);
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }

      // 2. Parse body
      const raw = await request.json();
      console.log("Webhook raw body:", raw);

      const checkout_id = raw.payload?.checkout_id;
      const reference   = raw.payload?.reference;
      const statusHint  = raw.payload?.status?.toUpperCase();

      if (!checkout_id) {
        console.log("Missing checkout_id in webhook payload");
        return new Response(JSON.stringify({ error: "Invalid payload" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 3. Refresh access token
      const tokenResp = await fetch("https://api.sumup.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: env.SUMUP_CLIENT_ID,
          client_secret: env.SUMUP_CLIENT_SECRET,
          refresh_token: env.SUMUP_REFRESH_TOKEN
        })
      });
      const tokenData = await tokenResp.json();
      const accessToken = tokenData.access_token;
      console.log("Access token retrieved:", !!accessToken);

      // 4. Verify checkout status with SumUp
      const verifyRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkout_id}`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      const verifyData = await verifyRes.json();
      console.log("Verify response from SumUp:", verifyData);

      const finalStatus = verifyData.status?.toUpperCase() || statusHint || "UNKNOWN";
      const tx = verifyData.transactions?.[0];
      const transactionId = tx?.id || "";
      const transactionCode = tx?.transaction_code || "";

      // 5. Update DB
      if (finalStatus === "PAID") {
        const result = await env.sumupDB
          .prepare(`
            UPDATE payments
            SET status = 'PAID',
                transaction_id = ?,
                transaction_code = ?
            WHERE checkout_id = ?
          `)
          .bind(transactionId, transactionCode, checkout_id)
          .run();
        console.log("DB update result (PAID):", result);
      } else if (["FAILED", "CANCELED", "ERROR"].includes(finalStatus)) {
        const result = await env.sumupDB
          .prepare(`UPDATE payments SET status = ? WHERE checkout_id = ?`)
          .bind(finalStatus, checkout_id)
          .run();
        console.log(`DB update result (${finalStatus}):`, result);
      } else {
        console.log("Checkout still pending or unknown status:", finalStatus);
      }

      // 6. Respond OK
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      console.log("Callback error:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }

  // Method not allowed
  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
}

// -------------------------------
// 3. FAVICON + DEFAULT HANDLER
// -------------------------------
if (url.pathname === '/favicon.ico') {
  // Return empty 204 so browsers stop complaining
  return new Response("", { status: 204 });
}

// Default 404 for everything else
return new Response("Not found", { status: 404, headers: corsHeaders });

  }
}