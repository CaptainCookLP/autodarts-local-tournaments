import { loadState } from './storage.js';

const s = loadState();
document.getElementById('cntPlayers').textContent = s.players.length;
document.getElementById('fmt').textContent = s.format === 'single-elim' ? 'SE' : 'DE';
document.getElementById('bo').textContent = s.bestOf;

document.getElementById('openOptions').addEventListener('click', () => {
  if (chrome?.runtime?.openOptionsPage) chrome.runtime.openOptionsPage();
});

document.getElementById('startNow').addEventListener('click', () => {
  chrome.runtime?.sendMessage?.({ type: 'startNextMatch' });
});
