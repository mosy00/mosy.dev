import './styles/main.css';
import { initSectionAnimations } from './animations/scrollAnimations';
import { SKILL_AREAS } from './data/skills';
import { Experience } from './three/Experience';
import { PlanetInteraction } from './three/PlanetInteraction';
import { InfoCard } from './ui/infoCard';
import { initAnchorNavigation } from './ui/nav';
import { renderSkillLegend } from './ui/skillLegend';
import { initSmoothScroll } from './ui/smoothScroll';

let activeExperience: Experience | null = null;
let activeInteraction: PlanetInteraction | null = null;

/** Teardown hook — kept for future HMR handling / programmatic resets. */
export function disposeExperience(): void {
  activeInteraction?.dispose();
  activeInteraction = null;
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

  const planetSection = document.querySelector<HTMLElement>('#planet');
  const legendHost = document.querySelector<HTMLElement>('#skill-legend');
  const infoCard = planetSection ? new InfoCard(planetSection) : null;

  // One hover pipeline shared by the raycaster and the legend rows.
  let applyHover: (skillId: string | null) => void = () => {};

  if (legendHost) {
    const legend = renderSkillLegend(legendHost, (skillId) => applyHover(skillId));

    applyHover = (skillId: string | null): void => {
      activeExperience?.planet.setHighlighted(skillId);
      legend.setActive(skillId);
      const skill = SKILL_AREAS.find((entry) => entry.id === skillId) ?? null;
      if (skill) {
        infoCard?.showSkill(skill);
      } else {
        infoCard?.hide();
      }
    };

    if (activeExperience) {
      activeInteraction = new PlanetInteraction({
        canvas,
        camera: activeExperience.camera,
        objects: activeExperience.planet.meshes,
        controls: activeExperience.controls,
        onHover: (skillId) => applyHover(skillId),
      });
    }
  }

  // Legend must exist before animations run so its items get revealed.
  initSectionAnimations(activeExperience.planet.object3D);
}

boot();
