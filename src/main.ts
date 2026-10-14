import './styles/main.css';
import { initPlanetTour } from './animations/planetTour';
import { initSectionAnimations } from './animations/scrollAnimations';
import { continentForSkill, validateContinents } from './data/continents';
import { applyPaletteVariables } from './data/palette';
import { SKILL_AREAS } from './data/skills';
import { Experience } from './three/Experience';
import { prefersReducedMotion } from './three/motionPrefs';
import { PlanetInteraction } from './three/PlanetInteraction';
import { LandLabels } from './three/landLabels';
import { InfoCard } from './ui/infoCard';
import { initAnchorNavigation } from './ui/nav';
import { renderSkillLegend } from './ui/skillLegend';
import { initSmoothScroll } from './ui/smoothScroll';

let activeExperience: Experience | null = null;
let activeInteraction: PlanetInteraction | null = null;
let disposeTour: (() => void) | null = null;

/** Teardown hook — kept for future HMR handling / programmatic resets. */
export function disposeExperience(): void {
  disposeTour?.();
  disposeTour = null;
  activeInteraction?.dispose();
  activeInteraction = null;
  activeExperience?.dispose();
  activeExperience = null;
}

function boot(): void {
  // The palette owns every colour on the site. Apply it FIRST, before the
  // renderer or any UI exists, so nothing is ever sampled from a pre-palette
  // stylesheet (T011).
  applyPaletteVariables(document.documentElement);

  // Fail fast on a malformed continent map rather than rendering an uncoloured
  // land (T027).
  validateContinents(SKILL_AREAS);

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
  const stage = planetSection?.querySelector<HTMLElement>('.planet__stage');
  const legendHost = document.querySelector<HTMLElement>('#skill-legend');
  const infoCard = stage ? new InfoCard(stage) : null;

  // One hover pipeline shared by the raycaster and the legend rows.
  let applyHover: (skillId: string | null) => void = () => {};

  if (legendHost) {
    const legend = renderSkillLegend(legendHost, (skillId) => applyHover(skillId));

    applyHover = (skillId: string | null): void => {
      activeExperience?.planet.setHighlighted(skillId);
      legend.setActive(skillId);
      const skill = SKILL_AREAS.find((entry) => entry.id === skillId) ?? null;
      if (skill) {
        infoCard?.showSkill(skill, continentForSkill(skill.id));
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
      // US4 / research D3: one floating sprite label per land, parented to
      // the drag group; Experience ticks and disposes them with the loop.
      activeExperience.attachLabels(new LandLabels(activeExperience.planet));
    }
  }

  // Legend must exist before animations run so its items get revealed.
  activeExperience.setReducedMotion(prefersReducedMotion());
  initSectionAnimations();
  disposeTour = initPlanetTour(activeExperience.planet, activeExperience.controls);
}

boot();
