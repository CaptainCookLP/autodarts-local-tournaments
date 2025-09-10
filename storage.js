const STORE_KEY = 'adlt:settings:v2';
const defaultState = {
  players: [],             // [{id, name}]
  format: 'single-elim',
  bestOf: 3,
  seed: 'balanced',
  showAverages: 'on',
  autoAdvance: 'on',
  webhook: ''
};
export function loadState() {
  try { return {...defaultState, ...(JSON.parse(localStorage.getItem(STORE_KEY))||{})}; }
  catch { return {...defaultState}; }
}
let saveTimer;
export function saveState(next) {
  if (saveTimer) cancelAnimationFrame(saveTimer);
  saveTimer = requestAnimationFrame(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  });
}
export function resetState() { localStorage.removeItem(STORE_KEY); return {...defaultState}; }
export function uid() { return crypto.randomUUID ? crypto.randomUUID() : 'id-'+Math.random().toString(36).slice(2); }
export function normName(s){ return s.normalize('NFKC').replace(/\s+/g,' ').trim(); }
export function mergePlayers(current, names){
  const byName = new Map(current.map(p => [normName(p.name).toLowerCase(), p]));
  const out = [...current];
  for (const raw of names){
    const name = normName(raw);
    if (!name) continue;
    const key = name.toLowerCase();
    if (!byName.has(key)) { const p={id:uid(), name}; byName.set(key,p); out.push(p); }
  }
  return out;
}
