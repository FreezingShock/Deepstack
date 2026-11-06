/* Next-word gate: a fresh result card ignores Enter (including a held key's repeats) until the reveal
   has settled and a half-second wax ribbon has filled, so the card can't be skipped unread. */
export const GATE_MS=500;
export function makeGate(now=()=>performance.now()){
 let openAt=Infinity;
 return{
  hold(){openAt=Infinity;},
  start(ms=GATE_MS){openAt=now()+ms;},
  ready(){return now()>=openAt;},
  open(){openAt=0;}
 };
}
