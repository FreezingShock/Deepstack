import test from 'node:test';
import assert from 'node:assert/strict';
import {statsLeaves,tallyMarks,lexiconChart,spineColumns,crossSection,TALLY_CAP,MAXROWS} from '../src/ui/statsPages.js';
import {FLOORS,floorStartFt} from '../src/core/floors.js';

const TIERS=Array.from({length:7},(_,i)=>({id:i,name:['Pamphlet','Paperback','Hardbound','Folio','Codex','Grimoire','Apocrypha'][i],spine:'#fff'}));
const ctx={TIERS,FLOORS,floorStartFt};
const base={runs:2,books:14,answered:12,tiers:[1,2,3,0,0,0,0],rarest:2,best:{w:'tempest',score:80,tier:2},deepest:400,deepestDay:'2026-11-01',totalFt:800,avg:50,streak:7,bestStreak:7,recent:[{day:'2026-11-01',depth:400,avg:50,best:2}]};

test('empty almanac is one written page',()=>{
 const l=statsLeaves({runs:0},{},ctx);
 assert.equal(l.length,1);assert.match(l[0],/Nothing shelved yet\./);
});
test('four pages once there is anything saved, Unlimited-only players included',()=>{
 assert.equal(statsLeaves(base,{},ctx).length,4);
 const l=statsLeaves({runs:0,streak:0,bestStreak:0,tiers:[],recent:[],deepest:0},{rating:{hist:[{t:1,lex:40,avg:50}]}},ctx);
 assert.equal(l.length,4);assert.match(l[1],/lexchart/);assert.match(l[2],/Nothing shelved yet\./);
});
test('tally marks match the streak: one stroke per day, fifth strikes through',()=>{
 for(const n of [0,1,4,5,6,13,TALLY_CAP]){
  const t=tallyMarks(n);
  const strokes=(t.html.match(/<line/g)||[]).length;
  assert.equal(strokes,n,`n=${n}`); // a full bundle is 4 strokes plus the slash: five lines for five days
  assert.equal((t.html.match(/<svg/g)||[]).length,Math.ceil(n/5));
  assert.equal(t.over,0);
 }
 assert.equal(tallyMarks(TALLY_CAP+9).over,9);
 assert.match(statsLeaves(base,{},ctx)[0],/7 days running/);
});
test('lexicon chart handles 0, 1 and a full 60-point history',()=>{
 assert.equal(lexiconChart([]),'');
 assert.match(lexiconChart([{lex:40}]),/data-points="1"/);
 const hist=Array.from({length:75},(_,i)=>({t:i,lex:30+Math.round(i/2),avg:50}));
 const svg=lexiconChart(hist);
 assert.match(svg,/data-points="60"/);
 const d=svg.match(/class="ln"[^>]* d="([^"]+)"/)[1];
 assert.equal((d.match(/[ML]/g)||[]).length,60);
 assert.ok(!/NaN/.test(svg));
});
test('spine columns draw one lying book per shelved book, scaled past the cap',()=>{
 const one=spineColumns([3,0,1,0,0,0,0],TIERS);
 assert.equal((one.match(/<i /g)||[]).length,4);
 const big=spineColumns([100,50,0,0,0,0,0],TIERS);
 assert.equal((big.match(/<div class="sp-pile">(.*?)<\/div>/)[1].match(/<i /g)||[]).length,MAXROWS);
});
test('cross-section places the marker inside the right floor and locks undiscovered ones',()=>{
 const x=crossSection(FLOORS,floorStartFt,floorStartFt(FLOORS[2]),2);
 assert.match(x,/top:33\.3%/);
 assert.match(x,/Undiscovered/);
 assert.equal((x.match(/class="locked"/g)||[]).length,3);
 assert.ok(!/xs-mark/.test(crossSection(FLOORS,floorStartFt,0,0)));
});
test('14-letter words survive in the closest-answer line',()=>{
 const l=statsLeaves({...base,best:{w:'sesquipedalian',score:90,tier:3}},{},ctx);
 assert.match(l[0],/sesquipedalian/);
});
