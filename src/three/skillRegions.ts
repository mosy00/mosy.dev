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
import { PLANET, REGIONS } from './config';

export interface SkillRegionBuild {
  /** One merged flat-shaded mesh per skill — its "country" on the planet. */
  readonly meshes: Mesh[];
  dispose(): void;
}

interface Seed {
  readonly direction: Vector3;
  readonly skillIndex: number;
}

function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

/** Smooth low-frequency field shared by neighbouring faces → organic borders. */
function boundaryWarp(centroid: Vector3, seed: Vector3): number {
  return (
    Math.sin(centroid.x * 3.1 + seed.y * 2.7) +
    Math.sin(centroid.y * 4.3 + seed.z * 3.3) +
    Math.sin(centroid.z * 3.7 + seed.x * 2.1)
  ) / 3;
}

/**
 * Carves the planet into skill regions: every face of a subdivided
 * icosahedron joins the nearest skill seed (spherical Voronoi with a
 * noise-warped metric), then faces merge into one mesh per skill.
 * Expertise drives territory size — each skill gets 1–3 seeds.
 */
export function buildSkillRegions(skills: readonly SkillArea[]): SkillRegionBuild {
  const base = new IcosahedronGeometry(1, REGIONS.detail);
  const basePositions = base.getAttribute('position');
  const faceCount = Math.floor(basePositions.count / 3);

  // 1. Seeds: Fibonacci-distributed, jittered for asymmetry.
  const seeds: Seed[] = [];
  const quotas = skills.map((skill) => 1 + Math.round(skill.expertise * 2));
  const totalSeeds = quotas.reduce((sum, quota) => sum + quota, 0);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  let seedCounter = 0;
  skills.forEach((skill, skillIndex) => {
    const quota = 1 + Math.round(skill.expertise * 2);
    for (let q = 0; q < quota; q += 1) {
      const y = 1 - ((seedCounter + 0.5) / totalSeeds) * 2;
      const ring = Math.sqrt(Math.max(1 - y * y, 0));
      const theta = goldenAngle * seedCounter;
      const direction = new Vector3(
        Math.cos(theta) * ring + (pseudoRandom(seedCounter * 3) - 0.5) * REGIONS.seedJitter,
        y + (pseudoRandom(seedCounter * 3 + 1) - 0.5) * REGIONS.seedJitter,
        Math.sin(theta) * ring + (pseudoRandom(seedCounter * 3 + 2) - 0.5) * REGIONS.seedJitter,
      ).normalize();
      seeds.push({ direction, skillIndex });
      seedCounter += 1;
    }
  });

  // 2. Assign each face to the nearest (noise-warped) seed's skill.
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

    let bestSkillIndex = -1;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const seed of seeds) {
      const score =
        centroid.angleTo(seed.direction) + REGIONS.borderNoise * boundaryWarp(centroid, seed.direction);
      if (score < bestScore) {
        bestScore = score;
        bestSkillIndex = seed.skillIndex;
      }
    }
    if (bestSkillIndex >= 0) {
      buckets[bestSkillIndex]?.push(face);
    }
  }

  // 3. Merge each skill's faces into a single mesh, tinted by expertise.
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
        vertex.normalize().multiplyScalar(PLANET.radius);
        const offset = writeFace * 9 + corner * 3;
        positions[offset] = vertex.x;
        positions[offset + 1] = vertex.y;
        positions[offset + 2] = vertex.z;
        vertex.divideScalar(PLANET.radius);
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
      emissive: new Color().setHSL(hue, saturation, Math.min(lightness, 0.18)),
      flatShading: true,
      roughness: 0.55,
      metalness: 0.2,
    });

    const mesh = new Mesh(geometry, material);
    mesh.userData = { skillId: skill.id, skillName: skill.name };
    meshes.push(mesh);
  });

  base.dispose();

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
