import type { Object3D } from 'three';
import { gsap, ScrollTrigger } from './gsap';

/** Scale the planet sits at while its section is off-screen. */
const PLANET_HIDDEN_SCALE = 0.88;

/**
 * Scroll choreography, step 2: hero intro, per-element ScrollTrigger
 * reveals, and a scale flourish when the skills planet scrolls into view.
 */
export function initSectionAnimations(planet: Object3D | null): () => void {
  const heroIntro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroIntro.from('[data-hero]', {
    y: 36,
    opacity: 0,
    duration: 1.1,
    stagger: 0.09,
    delay: 0.15,
  });

  const revealTweens = gsap.utils
    .toArray<HTMLElement>('[data-reveal]')
    .map((element) =>
      gsap.from(element, {
        y: 44,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
      }),
    );

  if (planet) {
    gsap.set(planet.scale, { x: PLANET_HIDDEN_SCALE, y: PLANET_HIDDEN_SCALE, z: PLANET_HIDDEN_SCALE });
    ScrollTrigger.create({
      trigger: '#planet',
      start: 'top 60%',
      onEnter: () => {
        gsap.to(planet.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 1.5,
          ease: 'elastic.out(1, 0.65)',
          overwrite: true,
        });
      },
      onLeaveBack: () => {
        gsap.to(planet.scale, {
          x: PLANET_HIDDEN_SCALE,
          y: PLANET_HIDDEN_SCALE,
          z: PLANET_HIDDEN_SCALE,
          duration: 0.6,
          ease: 'power2.out',
          overwrite: true,
        });
      },
    });
  }

  // Layout shifts once webfonts land — recalc trigger positions.
  document.fonts.ready.then(() => ScrollTrigger.refresh());

  return () => {
    heroIntro.kill();
    revealTweens.forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    if (planet) {
      gsap.killTweensOf(planet.scale);
    }
    gsap.killTweensOf('[data-reveal], [data-hero]');
  };
}
