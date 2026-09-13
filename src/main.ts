import './styles/main.css';
import { initSectionAnimations } from './animations/scrollAnimations';
import { Experience } from './three/Experience';
import { initAnchorNavigation } from './ui/nav';
import { initSmoothScroll } from './ui/smoothScroll';

let activeExperience: Experience | null = null;

/** Teardown hook — kept for future HMR handling / programmatic resets. */
export function disposeExperience(): void {
  activeExperience?.dispose();
  activeExperience = null;
}

function boot(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#webgl');
  if (!canvas) {
    throw new Error('#webgl canvas not found');
  }

  try {
    activeExperience = new Experience(canvas);
  } catch (error) {
    console.error('[mosy.dev] WebGL init failed:', error);
    document.body.classList.add('no-webgl');
    return;
  }

  const lenis = initSmoothScroll();
  initAnchorNavigation(lenis);
  initSectionAnimations();
}

boot();
