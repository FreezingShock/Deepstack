/* Player settings: sound volume, reduced motion, text size, high contrast.
   Stored under its own localStorage key so the save shape in `deepstack.v1`
   is untouched. Every field is optional and sanitised on load. */

export const SETTINGS_KEY='deepstack.settings.v1';
export const TEXT_SIZES=['normal','large','xlarge'];
export const DEFAULTS=Object.freeze({volume:0.8,motion:'system',text:'normal',contrast:false});

export function sanitize(raw){
 const r=raw&&typeof raw==='object'?raw:{};
 const v=Number(r.volume);
 return{
  volume:Number.isFinite(v)?Math.min(1,Math.max(0,v)):DEFAULTS.volume,
  motion:r.motion==='reduce'||r.motion==='full'?r.motion:'system',
  text:TEXT_SIZES.includes(r.text)?r.text:DEFAULTS.text,
  contrast:r.contrast===true,
 };
}

export function loadSettings(storage=globalThis.localStorage){
 try{return sanitize(JSON.parse(storage.getItem(SETTINGS_KEY)));}catch(e){return sanitize(null);}
}
export function saveSettings(s,storage=globalThis.localStorage){
 try{storage.setItem(SETTINGS_KEY,JSON.stringify(s));}catch(e){}
}

/** True when animation should be reduced: explicit choice wins over the OS setting. */
export function reducedMotion(s=loadSettings(),mq=()=>globalThis.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){
 if(s.motion==='reduce')return true;
 if(s.motion==='full')return false;
 try{return !!mq();}catch(e){return false;}
}

/** Mirror settings onto <html> data attributes; CSS does the rest. */
export function applySettings(s,doc=globalThis.document){
 if(!doc)return;
 const h=doc.documentElement;
 h.dataset.text=s.text;
 h.dataset.contrast=s.contrast?'high':'normal';
 h.dataset.motion=s.motion==='system'?'system':s.motion;
}
