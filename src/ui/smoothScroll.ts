import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../animations/gsap';

/**
 * Lenis smooth scroll driven by the GSAP ticker — one rAF loop for the
 * whole app, with ScrollTrigger kept in sync on every Lenis scroll event.
 */
export function initSmoothScroll(): Lenis {
  const lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    touchMultiplier: 1.4,
  });

  lenis.on('scroll', () => ScrollTrigger.update());

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
