import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeGate,GATE_MS} from '../src/ui/nextGate.js';
test('gate stays shut until started and the ribbon has filled',()=>{
 let t=1000;const g=makeGate(()=>t);
 g.hold();assert.equal(g.ready(),false);
 t+=5000;assert.equal(g.ready(),false);
 g.start();assert.equal(g.ready(),false);
 t+=GATE_MS-1;assert.equal(g.ready(),false);
 t+=1;assert.equal(g.ready(),true);
});
test('open gate (shelf cards) accepts at once',()=>{
 const g=makeGate(()=>0);g.open();assert.equal(g.ready(),true);
});
test('half a second',()=>{assert.equal(GATE_MS,500);});
