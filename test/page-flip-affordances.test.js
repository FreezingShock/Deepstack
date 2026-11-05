import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cornersHTML,paintEdges,noteTurned} from '../src/ui/pageFlip.js';
const css=readFileSync('src/ui/pageFlip.css','utf8'),home=readFileSync('src/ui/home.js','utf8');
const fake=()=>{const cls=new Set(),vars={};return {vars,classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),contains:c=>cls.has(c),toggle:(c,on)=>on?cls.add(c):cls.delete(c)},style:{setProperty:(k,v)=>{vars[k]=v;}}};};
test('curl corners carry a shaded flap, a gap, and a first-page cue',()=>{
 const h=cornersHTML();assert.ok(h.includes('<u></u><b></b>')&&h.includes('bs-cue'));
 assert.ok(!/linear-gradient\(135deg,var\(--c-parchment-80\) 0,var\(--c-brass-75\) 46%/.test(css),'no flat two-tone triangle');
});
test('edge thickness grows with pages remaining and caps',()=>{
 const sp=fake();paintEdges(sp,0,3);assert.equal(sp.vars['--edge-p'],'0px');assert.ok(parseFloat(sp.vars['--edge-n'])>2);
 paintEdges(sp,1,100);assert.equal(sp.vars['--edge-n'],'9px');paintEdges(sp,99,100);assert.equal(sp.vars['--edge-n'],'0px');
});
test('cue shows only on the first page until a turn',()=>{
 const sp=fake();paintEdges(sp,0,3);assert.ok(sp.classList.contains('can-cue'));
 noteTurned(sp);paintEdges(sp,0,3);assert.ok(!sp.classList.contains('can-cue'));
 const one=fake();paintEdges(one,0,1);assert.ok(!one.classList.contains('can-cue'));
});
test('turn animation stays transform/opacity and reduced motion is honoured',()=>{
 assert.ok(home.includes("import {cornersHTML,paintEdges,noteTurned,hintCurl}"));
 assert.match(css,/@keyframes fl-next\{0%/);assert.ok(css.includes('prefers-reduced-motion:reduce'));
});
