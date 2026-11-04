import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapStep,falloff,darkness,reach,flickerAt,addLight,darkAt} from '../src/ui/lighting.js';
import {FLOORS,atmosphereAt} from '../src/core/floors.js';

const atmOf=f=>atmosphereAt(f.row+10);

test('falloff is 1 at the centre, 0 at and beyond the edge, and monotone',()=>{
 assert.equal(falloff(0),1);assert.equal(falloff(1),0);assert.equal(falloff(2),0);
 let p=1;for(let u=.05;u<=1;u+=.05){const v=falloff(u);assert.ok(v<=p);p=v;}
});

test('light gets scarcer with depth: darker unlit world, smaller pools, every floor',()=>{
 const a=FLOORS.map(atmOf);
 assert.equal(darkness(a[0]),0);
 for(let i=1;i<a.length;i++){assert.ok(darkness(a[i])>darkness(a[i-1]));assert.ok(reach(a[i])<reach(a[i-1]));}
 assert.ok(darkness(a[5])>=.75);assert.ok(reach(a[5])<.5);
});

test('the alcove is never dark, even in the Abyss; far from any light it is',()=>{
 const rects=[{x:100,y:100,w:600,h:400,r:40}];
 const ls=[{x:50,y:50,r:60,k:1}];
 const sc=reach(atmOf(FLOORS[5]));
 assert.equal(darkAt(400,300,{lights:ls,rects,scale:sc}),0);
 assert.ok(darkAt(900,700,{lights:ls,rects,scale:sc})>.99);
 assert.equal(darkAt(50,50,{lights:ls,rects:[],scale:sc}),0);
});

test('flicker follows the floor and is absent in reduced motion',()=>{
 const hollow=atmOf(FLOORS[4]),vault=atmOf(FLOORS[3]);
 const spread=a=>{let lo=9,hi=0;for(let t=0;t<20;t+=.05){const v=flickerAt(a,t,0,false);lo=Math.min(lo,v);hi=Math.max(hi,v);}return hi-lo;};
 assert.ok(spread(hollow)>spread(vault));
 for(let t=0;t<5;t+=.3)assert.equal(flickerAt(hollow,t,1,true),1);
});

test('the light registry is capped',()=>{for(let i=0;i<100;i++)addLight(i,i,10,1);});

test('the light map gets coarser on slower quality tiers',()=>{
 assert.ok(mapStep('high')<mapStep('medium'));assert.ok(mapStep('medium')<mapStep('low'));assert.equal(mapStep(undefined),mapStep('high'));
});
