<div class="tiebreaker-rules">
  <div class="rules-section swiss">
    <strong>🟦 Swiss Rounds (can end in a draw)</strong>
    <ul>
      <li>When time is called → finish current turn (Turn 0) + 1 extra full turn.</li>
      <li>A 10‑minute overtime clock starts immediately when time is called.</li>
      <li>If no winner after that → game is a draw.</li>
    </ul>
  </div>

  <hr>

  <div class="rules-section topcut">
    <strong>🟥 Top Cut / Elimination (must have a winner)</strong>
    <ul>
      <li>Same procedure (Turn 0 +1, 10‑minute overtime).</li>
      <li>If 10 minutes expire and no winner:</li>
      <li>The player with a Prize card lead is declared the winner.</li>
      <li>If Prizes are tied → start a Tiebreaker Game (normal 6‑Prize setup).</li>
      <li>Tiebreaker Game has a 10‑minute time limit.</li>
      <li>The first player to establish a Prize card lead is declared the winner.</li>
    </ul>
  </div>
</div>

<style>
.tiebreaker-rules {
  font-family: 'Segoe UI','Helvetica Neue',sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
  background: #ffffffcc;
  backdrop-filter: blur(6px);
  border-radius: 14px;
  padding: 16px 20px;
  max-width: 700px;
  margin: 1.5rem auto;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.tiebreaker-rules hr {
  border: none;
  border-top: 1px solid #ccc;
  margin: 14px 0;
}
.rules-section {
  padding: 10px;
  border-radius: 8px;
}
.rules-section.swiss {
  background: #d0e6ff;
}
.rules-section.topcut {
  background: #ffd6d6;
}
.tiebreaker-rules ul {
  margin: 8px 0 0 20px;
  padding: 0;
}
.tiebreaker-rules li {
  margin-bottom: 4px;
}

/* Dark mode */
html.dark .tiebreaker-rules,
:root.dark .tiebreaker-rules,
[data-theme='dark'] .tiebreaker-rules {
  background: rgba(20, 20, 20, 0.85);
  color: #fff;
}
html.dark .rules-section.swiss {
  background: rgba(64, 128, 192, 0.3);
}
html.dark .rules-section.topcut {
  background: rgba(192, 64, 64, 0.3);
}
html.dark .tiebreaker-rules hr {
  border-top-color: rgba(255,255,255,0.18);
}
</style>
