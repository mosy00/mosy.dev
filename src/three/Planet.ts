import { gsap } from 'gsap';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import type { SkillArea } from '../data/skills';
import { HIGHLIGHT, PLANET } from './config';
import { buildOceanShell, type OceanShellBuild } from './oceanTiles';
import { buildPolarLands, type PolarLandsBuild } from './polarLands';
import { buildSkillIslands, type SkillIslandsBuild } from './skillRegions';

/**
 * The planet: ONE continuous flush hex-tile shell — skill lands, light-blue
 * hex ocean and white polar caps all meshed at PLANET.radius (no background
 * sphere, no padding). Three nested groups —
 *   object3D  float + scale (scene level)
 *   tourGroup rotation owned by the scroll tour (~180° sweep + growth)
 *   dragGroup rotation owned by user drag (free yaw, pitch clamped ±45°)
 * so dragging never fights the tour and the poles stay up.
 */
export class Planet {
  public readonly object3D = new Group();
  public readonly tourGroup = new Group();
  public readonly dragGroup = new Group();
  private readonly ocean: OceanShellBuild;
  private readonly islands: SkillIslandsBuild;
  private readonly polarLands: PolarLandsBuild;
  private highlightedSkillId: string | null = null;
  private elapsedTime = 0;
  private reducedMotion = false;

  constructor(skills: readonly SkillArea[]) {
    this.islands = buildSkillIslands(skills);
    this.polarLands = buildPolarLands(this.islands.grid);
    const excluded = new Set<number>([...this.islands.landTileIds, ...this.polarLands.capTileIds]);
    this.ocean = buildOceanShell(this.islands.grid, excluded);
    this.dragGroup.add(this.ocean.mesh, ...this.islands.meshes, ...this.polarLands.meshes);
    this.dragGroup.rotation.x = PLANET.initialTilt;
    this.tourGroup.add(this.dragGroup);
    // YXZ so yaw spins the globe about its poles and pitch stays latitude-like.
    this.tourGroup.rotation.order = 'YXZ';
    this.object3D.add(this.tourGroup);
  }

  /** Island meshes only — the raycaster must ignore hex ocean and polar lands. */
  public get meshes(): Mesh[] {
    return this.islands.meshes;
  }

  /** The group user drag rotates (inner — independent of the scroll tour). */
  public get controlsTarget(): Group {
    return this.dragGroup;
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

  /** Reduced motion (D8): freeze the ambient float bob; drag/hover untouched. */
  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (reduced) {
      this.object3D.position.y = 0;
    }
  }

  update(deltaTime: number): void {
    this.elapsedTime += deltaTime;
    if (this.reducedMotion) {
      return;
    }
    this.object3D.position.y = Math.sin(this.elapsedTime * PLANET.floatSpeed) * PLANET.floatAmplitude;
  }

  dispose(): void {
    this.ocean.dispose();
    this.islands.dispose();
    this.polarLands.dispose();
    this.object3D.clear();
  }
}




