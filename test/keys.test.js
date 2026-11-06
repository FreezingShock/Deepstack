import {test} from 'node:test';
import assert from 'node:assert/strict';
import {actionFor,SHORTCUTS,SHORTCUT_GROUPS} from '../src/ui/keysCore.js';

const ev=(key,o={})=>({key,code:'Key'+key.toUpperCase(),...o});
test('Alt+H and Alt+S work on the word screen, even while typing',()=>{
 const c={typing:true,modal:false,wordScreen:true};
 assert.equal(actionFor(ev('h',{altKey:true}),c),'hint');
 assert.equal(actionFor(ev('s',{altKey:true}),c),'skip');
});
test('Alt shortcuts do nothing off the word screen or under a modal',()=>{
 assert.equal(actionFor(ev('h',{altKey:true}),{typing:false,modal:false,wordScreen:false}),null);
 assert.equal(actionFor(ev('s',{altKey:true}),{typing:false,modal:true,wordScreen:true}),null);
});
test('plain keys never fire while typing an answer',()=>{
 const c={typing:true,modal:false,wordScreen:true};
 assert.equal(actionFor(ev('m'),c),null);
 assert.equal(actionFor(ev('?'),c),null);
});
test('M mutes and ? opens help when not typing; ctrl combos are ignored',()=>{
 const c={typing:false,modal:false,wordScreen:false};
 assert.equal(actionFor(ev('m'),c),'mute');
 assert.equal(actionFor(ev('?'),c),'help');
 assert.equal(actionFor(ev('m',{ctrlKey:true}),c),null);
});
test('shortcut list is documented',()=>assert.ok(SHORTCUTS.length>=8));

test('home keys open each book, descend and the attic, only on the home screen',()=>{
 const h={typing:false,modal:false,wordScreen:false,home:true};
 assert.equal(actionFor(ev('1'),h),'click:#bDaily');
 assert.equal(actionFor(ev('u'),h),'click:#bUnl');
 assert.equal(actionFor(ev('3'),h),'click:#bAll');
 assert.equal(actionFor(ev('5'),h),'click:#bStats');
 assert.equal(actionFor(ev(','),h),'click:#bSettings');
 assert.equal(actionFor(ev('a'),h),'click:.attic-cue-home');
 assert.equal(actionFor(ev('n'),h),'descend');
 assert.equal(actionFor(ev('1'),{...h,home:false}),null);
 assert.equal(actionFor(ev('1'),{...h,modal:true}),null);
 assert.equal(actionFor(ev('1'),{...h,typing:true}),null);
});
test('every shortcut group has rows',()=>{for(const [h,r] of SHORTCUT_GROUPS){assert.ok(h&&r.length);}});

test('help sheet lists the search slash',()=>assert.ok(SHORTCUTS.some(([k])=>k==='/')));
test('book muted ink has 4.5:1 contrast on the darkest paper',async()=>{
 const {readFileSync}=await import('node:fs');
 const css=readFileSync(new URL('../src/ui/bookStyle.css',import.meta.url),'utf8'),tok=readFileSync(new URL('../src/theme/tokens.css',import.meta.url),'utf8');
 const name=/--bs-mute:var\((--[\w-]+)\)/.exec(css);assert.ok(name);
 const m=new RegExp(name[1]+':(#[0-9a-f]{6})','i').exec(tok);assert.ok(m);
 const L=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
 const a=L(m[1]),b=L('#d9c9a3');
 assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5);
});

test('in-book keys are documented',()=>{for(const k of ['O / G / R / F','[ / ]','T'])assert.ok(SHORTCUTS.some(([x])=>x===k),k);});
