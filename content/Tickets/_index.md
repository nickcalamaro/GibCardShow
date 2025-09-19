---
herostyle: "basic"
showDate: false
showhero: false
description: "Get your tickets for the Gibraltar Card Show 2025 — the Rock’s premier trading card and TCG event."
image: "/img/gcs-logo.png"
showTitle: false
layoutBackgroundHeaderSpace: false
layout: single
---

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta property="og:title" content="Gibraltar Card Show 2025 Tickets">
<meta name="description" content="Join us at the Gibraltar Card Show 2025 — the Rock’s biggest TCG and trading card event. Buy tickets now for tournaments, trade nights, and a safe, family‑friendly community.">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
/* Intro headline */
.ticket-intro {
  font-family: 'Segoe UI','Helvetica Neue',sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.25;
  margin: 1.2rem auto 1.6rem;
  max-width: 800px;
  background: linear-gradient(90deg,#000,#fd4736);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fadeInUp 2s ease-out;
}
.ticket-intro span,
.ticket-intro em { color:#fd4736; font-style:normal; }
@keyframes fadeInUp { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
html.dark .ticket-intro {
  background: linear-gradient(90deg,#fff,#fd7366);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
}

/* Table wrapper */
.ticket-table-wrapper {
  text-align:center;
  padding:0 20px 20px;
  overflow-x:auto;
  -webkit-overflow-scrolling:touch;
}

/* Ticket table */
.ticket-table {
  display:table;
  width:100%;
  table-layout:fixed;
  border-collapse:collapse;
  margin:0 auto;
  font-family:'Segoe UI','Helvetica Neue',sans-serif;
  font-size:1.05em;
  color:#222;
  background:#ffffffcc;
  backdrop-filter:blur(6px);
  box-shadow:0 8px 24px rgba(0,0,0,0.15);
  border-radius:14px;
  overflow:hidden;
}
.ticket-table col.col-label { width:75%; }
.ticket-table col.col-price { width:25%; }

.ticket-table td { padding:14px 20px; }
.ticket-table .header {
  font-size:1.5em;
  font-weight:700;
  padding:16px 20px;
  text-align:center;
  letter-spacing:0.5px;
  color:#fff;
  white-space:nowrap;
}
.ticket-table .label { font-weight:600; }
.ticket-table .price { text-align:right; font-weight:500; white-space:nowrap; padding-right:28px; }
.ticket-table .divider td { border-bottom:1px solid #ccc; }

/* Hover rows */
.ticket-option { cursor:pointer; transition:all 0.2s ease; }
.ticket-option td { position:relative; }
.ticket-option:hover {
  background-color:rgba(253,71,54,0.08);
  transform:scale(1.01);
  box-shadow:0 2px 6px rgba(0,0,0,0.15);
}
.ticket-option:hover .label,
.ticket-option:hover .price { color:#fd4736; }
.ticket-option td:last-child::after {
  content:"›";
  margin-left:8px;
  color:#fd4736;
  font-weight:bold;
  position:absolute;
  right:10px;
}

/* Dark mode */
html.dark .ticket-table {
  color:#fff !important;
  background:rgba(20,20,20,0.6) !important;
  box-shadow:0 8px 24px rgba(0,0,0,0.4);
}
html.dark .ticket-table .header,
html.dark .ticket-table td { color:#fff !important; }
html.dark .ticket-table .divider td { border-bottom-color:rgba(255,255,255,0.18) !important; }
html.dark .ticket-option:hover { background-color:rgba(253,71,54,0.2); }
html.dark .ticket-option:hover .label,
html.dark .ticket-option:hover .price { color:#fd7366; }

/* Mobile tweaks */
@media (max-width:480px){
  .ticket-table td { padding:12px 14px; font-size:0.98em; }
  .ticket-table .header { font-size:1.25em; padding:14px; white-space:normal; }
  .ticket-table .label { white-space:normal; word-break:break-word; hyphens:auto; }
  .ticket-table col.col-label { width:72%; }
  .ticket-table col.col-price { width:28%; }
}
</style>
</head>

<body>

<h2 class="ticket-intro">
  <span>Get your tickets now</span> for the 
  <strong>2025 Gibraltar Card Show</strong> – 
  <em>bigger and better than ever!</em>
</h2>

<!-- Modal Overlay -->
<div id="paymentModal" style="
  display:none; position:fixed; z-index:9999; inset:0;
  background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);
">
  <div style="
    background:#ffffffcc; backdrop-filter:blur(8px);
    margin:5% auto; padding:20px 30px; border-radius:14px;
    width:90%; max-width:420px; font-family:'Segoe UI','Helvetica Neue',sans-serif;
    box-shadow:0 8px 24px rgba(0,0,0,0.3); position:relative;
  ">
    <span id="closePaymentModal" style="position:absolute; top:10px; right:14px; font-size:1.5em; cursor:pointer; color:#333;">&times;</span>
    <div class="w-full max-w-sm text-sm">
      {{< payment-form >}}
    </div>
  </div>
</div>
<!-- Ticket Table -->
<div class="ticket-table-wrapper">
  <table class="ticket-table">
    <colgroup>
      <col class="col-label">
      <col class="col-price">
    </colgroup>
    <tr style="background:linear-gradient(90deg,#000 0%,#fd4736 100%);">
      <td class="header" colspan="2">🎟️ Ticket Options</td>
    </tr>
    <!-- Day Passes -->
    <tr class="divider ticket-option" data-service="Saturday Pass" data-amount="3">
      <td class="label">Saturday Pass</td><td class="price">£3</td>
    </tr>
    <tr class="ticket-option" data-service="Sunday Pass" data-amount="3">
      <td class="label">Sunday Pass</td><td class="price">£3</td>
    </tr>

  <!-- Weekend Pass -->
  <tr class="divider ticket-option" data-service="Weekend Pass" data-amount="5">
    <td class="label">Weekend Pass</td><td class="price">£5</td>
  </tr>

  <!-- Tournament Packages -->
  <tr class="divider ticket-option" data-service="Weekend Pass + MTG Tournament" data-amount="10">
    <td class="label">Weekend Pass + MTG Tournament</td><td class="price">£10</td>
  </tr>
  <tr class="divider ticket-option" data-service="Weekend Pass + Pokémon TCG Tournament" data-amount="10">
    <td class="label">Weekend Pass + Pokémon TCG Tournament</td><td class="price">£10</td>
  </tr>
  <tr class="divider ticket-option" data-service="Weekend Pass + Both Tournaments" data-amount="12">
    <td class="label">Weekend Pass + Both Tournaments</td><td class="price">£12</td>
  </tr>
</table>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('paymentModal');
  const closeBtn = document.getElementById('closePaymentModal');
  const formHeading = document.getElementById('formHeading');
  const serviceInput = document.getElementById('service');

  function openPaymentModalFor(service) {
    // Reset widget + show form
    if (typeof resetSumUpWidget === 'function') resetSumUpWidget();

    // Set service + heading
    if (serviceInput) serviceInput.value = service;
    if (formHeading) formHeading.textContent = `🎟️ ${service}`;

    modal.style.display = 'block';
  }

  function closePaymentModal() {
    modal.style.display = 'none';
    if (typeof resetSumUpWidget === 'function') resetSumUpWidget();
  }

  // Hook up ticket rows
  document.querySelectorAll('.ticket-option').forEach(row => {
    row.addEventListener('click', () => {
      openPaymentModalFor(row.dataset.service);
    });
  });

  // Close handlers
  closeBtn.addEventListener('click', closePaymentModal);
  window.addEventListener('click', e => { if (e.target === modal) closePaymentModal(); });
});
</script>


</body>
</html>
