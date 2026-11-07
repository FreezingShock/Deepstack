import {test} from 'node:test';
import assert from 'node:assert/strict';
import {settingsPages,MOTION_LABELS} from '../src/ui/settingsBook.js';
import {eraseProgress,PROGRESS_KEYS} from '../src/ui/progressReset.js';
import {DEFAULTS,SETTINGS_KEY} from '../src/ui/settings.js';

const fake=(seed={})=>{const m={...seed};return{m,getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=v;},removeItem:k=>{delete m[k];}};};
const ids=html=>[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
const page=(opts={})=>{const p=settingsPages({st:{...DEFAULTS,...opts.st},sound:opts.sound??true,prefs:['auto','high','medium','low'],pref:'auto',floorRules:false,osCalm:!!opts.osCalm});return p.left+p.right;};

test('the book holds every control topbar.js wires, once each',()=>{
 const html=page();
 for(const id of ['sSound','sVol','sMus','sFx','sMotion','sText','sQual','sContrast','sFloorRules','sHaptics','sReset','sConfirm','scKeep','scGo']){
  assert.equal(ids(html).filter(x=>x===id).length,1,id);
 }
});
test('Music and Effects sliders show their stored levels',()=>{
 const html=page({st:{music:.4,effects:.75}});
 assert.match(html,/id="sMus"[^>]*value="40"/);
 assert.match(html,/id="oMus">40%</);
 assert.match(html,/id="sFx"[^>]*value="75"/);
});
test('motion has three choices and the chosen one is pressed',()=>{
 assert.deepEqual(MOTION_LABELS.map(x=>x[0]),['system','reduce','full']);
 const html=page({st:{motion:'reduce'}});
 assert.match(html,/data-motion-choice="reduce" aria-pressed="true"/);
 assert.match(html,/data-motion-choice="system" aria-pressed="false"/);
});
test('the motion hint says what Match system resolves to',()=>{
 assert.match(page({osCalm:true}),/Your system asks for calm motion/);
 assert.match(page({osCalm:false}),/Your system allows full motion/);
});
test('reset starts hidden behind a confirm step that defaults to keeping the library',()=>{
 const html=page();
 assert.match(html,/id="sConfirm"[^>]*hidden/);
 assert.match(html,/id="scKeep"[^>]*>Keep my library</);
 assert.match(html,/id="scGo"[^>]*>Erase progress</);
});
test('eraseProgress removes the save and records, and keeps every setting',()=>{
 const st=fake({
  'deepstack.v1':'{"shelf":[]}','deepstack.cabinet.v1':'{}','deepstack.flipHint':'2',
  'deepstack.settings.v1':'{"volume":0.3}','deepstack.quality.v1':'{"pref":"low"}','deepstack.floorrules.v1':'false',
 });
 assert.equal(eraseProgress(st),3);
 for(const k of PROGRESS_KEYS)assert.equal(k in st.m,false,k);
 assert.equal(st.m[SETTINGS_KEY],'{"volume":0.3}');
 assert.equal(st.m['deepstack.quality.v1'],'{"pref":"low"}');
 assert.equal(st.m['deepstack.floorrules.v1'],'false');
});
test('eraseProgress tolerates storage that throws',()=>{
 assert.equal(eraseProgress({removeItem(){throw new Error('blocked');}}),0);
});
