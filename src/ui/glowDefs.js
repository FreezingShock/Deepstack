/* Every cached glow the frame loop uses, defined once. The frame code asks for `glowSprite(...def)` and the idle
   prewarm (prewarm.js) builds the same defs ahead of time, so a key can never drift between the two. A def is
   [cacheKey, gradientStops]. Pure: no DOM, safe to import from tests. */
export const lampGlow = aq => ['lamp' + aq, [[0, 'rgba(0,0,0,0)'], [.3, `rgba(6,4,2,${.2 + .25 * aq})`], [1, `rgba(3,2,2,${.93 + .06 * aq})`]]];
export const flameGlow = c => ['flame' + c, [[0, `rgba(${c},1)`], [1, `rgba(${c},0)`]]];
export const tierGlow = zc => ['tier' + zc, [[0, zc + '26'], [1, zc + '00']]];
export const litGlow = col => ['lit' + col, [[0, `rgba(${col},.8)`], [.4, `rgba(${col},.22)`], [1, `rgba(${col},0)`]]];
export const eyeGlow = col => ['eye' + col, [[0, `rgba(${col},.9)`], [.25, `rgba(${col},.35)`], [1, `rgba(${col},0)`]]];
export const liftGlow = () => ['lift-lantern', [[0, 'rgba(255,200,110,.55)'], [1, 'rgba(255,200,110,0)']]];
/** The colours the glows take: lit-prop tints (litProps.js), eye tints (eyes.js). */
export const LIT_COLS = ['255,150,70', '170,150,255'];
export const EYE_COLS = ['255,70,60', '200,150,255', '150,230,230'];
