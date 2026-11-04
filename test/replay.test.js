import test from 'node:test';
import assert from 'node:assert/strict';
import {replayLayout,rowsOf,ROMAN} from '../src/core/replay.js';

const book=(i,rows)=>({w:'w'+i,pos:'noun',answer:'a'+i,score:50+i,tier:i%7,ft:rows*10,verdict:'v',rows});

test('alcoves and landings follow each answer in order, FINIS at the bottom',()=>{
 const L=replayLayout([book(0,4),book(1,10),book(2,2)],{gapRows:3,ftPerRow:10});
 assert.deepEqual(L.niches.map(n=>n.row),[0,7,20,25]);
 assert.deepEqual(L.taken,[4,17,22]);
 assert.equal(L.finalRow,25);
 assert.deepEqual(L.niches.map(n=>n.label),['I','II','III','FINIS']);
 assert.equal(L.niches[1].books.length,2);
 assert.equal(L.niches[1].res.w,'w1');
 assert.equal(L.niches[3].res,null);
});

test('old saves without rows fall back to depth, then to one row',()=>{
 assert.equal(rowsOf({ft:95},10),10);
 assert.equal(rowsOf({},10),1);
 assert.equal(rowsOf(null,10),1);
 const L=replayLayout([{w:'a',tier:0,score:1},{w:'b',tier:1,score:2,ft:50}],{gapRows:2,ftPerRow:10});
 assert.deepEqual(L.taken,[1,8]);
});

test('empty or missing books give just the FINIS alcove',()=>{
 assert.deepEqual(replayLayout(undefined).niches.map(n=>n.label),['FINIS']);
 assert.equal(replayLayout([]).finalRow,0);
 assert.ok(ROMAN.length>=7);
});
