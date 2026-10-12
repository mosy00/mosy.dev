import { CONTINENTS, skillColor } from '../data/continents';
import { paletteEntry } from '../data/palette';
import { SKILL_AREAS, skillLevelLabel, type SkillArea } from '../data/skills';

export interface SkillLegendController {
  /** Highlights the row matching the hovered skill (null clears). */
  setActive(skillId: string | null): void;
}

function createLegendItem(
  skill: SkillArea,
  onHover: (skillId: string | null) => void,
): HTMLLIElement {
  const item = document.createElement('li');
  item.dataset.reveal = '';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'skill-legend__item';
  button.title = skill.blurb;
  button.dataset.skillId = skill.id;

  const continent = CONTINENTS.find((entry) => entry.skills.includes(skill.id)) ?? null;
  // Same function the 3D material uses, so the swatch can never drift from the
  // land it represents.
  const color = continent ? skillColor(skill, continent) : paletteEntry('mintCream').hex;
  button.style.setProperty('--skill-color', color);

  const dot = document.createElement('span');
  dot.className = 'skill-legend__dot';
  dot.style.background = color;

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

/**
 * Builds the legend grouped by continent (FR-019), so a visitor can see the
 * grouping without rotating the globe. A continent with no skills is skipped
 * rather than rendering an empty header (T028).
 */
export function renderSkillLegend(
  container: HTMLElement,
  onHover: (skillId: string | null) => void,
): SkillLegendController {
  const fragment = document.createDocumentFragment();

  for (const continent of CONTINENTS) {
    const members = continent.skills
      .map((id) => SKILL_AREAS.find((skill) => skill.id === id))
      .filter((skill): skill is SkillArea => skill !== undefined);
    if (members.length === 0) {
      continue;
    }

    const group = document.createElement('li');
    group.className = 'skill-legend__group';
    group.dataset.reveal = '';

    const heading = document.createElement('p');
    heading.className = 'skill-legend__heading';
    heading.style.setProperty('--continent-color', paletteEntry(continent.mainColor).hex);

    const chip = document.createElement('span');
    chip.className = 'skill-legend__chip';
    heading.append(chip, document.createTextNode(continent.name));
    group.append(heading);

    const list = document.createElement('ul');
    list.className = 'skill-legend__list';
    for (const skill of members) {
      list.append(createLegendItem(skill, onHover));
    }
    group.append(list);
    fragment.append(group);
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
