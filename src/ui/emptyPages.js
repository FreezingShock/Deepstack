/* Empty-state pages for the menu books when the player has nothing yet: one faint pen sketch and one written line of
   invitation per book. Pure string builders, no state; styles in emptyPages.css. */
const SKETCH={
 /* an empty shelf: two uprights, two planks and one lonely leaning gap */
 shelf:'M8 10 v70 M112 10 v70 M8 34 h104 M8 66 h104 M8 80 h104 M20 66 v-18 h8 v18 M32 66 v-22 h7 v22 M44 66 l4 -20 l7 2 l-4 18 M86 34 v-14 h9 v14 M99 34 v-10 h6 v10',
 /* a sealed ledger: cover, spine bands, strap and wax seal */
 ledger:'M22 10 h66 q6 0 6 6 v64 q0 6 -6 6 h-66 z M30 10 v76 M30 28 h-6 M30 68 h-6 M46 46 h48 M60 46 v14 M60 53 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M56 53 l4 4 l5 -7',
 /* a riddle slip: torn paper, a few ruled lines and a question mark */
 slip:'M16 14 h88 l-3 6 l4 6 l-4 6 l3 6 l-3 6 l4 6 l-4 6 h-85 z M32 28 h56 M32 40 h40 M32 52 q0 -10 10 -10 q10 0 10 8 q0 6 -8 8 v4 M44 66 v0.1'
};
export const sketch=(kind,{w=120,h=96}={})=>`<svg class="ep-sketch" viewBox="0 0 120 96" width="${w}" height="${h}" aria-hidden="true" focusable="false"><path d="${SKETCH[kind]||SKETCH.slip}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
/* sketch plus a single handwritten line */
export const emptyBlock=(kind,line,cls="")=>`<div class="ep-empty${cls?" "+cls:""}">${sketch(kind)}<p class="hand">${line}</p></div>`;
