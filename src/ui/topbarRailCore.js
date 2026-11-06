/* Pure values for the top bar rail (no DOM, unit tested). */
import {liveStreak} from '../core/stats.js';
export const dayKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
export function railValues(S,today=dayKey()){
 const s=liveStreak(S&&S.streak,today),d=Math.max(0,Math.round(+(S&&S.bestDepth)||0));
 return{streak:s,deepest:d};
}

