import type { ContinentId } from './continents';

export interface SkillArea {
  readonly id: string;
  readonly name: string;
  /** Expertise in [0, 1] — buys tiles: more expertise, more territory. */
  readonly expertise: number;
  readonly blurb: string;
  /** Which continent this skill's land belongs to. */
  readonly continentId: ContinentId;
}

export const SKILL_AREAS: readonly SkillArea[] = [
  { id: 'typescript', name: 'TypeScript', expertise: 0.95, blurb: 'Strict types end to end — the mother tongue of this site.', continentId: 'backend' },
  { id: 'threejs', name: 'three.js / WebGL', expertise: 0.85, blurb: 'Scenes, materials, post-processing and the render loop itself.', continentId: 'graphics' },
  { id: 'gsap', name: 'GSAP / motion', expertise: 0.9, blurb: 'Scroll choreography, timelines and physics-feeling eases.', continentId: 'graphics' },
  { id: 'performance', name: 'Web performance', expertise: 0.82, blurb: '60fps budgets: draw calls, DPR caps, chunk splitting.', continentId: 'backend' },
  { id: 'creative', name: 'Creative coding', expertise: 0.8, blurb: 'Generative visuals, noise fields and happy little accidents.', continentId: 'creative' },
  { id: 'ui', name: 'UI engineering', expertise: 0.75, blurb: 'Layout systems, micro-interactions, design tokens.', continentId: 'frontend' },
  { id: 'glsl', name: 'GLSL shaders', expertise: 0.7, blurb: 'Fragment tricks, voronoi fields and vertex warps.', continentId: 'graphics' },
  { id: 'node', name: 'Node.js & APIs', expertise: 0.7, blurb: 'Tooling, build pipelines and small services.', continentId: 'backend' },
  { id: 'design', name: 'Design systems', expertise: 0.66, blurb: 'Type scales, color logic and components that survive contact.', continentId: 'frontend' },
  { id: 'a11y', name: 'Accessibility', expertise: 0.6, blurb: 'Semantics, focus management, prefers-reduced-motion.', continentId: 'frontend' },
  { id: '.NET', name: 'ASP.NET', expertise: 1.0, blurb: 'ASP.NET', continentId: 'backend' },
  { id: 'DDD', name: 'Domain driven design', expertise: 0.6, blurb: 'Domain driven design', continentId: 'backend' },
  { id: 'SQL', name: 'SQL', expertise: 0.8, blurb: 'SQL', continentId: 'backend' },
];

/**
 * How many globe tiles a skill's land occupies (FR-022).
 *
 * The three owner-specified anchors fall on one straight line:
 *   100% → 62.5 − 12.5 = 50 tiles
 *   60%  → 37.5 − 12.5 = 25 tiles
 *   20%  → 12.5 − 12.5 =  0 → floored to 1
 *
 * 50 tiles is 1.95% of the globe's surface; China is 1.88% (research D1).
 * Measured — do not change the coefficients without re-measuring.
 */
export function skillTileQuota(expertise: number): number {
  const clamped = Math.max(0, Math.min(1, expertise));
  return Math.max(1, Math.floor(62.5 * clamped - 12.5));
}

export function skillLevelLabel(skill: SkillArea): string {
  return `${Math.round(skill.expertise * 100)}%`;
}
