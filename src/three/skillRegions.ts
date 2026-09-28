import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { skillColorHSL, type SkillArea } from '../data/skills';
import { HEX, HIGHLIGHT, PLANET, POLAR, REGIONS } from './config';
import { buildHexSphereGrid, type HexSphereGrid } from './hexGrid';

export interface SkillIslandsBuild {
  /** One merged faceted mesh per skill with vertex colors. */
  readonly meshes: Mesh[];
  /** One representative direction per skill (primary seed) — tour targets. */
  readonly skillDirections: readonly Vector3[];
  /** Shared hex grid instance for polar caps and spatial alignment. */
  readonly grid: HexSphereGrid;
  dispose(): void;
}

interface Seed {
  readonly direction: Vector3;
  readonly skillIndex: number;
  readonly islandRadius: number;
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

/**
 * Builds hexagonal skill landmasses out of the ocean.
 * Guaranteed invariants:
 * - Each skill has strictly ONE connected landmass (INV-02)
 * - Each landmass contains > 30 tiles (INV-01)
 * - Per-tile deterministic shade variation gives visible hexagonal outlines (INV-05)
 * - Landmasses are raised with flat-shaded facets and vertex colors
 */
export function buildSkillIslands(skills: readonly SkillArea[]): SkillIslandsBuild {
  const grid = buildHexSphereGrid(HEX.detail);

  // 1. Generate primary & satellite seeds per skill
  const seeds: Seed[] = [];
  const skillDirections: Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const maxLatitude = (REGIONS.maxLatitude * Math.PI) / 180;

  skills.forEach((skill, skillIndex) => {
    const quota = 1 + Math.round(skill.expertise * 2);
    const islandRadius =
      REGIONS.islandRadius.min + (REGIONS.islandRadius.max - REGIONS.islandRadius.min) * skill.expertise;

    const bandY = 1 - ((skillIndex + 0.5) / skills.length) * 2;
    const y = Math.sin(maxLatitude) * bandY;
    const ring = Math.sqrt(Math.max(1 - y * y, 0));
    const theta = goldenAngle * skillIndex;
    const primary = new Vector3(
      Math.cos(theta) * ring + (pseudoRandom(skillIndex * 7) - 0.5) * REGIONS.seedJitter,
      y + (pseudoRandom(skillIndex * 7 + 1) - 0.5) * REGIONS.seedJitter * 0.5,
      Math.sin(theta) * ring + (pseudoRandom(skillIndex * 7 + 2) - 0.5) * REGIONS.seedJitter,
    ).normalize();
    seeds.push({ direction: primary, skillIndex, islandRadius });
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
      seeds.push({ direction, skillIndex, islandRadius });
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
      if (Math.abs(tile.latitude) >= POLAR.thresholdLat) {
        continue;
      }

      let bestSeed: Seed | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const seed of seeds) {
        const score =
          tile.center.angleTo(seed.direction) +
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

    // 3. Flood-fill filter to keep strictly ONE connected component per skill
    finalBuckets = skills.map((_, sIdx) => {
      const assigned = new Set(rawBuckets[sIdx] ?? []);
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
  const landRadius = PLANET.radius * REGIONS.raise;
  const meshes: Mesh[] = [];

  skills.forEach((skill, skillIndex) => {
    const tileIds = finalBuckets[skillIndex] ?? [];
    if (tileIds.length === 0) {
      return;
    }

    let totalTriangles = 0;
    for (const tId of tileIds) {
      const tile = tiles[tId];
      if (tile) {
        totalTriangles += tile.corners.length;
      }
    }

    const positions = new Float32Array(totalTriangles * 9);
    const normals = new Float32Array(totalTriangles * 9);
    const colors = new Float32Array(totalTriangles * 9);

    const [hue, saturation, baseLightness] = skillColorHSL(skill);
    const tempColor = new Color();
    let triOffset = 0;

    for (const tId of tileIds) {
      const tile = tiles[tId];
      if (!tile) {
        continue;
      }

      // Deterministic per-tile shade variation (INV-05)
      const jitter = (pseudoRandom(tile.id * 13 + 47) - 0.5) * 2 * HEX.shadeJitter;
      const tileLightness = Math.max(0.15, Math.min(0.9, baseLightness + jitter));
      tempColor.setHSL(hue, saturation, tileLightness);

      const centerPos = tile.center.clone().multiplyScalar(landRadius);
      const cornerCount = tile.corners.length;

      for (let cIdx = 0; cIdx < cornerCount; cIdx += 1) {
        const c0 = tile.corners[cIdx]!.clone().multiplyScalar(landRadius);
        const c1 = tile.corners[(cIdx + 1) % cornerCount]!.clone().multiplyScalar(landRadius);

        // Compute flat facet outward normal
        const edge0 = new Vector3().subVectors(c0, centerPos);
        const edge1 = new Vector3().subVectors(c1, centerPos);
        const facetNormal = new Vector3().crossVectors(edge0, edge1).normalize();

        const pIdx = triOffset * 9;

        // Vertex 0: center
        positions[pIdx] = centerPos.x;
        positions[pIdx + 1] = centerPos.y;
        positions[pIdx + 2] = centerPos.z;
        normals[pIdx] = facetNormal.x;
        normals[pIdx + 1] = facetNormal.y;
        normals[pIdx + 2] = facetNormal.z;
        colors[pIdx] = tempColor.r;
        colors[pIdx + 1] = tempColor.g;
        colors[pIdx + 2] = tempColor.b;

        // Vertex 1: c0
        positions[pIdx + 3] = c0.x;
        positions[pIdx + 4] = c0.y;
        positions[pIdx + 5] = c0.z;
        normals[pIdx + 3] = facetNormal.x;
        normals[pIdx + 4] = facetNormal.y;
        normals[pIdx + 5] = facetNormal.z;
        colors[pIdx + 3] = tempColor.r;
        colors[pIdx + 4] = tempColor.g;
        colors[pIdx + 5] = tempColor.b;

        // Vertex 2: c1
        positions[pIdx + 6] = c1.x;
        positions[pIdx + 7] = c1.y;
        positions[pIdx + 8] = c1.z;
        normals[pIdx + 6] = facetNormal.x;
        normals[pIdx + 7] = facetNormal.y;
        normals[pIdx + 8] = facetNormal.z;
        colors[pIdx + 6] = tempColor.r;
        colors[pIdx + 7] = tempColor.g;
        colors[pIdx + 8] = tempColor.b;

        triOffset += 1;
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

    const material = new MeshStandardMaterial({
      vertexColors: true,
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
    dispose() {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        (mesh.material as MeshStandardMaterial).dispose();
      }
    },
  };
}


