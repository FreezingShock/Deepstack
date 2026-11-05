// Run screen helpers: the candle's melt, the light it throws, and the clock under the word.
import {paintCandle,waxHeight,milestoneCrossed,secondsText} from './candle.js';
let prevLeft=Infinity;
// Called from the timer tick in main.js; everything else about the screen lives in runScreen.css.
export function paintRun(left,limit){
 const fr=Math.max(0,Math.min(1,left/limit)),s=Math.ceil(left/1000);
 const c=document.getElementById('candle'),k=document.getElementById('clock'),st=document.getElementById('stage');
 const root=st||document.documentElement;
 root.style.setProperty('--fr',fr.toFixed(3));
 paintCandle(c,left,limit);
 const wx=document.getElementById('wax');if(wx)wx.style.height=waxHeight(left,limit)+'px';
 const m=milestoneCrossed(left>=limit-150?Infinity:prevLeft,left),say=document.getElementById('clockSay');if(m&&say)say.textContent=m+(m===1?' second':' seconds');prevLeft=left;
 if(c)c.classList.toggle('dying',s<=5);
 if(k){const t=k.classList.contains('sr-only')?secondsText(left):'0:'+String(s).padStart(2,'0');if(k.textContent!==t)k.textContent=t;k.classList.toggle('low',left<10000);}
}
