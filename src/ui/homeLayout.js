/* Home composition: one lit reading room in three zones (title, plaque, stacks) with a fixed
   rhythm per room height. The room is the niche box (#home), which follows the canvas shelves, so
   the tier is picked from its own height rather than the window's. Each tier sets a gap unit and
   which optional strips (how-it-works steps, records) are shown; CSS reads data-room and --hz-*.
   The stacks zone always sits on the niche floor (the ledge), so nothing floats. */
import {nicheScale} from '../world/nicheWidth.js';
export const HOME_TIERS=[
 {name:'roomy',min:600,gap:20,bookH:46,steps:true,stats:true},
 {name:'cozy',min:460,gap:15,bookH:38,steps:true,stats:false},
 {name:'snug',min:380,gap:11,bookH:34,steps:false,stats:false},
 {name:'tight',min:0,gap:8,bookH:30,steps:false,stats:false},
];
export function homeTier(h){return HOME_TIERS.find(t=>h>=t.min)||HOME_TIERS[HOME_TIERS.length-1];}
/* bigger text counts as a shorter room, so the tier drops optional strips instead of overflowing */
export const textScale=()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ts'))||1;
/* --hs / --hv: how much bigger than the old fixed 760 px niche the room is (width / height). The wall furniture and the fire
   scale by them, so a big window gets a bigger room instead of the same small one in the middle of empty shelves. */
export function applyHomeScale(el,w=el.clientWidth){
 const hs=nicheScale(w+52),hv=1+(hs-1)*.55;
 el.style.setProperty('--hs',hs.toFixed(3));el.style.setProperty('--hv',hv.toFixed(3));
 return hs;
}
export function applyHomeTier(el,h=el.clientHeight/textScale()){
 applyHomeScale(el);
 const t=homeTier(h);
 el.dataset.room=t.name;
 el.style.setProperty('--hz-g',t.gap+'px');el.style.setProperty('--hz-book',t.bookH+'px');
 return t;
}
/* Keeps #home tiered as the window or shelves resize. Call once. */
export function watchHomeLayout(el){
 const go=()=>{if(!el.hidden)applyHomeTier(el);};
 new MutationObserver(go).observe(document.documentElement,{attributes:true,attributeFilter:['data-text']});
 if(typeof ResizeObserver==='function')new ResizeObserver(go).observe(el);
 else addEventListener('resize',go);
 go();
 return go;
}
