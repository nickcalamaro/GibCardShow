---

herostyle: "basic"
showDate: false
showhero: false

---
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="description" content="Get your tickets now for the 2025 Gibraltar Card Show - bigger and better than ever!">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tickets · Gibraltar Card Show</title>

<style>
/* Intro headline (smaller, gradient text) */
.ticket-intro {
  font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.25;
  margin: 1.2rem auto 1.6rem;
  max-width: 800px;
  background: linear-gradient(90deg, #000000, #fd4736);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fadeInUp 2.0s ease-out;
}
.ticket-intro span { color: #fd4736; }
.ticket-intro em { font-style: normal; color: #fd4736; }
html.dark .ticket-intro {
  background: linear-gradient(90deg, #ffffff, #fd7366);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }

/* Wrapper fix: inline-table centering prevents right-side blank space */
.ticket-table-wrapper {
  text-align: center;        /* center inline-table */
  padding: 0 20px;
  overflow-x: auto;          /* allow scroll on very narrow screens */
  -webkit-overflow-scrolling: touch;
    padding: 0 20px 20px; /* added bottom padding */
}
.ticket-table {
  display: inline-table;     /* shrink to content width */
  width: auto;
  max-width: 100%;           /* don’t overflow wrapper */
  margin: 0 auto;
  table-layout: auto;
  border-collapse: collapse;
  color: #222;
  background: #ffffffcc;
  backdrop-filter: blur(6px);
  font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
  font-size: 1.05em;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  border-radius: 14px;
  overflow: hidden;
}
.ticket-table col { min-width: unset !important; }
.ticket-table td { padding: 14px 20px; }
.ticket-table .header {
  font-size: 1.5em;
  font-weight: 700;
  padding: 16px 20px;
  text-align: center;
  letter-spacing: 0.5px;
  color: #fff;
  white-space: nowrap;       /* keep single-line header tight */
}
.ticket-table .label { font-weight: 600; white-space: nowrap; }
.ticket-table .price { text-align: right; font-weight: 500; white-space: nowrap; }
.ticket-table .divider td { border-bottom: 1px solid #ccc; }

/* Clickable ticket rows */
.ticket-option {
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
}
.ticket-option td { position: relative; }
.ticket-option:hover {
  background-color: rgba(253, 71, 54, 0.08);
  transform: scale(1.01);
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.ticket-option:hover .label, .ticket-option:hover .price { color: #fd4736; }
/* Chevron indicator on right */
.ticket-option td:last-child::after {
  content: "›";
  margin-left: 8px;
  color: #fd4736;
  font-weight: bold;
  position: absolute;
  right: 10px;
}

/* Dark mode */
html.dark .ticket-table { color: #fff !important; background: rgba(20, 20, 20, 0.6) !important; }
html.dark .ticket-table td, html.dark .ticket-table .header { color: #fff !important; }
html.dark .ticket-table .divider td { border-bottom-color: rgba(255, 255, 255, 0.18) !important; }
html.dark .ticket-option:hover { background-color: rgba(253, 71, 54, 0.2); box-shadow: 0 2px 6px rgba(0,0,0,0.4); }
html.dark .ticket-option:hover .label, html.dark .ticket-option:hover .price { color: #fd7366; }
@media (prefers-color-scheme: dark) {
  .ticket-table { color: #fff !important; background: rgba(20, 20, 20, 0.6) !important; }
  .ticket-table td, .ticket-table .header { color: #fff !important; }
  .ticket-table .divider td { border-bottom-color: rgba(255, 255, 255, 0.18) !important; }
}

/* Mobile-friendly table wrapping */
@media (max-width: 480px) {
  /* Let the table compute widths more predictably and fill the viewport */
  .ticket-table {
    display: table;          /* override inline-table on small screens */
    width: 100%;
    table-layout: fixed;     /* consistent column widths */
  }

  /* Slightly tighter spacing and type size */
  .ticket-table td {
    padding: 12px 14px;
    font-size: 0.98em;
  }

  /* Header can wrap on two lines if needed */
  .ticket-table .header {
    font-size: 1.25em;
    padding: 14px;
    white-space: normal;     /* allow wrap */
  }

  /* Allow labels to wrap so long names don't push off-screen */
  .ticket-table .label {
    white-space: normal;     /* allow wrap */
    word-break: break-word;  /* break long words if necessary */
    hyphens: auto;           /* nicer hyphenation when supported */
  }

  /* Keep the price on one line and ensure chevron has room */
  .ticket-table .price {
    white-space: nowrap;     /* keep £X on one line */
    padding-right: 28px;     /* space for the chevron */
  }

  /* If you want stronger column guidance on tiny screens */
  .ticket-table tr > td:first-child { width: 88%; }
  .ticket-table tr > td:last-child { width: 12%; }
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
  display:none; position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%;
  background:rgba(0,0,0,0.6); backdrop-filter: blur(4px);
">
  <div style="
    background:#ffffffcc; backdrop-filter: blur(8px); margin: 5% auto; padding: 20px 30px; border-radius: 14px;
    width: 90%; max-width: 420px; font-family: 'Segoe UI','Helvetica Neue',sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3); position: relative;
  ">
    <span id="closePaymentModal" style="position:absolute; top:10px; right:14px; font-size: 1.5em; cursor:pointer; color:#333;">&times;</span>
    <div class="w-full max-w-sm text-sm">
      {{< payment-form >}}
    </div>
  </div>
</div>

<!-- Ticket Table -->

<!-- Ticket Table -->
<div class="overflow-x-auto px-4 pb-5">
  <div class="inline-block min-w-full align-middle">
    <table class="ticket-table min-w-full">
    <tr style="background: linear-gradient(90deg, #000000 0%, #fd4736 100%);">
      <td class="header" colspan="2">🎟️ Ticket Options</td>
    </tr>
    <tr class="divider ticket-option" data-service="Weekend Pass" data-amount="5">
      <td class="label">Weekend Pass</td>
      <td class="price">£5</td>
    </tr>
    <tr class="divider ticket-option" data-service="Weekend Pass + MTG Tournament" data-amount="10">
      <td class="label">Weekend Pass + MTG Tournament</td>
      <td class="price">£10</td>
    </tr>
    <tr class="divider ticket-option" data-service="Weekend Pass + Pokémon TCG Tournament" data-amount="10">
      <td class="label">Weekend Pass + Pokémon TCG Tournament</td>
      <td class="price">£10</td>
    </tr>
    <tr class="divider ticket-option" data-service="Weekend Pass + Both Tournaments" data-amount="12">
      <td class="label">Weekend Pass + Both Tournaments</td>
      <td class="price">£12</td>
    </tr>
    <tr class="divider ticket-option" data-service="Saturday Pass" data-amount="3">
      <td class="label">Saturday Pass</td>
      <td class="price">£3</td>
    </tr>
    <tr class="ticket-option" data-service="Sunday Pass" data-amount="3">
      <td class="label">Sunday Pass</td>
      <td class="price">£3</td>
    </tr>
    </table>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('paymentModal');
  const closeBtn = document.getElementById('closePaymentModal');
  const formHeading = document.getElementById('formHeading');
  const serviceInput = document.getElementById('service');
  const amountInput = document.getElementById('amount');

  function openModalWithTicket(service, amount) {
    if (formHeading) formHeading.textContent = `🎟️ ${service}`;
    if (serviceInput) serviceInput.value = service;
    if (amountInput) amountInput.value = amount;
    if (modal) modal.style.display = 'block';
  }

  document.querySelectorAll('.ticket-option').forEach(row => {
    row.addEventListener('click', () => {
      const service = row.getAttribute('data-service');
      const amount = row.getAttribute('data-amount');
      openModalWithTicket(service, amount);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  }
  window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
});
</script>

</body>
</html>