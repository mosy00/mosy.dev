import { SKILL_AREAS, skillCssColor, skillLevelLabel, type SkillArea } from '../data/skills';

export interface SkillLegendController {
  /** Highlights the row matching the hovered skill (null clears). */
  setActive(skillId: string | null): void;
}

function createLegendItem(skill: SkillArea, onHover: (skillId: string | null) => void): HTMLLIElement {
  const item = document.createElement('li');
  item.dataset.reveal = '';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'skill-legend__item';
  button.title = skill.blurb;
  button.dataset.skillId = skill.id;
  // Same formula as the 3D material, so swatch = island color.
  button.style.setProperty('--skill-color', skillCssColor(skill));

  const dot = document.createElement('span');
  dot.className = 'skill-legend__dot';
  dot.style.background = skillCssColor(skill);

  const name = document.createElement('span');
  name.className = 'skill-legend__name';
  name.textContent = skill.name;

  const level = document.createElement('span');
  level.className = 'skill-legend__level';
  level.textContent = skillLevelLabel(skill);

  button.append(dot, name, level);
  item.append(button);

  // Legend rows drive the same hover pipeline as the 3D raycaster —
  // keyboard focus included.
  button.addEventListener('mouseenter', () => onHover(skill.id));
  button.addEventListener('mouseleave', () => onHover(null));
  button.addEventListener('focus', () => onHover(skill.id));
  button.addEventListener('blur', () => onHover(null));
  return item;
}

/** Builds the skill legend from the shared data module. */
export function renderSkillLegend(
  container: HTMLElement,
  onHover: (skillId: string | null) => void,
): SkillLegendController {
  const fragment = document.createDocumentFragment();
  for (const skill of SKILL_AREAS) {
    fragment.append(createLegendItem(skill, onHover));
  }
  container.append(fragment);

  return {
    setActive(skillId: string | null): void {
      for (const button of container.querySelectorAll<HTMLButtonElement>('.skill-legend__item')) {
        button.classList.toggle('is-active', skillId !== null && button.dataset.skillId === skillId);
      }
    },
  };
}
