(() => {
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
  async function run() {
    try {
      await waitForPlayers();
    } catch (e) {
      console.warn('[Autodarts Helper] Spielerbereich nicht gefunden');
    }
    const { players = '', removeHost = false } = await chrome.storage.sync.get(['players','removeHost']);
    if (removeHost) {
      const ok = await removeFirstPlayerWithRetry();
      if (!ok) console.warn('[Autodarts Helper] Erster Spieler (Host) konnte nicht entfernt werden');
      await new Promise(r => setTimeout(r, 120));
    }
    if (players) {
      await addPlayersCSV(players);
    }
  }
  if (/https:\/\/play\.autodarts\.io\/matches\//.test(location.href)) {
    run().catch(console.error);
  }
})();
