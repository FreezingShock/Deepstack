import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mantelModel,mantelHTML,MANTEL_MAX,candleHeight} from '../src/ui/mantel.js';

const count=(h,c)=>(h.match(new RegExp(`class="mc ${c}`,'g'))||[]).length;

test('streak 0 with no history: bare mantel, one waiting candle, nothing lit',()=>{
 const h=mantelHTML({streak:0,played:0});
 assert.equal(count(h,'mc-lit'),0);assert.equal(count(h,'mc-new'),1);assert.equal(count(h,'mc-cold'),0);
});
test('streak 1 lights one candle',()=>{
 const h=mantelHTML({streak:1,played:1});
 assert.equal(count(h,'mc-lit'),1);assert.equal(count(h,'mc-cold'),0);assert.match(h,/1 day in a row, 1 candle lit/);
});
test('streak 14 lights 14, streak 100 still draws 14 and a plate with the count',()=>{
 assert.equal(count(mantelHTML({streak:14,played:14}),'mc-lit'),14);
 const h=mantelHTML({streak:100,played:100});
 assert.equal(count(h,'mc-lit'),MANTEL_MAX);assert.match(h,/100 in a row/);assert.match(h,/100 days in a row/);
 assert.doesNotMatch(mantelHTML({streak:14,played:14}),/mantel-plate/);
});
test('a break leaves one cold stub, with or without a new run after it',()=>{
 assert.equal(count(mantelHTML({streak:0,played:6}),'mc-cold'),1);
 assert.equal(count(mantelHTML({streak:0,played:6}),'mc-lit'),0);
 const h=mantelHTML({streak:3,played:5});
 assert.equal(count(h,'mc-cold'),1);assert.equal(count(h,'mc-lit'),3);
 assert.deepEqual(mantelModel({streak:3,played:3}),{lit:3,over:0,cold:false});
});
test('bad input is tolerated and candle heights are stable',()=>{
 assert.deepEqual(mantelModel({streak:-4,played:NaN}),{lit:0,over:0,cold:false});
 assert.equal(candleHeight(3),candleHeight(3));
});
test('home hooks the mantel in and the css stays on tokens',()=>{
 assert.match(readFileSync(new URL('../src/ui/home.js',import.meta.url),'utf8'),/mantelHTML\(/);
 assert.match(readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),/ui\/mantel\.css/);
 assert.doesNotMatch(readFileSync(new URL('../src/ui/mantel.css',import.meta.url),'utf8'),/#[0-9a-f]{3,8}\b/i);
});
