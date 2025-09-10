import { uid } from './storage.js';

// Balanced Seeding 8er (skaliert auf 2^n)
const seedBalanced = n => {
  // Standard-Bracket-Sequenz für 2^k: 1,8,5,4,3,6,7,2 … wir berechnen rekursiv
  let arr=[1,2];
  while(arr.length<n){
    const a=[], len=arr.length*2+1;
    for(const s of arr){ a.push(s, len - s); }
    arr=a;
  }
  return arr.slice(0,n);
};

export function buildBracket(players, {seed='balanced', format='single-elim'}){
  const P = players.slice();
  // Runde auf 2^k hochrunden, Byes anhängen
  const pow = Math.pow(2, Math.ceil(Math.log2(Math.max(1, P.length))));
  while(P.length < pow) P.push({id: uid(), name: 'BYE'});

  // Seeding
  let order = [...P];
  if(seed==='balanced'){
    const seq = seedBalanced(pow); // 1-indexed
    order = seq.map(i => P[i-1]);
  }else if(seed==='random'){
    order = P.sort(()=>Math.random()-0.5);
  }

  // Erzeuge Matches der Runde 1
  const rounds = [];
  let current = [];
  for(let i=0;i<order.length;i+=2){
    current.push(match(order[i], order[i+1]));
  }
  rounds.push(current);

  // Folge-Runden
  while(current.length>1){
    const next=[];
    for(let i=0;i<current.length;i+=2){
      next.push(match(current[i], current[i+1])); // Platzhalter – Teilnehmer kommen dynamisch
    }
    rounds.push(next);
    current=next;
  }

  return { rounds };
}

function match(a,b){
  return {
    id: uid(),
    a: participant(a), b: participant(b),
    winnerId: null, loserId: null,
    scores: {a:0, b:0}, // Legs in BestOf
  };
}
function participant(x){
  // Spielerobjekt oder Match-Objekt (für spätere Runden)
  if(!x) return {type:'bye', id: uid(), name:'BYE'};
  if(x.rounds) return {type:'fromMatch', id:x.id}; // wenn versehentlich Match übergeben
  return {type:'player', id:x.id, name:x.name};
}

/** Ergibt HTML-Preview (nur zur Kontrolle in Optionen) */
export function previewMatches(plan){
  const frag = [];
  plan.rounds.forEach((rnd, ri)=>{
    frag.push(`<div class="list-item"><strong>Runde ${ri+1}</strong></div>`);
    rnd.forEach((m, mi)=>{
      const an = label(m.a), bn = label(m.b);
      frag.push(`<div class="list-item"><span>M${ri+1}.${mi+1}: ${an} vs ${bn}</span></div>`);
    });
  });
  return frag.join('');
}
function label(p){
  if(!p) return '—';
  if(p.type==='player') return p.name;
  if(p.type==='fromMatch') return 'Sieger vorheriges Match';
  return 'BYE';
}

/** Ergebnis eintragen (ID-basiert, sicher gegen Name-Clashes) */
export function reportResult(plan, matchId, {legsA, legsB, bestOf}){
  const bo = Math.max(1, bestOf||3);
  const {match, roundIndex} = findMatch(plan, matchId);
  match.scores = {a: legsA|0, b: legsB|0};

  // BYE-Handling
  const aBye = match.a?.type==='player' && match.a.name==='BYE';
  const bBye = match.b?.type==='player' && match.b.name==='BYE';
  let winnerPid, loserPid;
  if (aBye && !bBye) { winnerPid = pid(match.b); loserPid = pid(match.a); }
  else if (bBye && !aBye) { winnerPid = pid(match.a); loserPid = pid(match.b); }
  else {
    const need = Math.ceil(bo/2);
    const aWin = match.scores.a >= need && match.scores.a > match.scores.b;
    const bWin = match.scores.b >= need && match.scores.b > match.scores.a;
    if(!(aWin||bWin)) throw new Error('Match noch nicht entschieden');
    winnerPid = pid(aWin ? match.a : match.b);
    loserPid  = pid(aWin ? match.b : match.a);
  }
  match.winnerId = winnerPid;
  match.loserId = loserPid;

  // Gewinner in nächste Runde propagieren
  const nextRound = plan.rounds[roundIndex+1];
  if(nextRound){
    const idx = indexInRound(plan.rounds[roundIndex], match.id);
    const target = nextRound[Math.floor(idx/2)];
    const slot = (idx % 2 === 0) ? 'a' : 'b';
    target[slot] = {type:'player', id:winnerPid, name: findPlayerName(plan, winnerPid)};
  }
  return plan;
}

function pid(p){ return p?.id; }
function findMatch(plan, id){
  for(let ri=0;ri<plan.rounds.length;ri++){
    const m = plan.rounds[ri].find(x=>x.id===id);
    if(m) return {match:m, roundIndex:ri};
  }
  throw new Error('Match nicht gefunden: '+id);
}
function indexInRound(rnd, mid){ return rnd.findIndex(x=>x.id===mid); }
function findPlayerName(plan, pid){
  // Sucht ersten Teilnehmer mit dieser ID
  for (const rnd of plan.rounds){
    for (const m of rnd){
      for (const s of ['a','b']){
        const p = m[s];
        if (p?.type==='player' && p.id===pid) return p.name;
      }
    }
  }
  return 'Spieler';
}
