import type Lenis from 'lenis';

/** Smooth-scroll in-page anchors through Lenis instead of hard jumps. */
export function initAnchorNavigation(lenis: Lenis): void {
  const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');

  anchors.forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const hash = anchor.getAttribute('href');
      if (!hash) {
        return;
      }
      event.preventDefault();
      if (hash === '#') {
        return;
      }
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) {
        return;
      }
      lenis.scrollTo(target, { duration: 1.4 });
    });
  });
}
