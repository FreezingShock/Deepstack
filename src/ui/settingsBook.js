/* Settings book pages: markup only (testable as a string). topbar.js opens the book and wires these controls.
   Left page: Sound (switch, master, Music, Effects, Room sounds, Haptics) and Motion (Match system / Calm / Full).
   Right page: Display (text size, graphics, high contrast), Play (floor rules) and Progress (reset, with a confirm step).
   Look: settingsBook.css, on the panel-book classes from panelBook.css. Every control keeps the ids and data attributes
   topbar.js reads, so the page can repaint on a turn without losing its state. */
import {TEXT_SIZES} from './settings.js';

export const MOTION_LABELS=Object.freeze([['system','Match system'],['reduce','Calm'],['full','Full']]);
const pct=v=>Math.round(v*100);
const sw=(id,labelId,on)=>`<button type="button" class="tpsw" id="${id}" role="switch" aria-checked="${!!on}" aria-labelledby="${labelId}"><i></i></button>`;
const slider=(id,label,v)=>`<div class="tprow sb-slider"><label for="${id}">${label}</label><input id="${id}" type="range" min="0" max="100" step="5" value="${pct(v)}" aria-valuetext="${pct(v)} percent"><output id="o${id.slice(1)}">${pct(v)}%</output></div>`;

/** The two pages, split by <!--pg-->. st = sanitized settings; sound = Sound switch state; pref/prefs = Graphics; floorRules = switch state; osCalm = the OS asks for calm motion. */
export function settingsPages({st,sound=true,prefs=[],pref='auto',floorRules=false,osCalm=false}){
 const motionHint=osCalm?'Your system asks for calm motion, so Match system stays calm.':'Your system allows full motion, so Match system stays full.';
 const left=`<section class="sb-group" aria-label="Sound">
   <div class="tprow"><span id="lSnd">Sound</span>${sw('sSound','lSnd',sound)}</div>
   ${slider('sVol','Master',st.volume)}
   ${slider('sMus','Music',st.music)}
   ${slider('sFx','Effects',st.effects)}
   <p class="tphint">Music is the room's tone, the depth hum and the score. Effects are page turns, quills, seals and drips. Sound off silences both.</p>
   <div class="tprow"><span id="lRoo">Room sounds</span>${sw('sRoomSnd','lRoo',st.roomSounds!==false)}</div>
   <p class="tphint">Each topic room plays one faint sound of its own: a clock, beads, a bell, a quill, a chord or a heartbeat. Turn it off to keep the rest of Music. Sound must be on for any of it.</p>
   <div class="tprow"><span id="lHap">Haptics</span>${sw('sHaptics','lHap',st.haptics!==false)}</div>
   <p class="tphint">On a phone that supports it, the device buzzes softly as a verdict lands. Reduce motion turns the buzz off.</p>
  </section>
  <section class="sb-group" aria-label="Motion">
   <fieldset class="tprow tpseg sb-motion" id="sMotion"><legend>Motion</legend>${MOTION_LABELS.map(([v,l])=>`<button type="button" data-motion-choice="${v}" aria-pressed="${st.motion===v}">${l}</button>`).join('')}</fieldset>
   <p class="tphint" id="mHint">${motionHint} Calm shortens or stops most animations. A few effects only pick a change up on the next visit.</p>
  </section>`;
 const right=`<section class="sb-group" aria-label="Display">
   <fieldset class="tprow tpseg" id="sText"><legend>Text size</legend>${TEXT_SIZES.map((t,i)=>`<button type="button" data-text="${t}" aria-pressed="${st.text===t}" style="font-size:${14+i*3}px">A${i?'+'.repeat(i):''}<span class="sr-only"> ${['Normal','Large','Extra large'][i]}</span></button>`).join('')}</fieldset>
   <fieldset class="tprow tpseg" id="sQual"><legend>Graphics</legend>${prefs.map(p=>`<button type="button" data-q="${p}" aria-pressed="${pref===p}">${p[0].toUpperCase()+p.slice(1)}</button>`).join('')}</fieldset>
   <p class="tphint">Auto lightens dust, particles and resolution on slow devices. Pick Low if the library stutters.</p>
   <div class="tprow"><span id="lCon">High contrast</span>${sw('sContrast','lCon',st.contrast)}</div>
  </section>
  <section class="sb-group" aria-label="Play">
   <div class="tprow"><span id="lFR">Floor rules</span>${sw('sFloorRules','lFR',floorRules)}</div>
   <p class="tphint">Each deeper floor bends one small rule in Unlimited, like a faster candle. The Daily never uses them.</p>
  </section>
  <section class="sb-group sb-danger" aria-label="Progress">
   <h3 class="sb-h">Progress</h3>
   <div class="sb-dangerrow" id="sDangerRow"><p>Erase your shelf, streak, depths and room records and start the library again. Settings stay.</p><button type="button" class="btn sb-reset" id="sReset" aria-controls="sConfirm" aria-expanded="false">Reset progress…</button></div>
   <div class="sb-confirm" id="sConfirm" role="alertdialog" aria-labelledby="scT" aria-describedby="scD" hidden>
    <h4 id="scT">Erase all progress?</h4>
    <p id="scD">This cannot be undone. The page reloads empty.</p>
    <div class="sb-acts"><button type="button" class="btn" id="scKeep">Keep my library</button><button type="button" class="btn sb-go" id="scGo">Erase progress</button></div>
   </div>
  </section>`;
 return {left,right};
}
