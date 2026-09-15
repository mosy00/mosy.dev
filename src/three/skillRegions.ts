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
  /** One merged smooth-shaded mesh per skill — its landmass on the globe. */
  readonly meshes: Mesh[];
  /** One representative direction per skill (primary seed) — tour targets. */
  readonly skillDirections: readonly Vector3[];
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
 * Raises skill landmasses out of the ocean. Each skill gets ONE connected
 * landmass: a primary seed on a latitude-banded Fibonacci lattice plus
 * satellites clustered around it (so their caps always merge), all grown
 * by a noise-warped island radius scaled with expertise. Everything else
 * stays open ocean.
 */
export function buildSkillIslands(skills: readonly SkillArea[]): SkillIslandsBuild {
  const base = new IcosahedronGeometry(1, REGIONS.detail);
  const basePositions = base.getAttribute('position');
  const faceCount = Math.floor(basePositions.count / 3);

  // 1. Seeds: primary + clustered satellites per skill.
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
    skillDirections,
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
