import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hash,penPath,rule,underline,doodle,kindOf,noteFor,blot,decorate} from '../src/ui/ink.js';

test('pen paths are deterministic and stay inside the box',()=>{
 assert.equal(penPath(7),penPath(7));assert.notEqual(penPath(7),penPath(8));
 for(let s=0;s<50;s++)for(const n of penPath(s).matchAll(/[\d.]+/g))assert.ok(+n[0]<=100);
 assert.equal(hash('Book sets'),hash('Book sets'));
});
test('every svg is decoration only and strokes draw in with a clip',()=>{
 for(const s of [rule(1),underline(2),doodle('daily'),blot(3)])assert.match(s,/aria-hidden="true"/);
 assert.match(rule(1),/<path/);
 for(const k of ['daily','sets','shelf','stats','other'])assert.match(doodle(k),/<path/);
 assert.equal(kindOf('The Daily'),'daily');assert.equal(kindOf('Book sets'),'sets');assert.equal(kindOf('Your shelf'),'shelf');assert.equal(kindOf('Stats'),'stats');
 assert.ok(noteFor('sets',5).length>3);
});
/* a tiny stand-in DOM: enough for decorate() to add nodes once and leave text alone */
const el=(tag,text='',kids=[])=>{const e={tag,text,kids,cls:new Set(),dataset:{},html:[],
 get textContent(){return text;},get classList(){return {add:c=>e.cls.add(c),contains:c=>e.cls.has(c)};},
 get nextElementSibling(){return e.next||null;},insertAdjacentHTML:(w,h)=>e.html.push([w,h]),
 querySelector:s=>kids.find(k=>k.tag===s)||null,querySelectorAll:s=>kids.filter(k=>k.tag===s)};return e;};
test('decorate inks each page once with a divider, underlines and a margin note',()=>{
 const h1=el('h1','Book sets'),h2=el('h2','Contents'),pg=el('.pg-in','',[h1,h2]);
 const sp={querySelectorAll:()=>[pg]};
 decorate(sp,'Book sets');decorate(sp,'Book sets');
 assert.equal(h1.html.length,1);assert.match(h1.html[0][1],/ink-rule/);
 assert.equal(h2.html.length,1);assert.ok(h2.cls.has('inked'));
 assert.equal(pg.html.length,2);assert.match(pg.html[0][1],/ink-doodle/);assert.match(pg.html[1][1],/ink-note/);
});
test('ink css respects reduced motion and uses tokens only',()=>{
 const c=readFileSync('src/ui/ink.css','utf8');
 assert.match(c,/where\(html:not\(\.rm\)\)[\s\S]*inkdraw/);
 assert.ok(!/#[0-9a-f]{3,8}\b/i.test(c));assert.match(c,/pointer-events:none/);
});
