(() => {
  const T_KEY = 'tournament';
  const INIT_DELAY_MS = 2000;


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
  function waitForPlayers(timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      const readyXp = `//h2[normalize-space(.)='Players']`;
      const ready = () => !!document.evaluate(readyXp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (ready()) return resolve(true);
      const mo = new MutationObserver(() => { if (ready()) { mo.disconnect(); resolve(true); } });
      mo.observe(document.documentElement, { childList: true, subtree: true });
      const timer = setInterval(() => {
        if (performance.now() - start > timeoutMs) { clearInterval(timer); mo.disconnect(); reject(new Error('Players UI not ready')); }
      }, 250);
    });
  }

  function readScores() {
    const rows = document.querySelectorAll('#ad-ext-player-display > div');
    return Array.from(rows).map(r => ({
      name: r.querySelector('.ad-ext-player-name p')?.textContent?.trim(),
      score: parseInt(r.querySelector('.ad-ext-player-score')?.textContent || '', 10)
    }));
  }

  async function storeWinner(winner, data) {
    const match = data.matches[data.current];
    if (!match) return;
    match.winner = winner;
    const loser = match.p1 === winner ? match.p2 : match.p1;
    if (data.current === 0) {
      data.matches[2].p1 = loser;
      data.matches[3].p1 = winner;
    } else if (data.current === 1) {
      data.matches[2].p2 = loser;
      data.matches[3].p2 = winner;
    }
    data.current = Math.min(data.current + 1, data.matches.length - 1);
    await chrome.storage.local.set({ [T_KEY]: data });
  }

  async function watchForWinner(data) {
    const modeEl = document.querySelector('#ad-ext-game-variant');
    if (!/x01/i.test(modeEl?.textContent || '')) return;
    for (;;) {
      const scores = readScores();
      const win = scores.find(p => p.score === 0);
      if (win && win.name) {
        await storeWinner(win.name, data);
        break;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  async function run() {
    try {
      await waitForPlayers();
    } catch (e) {
      console.warn('[Autodarts Helper] Spielerbereich nicht gefunden');
    }

    const [{ players = '', removeHost = false }, tData] = await Promise.all([
      chrome.storage.sync.get(['players', 'removeHost']),
      chrome.storage.local.get([T_KEY])
    ]);
    let names = players;
    const tournament = tData[T_KEY];
    if (tournament && tournament.matches && tournament.matches[tournament.current]) {
      const m = tournament.matches[tournament.current];
      names = [m.p1, m.p2].filter(Boolean).join(',');
    }

    await new Promise(r => setTimeout(r, INIT_DELAY_MS));

    if (removeHost) {
      const ok = await removeFirstPlayerWithRetry();
      if (!ok) console.warn('[Autodarts Helper] Erster Spieler (Host) konnte nicht entfernt werden');
      await new Promise(r => setTimeout(r, 120));
    }

    if (names) {
      await addPlayersCSV(names);
    }
    if (tournament && tournament.matches && tournament.matches[tournament.current]) {
      watchForWinner(tournament).catch(console.error);
    }
  }
  if (/https:\/\/play\.autodarts\.io\/matches\//.test(location.href)) {
    run().catch(console.error);
  }
})();
