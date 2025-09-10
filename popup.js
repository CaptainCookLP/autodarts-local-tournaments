// popup.js
const ORIGIN = "play.autodarts.io";

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

function startPicker() {
  chrome.tabs
    .query({ active: true, currentWindow: true })
    .then(function (tabs) {
      var tab = tabs && tabs[0];
      if (!tab) return;
      var isAd = false;
      try {
        isAd = new URL(tab.url || "").host === ORIGIN;
      } catch (e) {}
      if (!isAd) {
        return chrome.tabs.create({ url: "https://" + ORIGIN }).then(function (created) {
          var tabId = created.id;
          var listener = function (id, info) {
            if (id === tabId && info && info.status === "complete") {
              chrome.runtime.sendMessage({ type: "EXECUTE_PICKER", tabId: tabId }, function () {});
              chrome.tabs.onUpdated.removeListener(listener);
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
        });
      }
      return chrome.runtime.sendMessage({ type: "EXECUTE_PICKER", tabId: tab.id }, function () {});
    });
}

document.getElementById("openOptions").addEventListener("click", function () {
  if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
});

document.getElementById("addVar").addEventListener("click", function () {
  if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
  setTimeout(startPicker, 300);
});

document.getElementById("start").addEventListener("click", async () => {
  const tab = await getCurrentTab();
  const settings = await window.AD_SETTINGS.getAll();

  if (!/https:\/\/play\.autodarts\.io\/lobbies\/new\/x01/.test(tab.url || "")) {
    await chrome.tabs.update(tab.id, { url: "https://play.autodarts.io/lobbies/new/x01" });
    await new Promise(r => setTimeout(r, 900));
  }

  await sendWithRetry(tab.id, {
    type: "APPLY_AND_OPEN",
    payload: { ...settings, __autodarts_helper: true }
  }, 12, 800);

  await sendWithRetry(tab.id, {
    type: "CONFIGURE_LOBBY",
    payload: { ...settings, __autodarts_helper_lobby: true }
  }, 14, 850);

  window.close();
});
