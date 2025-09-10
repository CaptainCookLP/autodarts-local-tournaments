import { loadState, saveState, resetState, mergePlayers, normName } from './storage.js';
import { buildBracket, previewMatches } from './bracket.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
let state = loadState();

// Tabs: Click + Hash + Keyboard
function activate(tab){
  for (const b of $$('.tab-btn')) { const on = b.dataset.tab===tab; b.setAttribute('aria-selected', on); }
  for (const p of $$('[data-panel]')) p.hidden = p.dataset.panel!==tab;
  history.replaceState(null,'',`#${tab}`);
  localStorage.setItem('adlt:lastTab', tab);
}
(function initTabs(){
  const last = location.hash.slice(1) || localStorage.getItem('adlt:lastTab') || 'players';
  activate(last);
  $$('.tab-btn').forEach(b=>{
    b.addEventListener('click', ()=>activate(b.dataset.tab));
    b.addEventListener('keydown', (e)=>{
      if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
        const idx=$$('.tab-btn').indexOf(b); const next = e.key==='ArrowRight'? idx+1: idx-1;
        const btn=$$('.tab-btn')[(next+$$('.tab-btn').length)%$$('.tab-btn').length];
        btn.focus(); btn.click();
      }
    });
  });
})();

// UI Binding
function renderPlayers(){
  const list = $('#playerList'); list.innerHTML='';
  state.players.forEach(p=>{
    const item = document.createElement('div'); item.className='list-item';
    item.innerHTML = `<span>${p.name}</span><button class="btn" data-id="${p.id}">Entfernen</button>`;
    item.querySelector('button').addEventListener('click', ()=>{
      state.players = state.players.filter(x=>x.id!==p.id); saveState(state); renderPlayers();
    });
    list.appendChild(item);
  });
}
function bindInputs(){
  $('#format').value = state.format;
  $('#bestOf').value = String(state.bestOf);
  $('#seed').value = state.seed;
  $('#showAverages').value = state.showAverages;
  $('#autoAdvance').value = state.autoAdvance;
  $('#webhook').value = state.webhook;

  $('#format').onchange = e=>{ state.format=e.target.value; saveState(state); };
  $('#bestOf').onchange = e=>{ state.bestOf=Math.max(1,parseInt(e.target.value||'1',10)); saveState(state); };
  $('#seed').onchange = e=>{ state.seed=e.target.value; saveState(state); };
  $('#showAverages').onchange = e=>{ state.showAverages=e.target.value; saveState(state); };
  $('#autoAdvance').onchange = e=>{ state.autoAdvance=e.target.value; saveState(state); };
  $('#webhook').oninput = e=>{ state.webhook=e.target.value.trim(); saveState(state); };
}
function addPlayersFromInput(str){
  const names = str.split(',').map(s=>s.trim()).filter(Boolean);
  state.players = mergePlayers(state.players, names);
  saveState(state); renderPlayers();
}
$('#addPlayers').addEventListener('click', ()=> addPlayersFromInput($('#playerInput').value));
$('#playerInput').addEventListener('keydown', e=>{ if(e.key==='Enter'){ addPlayersFromInput($('#playerInput').value); } });

$('#btnImportTournament').addEventListener('click', ()=>{
  const raw = $('#importTournament').value;
  const names = raw.split(/\r?\n|,|;|\t/).map(s=>s.trim()).filter(Boolean);
  state.players = mergePlayers(state.players, names);
  saveState(state); renderPlayers();
});

// Export / Import / Reset
$('#btn-export').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {href:url, download:'autodarts-local-tournaments.settings.json'});
  document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
});
$('#btn-import').addEventListener('click', async ()=>{
  const [file] = await showOpenFilePicker({types:[{description:'JSON', accept:{'application/json':['.json']}}]})
    .then(h=>h.map(x=>x.getFile()));
  const next = JSON.parse(await file.text());
  state = {...state, ...next}; saveState(state); bindInputs(); renderPlayers();
});
$('#btn-reset').addEventListener('click', ()=>{
  if(confirm('Wirklich alle Einstellungen zurücksetzen?')){
    state = resetState(); bindInputs(); renderPlayers();
  }
});

// Bracket Vorschau
$('#btnBuildBracket').addEventListener('click', ()=>{
  const plan = buildBracket(state.players, {seed: state.seed, format: state.format});
  $('#bracketPreview').innerHTML = previewMatches(plan);
});

bindInputs(); renderPlayers();
