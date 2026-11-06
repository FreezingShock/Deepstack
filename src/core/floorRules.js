// One small rule per floor, Unlimited only. The Daily and the placement test never use these, so their
// scores stay comparable. Pure data plus lookups; run.js applies them and Settings can switch them off.
export const FLOOR_RULES_KEY='deepstack.floorrules.v1';
export const BASE_LIMIT_MS=45000;
export const WHISPER_AT_MS=15000;

export const FLOOR_RULES={
 stacks:null,
 archive:{id:'lamps',name:'Reading lamps',line:'The lamps are lit. Ten extra seconds on every word.',limitMs:55000},
 catacombs:{id:'draught',name:'Draught',line:'A draught from the bone niches. The candle burns faster: 36 seconds a word.',limitMs:36000},
 vault:{id:'smear',name:'Smeared ink',line:'Damp has smeared the word. It sharpens when you start writing.',smear:true},
 hollow:{id:'whisper',name:'Whisper',line:'Something whispers a hint when the candle runs low.',whisper:true},
 abyss:{id:'gutter',name:'Guttering light',line:'The light barely holds. 30 seconds a word.',limitMs:30000}
};

/** Whether a run takes floor rules: Unlimited, not the placement test. */
export const rulesApply=run=>!!run&&run.mode==='unlimited'&&!run.placing&&!run.practice;

/** The rule for a floor key, or null. `enabled` is the player's Settings switch. */
export function ruleFor(floorKey,run,enabled=true){
 if(!enabled||!rulesApply(run))return null;
 return FLOOR_RULES[floorKey]||null;
}
export const limitFor=rule=>(rule&&rule.limitMs)||BASE_LIMIT_MS;

export function loadEnabled(storage=globalThis.localStorage){
 try{return storage.getItem(FLOOR_RULES_KEY)!=='off';}catch(e){return true;}
}
export function saveEnabled(on,storage=globalThis.localStorage){
 try{storage.setItem(FLOOR_RULES_KEY,on?'on':'off');}catch(e){}
}
