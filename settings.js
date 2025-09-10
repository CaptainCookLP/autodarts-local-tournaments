// settings.js
// Zentrale Settings & Hilfsfunktionen – wird von allen anderen JS genutzt.
// Einbinden:
// - popup.html <script src="settings.js"></script>
// - options.html <script src="settings.js"></script>
// - manifest.json content_scripts: ["settings.js", "content.js"] usw.

(function () {
  const KEYS = [
    "base","in","out","rounds","bull","bulloff","match","lobby",
    "legsTo","setsTo","legsPerSet",
    "board","players","removeHost","startGame"
  ];

  const DEFAULTS = {
    base: "501",
    in: "Straight",
    out: "Double",
    rounds: "50",
    bull: "25/50",
    bulloff: "Off",
    lobby: "Private",
    match: "Off",        // "Off" | "Legs" | "Sets"
    legsTo: "3",         // nur relevant, wenn match=Legs
    setsTo: "3",         // nur relevant, wenn match=Sets
    legsPerSet: "2",     // nur relevant, wenn match=Sets
    board: "PiBoard",
    players: "Spieler1, Spieler2",         // "PLAYER 1, NICKLAS"
    removeHost: true,
    startGame: true
  };

  function mergeDefaults(obj) {
    const out = { ...DEFAULTS, ...(obj || {}) };
    // Normieren: alles als String außer Booleans
    for (const k of KEYS) {
      if (!(k in out)) out[k] = DEFAULTS[k];
      if (typeof DEFAULTS[k] === "boolean") {
        out[k] = !!out[k];
      } else if (out[k] != null) {
        out[k] = String(out[k]);
      }
    }
    return out;
  }

  async function getAll() {
    const raw = await chrome.storage.sync.get(KEYS);
    return mergeDefaults(raw);
  }

  async function save(partial) {
    const mergedCurrent = await getAll();
    const next = { ...mergedCurrent, ...(partial || {}) };
    await chrome.storage.sync.set(next);
    return next;
  }

  // global verfügbar machen
  window.AD_SETTINGS = {
    KEYS,
    DEFAULTS,
    mergeDefaults,
    getAll,
    save
  };
})();
