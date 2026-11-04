import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HOME_TIERS,homeTier,applyHomeTier} from '../src/ui/homeLayout.js';
import {homeHTML} from '../src/ui/home.js';

test('tiers run from richest to tightest and every height gets one',()=>{
 const mins=HOME_TIERS.map(t=>t.min);
 assert.deepEqual(mins,[...mins].sort((a,b)=>b-a));
 assert.equal(HOME_TIERS.at(-1).min,0);
 for(let h=0;h<=1400;h+=10)assert.ok(homeTier(h).name);
});
test('taller rooms never lose features or shrink rhythm',()=>{
 let prev=homeTier(0);
 for(let h=1;h<=1400;h++){const t=homeTier(h);
  assert.ok(t.gap>=prev.gap&&t.bookH>=prev.bookH,h);
  for(const k of ['steps','stats'])assert.ok(!prev[k]||t[k],k+' @'+h);
  prev=t;}
});
test('applyHomeTier writes the room name and rhythm tokens',()=>{
 const el={dataset:{},style:{props:{},setProperty(k,v){this.props[k]=v;}}};
 const t=applyHomeTier(el,700);
 assert.equal(el.dataset.room,t.name);
 assert.equal(el.style.props['--hz-g'],t.gap+'px');
 assert.equal(el.style.props['--hz-book'],t.bookH+'px');
});
test('home markup has three zones: title, plaque, stacks',()=>{
 const h=homeHTML({S:{shelf:[],rating:{}},st:{streak:0,deepest:0},no:1,d:null,floorName:''});
 const i=[h.indexOf('hz-title'),h.indexOf('hz-plaque'),h.indexOf('hz hsecs')];
 assert.ok(i.every(x=>x>0)&&i[0]<i[1]&&i[1]<i[2],String(i));
 assert.ok(h.indexOf('id="bPlay"')>i[1]&&h.indexOf('id="bPlay"')<i[2]);
});
