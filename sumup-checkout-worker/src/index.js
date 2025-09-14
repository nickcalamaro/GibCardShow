export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const {
        name = '',
        email = '',
        service = '',
        privacyConsent = false,
        marketingConsent = false
      } = await request.json();

      if (!service) {
        return new Response(JSON.stringify({ error: 'Missing required field: service' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Look up official price from D1
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

      const amt = Number(product.amount);
      const currency = product.currency || 'GBP';

      const checkout_reference = `${Date.now()}-${service.replace(/\s+/g, '-').toLowerCase()}`;
      const redirectUrl = `https://gibcardshow.com/tickets/thank-you/?cr=${encodeURIComponent(checkout_reference)}`;

      // Create checkout in SumUp
      const body = {
        checkout_reference,
        amount: amt,
        currency,
        merchant_code: 'MUZHYEAH',
        description: `${service} for ${name} (${email})`,
        hosted_checkout: { enabled: true },
        redirect_url: redirectUrl
      };

      const sumupRes = await fetch('https://api.sumup.com/v0.1/checkouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SUMUP_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
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
             (name, email, service, amount, currency, status, transaction_id, checkout_reference, checkout_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            name, email, service, amt, currency,
            'PENDING', '', checkout_reference, data.id || ''
          )
          .run();
      } catch (e) {
        console.log('Pending insert failed:', e.message);
      }

      // Insert consent row into gcs_consent table
      try {
        await env.sumupDB
          .prepare(
            `INSERT INTO gcs_consent (name, email, privacy_consent, marketing_consent)
            VALUES (?, ?, ?, ?)
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
};
