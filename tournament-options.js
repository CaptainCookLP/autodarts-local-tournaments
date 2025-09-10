// tournament-options.js
const T_KEY = 'tournament';
const MODE_OPTIONS = ['301','501','701','901'];

function $(id){return document.getElementById(id);}

function modeSelect(id){
  const sel = document.createElement('select');
  sel.id = id;
  for(const m of MODE_OPTIONS){
    const opt=document.createElement('option');
    opt.value=m; opt.textContent=m;
    sel.appendChild(opt);
  }
  return sel;
}

async function load(){
  const data = (await chrome.storage.local.get([T_KEY]))[T_KEY] || {
    current:0,
    matches:[
      {p1:'Spieler1',p2:'Spieler2',mode:'501',winner:null},
      {p1:'Spieler3',p2:'Spieler4',mode:'501',winner:null},
      {p1:'',p2:'',mode:'501',winner:null},
      {p1:'',p2:'',mode:'501',winner:null}
    ]
  };
  // fill inputs
  $('m1p1').value=data.matches[0].p1;
  $('m1p2').value=data.matches[0].p2;
  $('m1mode').value=data.matches[0].mode;
  $('m2p1').value=data.matches[1].p1;
  $('m2p2').value=data.matches[1].p2;
  $('m2mode').value=data.matches[1].mode;
  $('m3mode').value=data.matches[2].mode;
  $('m4mode').value=data.matches[3].mode;
  if(data.matches[0].winner===data.matches[0].p1) $('m1w1').checked=true;
  else if(data.matches[0].winner===data.matches[0].p2) $('m1w2').checked=true;
  if(data.matches[1].winner===data.matches[1].p1) $('m2w1').checked=true;
  else if(data.matches[1].winner===data.matches[1].p2) $('m2w2').checked=true;
  updateBracket();
}

function gather(){
  const m1p1=$('m1p1').value.trim();
  const m1p2=$('m1p2').value.trim();
  const m2p1=$('m2p1').value.trim();
  const m2p2=$('m2p2').value.trim();
  const m1win=$('m1w1').checked?m1p1:($('m1w2').checked?m1p2:null);
  const m2win=$('m2w1').checked?m2p1:($('m2w2').checked?m2p2:null);
  const m1lose=m1win? (m1win===m1p1?m1p2:m1p1):null;
  const m2lose=m2win? (m2win===m2p1?m2p2:m2p1):null;
  return {
    current:0,
    matches:[
      {p1:m1p1,p2:m1p2,mode:$('m1mode').value,winner:m1win},
      {p1:m2p1,p2:m2p2,mode:$('m2mode').value,winner:m2win},
      {p1:m1lose||'Verlierer Spiel1',p2:m2lose||'Verlierer Spiel2',mode:$('m3mode').value,winner:null},
      {p1:m1win||'Sieger Spiel1',p2:m2win||'Sieger Spiel2',mode:$('m4mode').value,winner:null}
    ]
  };
}

function updateBracket(){
  const t=gather();
  $('thirdP1').textContent=t.matches[2].p1;
  $('thirdP2').textContent=t.matches[2].p2;
  $('finalP1').textContent=t.matches[3].p1;
  $('finalP2').textContent=t.matches[3].p2;
  chrome.storage.local.get([T_KEY]).then(r=>{
    const saved=r[T_KEY];
    $('status').textContent=saved?`Nächstes Spiel: ${saved.matches[saved.current]?.p1||'-'} vs ${saved.matches[saved.current]?.p2||'-'}`:'Noch kein Turnier gespeichert';
  });
}

async function save(){
  const t=gather();
  await chrome.storage.local.set({[T_KEY]:t});
  updateBracket();
  if (window.AD_SETTINGS && window.AD_SETTINGS.toast) window.AD_SETTINGS.toast('Gespeichert.');
  else console.log('Gespeichert.');
}

['m1p1','m1p2','m2p1','m2p2','m1mode','m2mode','m3mode','m4mode','m1w1','m1w2','m2w1','m2w2'].forEach(id=>{
  const el=$(id);
  if(el) el.addEventListener('input',updateBracket);
  if(el && el.type==='radio') el.addEventListener('change',updateBracket);
});

$('saveTournament').addEventListener('click',save);

load().catch(console.error);
