import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {follow,lightEnabled,isDarkSpot,initCursorLight,LIGHT_LAG_MS} from '../src/ui/cursorLight.js';

test('follow closes the gap smoothly and is frame-rate independent',()=>{
 assert.equal(follow(0,100,0,LIGHT_LAG_MS),0);
 const one=follow(0,100,32,LIGHT_LAG_MS);
 const two=follow(follow(0,100,16,LIGHT_LAG_MS),100,16,LIGHT_LAG_MS);
 assert.ok(Math.abs(one-two)<1e-9);
 assert.ok(follow(0,100,5000,LIGHT_LAG_MS)>99.9);
});

test('light only for fine hovering pointers with motion allowed',()=>{
 assert.equal(lightEnabled({fine:true,hover:true,reduced:false}),true);
 assert.equal(lightEnabled({fine:false,hover:false,reduced:false}),false);
 assert.equal(lightEnabled({fine:true,hover:true,reduced:true}),false);
});

test('initCursorLight mounts nothing on touch or reduced motion',()=>{
 const win={matchMedia:()=>({matches:false})};
 assert.equal(initCursorLight({doc:{},win,reduced:false}),null);
 const fine={matchMedia:()=>({matches:true})};
 assert.equal(initCursorLight({doc:{},win:fine,reduced:true}),null);
});

test('isDarkSpot lights the canvas, not lit surfaces',()=>{
 const mk=(lit,dark,self)=>({closest:s=>s.includes('button')?(lit?{}:null):s==='canvas,html,body'?(dark?{}:null):s==='#world'?{}:null,matches:()=>self});
 assert.equal(isDarkSpot(null),false);
 assert.equal(isDarkSpot(mk(false,true,true)),true);
 assert.equal(isDarkSpot(mk(true,true,true)),false);
 assert.equal(isDarkSpot(mk(false,false,false)),false);
});

test('css keeps the system cursor, hides for reduced motion, uses tokens',()=>{
 const css=fs.readFileSync(new URL('../src/ui/cursorLight.css',import.meta.url),'utf8');
 assert.match(css,/prefers-reduced-motion:reduce\)\{#pointerLight\{display:none/);
 assert.match(css,/data-motion=reduce\] #pointerLight\{display:none/);
 assert.doesNotMatch(css,/cursor:\s*none/);
 assert.doesNotMatch(css,/#[0-9a-fA-F]{3,8}\b/);
});
