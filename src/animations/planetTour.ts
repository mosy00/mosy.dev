import { gsap } from './gsap';
import { PLANET, TOUR } from '../three/config';
import { prefersReducedMotion } from '../three/motionPrefs';
import type { Planet } from '../three/Planet';
import type { PlanetControls } from '../three/PlanetControls';

/**
 * The calm scroll tour (research D7) PLUS tilt-only re-centering (US1 /
 * research D2 / contracts C1): scrolling sweeps the globe ~180° and grows it,
 * while any visitor-applied tilt eases back toward the entry tilt.
 *
 * Clarifications (session 2026-10-13): yaw is NEVER written — only tilt
 * recenters (Q1); the eased tilt is one-way — scrolling back keeps the entry
 * tilt and nothing restores the old custom tilt (Q3); while the pointer is
 * down the drag owns pitch outright (FR-003). Under reduced motion no
 * timeline is created: a single static set places the tilt at entry and the
 * planet stays still (research D5 / contracts C5).
 */
export function initPlanetTour(planet: Planet, controls: PlanetControls): () => void {
  // The tilt lives on the OUTERMOST group (research D1 / US2 turntable fix):
  // easing it here composes with the sweep below without touching any yaw.
  const tilt = planet.tiltTarget;

  if (prefersReducedMotion()) {
    // Research D5: static single set, no sweep/growth timeline at all.
    tilt.rotation.x = PLANET.initialTilt;
    return () => {};
  }

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: '#planet',
      start: 'top top',
      end: 'bottom bottom',
      scrub: TOUR.scrub,
      // Tilt-only re-center (D2): each scroll tick eases pitch toward the
      // entry tilt unless the visitor is actively dragging. Yaw is untouched,
      // so the sweep composes with wherever the visitor left the spin, and
      // the eased tilt sticks on scroll-back (nothing ever restores it).
      onUpdate: () => {
        if (controls.isDragging) {
          return; // FR-003: direct drag control while the pointer is down
        }
        tilt.rotation.x += (PLANET.initialTilt - tilt.rotation.x) * TOUR.recenterEase;
      },
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
