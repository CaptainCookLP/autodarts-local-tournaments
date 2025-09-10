// popup.js
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendWithRetry(tabId, message, tries = 12, delayMs = 750) {
  for (let i = 0; i < tries; i++) {
    try {
      await chrome.tabs.sendMessage(tabId, message);
      return true;
    } catch {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return false;
}

document.getElementById("start").addEventListener("click", async () => {
  const tab = await getCurrentTab();
  const settings = await window.AD_SETTINGS.getAll();

  // 1) ggf. zur X01-Seite navigieren
  if (!/https:\/\/play\.autodarts\.io\/lobbies\/new\/x01/.test(tab.url || "")) {
    await chrome.tabs.update(tab.id, { url: "https://play.autodarts.io/lobbies/new/x01" });
    await new Promise(r => setTimeout(r, 900));
  }

  // 2) X01 anwenden & "Open Lobby"
  await sendWithRetry(tab.id, {
    type: "APPLY_AND_OPEN",
    payload: { ...settings, __autodarts_helper: true }
  }, 12, 800);

  // 3) Lobby konfigurieren (Board/Spieler/Host/Start)
  await sendWithRetry(tab.id, {
    type: "CONFIGURE_LOBBY",
    payload: { ...settings, __autodarts_helper_lobby: true }
  }, 14, 850);

  window.close();
});
