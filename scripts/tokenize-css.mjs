// One-off helper used to convert CSS files to tokens: node scripts/tokenize-css.mjs file.css...
// Replaces raw hex inside declaration blocks with var(--c-*) when the exact value has a token, then
// proves the swap is lossless by expanding the vars back and comparing to the original.
import {readFileSync,writeFileSync} from 'node:fs';
import {COLORS,ALPHA} from '../src/theme/colors.js';
const norm=h=>{h=h.slice(1).toLowerCase();if(h.length<=4)h=[...h].map(c=>c+c).join('');return '#'+h;};
const byVal={};for(const[k,v]of Object.entries({...COLORS,...ALPHA}))byVal[v]='--c-'+k;
const rev=Object.fromEntries(Object.entries(byVal).map(([v,n])=>[n,v]));
const HEX=/#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b/g;
for(const f of process.argv.slice(2)){
 const src=readFileSync(f,'utf8');let left=0,did=0;
 const out=src.replace(/\{[^{}]*\}/g,blk=>blk.replace(/[^;{}]*;?/g,d=>/url\(/.test(d)?d:d.replace(HEX,m=>{const n=byVal[norm(m)];if(n){did++;return `var(${n})`;}left++;return m;})));
 const back=out.replace(/var\((--c-[a-z0-9-]+)\)/g,(_,n)=>rev[n]);
 const n2=s=>s.replace(HEX,norm);
 if(n2(back)!==n2(src))throw new Error(f+': expansion mismatch');
 writeFileSync(f,out);console.log(f,'tokenized',did,'raw left',left);
}
