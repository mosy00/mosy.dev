import { gsap } from 'gsap';
import { Group, MathUtils, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three';
import type { SkillArea } from '../data/skills';
import { HIGHLIGHT, OCEAN, PLANET, TOUR } from './config';
import { buildPolarLands, type PolarLandsBuild } from './polarLands';
import { buildSkillIslands, type SkillIslandsBuild } from './skillRegions';

export interface TourTarget {
  readonly yaw: number;
  readonly pitch: number;
}

/**
 * The planet: a light-blue ocean sphere with skill islands raised out of
 * it and white figurative polar caps at both poles, in three nested groups —
 *   object3D  float + scale (scene level)
 *   tourGroup rotation owned by the scroll tour (spins islands to camera)
 *   dragGroup rotation owned by user drag (free yaw, pitch clamped ±45°)
 * so dragging never fights the tour and the poles stay up.
 */
export class Planet {
  public readonly object3D = new Group();
  public readonly tourGroup = new Group();
  public readonly dragGroup = new Group();
  private readonly ocean: Mesh<SphereGeometry, MeshStandardMaterial>;
  private readonly islands: SkillIslandsBuild;
  private readonly polarLands: PolarLandsBuild;
  private tourTargetsCache: TourTarget[] | null = null;
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
    this.polarLands = buildPolarLands(this.islands.grid);
    this.dragGroup.add(this.ocean, ...this.islands.meshes, ...this.polarLands.meshes);
    this.dragGroup.rotation.x = PLANET.initialTilt;
    this.tourGroup.add(this.dragGroup);
    // YXZ so yaw spins the globe about its poles and pitch stays latitude-like.
    this.tourGroup.rotation.order = 'YXZ';
    this.object3D.add(this.tourGroup);
  }

  /** Island meshes only — the raycaster must ignore open ocean and polar lands (FR-007). */
  public get meshes(): Mesh[] {
    return this.islands.meshes;
  }

  /** The group user drag rotates (inner — independent of the scroll tour). */
  public get controlsTarget(): Group {
    return this.dragGroup;
  }

  /**
   * One tour target per skill: the tourGroup rotation that brings that
   * island roughly front-center (pitch clamped so the poles stay up).
   * The resting tilt of the drag group is baked in.
   */
  public get tourTargets(): readonly TourTarget[] {
    if (!this.tourTargetsCache) {
      this.tourTargetsCache = this.islands.skillDirections.map((direction) => {
        const tilted = direction.clone().applyAxisAngle(new Vector3(1, 0, 0), PLANET.initialTilt);
        const hyp = Math.hypot(tilted.x, tilted.z);
        return {
          yaw: Math.atan2(-tilted.x, hyp),
          pitch: MathUtils.clamp(Math.atan2(tilted.y, tilted.z), -TOUR.maxPitch, TOUR.maxPitch),
        };
      });
    }
    return this.tourTargetsCache;
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
    this.polarLands.dispose();
    this.object3D.clear();
  }
}




