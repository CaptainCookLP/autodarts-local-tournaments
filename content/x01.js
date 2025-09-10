// content.js
(() => {
  const LABELS = {
    base: 'Base score',
    in: 'In mode',
    out: 'Out mode',
    rounds: 'Max rounds',
    bull: 'Bull mode',
    bulloff: 'Bull-off',
    match: 'Match mode',
    lobby: 'Lobby'
  };

  function xpLiteral(s) {
    if (s == null) return "''";
    const str = String(s);
    if (str.indexOf("'") === -1) return "'" + str + "'";
    return "concat('" + str.split("'").join("',\"'\",'") + "')";
  }

  function findButton(labelText, buttonText) {
    const xp =
      `//p[normalize-space(.)=${xpLiteral(labelText)}]` +
      `/following::div[@role='group'][1]//button[normalize-space(.)=${xpLiteral(buttonText)}]`;
    return document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue || null;
  }

  async function clickByLabel(labelText, buttonText) {
    if (!buttonText) return true;
    for (let i = 0; i < 4; i++) {
      const btn = findButton(labelText, buttonText);
      if (btn) { btn.click(); return true; }
      await new Promise(r => setTimeout(r, 120));
    }
    console.warn(`[Autodarts Helper] Button nicht gefunden: ${labelText} → ${buttonText}`);
    return false;
  }

  function clickOpenLobby() {
    const xp = `//button[translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')='open lobby']`;
    const btn = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (btn) { btn.click(); return true; }
    console.warn('[Autodarts Helper] "Open Lobby" Button nicht gefunden');
    return false;
  }

  function waitForUI(timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      const xp = `//p[normalize-space(.)=${xpLiteral('Base score')}]`;
      const ready = () => !!document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (ready()) return resolve(true);
      const mo = new MutationObserver(() => { if (ready()) { mo.disconnect(); resolve(true); } });
      mo.observe(document.documentElement, { childList: true, subtree: true });
      const timer = setInterval(() => {
        if (performance.now() - start > timeoutMs) { clearInterval(timer); mo.disconnect(); reject(new Error('UI not ready')); }
      }, 250);
    });
  }

  function findMatchSelect(kind /* 'legs'|'sets' */) {
    const needle = String(kind || '').toLowerCase();
    const xp =
      `//p[normalize-space(.)=${xpLiteral('Match mode')}]` +
      `/following::div[contains(@class,'chakra-stack')][1]` +
      `//select[option[contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), ${xpLiteral(needle)})]]`;
    return document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue || null;
  }

  function setSelectValue(selectEl, valueString) {
    if (!selectEl) return false;
    const val = String(valueString);
    let chosen = Array.from(selectEl.options).find(o => o.value === val);
    if (!chosen) {
      chosen = Array.from(selectEl.options).find(o => {
        const t = (o.textContent || '').toLowerCase().trim();
        return t.endsWith(` ${val} legs`) || t.endsWith(` ${val} sets`) ||
               t === `first to ${val} leg` || t === `first to ${val} set`;
      });
    }
    if (!chosen) return false;
    selectEl.value = chosen.value;
    selectEl.dispatchEvent(new Event('input', { bubbles: true }));
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  async function applyMatchExtras(payload) {
    const mode = String(payload.match || '').toLowerCase();
    if (mode === 'legs') {
      const legsSelect = findMatchSelect('legs');
      if (payload.legsTo) setSelectValue(legsSelect, payload.legsTo);
    } else if (mode === 'sets') {
      const setsSelect = findMatchSelect('sets');
      const legsSelect = findMatchSelect('legs');
      if (payload.setsTo) {
        setSelectValue(setsSelect, payload.setsTo);
        await new Promise(r => setTimeout(r, 80));
      }
      if (payload.legsPerSet) setSelectValue(legsSelect, payload.legsPerSet);
    }
  }

  async function runApplyAndOpen(payload) {
    await waitForUI();

    const plan = [
      ['base', payload.base],
      ['in', payload.in],
      ['out', payload.out],
      ['rounds', payload.rounds],
      ['bull', payload.bull],
      ['bulloff', payload.bulloff],
      ['match', payload.match],
      ['lobby', payload.lobby]
    ];

    for (const [key, val] of plan) {
      if (!val) continue;
      await clickByLabel(LABELS[key], String(val));
      await new Promise(r => setTimeout(r, 120));
    }

    await applyMatchExtras(payload);
    clickOpenLobby();
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === 'APPLY_AND_OPEN' && msg.payload && msg.payload.__autodarts_helper) {
      runApplyAndOpen(msg.payload).then(() => sendResponse({ ok: true })).catch(e => sendResponse({ ok: false, error: e.message }));
      return true;
    }
    if (msg && msg.type === 'APPLY_AND_OPEN') {
      (async () => {
        const payload = await window.AD_SETTINGS.getAll();
        await runApplyAndOpen(payload);
        sendResponse({ ok: true });
      })().catch(e => sendResponse({ ok: false, error: e.message }));
      return true;
    }
  });
})();
