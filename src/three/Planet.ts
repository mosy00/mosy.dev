import { gsap } from 'gsap';
import { Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import type { SkillArea } from '../data/skills';
import { HIGHLIGHT, OCEAN, PLANET } from './config';
import { buildSkillIslands, type SkillIslandsBuild } from './skillRegions';

/**
 * The planet: a deep ocean sphere with skill islands raised out of it.
 * Most of the globe stays open ocean so the skill lands read clearly.
 * Drag controls rotate the whole group; `setHighlighted` glows the
 * hovered island and dims the rest.
 */
export class Planet {
  public readonly object3D = new Group();
  private readonly ocean: Mesh<SphereGeometry, MeshStandardMaterial>;
  private readonly islands: SkillIslandsBuild;
  private highlightedSkillId: string | null = null;
  private elapsedTime = 0;

  constructor(skills: readonly SkillArea[]) {
    this.ocean = new Mesh(
      new SphereGeometry(PLANET.radius, OCEAN.segments, OCEAN.segments),
      new MeshStandardMaterial({
        color: OCEAN.color,
        roughness: OCEAN.roughness,
        metalness: OCEAN.metalness,
      }),
    );
    this.islands = buildSkillIslands(skills);
    this.object3D.add(this.ocean, ...this.islands.meshes);
    this.object3D.rotation.x = PLANET.initialTilt;
  }

  /** Island meshes only — the raycaster must ignore open ocean. */
  public get meshes(): Mesh[] {
    return this.islands.meshes;
  }

  /** Glow the hovered island and dim the rest (GSAP-tweened emissive). */
  public setHighlighted(skillId: string | null): void {
    if (skillId === this.highlightedSkillId) {
      return;
    }
    this.highlightedSkillId = skillId;
    for (const mesh of this.islands.meshes) {
      const material = mesh.material as MeshStandardMaterial;
      const target =
        skillId !== null && mesh.userData['skillId'] === skillId ? HIGHLIGHT.active : HIGHLIGHT.dimmed;
      gsap.to(material, { emissiveIntensity: target, duration: 0.4, ease: 'power2.out', overwrite: true });
    }
  }

  update(deltaTime: number): void {
    this.elapsedTime += deltaTime;
    this.object3D.position.y = Math.sin(this.elapsedTime * PLANET.floatSpeed) * PLANET.floatAmplitude;
  }

  dispose(): void {
    this.ocean.geometry.dispose();
    this.ocean.material.dispose();
    this.islands.dispose();
    this.object3D.clear();
  }
}


