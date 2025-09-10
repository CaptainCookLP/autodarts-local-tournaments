// lobby.js
(() => {
  function xpLiteral(s) {
    if (s == null) return "''";
    const str = String(s);
    if (str.indexOf("'") === -1) return "'" + str + "'";
    return "concat('" + str.split("'").join("',\"'\",'") + "')";
  }

  function waitForLobby(timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      const readyXp = `//h2[normalize-space(.)='Lobby details'] | //h2[normalize-space(.)='Select board'] | //h2[normalize-space(.)='Players']`;
      const ready = () => !!document.evaluate(readyXp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (ready()) return resolve(true);
      const mo = new MutationObserver(() => { if (ready()) { mo.disconnect(); resolve(true); } });
      mo.observe(document.documentElement, { childList: true, subtree: true });
      const timer = setInterval(() => {
        if (performance.now() - start > timeoutMs) { clearInterval(timer); mo.disconnect(); reject(new Error('Lobby UI not ready')); }
      }, 250);
    });
  }

  // --- Board auswählen ---
  function findBoardSelect() {
    const xp = `//h2[normalize-space(.)='Select board']/following::select[1]`;
    return document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue || null;
  }
  function setBoard(boardInput) {
    if (!boardInput) return false;
    const sel = findBoardSelect();
    if (!sel) return false;
    const want = String(boardInput).trim().toLowerCase();
    let chosen = null;
    for (const opt of Array.from(sel.options)) {
      const txt = (opt.textContent || '').trim().toLowerCase();
      const val = (opt.value || '').trim().toLowerCase();
      if (txt === want || val === want) { chosen = opt; break; }
    }
    if (!chosen) return false;
    sel.value = chosen.value;
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // --- Spieler: erste Zeile (= Host) löschen, mit Retries ---
  function findFirstPlayerRow() {
    const xp = `//h2[normalize-space(.)='Players']/following::table[1]//tbody/tr[1]`;
    return document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue || null;
  }
  function findDeleteButtonInRow(row) {
    if (!row) return null;
    return (
      row.querySelector('button[aria-label="Delete player"]') ||
      row.querySelector('button[aria-label="delete player"]') ||
      row.querySelector('button[aria-label*="Delete" i]') ||
      row.querySelector('button:has(svg)') ||
      row.querySelector('button')
    );
  }
  async function removeFirstPlayerWithRetry(retries = 12, waitMs = 150) {
    for (let i = 0; i < retries; i++) {
      const row = findFirstPlayerRow();
      if (row) {
        const del = findDeleteButtonInRow(row);
        if (del && !del.disabled) {
          del.click();
          return true;
        }
      }
      await new Promise(r => setTimeout(r, waitMs));
    }
    return false;
  }

  // --- Spieler hinzufügen (lokal) ---
  function addLocalPlayer(name) {
    const input = document.querySelector('input[placeholder="Enter name for local player"]');
    const addBtn = document.querySelector('button[aria-label="add-player"]');
    if (!input || !addBtn) return false;
    input.value = name;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    addBtn.click();
    return true;
  }
  async function addPlayersCSV(csv) {
    if (!csv) return;
    const names = csv.split(',').map(s => s.trim()).filter(Boolean);
    for (const n of names) {
      const ok = addLocalPlayer(n);
      if (!ok) console.warn('[Autodarts Helper] Spieler konnte nicht hinzugefügt werden:', n);
      await new Promise(r => setTimeout(r, 140));
    }
  }

  // --- Start Game ---
  function clickStartGame() {
    const xp = `//button[normalize-space(.)='Start game']`;
    const btn = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (btn) { btn.click(); return true; }
    console.warn('[Autodarts Helper] "Start game" Button nicht gefunden');
    return false;
  }

  async function configureLobby(payload) {
    await waitForLobby();

    if (payload.board) {
      const ok = setBoard(payload.board);
      if (!ok) console.warn('[Autodarts Helper] Board nicht gefunden:', payload.board);
      await new Promise(r => setTimeout(r, 120));
    }

    if (payload.removeHost) {
      await new Promise(r => setTimeout(r, 200)); // kurze UI-Stabilisierung
      const ok = await removeFirstPlayerWithRetry(12, 150);
      if (!ok) console.warn('[Autodarts Helper] Erster Spieler (Host) nicht entfernbar');
      await new Promise(r => setTimeout(r, 120));
    }

    if (payload.players) {
      await addPlayersCSV(payload.players);
    }

    if (payload.startGame) {
      clickStartGame();
    }
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === 'CONFIGURE_LOBBY' && msg.payload && msg.payload.__autodarts_helper_lobby) {
      configureLobby(msg.payload)
        .then(() => sendResponse({ ok: true }))
        .catch(err => sendResponse({ ok: false, error: err.message }));
      return true; // async
    }
  });
})();
