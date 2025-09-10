const T_KEY = 'tournament';

function render(data) {
  const bracket = document.getElementById('bracket');
  bracket.innerHTML = '';
  if (!data || !data.matches) {
    bracket.textContent = 'Kein Turnier aktiv.';
    return;
  }
  data.matches.forEach((m, i) => {
    const div = document.createElement('div');
    let text = `Spiel ${i + 1}: ${m.p1 || '-'} vs ${m.p2 || '-'}`;
    if (m.winner) text += ` – Sieger: ${m.winner}`;
    div.textContent = text;
    bracket.appendChild(div);
  });
}

chrome.storage.local.get([T_KEY]).then(r => render(r[T_KEY]));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[T_KEY]) {
    render(changes[T_KEY].newValue);
  }
});
