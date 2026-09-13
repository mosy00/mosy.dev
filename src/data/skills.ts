export interface SkillArea {
  readonly id: string;
  readonly name: string;
  /** Base hue in [0, 1). All regions of a skill share this hue. */
  readonly hue: number;
  /** Expertise in [0, 1] — buys territory (more seeds) and deepens the tint. */
  readonly expertise: number;
  readonly blurb: string;
}

export const SKILL_AREAS: readonly SkillArea[] = [
  { id: 'typescript', name: 'TypeScript', hue: 0.58, expertise: 0.95, blurb: 'Strict types end to end — the mother tongue of this site.' },
  { id: 'threejs', name: 'three.js / WebGL', hue: 0.72, expertise: 0.85, blurb: 'Scenes, materials, post-processing and the render loop itself.' },
  { id: 'gsap', name: 'GSAP / motion', hue: 0.47, expertise: 0.9, blurb: 'Scroll choreography, timelines and physics-feeling eases.' },
  { id: 'performance', name: 'Web performance', hue: 0.53, expertise: 0.82, blurb: '60fps budgets: draw calls, DPR caps, chunk splitting.' },
  { id: 'creative', name: 'Creative coding', hue: 0.07, expertise: 0.8, blurb: 'Generative visuals, noise fields and happy little accidents.' },
  { id: 'ui', name: 'UI engineering', hue: 0.38, expertise: 0.75, blurb: 'Layout systems, micro-interactions, design tokens.' },
  { id: 'glsl', name: 'GLSL shaders', hue: 0.83, expertise: 0.7, blurb: 'Fragment tricks, voronoi fields and vertex warps.' },
  { id: 'node', name: 'Node.js & APIs', hue: 0.11, expertise: 0.7, blurb: 'Tooling, build pipelines and small services.' },
  { id: 'design', name: 'Design systems', hue: 0.91, expertise: 0.66, blurb: 'Type scales, color logic and components that survive contact.' },
  { id: 'a11y', name: 'Accessibility', hue: 0.25, expertise: 0.6, blurb: 'Semantics, focus management, prefers-reduced-motion.' },
];

const COLOR = {
  saturationBase: 0.45,
  saturationRange: 0.25,
  lightnessBase: 0.6,
  lightnessRange: 0.3,
} as const;

/** Shared tint formula: deeper (darker, richer) color = more experience. */
export function skillColorHSL(skill: SkillArea): [number, number, number] {
  return [
    skill.hue,
    COLOR.saturationBase + COLOR.saturationRange * skill.expertise,
    COLOR.lightnessBase - COLOR.lightnessRange * skill.expertise,
  ];
}

/** CSS color for legend swatches — the same formula the materials use. */
export function skillCssColor(skill: SkillArea): string {
  const [hue, saturation, lightness] = skillColorHSL(skill);
  return `hsl(${(hue * 360).toFixed(0)} ${(saturation * 100).toFixed(0)}% ${(lightness * 100).toFixed(0)}%)`;
}

export function skillLevelLabel(skill: SkillArea): string {
  return `${Math.round(skill.expertise * 100)}%`;
}
