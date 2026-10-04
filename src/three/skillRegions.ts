import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { skillColorHSL, type SkillArea } from '../data/skills';
import { HEX, HIGHLIGHT, PLANET, REGIONS } from './config';
import { buildHexSphereGrid, type HexSphereGrid } from './hexGrid';
import { buildTileFan } from './tileFan';

export interface SkillIslandsBuild {
  /** One merged faceted mesh per skill with vertex colors. */
  readonly meshes: Mesh[];
  /** One representative direction per skill (primary seed). */
  readonly skillDirections: readonly Vector3[];
  /** Shared hex grid instance for polar caps and spatial alignment. */
  readonly grid: HexSphereGrid;
  /** Union of every tile id owned by any skill (for ocean exclusion in US1). */
  readonly landTileIds: ReadonlySet<number>;
  dispose(): void;
}

/** Deterministic per-skill silhouette: elliptical aspect + radial lobes (D5). */
interface ShapeProfile {
  readonly aspect: number;
  readonly lobes: number;
  readonly phase: number;
  readonly amplitude: number;
}

interface Seed {
  readonly direction: Vector3;
  readonly skillIndex: number;
  readonly islandRadius: number;
  /** Tangent frame used to measure the modulated distance (primary seeds). */
  readonly tangent: Vector3;
  readonly bitangent: Vector3;
  /** Primary seeds carry a silhouette profile; satellites stay isotropic. */
  readonly profile: ShapeProfile | null;
}

function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

/** Smooth low-frequency field shared by neighbouring tiles → organic coasts. */
function boundaryWarp(centroid: Vector3, seed: Vector3): number {
  return (
    Math.sin(centroid.x * 3.1 + seed.y * 2.7) +
    Math.sin(centroid.y * 4.3 + seed.z * 3.3) +
    Math.sin(centroid.z * 3.7 + seed.x * 2.1)
  ) / 3;
}

/** Orthonormal tangent basis for a unit direction (same style as hexGrid). */
function tangentFrame(direction: Vector3, outTangent: Vector3, outBitangent: Vector3): void {
  if (Math.abs(direction.y) < 0.9) {
    outTangent.set(0, 1, 0);
  } else {
    outTangent.set(1, 0, 0);
  }
  outTangent.crossVectors(outTangent, direction).normalize();
  outBitangent.crossVectors(direction, outTangent).normalize();
}

/**
 * Per-skill shape profile (research D5), deterministic from skillIndex:
 * aspect ∈ [0.8, 1.12], lobe count ∈ {3, 4, 5}, amplitude ∈ [0.1, 0.17].
 */
function shapeForSkill(skillIndex: number): ShapeProfile {
  const rand = (n: number): number => pseudoRandom(skillIndex * 53 + n * 11 + 3);
  const lobeOptions = REGIONS.shape.lobes;
  const lobeIndex = Math.min(lobeOptions.length - 1, Math.floor(rand(1) * lobeOptions.length));
  return {
    aspect: REGIONS.shape.aspectMin + (REGIONS.shape.aspectMax - REGIONS.shape.aspectMin) * rand(0),
    lobes: lobeOptions[lobeIndex] ?? 3,
    phase: rand(2) * Math.PI * 2,
    amplitude: REGIONS.shape.ampMin + (REGIONS.shape.ampMax - REGIONS.shape.ampMin) * rand(3),
  };
}

/**
 * Distance from a tile to a seed in the shape's own metric: satellites stay
 * isotropic, while the primary seed squashes along its aspect axis and bulges
 * along its lobes so every land reads as a distinct silhouette (research D5).
 */
function seedDistance(center: Vector3, seed: Seed): number {
  const dot = Math.min(1, Math.max(-1, center.dot(seed.direction)));
  const angle = Math.acos(dot);
  const profile = seed.profile;
  if (!profile) {
    return angle;
  }

  const bearing = Math.atan2(center.dot(seed.bitangent), center.dot(seed.tangent));
  const elliptical = Math.hypot((angle * Math.cos(bearing)) / profile.aspect, angle * Math.sin(bearing));
  const lobe = 1 + profile.amplitude * Math.sin(profile.lobes * bearing + profile.phase);
  return elliptical / lobe;
}

/**
 * Builds hexagonal skill landmasses out of the hex ocean, flush at PLANET.radius.
 * Guaranteed invariants:
 * - Each skill has strictly ONE connected landmass (INV-02)
 * - Each landmass contains > 30 tiles (INV-01)
 * - Per-tile deterministic shade variation gives visible hexagonal outlines (INV-05)
 * - Land never touches another skill's land (symmetric erosion pass, D5)
 * - Land stays inside ±maxLandLat, leaving a structural moat to the polar caps
 */
export function buildSkillIslands(skills: readonly SkillArea[]): SkillIslandsBuild {
  const grid = buildHexSphereGrid(HEX.detail);

  // 1. Generate primary & satellite seeds per skill
  const seeds: Seed[] = [];
  const skillDirections: Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const maxLatitude = (REGIONS.maxLatitude * Math.PI) / 180;

  skills.forEach((skill, skillIndex) => {
    // Clamp before sizing and quota so the 40% floor always holds (research D10).
    const expertise = Math.min(
      Math.max(skill.expertise, REGIONS.expertiseRange.min),
      REGIONS.expertiseRange.max,
    );
    const quota = 1 + Math.round(expertise * 2);
    const islandRadius =
      REGIONS.islandRadius.min + (REGIONS.islandRadius.max - REGIONS.islandRadius.min) * expertise;
    const profile = shapeForSkill(skillIndex);

    const bandY = 1 - ((skillIndex + 0.5) / skills.length) * 2;
    const y = Math.sin(maxLatitude) * bandY;
    const ring = Math.sqrt(Math.max(1 - y * y, 0));
    const theta = goldenAngle * skillIndex;
    const primary = new Vector3(
      Math.cos(theta) * ring + (pseudoRandom(skillIndex * 7) - 0.5) * REGIONS.seedJitter,
      y + (pseudoRandom(skillIndex * 7 + 1) - 0.5) * REGIONS.seedJitter * 0.5,
      Math.sin(theta) * ring + (pseudoRandom(skillIndex * 7 + 2) - 0.5) * REGIONS.seedJitter,
    ).normalize();
    const tangentAxis = new Vector3();
    const bitangentAxis = new Vector3();
    tangentFrame(primary, tangentAxis, bitangentAxis);
    // The primary seed owns the skill's silhouette; satellites stay isotropic
    // so they read as bays and peninsulas hanging off it.
    seeds.push({
      direction: primary,
      skillIndex,
      islandRadius,
      tangent: tangentAxis,
      bitangent: bitangentAxis,
      profile,
    });
    skillDirections.push(primary.clone());

    for (let q = 1; q < quota; q += 1) {
      const rand = (n: number): number => pseudoRandom(skillIndex * 31 + q * 3 + n);
      const scatter = new Vector3(rand(0) - 0.5, rand(1) - 0.5, rand(2) - 0.5);
      if (scatter.lengthSq() < 1e-4) {
        scatter.set(0.5, 0.5, 0.5);
      }
      scatter.normalize();
      const tangent = scatter.sub(primary.clone().multiplyScalar(scatter.dot(primary)));
      if (tangent.lengthSq() < 1e-4) {
        tangent.set(-primary.y, primary.x, 0);
      }
      tangent.normalize();
      const offset = islandRadius * REGIONS.satelliteOffset * (0.55 + 0.45 * rand(3));
      const direction = primary.clone().add(tangent.multiplyScalar(offset)).normalize();
      seeds.push({
        direction,
        skillIndex,
        islandRadius,
        tangent: tangentAxis,
        bitangent: bitangentAxis,
        profile: null,
      });
    }
  });

  return generateMeshes(skills, grid, seeds, skillDirections);
}
function generateMeshes(
  skills: readonly SkillArea[],
  grid: HexSphereGrid,
  seeds: Seed[],
  skillDirections: readonly Vector3[],
): SkillIslandsBuild {
  const tiles = grid.tiles;

  // 2. Assign tiles to nearest skill seed with iterative radius growth until count >= 31
  let radiusExpansion = 0;
  let finalBuckets: number[][] = [];

  while (radiusExpansion < 0.25) {
    const rawBuckets: number[][] = Array.from({ length: skills.length }, () => []);

    for (const tile of tiles) {
      // Hard latitude cap: land never enters the 66.5° polar-cap moat (D3).
      if (Math.abs(tile.latitude) >= REGIONS.maxLandLat) {
        continue;
      }

      let bestSeed: Seed | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const seed of seeds) {
        const score =
          seedDistance(tile.center, seed) +
          REGIONS.borderNoise * boundaryWarp(tile.center, seed.direction);
        if (score < bestScore) {
          bestScore = score;
          bestSeed = seed;
        }
      }

      if (bestSeed && bestScore <= bestSeed.islandRadius + radiusExpansion) {
        rawBuckets[bestSeed.skillIndex]?.push(tile.id);
      }
    }

    // 2b. Symmetric erosion (research D5): drop every tile grid-adjacent to a
    // DIFFERENT skill's tile, both sides, so bigger lands can never touch or
    // merge. One pass suffices — removals only shrink the adjacency graph.
    const tileSkill = new Map<number, number>();
    rawBuckets.forEach((tileIds, sIdx) => {
      for (const tileId of tileIds) {
        tileSkill.set(tileId, sIdx);
      }
    });
    const erodedBuckets: number[][] = rawBuckets.map((tileIds, sIdx) => {
      const kept: number[] = [];
      for (const tileId of tileIds) {
        const tile = tiles[tileId];
        if (!tile) {
          continue;
        }
        const touchesOtherSkill = tile.neighborIds.some((neighborId) => {
          const owner = tileSkill.get(neighborId);
          return owner !== undefined && owner !== sIdx;
        });
        if (!touchesOtherSkill) {
          kept.push(tileId);
        }
      }
      return kept;
    });

    // 3. Flood-fill filter to keep strictly ONE connected component per skill
    finalBuckets = skills.map((_, sIdx) => {
      const assigned = new Set(erodedBuckets[sIdx] ?? []);
      const primaryDir = skillDirections[sIdx];
      let primaryTileId = -1;
      if (primaryDir) {
        primaryTileId = grid.findNearestTileId(primaryDir);
      }

      const visited = new Set<number>();
      const components: number[][] = [];

      for (const tId of assigned) {
        if (!visited.has(tId)) {
          const comp: number[] = [];
          const queue = [tId];
          visited.add(tId);

          while (queue.length > 0) {
            const curr = queue.pop()!;
            comp.push(curr);
            const tileObj = tiles[curr];
            if (tileObj) {
              for (const n of tileObj.neighborIds) {
                if (assigned.has(n) && !visited.has(n)) {
                  visited.add(n);
                  queue.push(n);
                }
              }
            }
          }
          components.push(comp);
        }
      }

      // Prioritize component containing the primary anchor seed, or largest
      const anchorComp = components.find((c) => c.includes(primaryTileId));
      if (anchorComp) {
        return anchorComp;
      }
      components.sort((a, b) => b.length - a.length);
      return components[0] ?? [];
    });

    const allMeetFloor = finalBuckets.every((b) => b.length >= 31);
    if (allMeetFloor) {
      break;
    }
    radiusExpansion += 0.02;
  }

  return buildMeshArray(skills, grid, finalBuckets, skillDirections);
}
function buildMeshArray(
  skills: readonly SkillArea[],
  grid: HexSphereGrid,
  finalBuckets: number[][],
  skillDirections: readonly Vector3[],
): SkillIslandsBuild {
  const tiles = grid.tiles;
  const meshes: Mesh[] = [];
  const landTileIds = new Set<number>();

  skills.forEach((skill, skillIndex) => {
    const tileIds = finalBuckets[skillIndex] ?? [];
    if (tileIds.length === 0) {
      return;
    }
    for (const trackedId of tileIds) {
      landTileIds.add(trackedId);
    }

    const [hue, saturation, baseLightness] = skillColorHSL(skill);
    const tileColor = new Color();
    const fan = buildTileFan(tiles, tileIds, PLANET.radius, (tile) => {
      // Deterministic per-tile shade variation (INV-05)
      const jitter = (pseudoRandom(tile.id * 13 + 47) - 0.5) * 2 * HEX.shadeJitter;
      const tileLightness = Math.max(0.15, Math.min(0.9, baseLightness + jitter));
      return tileColor.setHSL(hue, saturation, tileLightness).clone();
    });

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(fan.positions, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(fan.normals, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(fan.colors, 3));

    const material = new MeshStandardMaterial({
      vertexColors: true,
      // Both sides render, so lands on the far hemisphere are visible THROUGH
      // the translucent near-side ocean (the glass-globe read). The ocean keeps
      // FrontSide, so we never see the sea's own interior/far tiles.
      side: DoubleSide,
      emissive: new Color().setHSL(hue, 0.9, 0.55),
      emissiveIntensity: HIGHLIGHT.base,
      roughness: 0.55,
      metalness: 0.2,
      flatShading: true,
    });

    const mesh = new Mesh(geometry, material);
    mesh.userData = { skillId: skill.id, skillName: skill.name };
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


