import {test} from 'node:test';
import assert from 'node:assert/strict';
import {floorLeaves} from '../src/ui/floorLeaves.js';
import {ledgerHTML} from '../src/ui/welcome.js';
const F=[0,1,2].map(i=>({id:i,key:['stacks','archive','catacombs'][i],name:'F'+i,sub:'s'+i}));
const ft=f=>f.id*100;
test('floors book: one leaf per floor plus contents, locked floors hidden',()=>{
 const L=floorLeaves({bestFloor:1,shelf:[{w:'ox',score:80,fl:1},{w:'ax',score:90,fl:1}]},F,ft);
 assert.equal(L.length,4);
 assert.match(L[2],/Best find[\s\S]*ax/);
 assert.match(L[3],/Undiscovered/);assert.doesNotMatch(L[3],/F2/);
});
test('ledger rows are openable',()=>{
 const h=ledgerHTML({streak:3,deepest:200,books:5,floor:'The Stacks',floorKey:'stacks'});
 assert.match(h,/id="bFloors"/);assert.equal((h.match(/data-go="bStats"/g)||[]).length,2);
});
