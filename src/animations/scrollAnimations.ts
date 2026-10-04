import { gsap, ScrollTrigger } from './gsap';

/**
 * Scroll choreography, step 2: hero intro and per-element ScrollTrigger
 * reveals. The planet's own scroll motion (~180° sweep + ×1.3 growth) lives in
 * planetTour.ts, and the enlarged entry comes from the camera fit (research D7).
 */
export function initSectionAnimations(): () => void {
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

  // Layout shifts once webfonts land — recalc trigger positions.
  document.fonts.ready.then(() => ScrollTrigger.refresh());

  return () => {
    heroIntro.kill();
    revealTweens.forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    gsap.killTweensOf('[data-reveal], [data-hero]');
  };
}
