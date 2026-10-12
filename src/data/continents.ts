import { hexToHsl, hslToHex, paletteEntry, type PaletteEntryId } from './palette';
import { skillTileQuota, SKILL_AREAS, type SkillArea } from './skills';
import { LAND_COLOR } from '../three/config';

export type ContinentId = string;

/**
 * A lake or river cut out of a continent's interior, expressed in the
 * continent's own tangent frame (radians, `p` along its long axis, `q`
 * across it).
 *
 * `from === to` gives a lake; differing endpoints give a river. The cut only
 * ever removes tiles — the continent still grows by adjacency around it, so the
 * mass stays connected and keeps its exact quota. A cut that happens to reach
 * the rim becomes a bay; a cut that would split the continent in two stalls the
 * growth instead, which `allocateContinents` detects and falls back from.
 */
export interface ContinentVoid {
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  /** Cut width in radians — one hex tile is ≈0.043, so 0.09 ≈ two tiles. */
  readonly width: number;
}

/**
 * The silhouette of a continent — the continent-scale version of the per-skill
 * shape profiles from research D5, which never made it up to continent level
 * (that is why every outline came out the same circle).
 *
 * The outline is the set of tiles whose score falls below the growth threshold,
 * and score is a RADIUS measured from the anchor, so every profile here stays
 * star-shaped around the anchor by construction — that is what keeps the
 * continent connected no matter how wild the numbers get.
 */
export interface ContinentShape {
  /** Stretch along `angle`. 1 = round, 1.8 = long and narrow, 0.6 = squat. */
  readonly aspect: number;
  /** Bearing of the long axis, radians from the anchor's east direction. */
  readonly angle: number;
  /** Radial lobes: 1 = bean/crescent, 2 = pinched, 3–6 = scalloped. */
  readonly lobes: number;
  /** Symmetry breaker in radians, so two continents with the same `lobes` still differ. */
  readonly phase: number;
  /** Lobe depth. 0 = plain ellipse; higher = deeper bays between lobes. */
  readonly amp: number;
  readonly voids: readonly ContinentVoid[];
}

export interface Continent {
  readonly id: ContinentId;
  readonly name: string;
  /** A palette entry id — the continent's identity colour. */
  readonly mainColor: PaletteEntryId;
  /** Member skill ids. Membership lives here, so adding a skill is one line. */
  readonly skills: readonly string[];
  /**
   * Silhouette. Optional — omit it and `continentShape()` derives a distinct
   * one from the id, so a newly added continent still doesn't look like a
   * clone of an existing one (FR-015).
   */
  readonly shape?: ContinentShape;
}

/**
 * The four starting continents (FR-020). A starting point only — add, rename or
 * remove entries freely, or move a skill between them, without touching any
 * other file (FR-015).
 */
export const CONTINENTS: readonly Continent[] = [
  {
    id: 'frontend',
    name: 'Front-end & Interface',
    mainColor: 'amber',
    skills: ['ui', 'design', 'a11y'],
    // Long EAST–WEST streak. Its anchor sits at 48.6°N and land stops at 60°, so a
    // north–south long axis would be sawn off by the polar cap; running it along
    // the latitude circle keeps the full stretch. Four scallops + an inland lake
    // offset from the anchor so growth can route around it.
    shape: {
      aspect: 2.4,
      angle: 0,
      lobes: 4,
      phase: 0.9,
      amp: 0.3,
      voids: [{ from: [0.28, 0.05], to: [0.28, 0.05], width: 0.09 }],
    },
  },
  {
    id: 'backend',
    name: 'Back-end & Systems',
    mainColor: 'mainBlue',
    skills: ['typescript', 'node', 'performance', '.NET', 'DDD', 'SQL'],
    // Diagonally stretched, with one deep bay (lobes: 1, deep amp) scooping the
    // inner side into a boomerang/L rather than an oval, split by a river placed
    // off-anchor so the falling-back pass can route around it. Deliberately NOT
    // the tall one: this is the biggest mass and its anchor sits at 14.5°N, so a
    // north–south axis would be sawn off by the 60° cap.
    shape: {
      aspect: 1.45,
      angle: 0.8,
      lobes: 1,
      phase: 2.0,
      amp: 0.22,
      voids: [{ from: [-0.34, -0.14], to: [0.3, 0.18], width: 0.06 }],
    },
  },
  {
    id: 'graphics',
    name: 'Graphics & Motion',
    mainColor: 'paleAmber',
    skills: ['threejs', 'glsl', 'gsap'],
    // THE VERTICALLY LONG one. Its anchor sits at 14.5°S, so it has 45° of
    // southward room before the 60° cap — more than enough for a 1.6×
    // north–south stretch. Pinched twice (lobes: 2) into a crescent, with an
    // inland lake offset from the anchor so it survives growth.
    shape: {
      aspect: 1.6,
      angle: Math.PI / 2,
      lobes: 2,
      phase: 2.6,
      amp: 0.18,
      voids: [{ from: [0.1, -0.06], to: [0.1, -0.06], width: 0.075 }],
    },
  },
  {
    id: 'creative',
    name: 'Creative & Quality',
    mainColor: 'beige',
    skills: ['creative'],
    // The small one: five scalloped lobes, on the north-west diagonal so its
    // long axis is distinct from Front-end's east–west one (its anchor is at
    // 48.6°S, so it also has to keep clear of the 60° cap) — a star-shaped isle.
    // Too small for an interior cut to read as anything but damage.
    shape: {
      aspect: 1.25,
      angle: 2.59,
      lobes: 5,
      phase: 0.4,
      amp: 0.2,
      voids: [],
    },
  },
];

/**
 * The silhouette to build a continent with.
 *
 * Only four continents are authored above, so the derived fallback exists for
 * the fifth: it hashes the id into an aspect/angle/lobe/phase set rather than
 * defaulting to a plain circle. Adding a continent stays a one-entry edit
 * (FR-015) and still gets an outline of its own.
 */
export function continentShape(continent: Continent): ContinentShape {
  if (continent.shape) {
    return continent.shape;
  }
  let hash = 7;
  for (let i = 0; i < continent.id.length; i += 1) {
    hash = (hash * 131 + continent.id.charCodeAt(i)) >>> 0;
  }
  const rnd = (k: number): number => {
    const value = Math.sin(hash * 0.0001 * 12.9898 + k * 78.233) * 43758.5453;
    return value - Math.floor(value);
  };
  return {
    aspect: 0.8 + rnd(1) * 1.0,
    angle: rnd(2) * Math.PI * 2,
    lobes: 1 + Math.floor(rnd(3) * 6),
    phase: rnd(4) * Math.PI * 2,
    amp: 0.1 + rnd(5) * 0.18,
    voids: [],
  };
}

/** Continent owning a skill, or null when the skill is not a member of any. */
export function continentForSkill(skillId: string): Continent | null {
  return CONTINENTS.find((continent) => continent.skills.includes(skillId)) ?? null;
}

/** Total tile budget of a continent — the sum of its members' quotas. */
export function continentTileQuota(continent: Continent, skills: readonly SkillArea[]): number {
  return continent.skills.reduce((total, id) => {
    const skill = skills.find((entry) => entry.id === id);
    return total + (skill ? skillTileQuota(skill.expertise) : 0);
  }, 0);
}

/**
 * Fails fast on a malformed continent map rather than rendering an uncoloured
 * land. Throws on: a duplicate continent id, a duplicate skill id, a skill
 * listed in more than one continent, a member skill that does not exist, and a
 * mainColor that is not a palette entry.
 */
/**
 * Fail fast on a malformed silhouette. A typo in `shape` would otherwise just
 * mangle the outline at runtime — a NaN score silently empties the continent,
 * which is the same silent failure class as research D2.1.
 */
function validateShape(continent: Continent): void {
  const shape = continent.shape;
  if (!shape) {
    return;
  }
  const bad = (why: string): never => {
    throw new Error(`[mosy.dev] Continent "${continent.id}" has an invalid shape: ${why}.`);
  };
  const finite = (value: number): boolean => Number.isFinite(value);

  if (!finite(shape.aspect) || shape.aspect < 0.3 || shape.aspect > 3) {
    bad(`aspect must be 0.3–3, got ${shape.aspect}`);
  }
  if (!finite(shape.angle)) bad(`angle must be finite, got ${shape.angle}`);
  if (!Number.isInteger(shape.lobes) || shape.lobes < 1 || shape.lobes > 6) {
    bad(`lobes must be a whole number 1–6, got ${shape.lobes}`);
  }
  if (!finite(shape.phase)) bad(`phase must be finite, got ${shape.phase}`);
  if (!finite(shape.amp) || shape.amp < 0 || shape.amp > 0.4) {
    bad(`amp must be 0–0.4, got ${shape.amp}`);
  }

  for (const cut of shape.voids) {
    const ends = [cut.from, cut.to].flat();
    if (!ends.every(finite)) bad(`void endpoints must be finite, got ${JSON.stringify(ends)}`);
    if (!finite(cut.width) || cut.width <= 0 || cut.width > 0.25) {
      bad(`void width must be 0–0.25 radians, got ${cut.width}`);
    }
  }
}

export function validateContinents(skills: readonly SkillArea[]): void {
  const known = new Set(skills.map((skill) => skill.id));
  const seenContinents = new Set<string>();
  const seenSkills = new Map<string, ContinentId>();

  for (const continent of CONTINENTS) {
    if (seenContinents.has(continent.id)) {
      throw new Error(`[mosy.dev] Duplicate continent id "${continent.id}" in src/data/continents.ts.`);
    }
    seenContinents.add(continent.id);

    // Throws when the id is not a palette entry.
    paletteEntry(continent.mainColor);
    validateShape(continent);

    for (const skillId of continent.skills) {
      if (!known.has(skillId)) {
        throw new Error(
          `[mosy.dev] Continent "${continent.id}" lists unknown skill "${skillId}". Check src/data/skills.ts.`,
        );
      }
      const owner = seenSkills.get(skillId);
      if (owner !== undefined) {
        throw new Error(
          `[mosy.dev] Skill "${skillId}" is in both "${owner}" and "${continent.id}". A skill belongs to exactly one continent.`,
        );
      }
      seenSkills.set(skillId, continent.id);
    }
  }

  for (const skill of skills) {
    if (!seenSkills.has(skill.id)) {
      throw new Error(
        `[mosy.dev] Skill "${skill.id}" is not in any continent. Add it to one in src/data/continents.ts.`,
      );
    }
    if (skill.continentId && skill.continentId !== seenSkills.get(skill.id)) {
      throw new Error(
        `[mosy.dev] Skill "${skill.id}" declares continent "${skill.continentId}" but is listed under "${seenSkills.get(skill.id)}".`,
      );
    }
  }
}

/**
 * A skill's land colour: its continent's hue and saturation, with lightness
 * stepped by expertise rank so sibling skills stay distinguishable (FR-017).
 *
 * `LAND_COLOR.spread` (0.14) is a measured value, not a taste call — see
 * research.md D6. The ramp is clamped to the room actually available above and
 * below the base lightness, because very light bases (amber is L* 84.5) would
 * otherwise have most of their ramp swallowed by the clamp and collapse sibling
 * skills toward each other.
 */
export function skillColor(skill: SkillArea, continent: Continent): `#${string}` {
  // Rank siblings by expertise, strongest first, so the ramp is stable and each
  // member lands on its own step. Ranked from the skill data module directly —
  // no caller-registered global, because a missed registration would silently
  // collapse every sibling to the same flat colour (FR-017).
  const members = continent.skills
    .map((id) => SKILL_AREAS.find((entry) => entry.id === id))
    .filter((entry): entry is SkillArea => entry !== undefined)
    .sort((a, b) => b.expertise - a.expertise);

  const rank = members.findIndex((entry) => entry.id === skill.id);
  if (rank < 0) {
    return paletteEntry(continent.mainColor).hex;
  }

  const base = hexToHsl(paletteEntry(continent.mainColor).hex);
  if (members.length <= 1) {
    return hslToHex(base[0], base[1], base[2]);
  }

  const t = rank / (members.length - 1) - 0.5; // -0.5 .. +0.5
  const room = Math.max(
    0,
    Math.min(base[2] - LAND_COLOR.minLightness, LAND_COLOR.maxLightness - base[2]),
  );
  const step = t * 2 * Math.min(LAND_COLOR.spread, room);
  const lightness = Math.max(
    LAND_COLOR.minLightness,
    Math.min(LAND_COLOR.maxLightness, base[2] + step),
  );
  return hslToHex(base[0], base[1], lightness);
}