import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {penMark,penPlay} from '../src/ui/penInk.js';

const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const BOOK_CSS=['src/ui/bookpages.css','src/ui/penInk.css','src/ui/dailyBook.css','src/sets/sets.css'].map(read).join('\n');

test('no filled pill or .bbtn styling on book pages',()=>{
 assert.doesNotMatch(BOOK_CSS,/\.bbtn/);
 const chip=BOOK_CSS.match(/\.bk-spread\.menu \.fchip\{[^}]*\}/)[0];
 assert.match(chip,/background:none/);assert.match(chip,/border:0/);assert.doesNotMatch(chip,/border-radius:[1-9]/);
 const start=read('src/ui/penInk.css').match(/\.bk-spread \.pen-ink\{[^}]*\}/)[0];
 assert.match(start,/background:none/);assert.match(start,/border:0/);
});
test('written actions use the shared pen stroke and keep a visible focus ring',()=>{
 const css=read('src/ui/penInk.css');
 assert.match(css,/--pen-stroke:url\(/);
 assert.match(BOOK_CSS,/\.fchip\[aria-pressed="true"\]::after[^}]*var\(--pen-stroke\)/);
 assert.match(css,/\.fchip:focus-visible[^}]*outline:2px/);
 assert.match(css,/\.pen-ink:focus-visible::after/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(read('src/ui/home.js'),/bs-start pen-ink/);
 assert.match(read('src/ui/dailyBook.js'),/dly-go pen-ink/);
});
test('typing in the shelf search repaints only the results page',()=>{
 const src=read('src/ui/bookMenus.js');
 const line=src.split('\n').find(l=>l.includes('fq.oninput'));
 assert.match(line,/setSpreads\(toSpreads\(build\(\)\),0,'r'\)/);
 assert.doesNotMatch(line,/redo\(/);
});

/* the stroke slides from the old word to the new one when they share a line */
const rect=(left,top,width)=>({left,top,width,height:20});
function fakeRoot({prev,next}){
 const chips=[];
 const mk=(k,pressed,r)=>({dataset:{k},getAttribute:a=>a==='aria-pressed'&&pressed?'true':null,getBoundingClientRect:()=>r,classList:{add(c){this.added=c;},added:''},calls:[],animate(kf,o){this.calls.push({kf,o});}});
 const a=mk('sA',true,prev),b=mk('sB',false,next);chips.push(a,b);
 const group={querySelectorAll:()=>[a]};
 for(const c of chips)c.closest=()=>group;
 return {a,b,root:{querySelector:s=>chips.find(c=>s===`[data-k="${c.dataset.k}"]`)}};
}
test('pen slides between choices on one line and draws in otherwise',()=>{
 globalThis.matchMedia=()=>({matches:false});
 let f=fakeRoot({prev:rect(10,100,40),next:rect(110,102,80)});
 penMark(f.root,'sB');penPlay(f.root);
 assert.equal(f.b.calls.length,1);
 assert.match(f.b.calls[0].kf[0].transform,/translateX\(-100px\) scaleX\(0\.5\)/);
 assert.equal(f.b.calls[0].o.pseudoElement,'::after');
 f=fakeRoot({prev:rect(10,100,40),next:rect(10,160,80)});
 penMark(f.root,'sB');penPlay(f.root);
 assert.equal(f.b.calls.length,0);assert.equal(f.b.classList.added,'pen');
 globalThis.matchMedia=()=>({matches:true});
 f=fakeRoot({prev:rect(10,100,40),next:rect(110,100,80)});
 penMark(f.root,'sB');penPlay(f.root);
 assert.equal(f.b.calls.length,0);assert.equal(f.b.classList.added,'pen');
 delete globalThis.matchMedia;
});
