import {motionNow,onMotionChange} from '../ui/settings.js';

export const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
/* live binding: follows the Motion setting and the OS preference without a reload (ST3) */
export let RM=motionNow();
onMotionChange(v=>{RM=v;});
export const sleep=ms=>new Promise(r=>setTimeout(r,RM?Math.min(ms,30):ms));
export const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
