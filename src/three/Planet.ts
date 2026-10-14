import { gsap } from 'gsap';
import { Color, Group, Mesh, MeshStandardMaterial, Vector3, type Object3D } from 'three';
import type { SkillArea } from '../data/skills';
import { HIGHLIGHT, HOVER, PLANET } from './config';
import { buildOceanShell, type OceanShellBuild } from './oceanTiles';
import { buildPolarLands, type PolarLandsBuild } from './polarLands';
import { buildSkillIslands, type SkillIslandsBuild } from './skillRegions';

/**
 * The planet: ONE continuous flush hex-tile shell — skill lands, light-blue
 * hex ocean and white polar caps all meshed at PLANET.radius (no background
 * sphere, no padding). Three nested groups —
 *   object3D  float + growth scale + THE TILT (rotation.x, clamped ±45°)
 *   tourGroup yaw owned by the scroll tour (~180° sweep)
 *   dragGroup yaw owned by user drag (free spin)
 * TURNTABLE NESTING (US2 fix, 2026-10-13): the tilt is applied LAST, on the
 * OUTERMOST group, with every yaw source nested INSIDE it, so
 * world = Rx(tilt)·Ry(tourYaw+dragYaw). The pole position depends only on the
 * tilt — never on accumulated yaw — so vertical drag reads the same on screen
 * at every scroll position and after any amount of manual spinning. (With the
 * tilt anywhere between two yaws — the old arrangement — any 180° of yaw
 * rotated the tilt axis and flipped dragging on screen.)
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
    this.tourGroup.add(this.dragGroup);
    // Both inner groups only ever have rotation.y written (yaw) — their Euler
    // order is irrelevant. The tilt lives on object3D, applied AFTER all yaw.
    this.object3D.add(this.tourGroup);
    this.object3D.rotation.x = PLANET.initialTilt;
  }

  /** Island meshes only — the raycaster must ignore hex ocean and polar lands. */
  public get meshes(): Mesh[] {
    return this.islands.meshes;
  }

  /** The group user drag rotates (inner — the free yaw only). */
  public get controlsTarget(): Group {
    return this.dragGroup;
  }

  /** The tilt target (outermost group — rotation.x; see class doc). */
  public get tiltTarget(): Object3D {
    return this.object3D;
  }

  /**
   * Close-tint + lift the hovered land (US3 / research D4 / contracts C4):
   * the emissive tweens to the land's own same-hue sibling tint at a modest
   * intensity (never a bright flash), the mesh pops up along its radial
   * direction, and clearing (null) restores the base color, resting glow and
   * flush height — nothing ever sticks (FR-012 / SC-005). Under reduced
   * motion the change is instant (duration 0, research D5).
   */
  public setHighlighted(skillId: string | null): void {
    if (skillId === this.highlightedSkillId) {
      return;
    }
    this.highlightedSkillId = skillId;
    const duration = this.reducedMotion ? 0 : HOVER.tweenDuration;
    for (const mesh of this.islands.meshes) {
      const material = mesh.material as MeshStandardMaterial;
      const isActive = skillId !== null && mesh.userData['skillId'] === skillId;
      // Hover = same-hue sibling tint; cleared = the land's own base color;
      // another land hovered = dimmed rest (pre-existing contrast behavior).
      const emissiveTarget = new Color(
        isActive ? (mesh.userData['hoverTint'] as number) : (mesh.userData['skillColor'] as number),
      );
      gsap.to(material.emissive, {
        r: emissiveTarget.r,
        g: emissiveTarget.g,
        b: emissiveTarget.b,
        duration,
        overwrite: true,
      });
      const intensity = isActive
        ? HIGHLIGHT.active
        : skillId === null
          ? HIGHLIGHT.base
          : HIGHLIGHT.dimmed;
      gsap.to(material, {
        emissiveIntensity: intensity,
        duration,
        ease: 'power2.out',
        overwrite: true,
      });
      // Slight radial pop-up ("stuck up"), flush again when cleared.
      const dir = mesh.userData['radialDir'] as Vector3;
      const lift = isActive ? HOVER.liftHeight : 0;
      gsap.to(mesh.position, {
        x: dir.x * lift,
        y: dir.y * lift,
        z: dir.z * lift,
        duration,
        ease: 'power2.out',
        overwrite: true,
      });
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




