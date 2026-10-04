/**
 * Boot-time reduced-motion check for the planet tour (research D8).
 * True when the visitor prefers reduced motion — the scroll tour stays
 * static (enlarged planet, no sweep/growth) while drag/hover stay live.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}