import { gsap } from './gsap';
import { TOUR } from '../three/config';
import type { Planet } from '../three/Planet';

function shortestAngle(from: number, to: number): number {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) {
    delta -= Math.PI * 2;
  }
  if (delta < -Math.PI) {
    delta += Math.PI * 2;
  }
  return delta;
}

/**
 * Step 4 — the scroll tour: scrolling through the (tall) planet section
 * rotates the globe so each skill island takes a turn facing the camera.
 * The tour owns only the outer tour group; user drag (inner group) stays
 * completely free, and the yaw always travels the short way round.
 */
export function initPlanetTour(planet: Planet): () => void {
  const group = planet.tourGroup;
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: '#planet',
      start: 'top top',
      end: 'bottom bottom',
      scrub: TOUR.scrub,
    },
  });

  let currentYaw = group.rotation.y;
  let time = 0;
  planet.tourTargets.forEach((target) => {
    const yawDelta = shortestAngle(currentYaw, target.yaw);
    timeline.to(
      group.rotation,
      {
        y: `+=${yawDelta}`,
        x: target.pitch,
        duration: TOUR.rotateDuration,
        ease: 'power2.inOut',
      },
      time,
    );
    time += TOUR.rotateDuration + TOUR.holdDuration;
    currentYaw += yawDelta;
  });

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
  };
}
