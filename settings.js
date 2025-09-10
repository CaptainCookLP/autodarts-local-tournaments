(function(){
  const KEYS = [
    'base','in','out','rounds','bull','bulloff','match','lobby',
    'legsTo','setsTo','legsPerSet','board','players','removeHost','startGame'
  ];
  const DEFAULTS = {
    base: '501',
    in: 'Straight',
    out: 'Double',
    rounds: '50',
    bull: '25/50',
    bulloff: 'Off',
    match: 'Off',
    lobby: 'Private',
    legsTo: '1',
    setsTo: '2',
    legsPerSet: '2',
    board: '',
    players: '',
    removeHost: false,
    startGame: true
  };
  async function getAll(){
    const stored = await chrome.storage.sync.get(KEYS);
    return Object.assign({}, DEFAULTS, stored);
  }
  function save(obj){
    const out = {};
    for(const k of KEYS){
      if(k in obj) out[k] = obj[k];
    }
    return chrome.storage.sync.set(out);
  }
  function toast(msg){
    const div = document.createElement('div');
    div.textContent = msg;
    div.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#333;color:#fff;padding:8px 12px;border-radius:4px;z-index:2147483647;font-size:13px;';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
  }
  window.AD_SETTINGS = { KEYS, DEFAULTS, getAll, save, toast };
})();
