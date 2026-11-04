import {test} from 'node:test';
import assert from 'node:assert/strict';
import {railFraction,TAIL_FT} from '../src/ui/tracker.js';
import {FLOORS,floorStartFt} from '../src/core/floors.js';

const starts=FLOORS.map(floorStartFt);
test('rail fraction is 0 at the surface and grows monotonically',()=>{
 assert.equal(railFraction(0,starts),0);
 let prev=-1;for(let ft=0;ft<=1500;ft+=7){const f=railFraction(ft,starts);assert.ok(f>=prev&&f<=1);prev=f;}
});
test('each floor boundary lands on an equal segment edge',()=>{
 starts.forEach((s,i)=>assert.ok(Math.abs(railFraction(s,starts)-i/starts.length)<1e-9));
});
test('the open last floor tops out at the bottom of the rail',()=>{
 const last=starts[starts.length-1];
 assert.equal(railFraction(last+TAIL_FT,starts),1);
 assert.equal(railFraction(last+5000,starts),1);
 assert.equal(railFraction(-20,starts),0);
});
