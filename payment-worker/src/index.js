export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const event = await request.json();
      console.log('Incoming webhook:', event);

      if (
        event.event_type === 'checkout.status.updated' ||
        event.event_type === 'checkout.status.updated.v1'
      ) {
        const { checkout_id, reference, status, customer_email } = event.payload;

        // Update the matching row
        await env.sumupDB
          .prepare(
            `UPDATE payments
             SET status = ?
             WHERE checkout_id = ? OR checkout_reference = ?`
          )
          .bind(status.toUpperCase(), checkout_id, reference)
          .run();

        // If payment completed, send confirmation email
        if (status.toLowerCase() === 'paid' && customer_email) {
          await sendConfirmationEmail(customer_email, reference, env);
        }

        return new Response('OK', { status: 200 });
      }

      return new Response('Ignored', { status: 200 });
    } catch (err) {
      console.error(err);
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  }
};

// Helper function to send email via MailerSend API
async function sendConfirmationEmail(to, reference, env) {
  const htmlContent = `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #ff4b2b, #ff416c); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Gibraltar Card Show 2025</h1>
      </div>
      <div style="padding: 30px; color: #333; line-height: 1.6;">
        <p>Hey Collector,</p>
        <p>First off—thank you for snagging your ticket to the <strong>Gibraltar Card Show 2025</strong>! 🥳</p>
        <p>You’ve officially unlocked:</p>
        <ul style="list-style: none; padding: 0;">
          <li>✔️ Access to the biggest collectors event on the Rock</li>
          <li>✔️ The right to brag to your friends (“I’ve got my ticket, do you?”)</li>
          <li>✔️ A guaranteed weekend full of shiny cardboard, epic trades, and possibly… new best friends</li>
        </ul>
        <p>Your ticket is confirmed, safe, and already doing little celebratory cartwheels in our inbox. 💃</p>
        <p>All that’s left? Bring your passion, your decks, and maybe a lucky charm (because who knows what you’ll pull).</p>
        <p><strong>We can’t wait to see you at the Catholic Community Centre on 1–2 November 2025.</strong></p>
        <p>Until then, keep your cards sleeved and your dice rolling. 😉</p>
        <p style="margin-top: 30px;">Cheers,<br>The Gibraltar Card Show Team</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #888;">Payment reference: <strong>${reference}</strong></p>
      </div>
    </div>
  </div>
  `;

  const textContent = `
Hey Collector,

First off—thank you for snagging your ticket to the Gibraltar Card Show 2025! 🥳

You’ve officially unlocked:
- Access to the biggest collectors event on the Rock
- The right to brag to your friends (“I’ve got my ticket, do you?”)
- A guaranteed weekend full of shiny cardboard, epic trades, and possibly… new best friends

Your ticket is confirmed, safe, and already doing little celebratory cartwheels in our inbox. 💃

All that’s left? Bring your passion, your decks, and maybe a lucky charm (because who knows what you’ll pull).

We can’t wait to see you at the Catholic Community Centre on 1–2 November 2025.

Until then, keep your cards sleeved and your dice rolling. 😉

Cheers,
The Gibraltar Card Show Team

Payment reference: ${reference}
`;

  const body = {
    from: { email: "noreply@gibcardshow.com", name: "Gibraltar Card Show" },
    to: [{ email: to }],
    subject: "Your Gibraltar Card Show Ticket Confirmation",
    text: textContent,
    html: htmlContent,
  };

  const res = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.MAILERSEND_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("MailerSend error:", errText);
  }
}
