// options.js
const K = window.AD_SETTINGS.KEYS;

function toggleMatchUI() {
  const mode = document.getElementById("match").value;
  document.getElementById("match-legs").classList.toggle("hidden", mode !== "Legs");
  document.getElementById("match-sets").classList.toggle("hidden", mode !== "Sets");
}

async function load() {
  const data = await window.AD_SETTINGS.getAll();
  for (const k of K) {
    const el = document.getElementById(k);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = !!data[k];
    else el.value = String(data[k] ?? "");
  }
  toggleMatchUI();
}

async function save() {
  const out = {};
  for (const k of K) {
    const el = document.getElementById(k);
    if (!el) continue;
    out[k] = el.type === "checkbox" ? el.checked : el.value;
  }
  await window.AD_SETTINGS.save(out);
}

function setDefaults() {
  const D = window.AD_SETTINGS.DEFAULTS;
  for (const k of Object.keys(D)) {
    const el = document.getElementById(k);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = !!D[k];
    else el.value = String(D[k]);
  }
  toggleMatchUI();
}

document.getElementById("match").addEventListener("change", toggleMatchUI);
document.getElementById("saveX01").addEventListener("click", async () => {
  await save();
  alert("Gespeichert.");
});
document.getElementById("reset").addEventListener("click", setDefaults);

load().catch(console.error);
