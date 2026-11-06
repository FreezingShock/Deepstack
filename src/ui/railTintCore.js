/* Pure helper for the floor-tinted top rail (no DOM, unit tested). The rail borrows each floor's own lamp colour,
   softened, so the oak never goes bright. Stacks is the neutral warm amber the rail already had. */
export const railTintFor=f=>{
 const l=(f&&f.lamp)||[255,176,77];
 return `rgb(${l.map(n=>Math.max(0,Math.min(255,Math.round(+n||0)))).join(' ')})`;
};
