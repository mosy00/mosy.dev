import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { skillColorHSL, type SkillArea } from '../data/skills';
import { HIGHLIGHT, PLANET, REGIONS } from './config';

export interface SkillIslandsBuild {
  /** One merged smooth-shaded mesh per skill — its island(s) on the globe. */
  readonly meshes: Mesh[];
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

/** Smooth low-frequency field shared by neighbouring faces → organic coasts. */
function boundaryWarp(centroid: Vector3, seed: Vector3): number {
  return (
    Math.sin(centroid.x * 3.1 + seed.y * 2.7) +
    Math.sin(centroid.y * 4.3 + seed.z * 3.3) +
    Math.sin(centroid.z * 3.7 + seed.x * 2.1)
  ) / 3;
}

/**
 * Raises skill islands out of the ocean: a face of the icosphere becomes
 * land of a skill when its (noise-warped) distance to one of that skill's
 * seeds is inside the seed's island radius — everything else stays ocean.
 * Expertise buys radius (and 1–3 seeds), so expert skills form continents.
 */
export function buildSkillIslands(skills: readonly SkillArea[]): SkillIslandsBuild {
  const base = new IcosahedronGeometry(1, REGIONS.detail);
  const basePositions = base.getAttribute('position');
  const faceCount = Math.floor(basePositions.count / 3);

  // 1. Seeds: Fibonacci-distributed, jittered for asymmetry.
  const seeds: Seed[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const totalSeeds = skills.reduce((sum, skill) => sum + (1 + Math.round(skill.expertise * 2)), 0);
  let seedCounter = 0;
  skills.forEach((skill, skillIndex) => {
    const quota = 1 + Math.round(skill.expertise * 2);
    const islandRadius =
      REGIONS.islandRadius.min + (REGIONS.islandRadius.max - REGIONS.islandRadius.min) * skill.expertise;
    for (let q = 0; q < quota; q += 1) {
      const y = 1 - ((seedCounter + 0.5) / totalSeeds) * 2;
      const ring = Math.sqrt(Math.max(1 - y * y, 0));
      const theta = goldenAngle * seedCounter;
      const direction = new Vector3(
        Math.cos(theta) * ring + (pseudoRandom(seedCounter * 3) - 0.5) * REGIONS.seedJitter,
        y + (pseudoRandom(seedCounter * 3 + 1) - 0.5) * REGIONS.seedJitter,
        Math.sin(theta) * ring + (pseudoRandom(seedCounter * 3 + 2) - 0.5) * REGIONS.seedJitter,
      ).normalize();
      seeds.push({ direction, skillIndex, islandRadius });
      seedCounter += 1;
    }
  });

  // 2. Faces inside a (noise-warped) island radius become that skill's land.
  const buckets: number[][] = Array.from({ length: skills.length }, () => []);
  const centroid = new Vector3();
  const vertex = new Vector3();
  for (let face = 0; face < faceCount; face += 1) {
    centroid.set(0, 0, 0);
    for (let corner = 0; corner < 3; corner += 1) {
      vertex.fromBufferAttribute(basePositions, face * 3 + corner);
      centroid.add(vertex);
    }
    centroid.normalize();

    let best: Seed | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const seed of seeds) {
      const score =
        centroid.angleTo(seed.direction) + REGIONS.borderNoise * boundaryWarp(centroid, seed.direction);
      if (score < bestScore) {
        bestScore = score;
        best = seed;
      }
    }
    if (best && bestScore <= best.islandRadius) {
      buckets[best.skillIndex]?.push(face);
    }
  }
  base.dispose();

  // 3. Merge each skill's land into one raised, smooth-shaded mesh.
  const landRadius = PLANET.radius * REGIONS.raise;
  const meshes: Mesh[] = [];
  skills.forEach((skill, skillIndex) => {
    const faces = buckets[skillIndex] ?? [];
    if (faces.length === 0) {
      return;
    }
    const positions = new Float32Array(faces.length * 9);
    const normals = new Float32Array(faces.length * 9);
    faces.forEach((face, writeFace) => {
      for (let corner = 0; corner < 3; corner += 1) {
        vertex.fromBufferAttribute(basePositions, face * 3 + corner);
        vertex.normalize().multiplyScalar(landRadius);
        const offset = writeFace * 9 + corner * 3;
        positions[offset] = vertex.x;
        positions[offset + 1] = vertex.y;
        positions[offset + 2] = vertex.z;
        vertex.divideScalar(landRadius);
        normals[offset] = vertex.x;
        normals[offset + 1] = vertex.y;
        normals[offset + 2] = vertex.z;
      }
    });

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));

    const [hue, saturation, lightness] = skillColorHSL(skill);
    const material = new MeshStandardMaterial({
      color: new Color().setHSL(hue, saturation, lightness),
      emissive: new Color().setHSL(hue, 0.9, 0.55),
      emissiveIntensity: HIGHLIGHT.base,
      roughness: 0.55,
      metalness: 0.2,
    });

    const mesh = new Mesh(geometry, material);
    mesh.userData = { skillId: skill.id, skillName: skill.name };
    meshes.push(mesh);
  });

  return {
    meshes,
    dispose(): void {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          for (const entry of mesh.material) entry.dispose();
        } else {
          mesh.material.dispose();
        }
      }
    },
  };
}
