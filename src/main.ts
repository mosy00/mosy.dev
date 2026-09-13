import './styles/main.css';
import { initSectionAnimations } from './animations/scrollAnimations';
import { SKILL_AREAS } from './data/skills';
import { Experience } from './three/Experience';
import { initAnchorNavigation } from './ui/nav';
import { renderSkillLegend } from './ui/skillLegend';
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
    activeExperience = new Experience(canvas, SKILL_AREAS);
  } catch (error) {
    console.error('[mosy.dev] WebGL init failed:', error);
    document.body.classList.add('no-webgl');
    return;
  }

  const lenis = initSmoothScroll();
  initAnchorNavigation(lenis);

  // Legend must exist before animations run so its items get revealed.
  const legend = document.querySelector<HTMLElement>('#skill-legend');
  if (legend) {
    renderSkillLegend(legend);
  }

  initSectionAnimations(activeExperience.planet.object3D);
}

boot();
