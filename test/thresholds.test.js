import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FLOORS} from '../src/core/floors.js';
import {THRESHOLDS,drawThreshold,drawThresholdSign,drawThresholdLive,drawWallMaterial,doorSpan,numeralOf} from '../src/ui/thresholds.js';

// A recording 2d context: every method is a no-op, every property settable, measureText is deterministic.
function ctx(){const calls=[];const t={calls,measureText:s=>({width:String(s).length*7}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})};
 return new Proxy(t,{get:(o,k)=>k in o?o[k]:(...a)=>{calls.push(k);},set:(o,k,v)=>{o[k]=v;return true;}});}

test('every floor has a threshold definition, a wall material and a numeral',()=>{
 for(const f of FLOORS){const d=THRESHOLDS[f.key];assert.ok(d,f.key);assert.ok(d.frame&&d.wall,f.key);assert.ok(numeralOf(f));}
 assert.equal(new Set(FLOORS.map(f=>THRESHOLDS[f.key].wall)).size,FLOORS.length,'walls are all different');
});
test('every floor below the Stacks draws a door, a sign, a wall and live parts without throwing',()=>{
 for(const f of FLOORS.slice(1)){const c=ctx();
  drawThreshold(c,f,1280,100,150,238,0,1280);drawThresholdSign(c,f,1280,100,150);drawThresholdLive(c,f,1280,100,150,3,false);drawWallMaterial(c,f,0,1280,100,238,150,f.row);
  assert.ok(c.calls.length>20,f.key);}
 drawWallMaterial(ctx(),FLOORS[0],0,375,0,100,120,0);
});
test('live parts are skipped under reduced motion where they move',()=>{
 const f=FLOORS.find(x=>x.key==='vault'),c=ctx();drawThresholdLive(c,f,1280,0,150,3,true);assert.equal(c.calls.length,0);
});
test('the doorway bay is the middle third between the pillars',()=>{
 const [a,b]=doorSpan(900);assert.ok(a>300&&b<600&&b-a>200);
});
test('sign fits the screen at phone width',()=>{
 const f=FLOORS.find(x=>x.key==='vault');const c=ctx();const rects=[];c.fillRect=(x,y,w)=>rects.push([x,w]);
 drawThresholdSign(c,f,375,0,120);for(const [x,w] of rects)assert.ok(x>=0&&x+w<=375,`rect ${x},${w}`);
});
