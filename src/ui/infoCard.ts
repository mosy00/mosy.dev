import { skillColor, type Continent } from '../data/continents';
import { skillLevelLabel, type SkillArea } from '../data/skills';

/**
 * Floating glass card describing the hovered skill: name, blurb and an
 * expertise meter tinted with the skill's colour (same function the 3D material
 * uses, so card and land always match).
 *
 * The kicker line shows the CONTINENT name, so a visitor always knows which
 * grouping they are looking at (FR-018).
 */
export class InfoCard {
  private readonly root: HTMLElement;
  private readonly kicker: HTMLElement;
  private readonly nameElement: HTMLElement;
  private readonly blurbElement: HTMLElement;
  private readonly levelElement: HTMLElement;
  private readonly meterFill: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'skill-card';
    this.root.setAttribute('role', 'status');
    this.root.setAttribute('aria-live', 'polite');

    this.kicker = document.createElement('p');
    this.kicker.className = 'skill-card__kicker';

    this.nameElement = document.createElement('h3');
    this.nameElement.className = 'skill-card__name';

    this.blurbElement = document.createElement('p');
    this.blurbElement.className = 'skill-card__blurb';

    const meter = document.createElement('div');
    meter.className = 'skill-card__meter';
    this.meterFill = document.createElement('span');
    meter.append(this.meterFill);

    this.levelElement = document.createElement('p');
    this.levelElement.className = 'skill-card__level';

    this.root.append(this.kicker, this.nameElement, this.blurbElement, meter, this.levelElement);
    parent.append(this.root);
  }

  showSkill(skill: SkillArea, continent: Continent | null): void {
    const color = continent ? skillColor(skill, continent) : '#F1FFFA';
    this.root.style.setProperty('--skill-color', color);
    // Continent name in the kicker; omit the line entirely when unknown.
    this.kicker.textContent = continent ? continent.name : '';
    this.kicker.hidden = continent === null;
    this.nameElement.textContent = skill.name;
    this.blurbElement.textContent = skill.blurb;
    this.levelElement.textContent = `expertise — ${skillLevelLabel(skill)}`;
    this.meterFill.style.width = `${Math.round(skill.expertise * 100)}%`;
    this.root.classList.add('is-visible');
  }

  hide(): void {
    this.root.classList.remove('is-visible');
  }

  dispose(): void {
    this.root.remove();
  }
}
