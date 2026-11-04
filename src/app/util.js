import {reducedMotion} from '../ui/settings.js';

export const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
export const RM=reducedMotion();
export const sleep=ms=>new Promise(r=>setTimeout(r,RM?Math.min(ms,30):ms));
export const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
