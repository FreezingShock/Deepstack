import {bookArt,RIBBONS} from '../ui/bookArt.js';
import {fitSpine,resetSpineMeasure} from '../ui/spineLabel.js';
import {TIERS,hashStr} from '../app/state.js';
import {esc} from '../app/util.js';

/* ---------- book art (shared by the canvas world and DOM spine images) ---------- */
export function bookDims(b,rh){const hs=((b.w||'a').charCodeAt(0)*13+(b.w||'a').length*7)%20;return{w:Math.round(22+Math.min(16,(b.w||'').length*1.5)+b.tier*1.8),h:Math.round(rh*(.5+.04*b.tier)+hs),};}
// the recent-books shelf: spines sized from the word so the whole word always fits and reads
export function shelfDims(b,rh){const d=bookDims(b,rh),f=fitSpine(b.w||'',{baseH:d.h,baseW:d.w,maxH:Math.round(rh-22),top:b.tier>=5?16:0});return{w:f.w,h:f.h,fit:{fs:f.fs,lh:f.lh,top:f.top}};}
export const seedOf=b=>hashStr(b.w+(b.t||''))&0xffff;
export const urlCache=new Map();
export function spineURL(b,rh=110){const k=b.w+'|'+b.tier+'|'+rh;if(urlCache.has(k))return urlCache.get(k);
 const d=shelfDims(b,rh),pw=d.w+16,ph=d.h+30,cv=document.createElement('canvas');cv.width=pw*2;cv.height=ph*2;const c=cv.getContext('2d');c.scale(2,2);c.translate(pw/2,d.h+8);
 bookArt(c,{w:d.w,h:d.h,fit:d.fit,tier:b.tier,seed:seedOf(b),word:b.w,ribbon:b.tier>=1||seedOf(b)%3===0?RIBBONS[seedOf(b)%RIBBONS.length]:null},0);
 const r={url:cv.toDataURL(),w:pw,h:ph};urlCache.set(k,r);return r;}
export const spineImg=(b,i,src,rh=110,scale=1)=>{const s=spineURL(b,rh);return `<img src="${s.url}" width="${s.w*scale}" height="${s.h*scale}" alt="${esc(b.w)}, ${TIERS[b.tier].name}" data-i="${i}" data-src="${src}" data-tip="${esc(b.w)} · ${TIERS[b.tier].name} · ${b.score}">`;};
if(document.fonts&&document.fonts.load)Promise.all(['16px "IM Fell English"','16px Newsreader','24px "Fuzzy Bubbles"','600 14px Cinzel','16px "Special Elite"'].map(f=>document.fonts.load(f))).then(()=>{urlCache.clear();resetSpineMeasure();}).catch(()=>{});
