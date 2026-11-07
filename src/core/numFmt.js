/* Number formats for on-screen copy. Depths and counts take a thousands comma (1,008 ft, never 1008 ft),
   so every screen reads the same. Pure: no DOM, so tests can import it. */
export const fmtNum = n => Math.round(Number(n) || 0).toLocaleString('en-US');
export const fmtFt = n => fmtNum(n) + ' ft';
