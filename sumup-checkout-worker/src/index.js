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
        const {
          name = '',
          email = '',
          service = '',
          quantity = 1,
          privacyConsent = false,
          marketingConsent = false
        } = await request.json();

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
        const qty = Math.max(1, parseInt(quantity, 10) || 1);
        const totalAmt = unitAmt * qty;
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
            description: `${qty}x ${service} for ${name} (${email})`,
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
              name, email, service, qty, totalAmt, currency,
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
        const { checkout_id, type, body } = await request.json();

        if (type === 'success') {
          await env.sumupDB
            .prepare(`
              UPDATE payments
              SET status = 'PAID',
                  transaction_id = ?
              WHERE checkout_id = ?
            `)
            .bind(body.transaction_id || '', checkout_id)
            .run();
        } else if (type === 'error' || type === 'cancel') {
          await env.sumupDB
            .prepare(`
              UPDATE payments
              SET status = ?
              WHERE checkout_id = ?
            `)
            .bind(type.toUpperCase(), checkout_id)
            .run();
        }

        return new Response(JSON.stringify({ ok: true }), {
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
    // Default 404
    // -------------------------------
    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};
