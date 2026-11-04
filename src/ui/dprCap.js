// Backing-store scale for the world canvas: device ratio, never above 2, and capped so
// width*height*dpr^2 stays under maxPx (huge or 4K screens would otherwise fill-rate bound the frame).
export const MAX_WORLD_PX = 6e6;
export function worldDpr(w, h, deviceRatio = 1, maxPx = MAX_WORLD_PX) {
  const area = Math.max(1, w * h);
  return Math.min(2, deviceRatio || 1, Math.sqrt(maxPx / area));
}
