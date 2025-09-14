export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const event = await request.json();
      console.log('Incoming webhook:', event);

      if (event.event_type === 'checkout.status.updated' || event.event_type === 'checkout.status.updated.v1') {
        const { checkout_id, reference, status } = event.payload;

        // Update the matching row
        await env.sumupDB
          .prepare(
            `UPDATE payments
             SET status = ?
             WHERE checkout_id = ? OR checkout_reference = ?`
          )
          .bind(status.toUpperCase(), checkout_id, reference)
          .run();

        return new Response('OK', { status: 200 });
      }

      return new Response('Ignored', { status: 200 });
    } catch (err) {
      console.error(err);
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  }
};
