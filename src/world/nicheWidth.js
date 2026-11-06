/* How wide the lit niche is for a window of width W. It has always been 760 px; on wide windows it now grows (up to
   1100 px from about 1500 px up) so the home room, the cabinet, the ledger and the fireplace can be a good deal bigger
   instead of floating in a fixed 760 px box with empty shelves either side. Below 1100 px nothing changes. One place,
   used by the world canvas, the lore-book clearances and the home layout, so they always agree. */
export const NICHE_BASE = 760, NICHE_MAX = 1100, NICHE_GROW_FROM = 1100;
export const nicheWidth = W => Math.min(W - 24, NICHE_BASE + Math.max(0, Math.min(NICHE_MAX - NICHE_BASE, (W - NICHE_GROW_FROM) * .7)));
/** How much bigger than the old fixed box a niche of width nw is, as a plain factor (1 up to 1.45). */
export const nicheScale = nw => Math.max(1, Math.min(NICHE_MAX / NICHE_BASE, nw / NICHE_BASE));
