export interface SkillArea {
  readonly id: string;
  readonly name: string;
  /** Expertise in [0, 1] — buys tiles: more expertise, more territory. */
  readonly expertise: number;
  readonly blurb: string;
  // Continent membership deliberately does NOT live here: it is declared once,
  // on the continent, in `src/data/continents.ts` (FR-014). A second copy on
  // the skill would force a two-file edit for every move (FR-015 / SC-009) —
  // see convergence task T037.
}

export const SKILL_AREAS: readonly SkillArea[] = [
  { id: 'typescript', name: 'TypeScript', expertise: 0.95, blurb: 'Strict types end to end — the mother tongue of this site.' },
  { id: 'threejs', name: 'three.js / WebGL', expertise: 0.85, blurb: 'Scenes, materials, post-processing and the render loop itself.' },
  { id: 'gsap', name: 'GSAP / motion', expertise: 0.9, blurb: 'Scroll choreography, timelines and physics-feeling eases.' },
  { id: 'performance', name: 'Web performance', expertise: 0.82, blurb: '60fps budgets: draw calls, DPR caps, chunk splitting.' },
  { id: 'creative', name: 'Creative coding', expertise: 0.8, blurb: 'Generative visuals, noise fields and happy little accidents.' },
  { id: 'ui', name: 'UI engineering', expertise: 0.75, blurb: 'Layout systems, micro-interactions, design tokens.' },
  { id: 'glsl', name: 'GLSL shaders', expertise: 0.7, blurb: 'Fragment tricks, voronoi fields and vertex warps.' },
  { id: 'node', name: 'Node.js & APIs', expertise: 0.7, blurb: 'Tooling, build pipelines and small services.' },
  { id: 'design', name: 'Design systems', expertise: 0.66, blurb: 'Type scales, color logic and components that survive contact.' },
  { id: 'a11y', name: 'Accessibility', expertise: 0.6, blurb: 'Semantics, focus management, prefers-reduced-motion.' },
  { id: '.NET', name: 'ASP.NET', expertise: 1.0, blurb: 'ASP.NET' },
  { id: 'DDD', name: 'Domain driven design', expertise: 0.6, blurb: 'Domain driven design' },
  { id: 'SQL', name: 'SQL', expertise: 0.8, blurb: 'SQL' },
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
