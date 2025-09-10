const T_KEY = 'tournament';

function fmt(res) {
  if (!res) return '';
  const p = Number.isFinite(res.points) ? res.points : '-';
  const s = Number.isFinite(res.sets) ? res.sets : '-';
  const l = Number.isFinite(res.legs) ? res.legs : '-';
  return `P${p} S${s} L${l}`;
}

function matchDiv(m, idx, current) {
  const div = document.createElement('div');
  div.className = 'br-match';
  if (idx === current) div.classList.add('current');
  if (m.winner) div.classList.add('done');
  const p1 = document.createElement('div');
  p1.className = 'br-player';
  p1.innerHTML = `<span class="name">${m.p1 || '-'}</span><span class="score">${fmt(m.result?.p1)}</span>`;
  const p2 = document.createElement('div');
  p2.className = 'br-player';
  p2.innerHTML = `<span class="name">${m.p2 || '-'}</span><span class="score">${fmt(m.result?.p2)}</span>`;
  div.appendChild(p1);
  div.appendChild(p2);
  return div;
}

function render(data) {
  const bracket = document.getElementById('bracket');
  bracket.innerHTML = '';
  if (!data || !data.enabled) {
    bracket.textContent = 'Turniermodus deaktiviert.';
    return;
  }
  const r1 = document.createElement('div');
  r1.className = 'round';
  r1.appendChild(matchDiv(data.matches[0], 0, data.current));
  r1.appendChild(matchDiv(data.matches[1], 1, data.current));
  const r2 = document.createElement('div');
  r2.className = 'round';
  r2.appendChild(matchDiv(data.matches[3], 3, data.current));
  r2.appendChild(matchDiv(data.matches[2], 2, data.current));
  bracket.className = 'bracket';
  bracket.appendChild(r1);
  bracket.appendChild(r2);
}

chrome.storage.local.get([T_KEY]).then(r => render(r[T_KEY]));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[T_KEY]) {
    render(changes[T_KEY].newValue);
  }
});
