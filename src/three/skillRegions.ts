import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import {
  CONTINENTS,
  continentShape,
  continentTileQuota,
  skillColor,
  type Continent,
} from '../data/continents';
import { paletteEntry } from '../data/palette';
import { skillTileQuota, type SkillArea } from '../data/skills';
import { HEX, HIGHLIGHT, HOVER, LAND_COLOR, PLANET, REGIONS } from './config';
import { buildHexSphereGrid, type HexSphereGrid, type HexTile } from './hexGrid';
import { buildTileFan } from './tileFan';

export interface SkillIslandsBuild {
  /** One merged faceted mesh per skill with vertex colors. */
  readonly meshes: Mesh[];
  /** One representative direction per skill (its land's centroid). */
  readonly skillDirections: readonly Vector3[];
  /** Shared hex grid instance for polar caps and spatial alignment. */
  readonly grid: HexSphereGrid;
  /** Union of every tile id owned by any skill (for ocean exclusion). */
  readonly landTileIds: ReadonlySet<number>;
  dispose(): void;
}

function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

/** Evenly spread unit vectors — deterministic continent anchor placement.
 *  `phase` slides every vector around the Y axis, so the same count can yield
 *  a whole family of distinct layouts (used to search for a viable partition). */
function spread(count: number, phase = 0): Vector3[] {
  const out: Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i + phase;
    out.push(new Vector3(Math.cos(th) * r, y, Math.sin(th) * r).normalize());
  }
  return out;
}

function angularDistance(a: Vector3, b: Vector3): number {
  return Math.acos(Math.max(-1, Math.min(1, a.dot(b))));
}

/** Smooth low-frequency field shared by neighbouring tiles → organic coasts. */
function boundaryWarp(centroid: Vector3, anchor: Vector3): number {
  return (
    Math.sin(centroid.x * 3.1 + anchor.y * 2.7) +
    Math.sin(centroid.y * 4.3 + anchor.z * 3.3) +
    Math.sin(centroid.z * 3.7 + anchor.x * 2.1)
  ) / 3;
}

/** East/north axes lying flat on the sphere at an anchor. */
interface TangentFrame {
  readonly east: Vector3;
  readonly north: Vector3;
}

/**
 * A flat frame at `anchor`, so a silhouette can be authored in ordinary 2-D
 * coordinates instead of longitude/latitude. A shape's `angle` is measured from
 * `east` towards `north`, so `angle: π/2` is a north–south long axis.
 */
function tangentFrame(anchor: Vector3): TangentFrame {
  // Near a pole the world Y axis is nearly parallel to the anchor, so use Z.
  const up = Math.abs(anchor.y) > 0.9 ? new Vector3(0, 0, 1) : new Vector3(0, 1, 0);
  const north = up.clone().addScaledVector(anchor, -up.dot(anchor)).normalize();
  const east = new Vector3().crossVectors(north, anchor).normalize();
  return { east, north };
}

/** Distance from a point to a segment; a zero-length segment behaves as a point. */
function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Per-tile growth score and void mask for one continent.
 *
 * Score is a RADIUS from the anchor in the continent's own frame, scaled by
 * `aspect`, modulated by the lobes, then wobbled by coastal noise that is
 * PROPORTIONAL to the lobe depth — because the wobble is invisible next to
 * the radius on large continents (it is ~0.06 against a rim score of ~0.5),
 * so depth and wobble have to scale together to leave a mark on the outline.
 *
 * Two properties follow from the score being a radius at all:
 *
 *   - The sublevel set {score < t} is star-shaped around the anchor, so growing
 *     in score order from the anchor can never leave a detached piece — the
 *     silhouette stays connected however extreme the profile is.
 *   - Size is set by the quota, not the profile: a higher `aspect` shrinks the
 *     threshold to compensate, so stretching a continent changes its outline
 *     without changing how much land it owns.
 */
function continentMetrics(
  continent: Continent,
  anchor: Vector3,
  tiles: readonly HexTile[],
): { score: number[]; voided: boolean[] } {
  const shape = continentShape(continent);
  const frame = tangentFrame(anchor);
  const cosAngle = Math.cos(shape.angle);
  const sinAngle = Math.sin(shape.angle);
  const floor = Math.max(0.35, 1 - shape.amp);

  const projected = tiles.map((tile) => {
    const u = tile.center.dot(frame.east);
    const v = tile.center.dot(frame.north);
    return { p: u * cosAngle + v * sinAngle, q: -u * sinAngle + v * cosAngle };
  });

  const score = tiles.map((tile, index) => {
    const { p, q } = projected[index] as { p: number; q: number };
    const radius = Math.hypot(p / shape.aspect, q);
    const lobed = Math.max(
      floor,
      1 + shape.amp * Math.sin(shape.lobes * Math.atan2(q, p) + shape.phase),
    );
    return radius / lobed + REGIONS.borderNoise * boundaryWarp(tile.center, anchor);
  });

  const voided = projected.map(({ p, q }) =>
    shape.voids.some(
      (cut) =>
        distanceToSegment(p, q, cut.from[0], cut.from[1], cut.to[0], cut.to[1]) < cut.width / 2,
    ),
  );

  return { score, voided };
}

/**
 * Quota-driven continent growth (research D2), shaped by each continent's
 * silhouette profile.
 *
 * Each continent is seeded at ONE tile and then grows by claiming the lowest
 * scored unclaimed neighbour until it reaches its exact quota. Two properties
 * fall out of the construction rather than being filtered for afterwards:
 *
 *   - Connectivity: a tile can only be claimed if it touches one already owned
 *     by the same continent, so the result is always ONE connected mass (FR-016)
 *     and no flood-fill repair pass can ever be needed.
 *   - Separation: a tile adjacent to a different continent is refused outright,
 *     so distinct continents can never touch (FR-027).
 *
 * Voids (lakes, rivers) are cut DURING growth rather than punched out afterwards,
 * because a post-hoc punch would drop tiles the quota already promised and could
 * sever the mass. Growth simply skips them and reaches around. If a cut happens
 * to wall off part of the continent the growth stalls short of its quota, which
 * is detected below and rebuilt without the cuts.
 *
 * The seeding step is NOT optional. An earlier prototype omitted it and every
 * continent returned zero tiles: with an empty bucket the "must touch an owned
 * tile" rule can never fire. It type-checks and renders as a plausible, empty
 * globe, so the failure is silent — see research.md D2.1.
 */
function allocateContinents(
  skills: readonly SkillArea[],
  grid: HexSphereGrid,
): { owner: Map<number, number>; anchors: Vector3[] } {
  const tiles = grid.tiles;
  const anchors = spread(CONTINENTS.length);
  const owner = new Map<number, number>();

  const latOk = (tileId: number): boolean => {
    const tile = tiles[tileId];
    return tile !== undefined && Math.abs(tile.latitude) < REGIONS.maxLandLat;
  };

  const foreignAdjacent = (tileId: number, self: number): boolean => {
    const tile = tiles[tileId];
    if (!tile) {
      return false;
    }
    return tile.neighborIds.some((n) => {
      const other = owner.get(n);
      return other !== undefined && other !== self;
    });
  };

  // Silhouettes depend only on the anchor, so score every tile once up front —
  // the growth loop below reads these on every pass.
  const metrics = CONTINENTS.map((continent, index) =>
    continentMetrics(continent, anchors[index] as Vector3, tiles),
  );

  // SEED FIRST — mandatory, see the note above.
  CONTINENTS.forEach((continent, index) => {
    const anchor = anchors[index] as Vector3;
    const voided = metrics[index]?.voided ?? [];
    const plantable = (tileId: number): boolean =>
      latOk(tileId) && !owner.has(tileId) && !voided[tileId];
    const nearest = grid.findNearestTileId(anchor);
    let seed = plantable(nearest) ? nearest : -1;
    if (seed < 0) {
      // The obvious seed is a lake, a river, or already taken. Fall back to the
      // closest plantable tile rather than skipping the seed — an unseeded
      // continent grows into nothing at all (research D2.1).
      seed =
        tiles
          .map((tile) => ({ id: tile.id, d: angularDistance(tile.center, anchor) }))
          .sort((a, b) => a.d - b.d)
          .find((entry) => plantable(entry.id))?.id ?? -1;
    }
    if (seed < 0) {
      console.warn(
        `[mosy.dev] continent "${continent.id}" could not be seeded (research D2.1); it will be empty.`,
      );
      return;
    }
    owner.set(seed, index);
  });

  CONTINENTS.forEach((continent, index) => {
    const target = continentTileQuota(continent, skills);
    const voided = metrics[index]?.voided ?? [];
    const score = metrics[index]?.score ?? [];

    /**
     * Grow this continent to `target` tiles. Returns only the tiles it added,
     * so a failed attempt can be undone exactly and retried.
     */
    const grow = (ignoreVoids: boolean): number[] => {
      const added: number[] = [];
      const owned = new Set<number>();
      for (const [tileId, ownerIndex] of owner) {
        if (ownerIndex === index) {
          owned.add(tileId);
        }
      }
      if (owned.size === 0) {
        return added;
      }

      let grew = true;
      let guard = 0;
      // ONE tile per pass, never the whole frontier. Claiming the entire
      // frontier (which is what this loop used to do) makes the outline a
      // plain hex ring around the seed: every frontier tile gets taken
      // regardless of score, so `aspect`, the lobes and the coastline noise
      // were all dead code and every continent came out a circle. Taking only
      // the best-scored frontier tile makes the region follow the score
      // ordering — which is the whole point of the shape profile.
      const maxPasses = target + 8;
      while (owned.size < target && grew && guard < maxPasses) {
        guard += 1;
        grew = false;

        let best = -1;
        let bestScore = Number.POSITIVE_INFINITY;
        for (const tile of tiles) {
          if (owned.has(tile.id) || owner.has(tile.id)) continue;
          if (!latOk(tile.id)) continue;
          if (foreignAdjacent(tile.id, index)) continue;
          if (!ignoreVoids && voided[tile.id]) continue;
          // connectivity: must touch the continent we are growing
          let touches = false;
          for (const n of tile.neighborIds) {
            if (owned.has(n)) {
              touches = true;
              break;
            }
          }
          if (!touches) continue;

          const s = score[tile.id];
          if (s !== undefined && s < bestScore) {
            bestScore = s;
            best = tile.id;
          }
        }

        if (best < 0) {
          break;
        }
        owned.add(best);
        owner.set(best, index);
        added.push(best);
        grew = true;
      }
      return added;
    };

    const added = grow(false);
    if (1 + added.length >= target) {
      return;
    }

    // A lake or river walled off part of the continent, so growth stalled below
    // the quota. Undo and rebuild without the cuts: the outline keeps its
    // aspect/lobes, only the interior detail is dropped.
    for (const tileId of added) {
      owner.delete(tileId);
    }
    const retried = grow(true);
    if (1 + retried.length < target) {
      console.warn(
        `[mosy.dev] continent "${continent.id}" reached ${1 + retried.length} of ${target} tiles; ` +
          `its quota is short (FR-016/FR-022). Its shape profile is probably too aggressive.`,
      );
    }
  });

  return { owner, anchors };
}

/**
 * Split each continent's tiles among its member skills (research D4).
 *
 * Members grow strictly in sequence, largest quota first. Each one seeds at the
 * still-free tile nearest its own direction, then claims the first `quota`
 * entries of a breadth-first sweep through what is left of the continent.
 *
 * Two guarantees come out of that construction rather than out of a cleanup
 * pass afterwards:
 *
 *   - Exact counts (FR-022): members are handed their quota one at a time and
 *     quotas sum to the continent's size, so the last member's quota is exactly
 *     what remains. Nothing is ever stranded, so no leftover has to be dumped on
 *     a neighbour — which is what previously broke the counts.
 *   - Connectivity (FR-016): a BFS prefix is connected by construction, because
 *     every tile in it has a neighbour one level closer to the seed, and that
 *     neighbour is in the prefix too. Picking the N tiles *nearest* a seed has
 *     no such property, and hands a skill two disjoint patches whenever the
 *     continent bulges around them.
 *
 * Sequential growth has one failure mode: the last member inherits whatever
 * shape is left. Which member grows first, which direction each seeds toward,
 * and how far apart those seeds sit all decide whether the leftover comes out in
 * one piece — so those three knobs are searched rather than guessed, and the
 * first attempt in which every land is connected wins. The search is
 * deterministic, so the globe is stable across reloads; if nothing works the
 * code says so rather than silently rendering a land in two pieces.
 */
function partitionBySkill(
  skills: readonly SkillArea[],
  grid: HexSphereGrid,
  owner: Map<number, number>,
  anchors: Vector3[],
): Map<number, number> {
  const tiles = grid.tiles;
  const skillOwner = new Map<number, number>();

  CONTINENTS.forEach((continent, continentIndex) => {
    const pool = new Set<number>();
    for (const [tileId, ownerIndex] of owner) {
      if (ownerIndex === continentIndex) {
        pool.add(tileId);
      }
    }

    if (pool.size === 0) {
      return;
    }

    const members = continent.skills
      .map((id) => skills.findIndex((skill) => skill.id === id))
      .filter((index) => index >= 0)
      .sort((a, b) => {
        const qa = skillTileQuota((skills[a] as SkillArea).expertise);
        const qb = skillTileQuota((skills[b] as SkillArea).expertise);
        return qb - qa;
      });
    if (members.length === 0) {
      return;
    }

    /** The still-free tile nearest `position`'s direction. */
    const pickSeed = (
      claims: Map<number, number>,
      position: number,
      offsets: readonly Vector3[],
      multiplier: number,
    ): number => {
      const seedDir = (anchors[continentIndex] as Vector3)
        .clone()
        .add((offsets[position] as Vector3).clone().multiplyScalar(multiplier))
        .normalize();
      let best = -1;
      let bestScore = Infinity;
      for (const tileId of pool) {
        if (claims.has(tileId)) continue;
        const tile = tiles[tileId];
        if (!tile) continue;
        const score = angularDistance(tile.center, seedDir);
        if (score < bestScore) {
          bestScore = score;
          best = tileId;
        }
      }
      return best;
    };

    /**
     * Every still-free tile reachable from `seed`, in breadth-first order.
     *
     * A BFS PREFIX IS CONNECTED BY CONSTRUCTION: each tile in it has a
     * neighbour one level closer to the seed, and that neighbour is in the
     * prefix too, so every tile chains back to the seed. Taking the first
     * `quota` entries therefore yields a connected land of exactly `quota`
     * tiles — FR-016 and FR-022 satisfied in the same step.
     */
    const bfsOrder = (claims: Map<number, number>, seed: number): number[] => {
      const visited = new Set<number>([seed]);
      const queue: number[] = [seed];
      const out: number[] = [seed];
      for (let head = 0; head < queue.length; head++) {
        const tile = tiles[queue[head] as number];
        if (!tile) continue;
        for (const n of tile.neighborIds) {
          if (!pool.has(n) || claims.has(n) || visited.has(n)) continue;
          visited.add(n);
          queue.push(n);
          out.push(n);
        }
      }
      return out;
    };

    /**
     * One partition attempt: grow the members in `order`, largest first, each
     * claiming exactly its quota out of what is still free.
     *
     * Growing strictly in sequence is what keeps the counts exact — the last
     * member's quota IS whatever is left, so nothing is ever stranded. (Growing
     * all siblings at once let a sibling end up sealed with tiles still owed,
     * and the leftovers had to be dumped on a neighbour, breaking FR-022.)
     */
    const runPartition = (
      order: readonly number[],
      phase: number,
      multiplier: number,
    ): Map<number, number> => {
      const offsets = spread(order.length, phase);
      const claims = new Map<number, number>();
      order.forEach((skillIndex, position) => {
        const quota = skillTileQuota((skills[skillIndex] as SkillArea).expertise);
        const seed = pickSeed(claims, position, offsets, multiplier);
        if (seed < 0) {
          // Unseeded growth returns nothing at all, silently — research D2.1.
          return;
        }
        const reached = bfsOrder(claims, seed);
        if (reached.length < quota) {
          // The seed's own region ran out; sweep the other free regions too.
          const seen = new Set(reached);
          for (const tileId of pool) {
            if (claims.has(tileId) || seen.has(tileId)) continue;
            for (const t of bfsOrder(claims, tileId)) {
              if (!seen.has(t)) {
                seen.add(t);
                reached.push(t);
              }
            }
          }
        }
        for (const tileId of reached.slice(0, quota)) {
          claims.set(tileId, skillIndex);
        }
      });
      return claims;
    };

    /** Can this skill reach all of its own tiles from one of them? */
    const skillIsConnected = (claims: Map<number, number>, skillIndex: number): boolean => {
      const own: number[] = [];
      for (const [tileId, ownerIndex] of claims) {
        if (ownerIndex === skillIndex) own.push(tileId);
      }
      const start = own[0];
      if (start === undefined) return false;
      const mine = new Set(own);
      const seen = new Set<number>([start]);
      const stack = [start];
      while (stack.length) {
        const tile = tiles[stack.pop() as number];
        if (!tile) continue;
        for (const n of tile.neighborIds) {
          if (mine.has(n) && !seen.has(n)) {
            seen.add(n);
            stack.push(n);
          }
        }
      }
      return seen.size === mine.size;
    };

    // Sequential growth has one unavoidable failure mode: the last member
    // inherits whatever is left, and a badly shaped earlier member can leave
    // that remainder in two pieces. Three knobs decide the outcome — which
    // member grows first, which direction each seeds toward (the `phase` that
    // slides the offset ring around), and how far apart those seeds sit. All
    // three are searched in a fixed order, and the first attempt where every
    // land is connected wins, so the globe is stable across reloads.
    const descending = [...members];
    const ascending = [...members].reverse();
    const PHASES = 6;
    const MULTIPLIERS = [0.35, 0.6, 0.85];
    const orders: number[][] = [];
    for (let r = 0; r < descending.length; r += 1) {
      orders.push([...descending.slice(r), ...descending.slice(0, r)]);
      orders.push([...ascending.slice(r), ...ascending.slice(0, r)]);
    }

    let chosen: Map<number, number> | null = null;
    let solved = false;
    for (const multiplier of MULTIPLIERS) {
      for (let p = 0; p < PHASES && !solved; p += 1) {
        const phase = (p * Math.PI * 2) / PHASES;
        for (const order of orders) {
          const claims = runPartition(order, phase, multiplier);
          if (claims.size !== pool.size) continue;
          if (order.every((skillIndex) => skillIsConnected(claims, skillIndex))) {
            chosen = claims;
            solved = true;
            break;
          }
          chosen ??= claims;
        }
      }
      if (solved) break;
    }

    if (chosen !== null) {
      for (const [tileId, skillIndex] of chosen) {
        skillOwner.set(tileId, skillIndex);
      }
    }
    if (!solved) {
      console.warn(
        `[mosy.dev] continent "${continent.id}": no growth order gave every skill one connected ` +
          `land (FR-016). The counts are exact, but at least one land is in more than one piece.`,
      );
    }
  });

  void grid;
  return skillOwner;
}

export function buildSkillIslands(skills: readonly SkillArea[]): SkillIslandsBuild {
  const grid = buildHexSphereGrid(HEX.detail);
  const tiles = grid.tiles;
  const { owner, anchors } = allocateContinents(skills, grid);
  const skillOwner = partitionBySkill(skills, grid, owner, anchors);

  // Bucket tiles per skill, preserving a stable order for reproducibility.
  const buckets: number[][] = skills.map(() => []);
  for (const tile of tiles) {
    const skillIndex = skillOwner.get(tile.id);
    if (skillIndex !== undefined) {
      buckets[skillIndex]?.push(tile.id);
    }
  }

  const landTileIds = new Set<number>(owner.keys());
  const meshes: Mesh[] = [];
  const skillDirections: Vector3[] = [];

  skills.forEach((skill, skillIndex) => {
    const tileIds = buckets[skillIndex] ?? [];
    if (tileIds.length === 0) {
      return;
    }
    const continent = CONTINENTS.find((entry) => entry.skills.includes(skill.id));
    const baseColor = continent ? skillColor(skill, continent) : paletteEntry('mintCream').hex;
    const tileColor = new Color();

    // US3 / research D4: close-tint hover sibling — same hue family, lightness
    // lifted slightly. Stored per land so Planet.setHighlighted tweens the
    // emissive to a "bolder, not brighter" tint on hover.
    const baseHsl = { h: 0, s: 0, l: 0 };
    new Color(baseColor).getHSL(baseHsl);
    const hoverTint = new Color().setHSL(
      baseHsl.h,
      baseHsl.s,
      Math.min(0.98, baseHsl.l + HOVER.tintLightnessLift),
    );

    // Per-skill representative direction = centroid of its tiles, so the scroll
    // tour still faces every land.
    const centroid = new Vector3();
    for (const tileId of tileIds) {
      const tile = tiles[tileId];
      if (tile) {
        centroid.add(tile.center);
      }
    }
    centroid.normalize();
    skillDirections.push(centroid.clone());

    const fan = buildTileFan(tiles, tileIds, PLANET.radius, (tile) => {
      // Deterministic per-tile shade variation keeps hex tiles countable
      // (feature 002 INV-05), applied as a small lightness offset.
      const jitter = (pseudoRandom(tile.id * 13 + 47) - 0.5) * 2 * HEX.shadeJitter;
      const jittered = new Color(baseColor);
      const hsl = { h: 0, s: 0, l: 0 };
      jittered.getHSL(hsl);
      const l = Math.max(
        LAND_COLOR.minLightness,
        Math.min(LAND_COLOR.maxLightness, hsl.l + jitter),
      );
      return tileColor.setHSL(hsl.h, hsl.s, l).clone();
    });

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(fan.positions, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(fan.normals, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(fan.colors, 3));

    const emissive = new Color(baseColor);

    const material = new MeshStandardMaterial({
      vertexColors: true,
      // Both sides render, so lands on the far hemisphere are visible THROUGH
      // the translucent near-side ocean (the glass-globe read). The ocean keeps
      // FrontSide, so we never see the sea's own interior/far tiles.
      side: DoubleSide,
      emissive,
      emissiveIntensity: HIGHLIGHT.base,
      roughness: 0.55,
      metalness: 0.2,
      flatShading: true,
    });

    const mesh = new Mesh(geometry, material);
    mesh.userData = {
      skillId: skill.id,
      skillName: skill.name,
      continentId: continent?.id ?? '',
      continentName: continent?.name ?? '',
      skillColor: baseColor,
      // US3 (D4 close-tint) / US4 (D3 radial lift + label anchor direction).
      hoverTint: hoverTint.getHex(),
      radialDir: centroid.clone(),
    };
    meshes.push(mesh);
  });

  return {
    meshes,
    skillDirections,
    grid,
    landTileIds,
    dispose() {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        (mesh.material as MeshStandardMaterial).dispose();
      }
    },
  };
}
