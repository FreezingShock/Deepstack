import test from 'node:test';
import assert from 'node:assert/strict';
import {plaqueState,dailyBadge,unlimitedBadge} from '../src/ui/homePlaque.js';
import {homeHTML,HOME_LINKS,BOOK_INTROS} from '../src/ui/home.js';
import {dailyLeaves} from '../src/ui/dailyBook.js';

const lex=L=>'L'+L, TODAY='2026-11-05';
const S0={shelf:[],daily:{},rating:{placed:false,L:3}};
const base={st:{streak:2,deepest:10},no:7,today:TODAY,lexicon:lex};

test('unplayed Daily: Descend means today’s Daily and says so',()=>{
 const p=plaqueState({S:S0,played:false,no:7,today:TODAY});
 assert.deepEqual([p.kind,p.label,p.tag,p.second],['daily','Descend','Daily No. 7',false]);
 const h=homeHTML({...base,S:S0,d:null});
 assert.match(h,/id="bPlay"/);assert.doesNotMatch(h,/id="bRes"|id="bNext"/);
});
test('mid-run Daily: Continue, with how many words you have written',()=>{
 const S={...S0,dailyRun:{day:TODAY,results:[{},{},{}],combo:0}};
 const p=plaqueState({S,played:false,no:7,today:TODAY});
 assert.deepEqual([p.kind,p.label,p.tag],['resume','Continue','Daily No. 7 · 3 of 7 written']);
 assert.match(homeHTML({...base,S,d:null}),/data-next="resume"/);
 assert.equal(dailyBadge({S,played:false,no:7,today:TODAY}),'No. 7 · resume');
});
test('a stale run from another day does not read as mid-run',()=>{
 const S={...S0,dailyRun:{day:'2026-11-04',results:[{}]}};
 assert.equal(plaqueState({S,played:false,no:7,today:TODAY}).kind,'daily');
});
test('played Daily: Descend goes to your Unlimited level; result is the second choice',()=>{
 const placed={...S0,rating:{placed:true,L:5}};
 const p=plaqueState({S:placed,played:true,no:7,today:TODAY,lexicon:lex});
 assert.deepEqual([p.kind,p.label,p.tag,p.second],['unlimited','Descend','Unlimited · Lexicon L5',true]);
 const h=homeHTML({...base,S:placed,d:{}});
 assert.match(h,/id="bNext"[\s\S]*Unlimited · Lexicon L5/);assert.match(h,/id="bRes"/);assert.doesNotMatch(h,/id="bPlay"/);
 assert.equal(plaqueState({S:S0,played:true,no:7,today:TODAY}).tag,'Unlimited · find your rank');
});
test('spine badges say what is waiting and stay short',()=>{
 assert.equal(dailyBadge({S:S0,played:true,no:7,today:TODAY}),'No. 7 · done');
 assert.equal(dailyBadge({S:S0,played:false,no:7,today:TODAY}),'No. 7 · open');
 assert.equal(unlimitedBadge(S0,lex),'find your rank');
 assert.equal(unlimitedBadge({rating:{placed:true,L:5}},lex),'Lexicon L5');
});
test('Practice is no longer a menu book; it is a section of the Daily book',()=>{
 assert.equal(HOME_LINKS.some(l=>l.id==='bPrac'),false);
 assert.equal(BOOK_INTROS.bPrac,undefined);
 const {leaves}=dailyLeaves(S0,TODAY,{wordsFor:()=>[]});
 assert.match(leaves[0],/aria-label="Practice"[\s\S]*data-act="practice"/);
});
