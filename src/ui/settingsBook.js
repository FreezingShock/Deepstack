/* Settings book pages: markup only (testable as a string). topbar.js opens the book and wires these controls.
   Normal text: two pages. Left: Sound (switch, master, Music, Effects) and Motion (Match system / Calm / Full).
   Right: Display (text size, graphics, high contrast), Play (floor rules) and Progress (reset, with a confirm step).
   Large and Extra large text: the same sections flow onto more book pages (three spreads, six pages), so no page scrolls
   and every control keeps its 44px target. Each control id appears on exactly one page.
   Look: settingsBook.css, on the panel-book classes from panelBook.css. Every control keeps the ids and data attributes
   topbar.js reads, so the page can repaint on a turn without losing its state. */
import {TEXT_SIZES} from './settings.js';

export const MOTION_LABELS=Object.freeze([['system','Match system'],['reduce','Calm'],['full','Full']]);
const pct=v=>Math.round(v*100);
const sw=(id,labelId,on)=>`<button type="button" class="tpsw" id="${id}" role="switch" aria-checked="${!!on}" aria-labelledby="${labelId}"><i></i></button>`;
const slider=(id,label,v)=>`<div class="tprow sb-slider"><label for="${id}">${label}</label><input id="${id}" type="range" min="0" max="100" step="5" value="${pct(v)}" aria-valuetext="${pct(v)} percent"><output id="o${id.slice(1)}">${pct(v)}%</output></div>`;

/* One block of markup per section. o = {st, sound, prefs, pref, floorRules, osCalm} (see settingsPages). */
const soundRows=o=>`<div class="tprow"><span id="lSnd">Sound</span>${sw('sSound','lSnd',o.sound)}</div>
   ${slider('sVol','Master',o.st.volume)}
   ${slider('sMus','Music',o.st.music)}
   ${slider('sFx','Effects',o.st.effects)}
   <p class="tphint">Music is the room's tone, the depth hum and the score. Effects are page turns, quills, seals and drips. Sound off silences both.</p>`;
const hapticRows=o=>`<div class="tprow"><span id="lHap">Haptics</span>${sw('sHaptics','lHap',o.st.haptics!==false)}</div>
   <p class="tphint">On a phone that supports it, the device buzzes softly as a verdict lands. Reduce motion turns the buzz off.</p>`;
const soundSec=o=>`<section class="sb-group" aria-label="Sound">${soundRows(o)}</section>`;
const hapticSec=o=>`<section class="sb-group" aria-label="Haptics">${hapticRows(o)}</section>`;
const motionSec=o=>{
 const motionHint=o.osCalm?'Your system asks for calm motion, so Match system stays calm.':'Your system allows full motion, so Match system stays full.';
 return `<section class="sb-group" aria-label="Motion">
   <fieldset class="tprow tpseg sb-motion" id="sMotion"><legend>Motion</legend>${MOTION_LABELS.map(([v,l])=>`<button type="button" data-motion-choice="${v}" aria-pressed="${o.st.motion===v}">${l}</button>`).join('')}</fieldset>
   <p class="tphint" id="mHint">${motionHint} Calm shortens or stops most animations. A few effects only pick a change up on the next visit.</p>
  </section>`;
};
/* the text-size and graphics rows and their hint: the body of Display */
const textBody=o=>`<fieldset class="tprow tpseg" id="sText"><legend>Text size</legend>${TEXT_SIZES.map((t,i)=>`<button type="button" data-text="${t}" aria-pressed="${o.st.text===t}" style="font-size:${14+i*3}px">A${i?'+'.repeat(i):''}<span class="sr-only"> ${['Normal','Large','Extra large'][i]}</span></button>`).join('')}</fieldset>
   <fieldset class="tprow tpseg" id="sQual"><legend>Graphics</legend>${o.prefs.map(p=>`<button type="button" data-q="${p}" aria-pressed="${o.pref===p}">${p[0].toUpperCase()+p.slice(1)}</button>`).join('')}</fieldset>
   <p class="tphint">Auto lightens dust, particles and resolution on slow devices. Pick Low if the library stutters.</p>`;
const contrastRow=o=>`<div class="tprow"><span id="lCon">High contrast</span>${sw('sContrast','lCon',o.st.contrast)}</div>`;
const displaySec=body=>`<section class="sb-group" aria-label="Display">${body}</section>`;
const playSec=o=>`<section class="sb-group" aria-label="Play">
   <div class="tprow"><span id="lFR">Floor rules</span>${sw('sFloorRules','lFR',o.floorRules)}</div>
   <p class="tphint">Each deeper floor bends one small rule in Unlimited, like a faster candle. The Daily never uses them.</p>
  </section>`;
const progressSec=()=>`<section class="sb-group sb-danger" aria-label="Progress">
   <h3 class="sb-h">Progress</h3>
   <div class="sb-dangerrow" id="sDangerRow"><p>Erase your shelf, streak, depths and room records and start the library again. Settings stay.</p><button type="button" class="btn sb-reset" id="sReset" aria-controls="sConfirm" aria-expanded="false">Reset progress…</button></div>
   <div class="sb-confirm" id="sConfirm" role="alertdialog" aria-labelledby="scT" aria-describedby="scD" hidden>
    <h4 id="scT">Erase all progress?</h4>
    <p id="scD">This cannot be undone. The page reloads empty.</p>
    <div class="sb-acts"><button type="button" class="btn" id="scKeep">Keep my library</button><button type="button" class="btn sb-go" id="scGo">Erase progress</button></div>
   </div>
  </section>`;

/* Normal text: the two pages. o = {st (sanitized settings), sound (Sound switch state), prefs/pref (Graphics), floorRules (switch state), osCalm (the OS asks for calm motion)}. */
export function settingsPages(o){
 return {left:`<section class="sb-group" aria-label="Sound">${soundRows(o)}${hapticRows(o)}</section>`+motionSec(o), right:displaySec(textBody(o)+contrastRow(o))+playSec(o)+progressSec()};
}

/* The book's spreads: {l, r} pairs. Desktop at normal text is one spread; larger text, and every phone (one page at a time,
   so more pages cost nothing), splits the same sections over three spreads in the same order, so a page never has to scroll. */
export function settingsSpreads(o){
 if(o.st.text==='normal'&&!o.phone){const p=settingsPages(o);return [{l:p.left,r:p.right}];}
 return [
  {l:soundSec(o), r:hapticSec(o)+motionSec(o)},
  {l:displaySec(textBody(o)), r:`<section class="sb-group" aria-label="Contrast">${contrastRow(o)}</section>`},
  {l:playSec(o), r:progressSec()},
 ];
}
