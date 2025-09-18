export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

        const name = raw.name || '';
        const email = raw.email || '';
        const service = raw.service || '';
        const quantity = Math.max(1, parseInt(raw.quantity, 10) || 1);

        // Normalize checkboxes into booleans
        const privacyConsent =
          raw.privacyConsent === true ||
          raw.privacyConsent === 'on' ||
          raw.privacyConsent === 'true';

        const marketingConsent =
          raw.marketingConsent === true ||
          raw.marketingConsent === 'on' ||
          raw.marketingConsent === 'true';

        console.log("Incoming body:", { name, email, service, quantity, privacyConsent, marketingConsent });

        if (!service) {
          return new Response(JSON.stringify({ error: 'Missing required field: service' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Look up official unit price from products table
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

        // Create checkout in SumUp
        const sumupRes = await fetch('https://api.sumup.com/v0.1/checkouts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.SUMUP_SECRET_KEY}`,
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

        // Insert pending row into payments table
        try {
          await env.sumupDB
            .prepare(
              `INSERT INTO payments
               (name, email, service, quantity, amount, currency, status, transaction_id, checkout_reference, checkout_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
            )
            .bind(
              name, email, service, quantity, totalAmt, currency,
              'PENDING', '', checkout_reference, data.id || ''
            )
            .run();
        } catch (e) {
          console.log('Pending insert failed:', e.message);
        }

        // Insert or update consent
        try {
          await env.sumupDB
            .prepare(
              `INSERT INTO gcs_consent (name, email, privacy_consent, marketing_consent, created_at)
               VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(email) DO UPDATE SET
                 name = excluded.name,
                 privacy_consent = excluded.privacy_consent,
                 marketing_consent = excluded.marketing_consent,
                 created_at = CURRENT_TIMESTAMP`
            )
            .bind(name, email, privacyConsent ? 1 : 0, marketingConsent ? 1 : 0)
            .run();
        } catch (e) {
          console.log('Consent insert failed:', e.message);
        }

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
    // 2. PAYMENT CALLBACK
    // -------------------------------
if (url.pathname === '/payment-callback' && request.method === 'POST') {
  try {
    const raw = await request.json();
    console.log("Callback raw body:", raw);

    const checkout_id = raw.checkout_id || raw.payload?.checkout_id;
    if (!checkout_id) {
      return new Response(JSON.stringify({ error: "Missing checkout_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verify with SumUp API
    const verifyRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkout_id}`, {
      headers: {
        "Authorization": `Bearer ${env.SUMUP_SECRET_KEY}`
      }
    });
    const verifyData = await verifyRes.json();
    console.log("Verify response:", verifyData);

    if (verifyRes.ok && verifyData.status) {
      if (verifyData.status.toUpperCase() === "PAID") {
        await env.sumupDB
          .prepare(`
            UPDATE payments
            SET status = 'PAID',
                transaction_id = ?
            WHERE checkout_id = ?
          `)
          .bind(verifyData.transaction_id || "", checkout_id)
          .run();
      } else if (["FAILED", "CANCELED", "ERROR"].includes(verifyData.status.toUpperCase())) {
        await env.sumupDB
          .prepare(`
            UPDATE payments
            SET status = ?
            WHERE checkout_id = ?
          `)
          .bind(verifyData.status.toUpperCase(), checkout_id)
          .run();
      }
    }

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

    // -------------------------------
    // Default 404
    // -------------------------------
    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};
