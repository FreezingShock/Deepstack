import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {follow,candleEnabled,stateFor,initCursorLight,LIGHT_LAG_MS} from '../src/ui/cursorLight.js';

test('follow closes the gap smoothly and is frame-rate independent',()=>{
 assert.equal(follow(0,100,0,LIGHT_LAG_MS),0);
 const one=follow(0,100,32,LIGHT_LAG_MS);
 const two=follow(follow(0,100,16,LIGHT_LAG_MS),100,16,LIGHT_LAG_MS);
 assert.ok(Math.abs(one-two)<1e-9);
 assert.ok(follow(0,100,5000,LIGHT_LAG_MS)>99.9);
});

test('candle only for fine hovering pointers with motion allowed',()=>{
 assert.equal(candleEnabled({fine:true,hover:true,reduced:false}),true);
 assert.equal(candleEnabled({fine:false,hover:false,reduced:false}),false);
 assert.equal(candleEnabled({fine:true,hover:true,reduced:true}),false);
});

test('initCursorLight mounts nothing on touch or reduced motion',()=>{
 const win={matchMedia:q=>({matches:!q.includes('fine')&&!q.includes('hover')?false:false})};
 assert.equal(initCursorLight({doc:{},win,reduced:false}),null);
 const fine={matchMedia:()=>({matches:true})};
 assert.equal(initCursorLight({doc:{},win:fine,reduced:true}),null);
});

test('stateFor classifies hover targets',()=>{
 const mk=(match,cursor='')=>({style:{cursor},closest:sel=>match(sel)?{}:null});
 assert.equal(stateFor(null),'idle');
 assert.equal(stateFor(mk(sel=>sel.includes('textarea'))),'text');
 assert.equal(stateFor(mk(sel=>sel.startsWith('a,button'))),'hand');
 assert.equal(stateFor(mk(()=>false,'pointer')),'hand');
 assert.equal(stateFor(mk(()=>false)),'idle');
});

test('css hides the candle for reduced motion and keeps the text caret',()=>{
 const css=fs.readFileSync(new URL('../src/ui/cursorLight.css',import.meta.url),'utf8');
 assert.match(css,/prefers-reduced-motion:reduce\)\{#candleCursor\{display:none/);
 assert.match(css,/data-motion=reduce\] #candleCursor\{display:none/);
 assert.match(css,/cursor:text!important/);
 assert.doesNotMatch(css,/#[0-9a-fA-F]{3,8}\b/);
});
