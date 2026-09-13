import { SKILL_AREAS, skillCssColor, skillLevelLabel, type SkillArea } from '../data/skills';

function createLegendItem(skill: SkillArea): HTMLLIElement {
  const item = document.createElement('li');
  item.className = 'skill-legend__item';
  item.title = skill.blurb;
  item.dataset.reveal = '';

  const dot = document.createElement('span');
  dot.className = 'skill-legend__dot';
  // Same formula as the 3D material, so swatch = country color.
  dot.style.background = skillCssColor(skill);
  dot.style.color = skillCssColor(skill);

  const name = document.createElement('span');
  name.className = 'skill-legend__name';
  name.textContent = skill.name;

  const level = document.createElement('span');
  level.className = 'skill-legend__level';
  level.textContent = skillLevelLabel(skill);

  item.append(dot, name, level);
  return item;
}

/** Builds the skill legend from the shared data module (swatches match the planet). */
export function renderSkillLegend(container: HTMLElement): void {
  const fragment = document.createDocumentFragment();
  for (const skill of SKILL_AREAS) {
    fragment.append(createLegendItem(skill));
  }
  container.append(fragment);
}
