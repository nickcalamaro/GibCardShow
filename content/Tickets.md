---

title: Tickets
herostyle: "basic"
showDate: false
showhero: false

---

<meta name="description" content="Get your tickets now for the 2025 Gibraltar Card Show - bigger and better than ever!">

Get your tickets now for the 2025 Gibraltar Card Show - bigger and better than ever!

<style>
  /* Base */
  .ticket-table {
    color: #222;
    background: #ffffffcc;
    backdrop-filter: blur(6px);
    font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
    font-size: 1.05em;
    border-collapse: collapse;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    border-radius: 14px;
    overflow: hidden;
  }
  .ticket-table td {
    padding: 14px 20px;
  }
  .ticket-table .header {
    font-size: 1.5em;
    font-weight: 700;
    padding: 16px 20px;
    text-align: center;
    letter-spacing: 0.5px;
    color: #fff; /* White text over black/red gradient */
  }
  .ticket-table .label { font-weight: 600; }
  .ticket-table .price { text-align: right; font-weight: 500; }
  .ticket-table .divider td { border-bottom: 1px solid #ccc; }

  /* Dark mode */
  html.dark .ticket-table,
  :root.dark .ticket-table,
  [data-theme='dark'] .ticket-table,
  [data-scheme='dark'] .ticket-table,
  [data-color-scheme='dark'] .ticket-table {
    color: #fff !important;
    background: rgba(20, 20, 20, 0.6) !important;
  }
  html.dark .ticket-table td,
  :root.dark .ticket-table td,
  [data-theme='dark'] .ticket-table td,
  [data-scheme='dark'] .ticket-table td,
  [data-color-scheme='dark'] .ticket-table td {
    color: #fff !important;
  }
  html.dark .ticket-table .header,
  :root.dark .ticket-table .header,
  [data-theme='dark'] .ticket-table .header,
  [data-scheme='dark'] .ticket-table .header,
  [data-color-scheme='dark'] .ticket-table .header {
    color: #fff !important;
  }
  html.dark .ticket-table .divider td,
  :root.dark .ticket-table .divider td,
  [data-theme='dark'] .ticket-table .divider td,
  [data-scheme='dark'] .ticket-table .divider td,
  [data-color-scheme='dark'] .ticket-table .divider td {
    border-bottom-color: rgba(255, 255, 255, 0.18) !important;
  }

  @media (prefers-color-scheme: dark) {
    .ticket-table {
      color: #fff !important;
      background: rgba(20, 20, 20, 0.6) !important;
    }
    .ticket-table td,
    .ticket-table .header {
      color: #fff !important;
    }
    .ticket-table .divider td {
      border-bottom-color: rgba(255, 255, 255, 0.18) !important;
    }
  }
</style>

<div style="display: flex; justify-content: center; overflow-x: auto; padding: 0 20px;">
  <table class="ticket-table" style="width: 90%; min-width: 330px; table-layout: fixed;">
    <colgroup>
      <col style="min-width: 220px;">
      <col>
    </colgroup>
    <!-- Updated header with brand colours -->
    <tr style="background: linear-gradient(90deg, #000000 0%, #fd4736 100%);">
      <td class="header" colspan="2">🎟️ Ticket Options – Gibraltar Card Show 2025</td>
    </tr>
    <!-- Rows -->
    <tr class="divider">
      <td class="label">Weekend Pass</td>
      <td class="price">£5</td>
    </tr>
    <tr class="divider">
      <td class="label">Weekend Pass + MTG Tournament</td>
      <td class="price">£10</td>
    </tr>
    <tr class="divider">
      <td class="label">Weekend Pass + Pokémon TCG Tournament</td>
      <td class="price">£10</td>
    </tr>
    <tr class="divider">
      <td class="label">Weekend Pass + Both Tournaments</td>
      <td class="price">£12</td>
    </tr>
    <tr class="divider">
      <td class="label">Saturday Pass</td>
      <td class="price">£3</td>
    </tr>
    <tr>
      <td class="label">Sunday Pass</td>
      <td class="price">£3</td>
    </tr>
  </table>
</div>
