import test from 'node:test';
import assert from 'node:assert/strict';
import {dustOff,atticItems,hasFloor,atticAll} from '../src/core/attic.js';

const mk=(w,extra={})=>({w,tier:1,score:40,t:Date.UTC(2026,9,1),...extra});

test('dusting off writes fl additively and the book leaves the attic',()=>{
 const shelf=[mk('alpha'),mk('beta',{fl:2})];
 assert.equal(atticItems(shelf).length,1);
 assert.equal(dustOff(shelf[0],3),true);
 assert.equal(shelf[0].fl,3);assert.equal(shelf[0].fld,1);
 assert.equal(hasFloor(shelf[0]),true);
 assert.equal(atticItems(shelf).length,0);
 assert.deepEqual(Object.keys(shelf[0]).sort(),['fl','fld','score','t','tier','w']);
});
test('floor 0 is a real floor; bad ids and already-placed books are left alone',()=>{
 const a=mk('a');assert.equal(dustOff(a,0),true);assert.equal(a.fl,0);
 const b=mk('b',{fl:4});assert.equal(dustOff(b,1),false);assert.equal(b.fl,4);assert.equal(b.fld,undefined);
 for(const bad of[-1,6,1.5,'2',null,undefined]){const c=mk('c');assert.equal(dustOff(c,bad),false);assert.equal(hasFloor(c),false);}
 assert.equal(dustOff(null,1),false);
});
test('a dusted-off book drops out of earlier finds but recent guesses keep listing it',()=>{
 const shelf=[mk('old'),mk('new')];
 dustOff(shelf[0],2);
 assert.equal(atticAll(shelf,1).filter(x=>!x.recent).length,0);
});
