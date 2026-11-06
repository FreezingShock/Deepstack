import {test} from 'node:test';
import assert from 'node:assert/strict';
import {refreshMotion,motionNow,onMotionChange} from '../src/ui/settings.js';
import {RM} from '../src/app/util.js';

test('the live motion flag follows the setting and tells listeners',()=>{
 const seen=[];const off=onMotionChange(v=>seen.push(v));
 assert.equal(refreshMotion({motion:'reduce'},()=>false),true);
 assert.equal(motionNow(),true);
 assert.equal(refreshMotion({motion:'full'},()=>true),false);
 assert.equal(motionNow(),false);
 assert.equal(refreshMotion({motion:'system'},()=>true),true);
 off();
 assert.deepEqual(seen,[true,false,true]);
});
test('a listener that throws does not stop the others',()=>{
 const seen=[];const a=onMotionChange(()=>{throw new Error('x');});const b=onMotionChange(v=>seen.push(v));
 refreshMotion({motion:'reduce'},()=>false);
 a();b();
 assert.deepEqual(seen,[true]);
});
test('util RM is a live binding: it follows the setting without a reload',()=>{
 refreshMotion({motion:'reduce'},()=>false);
 assert.equal(RM,true);
 refreshMotion({motion:'full'},()=>true);
 assert.equal(RM,false);
});
