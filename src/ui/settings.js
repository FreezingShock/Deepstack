/* Player settings: sound (master volume, music, effects), motion, text size, high contrast.
   Stored under its own localStorage key so the save shape in `deepstack.v1` is untouched.
   Every field is optional and sanitised on load; new fields are additive with defaults that keep
   the look and sound the game had before they existed. */

export const SETTINGS_KEY='deepstack.settings.v1';
export const TEXT_SIZES=['normal','large','xlarge'];
/* 'system' follows the OS prefers-reduced-motion setting; 'reduce' and 'full' override it. */
export const MOTION_CHOICES=['system','reduce','full'];
export const DEFAULTS=Object.freeze({volume:0.8,music:1,effects:1,motion:'system',text:'normal',contrast:false});

const unit=(x,d)=>{const v=Number(x);return Number.isFinite(v)?Math.min(1,Math.max(0,v)):d;};

export function sanitize(raw){
 const r=raw&&typeof raw==='object'?raw:{};
 return{
  volume:unit(r.volume,DEFAULTS.volume),
  music:unit(r.music,DEFAULTS.music),
  effects:unit(r.effects,DEFAULTS.effects),
  motion:MOTION_CHOICES.includes(r.motion)?r.motion:'system',
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

/** The OS asks for reduced motion (false when it cannot be read). */
export function systemReduces(mq=()=>globalThis.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){
 try{return !!mq();}catch(e){return false;}
}

/** True when animation should be reduced: explicit choice wins over the OS setting. */
export function reducedMotion(s=loadSettings(),mq=()=>globalThis.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){
 if(s.motion==='reduce')return true;
 if(s.motion==='full')return false;
 return systemReduces(mq);
}

/* Live motion flag (ST3). Modules that used to read reducedMotion() once at load now read motionNow(); the flag is
   refreshed when the Motion setting changes or the OS preference flips, so a change lands without a reload. */
const motionListeners=new Set();
let liveRM=null;
/** Recompute the live flag from the settings (or the given ones, for tests) and tell every listener. */
export function refreshMotion(s=loadSettings(),mq){
 liveRM=mq===undefined?reducedMotion(s):reducedMotion(s,mq);
 // One switch for CSS: html.rm is on exactly when motion is reduced (the Motion setting, or the OS when set to System).
 // Every reduced-motion rule in src/**/*.css keys off this class, so the in-game setting always wins.
 if(globalThis.document?.documentElement)document.documentElement.classList.toggle('rm',!!liveRM);
 motionListeners.forEach(fn=>{try{fn(liveRM);}catch(e){}});
 return liveRM;
}
/** Current reduced-motion flag: cheap to read per frame, always in step with the settings. */
export function motionNow(){return liveRM===null?refreshMotion():liveRM;}
/** Call fn(reduced) whenever the flag changes. Returns an unsubscribe. */
export function onMotionChange(fn){motionListeners.add(fn);return()=>motionListeners.delete(fn);}
try{
 const mq=globalThis.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');
 if(mq&&mq.addEventListener)mq.addEventListener('change',()=>refreshMotion());
 refreshMotion();
}catch(e){}

/** Mirror settings onto <html> data attributes; CSS does the rest. */
export function applySettings(s,doc=globalThis.document){
 if(!doc)return;
 const h=doc.documentElement;
 h.dataset.text=s.text;
 h.dataset.contrast=s.contrast?'high':'normal';
 h.dataset.motion=s.motion==='system'?'system':s.motion;
 refreshMotion(s);
}
