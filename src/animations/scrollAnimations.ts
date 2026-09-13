import { gsap, ScrollTrigger } from './gsap';

/**
 * Scroll choreography, step 1: a hero intro timeline, per-element
 * ScrollTrigger reveals and a scrubbed dim of the planet as the page
 * scrolls into the content sections (it returns at the footer).
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

  // Dim the planet while reading the content sections.
  gsap.to('#webgl', {
    opacity: 0.22,
    ease: 'none',
    scrollTrigger: { trigger: '#manifesto', start: 'top 85%', end: 'top 25%', scrub: true },
  });
  gsap.to('#webgl', {
    opacity: 1,
    ease: 'none',
    scrollTrigger: { trigger: '#contact', start: 'top 95%', end: 'top 45%', scrub: true },
  });

  // Layout shifts once webfonts land — recalc trigger positions.
  document.fonts.ready.then(() => ScrollTrigger.refresh());

  return () => {
    heroIntro.kill();
    revealTweens.forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
    gsap.killTweensOf('#webgl');
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  };
}
