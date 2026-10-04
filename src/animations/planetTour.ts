import { gsap } from './gsap';
import { TOUR } from '../three/config';
import { prefersReducedMotion } from '../three/motionPrefs';
import type { Planet } from '../three/Planet';

/**
 * Step 4 — the calm scroll tour: scrolling through the (tall) planet section
 * sweeps the globe ~180° about its poles and grows it ×1.3. Pitch is never
 * written, so no land is ever re-centred and the poles stay put. The tour owns
 * only the outer tour group; user drag (inner group) stays completely free.
 * Under reduced motion no timeline is created — the planet stays exactly as
 * the camera fit placed it: enlarged and static (research D8).
 */
export function initPlanetTour(planet: Planet): () => void {
  if (prefersReducedMotion()) {
    return () => {};
  }

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: '#planet',
      start: 'top top',
      end: 'bottom bottom',
      scrub: TOUR.scrub,
    },
  });

  timeline.to(planet.tourGroup.rotation, { y: `+=${TOUR.sweepYaw}`, ease: 'power1.inOut' }, 0);
  timeline.to(
    planet.object3D.scale,
    {
      x: TOUR.growthScale,
      y: TOUR.growthScale,
      z: TOUR.growthScale,
      ease: 'power1.inOut',
    },
    0,
  );

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
  };
}
