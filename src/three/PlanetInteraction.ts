import {
  Matrix4,
  Raycaster,
  Vector2,
  Vector3,
  type Object3D,
  type Mesh,
  type PerspectiveCamera,
} from 'three';
import { PLANET } from './config';
import type { PlanetControls } from './PlanetControls';

/**
 * Occluder sphere radius as a fraction of the shell radius (research D6): the
 * flat fan facets dip at most ~0.001·R below the shell, so a sphere at 0.998·R
 * sits behind every near-side land while blocking anything on the far side.
 */
const OCCLUDER_RADIUS_SCALE = 0.998;

/**
 * FR-029 — enlarged invisible target areas.
 *
 * A single-tile land is only ~0.04 rad wide, far below an accurate finger or
 * even a casual mouse pick. When no visible land is hit exactly, each skill's
 * land gets an INVISIBLE enlarged pick sphere: its mesh bounding sphere grown
 * by `HIT_MARGIN` world units and floored at `HIT_MIN_RADIUS`, so the smallest
 * lands stay selectable while continent-scale lands barely grow — the ocean
 * bands between continents (FR-027) stay free of pick-up zones.
 *
 * The enlargement is pick-only: no geometry is added or rendered, so draw
 * calls are untouched (plan constraint, SC-011) and the far-side occluder
 * rule still applies to every fallback pick (FR-012).
 */
const HIT_MARGIN = 0.03;
const HIT_MIN_RADIUS = 0.09;

/** One skill's invisible pick sphere, in its land mesh's local frame. */
interface LandHitTarget {
  readonly mesh: Mesh;
  readonly centerLocal: Vector3;
  readonly radiusLocal: number;
}

/** Average axis scale of a world matrix (the planet's group scales are uniform). */
function worldScale(matrix: Matrix4): number {
  const e = matrix.elements;
  return (
    (Math.hypot(e[0], e[1], e[2]) +
      Math.hypot(e[4], e[5], e[6]) +
      Math.hypot(e[8], e[9], e[10])) /
    3
  );
}

export interface PlanetInteractionOptions {
  readonly canvas: HTMLElement;
  readonly camera: PerspectiveCamera;
  readonly objects: readonly Mesh[];
  readonly controls: PlanetControls;
  /** Called whenever the hovered skill changes (null = open ocean / off planet). */
  readonly onHover: (skillId: string | null) => void;
}

/**
 * Raycast hover/tap for the planet: picks the island under the pointer and
 * reports skill ids through onHover. Hover is suppressed while the user drags —
 * dragging rotates, hovering inspects — but a fresh pointerdown always picks,
 * so a tap selects a land even on touch (FR-029 / FR-031).
 */
export class PlanetInteraction {
  private readonly options: PlanetInteractionOptions;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly occluderCenter = new Vector3();
  private readonly occluderScale = new Vector3();
  private readonly toCenter = new Vector3();
  private readonly hitCenter = new Vector3();
  private readonly hitToCenter = new Vector3();
  private readonly hitTargets: LandHitTarget[] = [];
  private hoveredSkillId: string | null = null;

  constructor(options: PlanetInteractionOptions) {
    this.options = options;

    // FR-029: one invisible enlarged pick sphere per skill land, measured once
    // from the visible mesh geometry (each fan covers exactly that skill's tiles).
    for (const mesh of options.objects) {
      if (mesh.geometry.boundingSphere === null) {
        mesh.geometry.computeBoundingSphere();
      }
      const sphere = mesh.geometry.boundingSphere;
      if (sphere !== null) {
        this.hitTargets.push({
          mesh,
          centerLocal: sphere.center.clone(),
          radiusLocal: sphere.radius,
        });
      }
    }

    options.canvas.addEventListener('pointermove', this.handlePointerMove);
    options.canvas.addEventListener('pointerdown', this.handlePointerDown);
    options.canvas.addEventListener('pointerleave', this.handlePointerLeave);
  }

  dispose(): void {
    this.options.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.options.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.options.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.options.controls.isDragging) {
      this.setHovered(null);
      return;
    }
    this.updatePointer(event);
    this.pick();
  };

  /** A tap has no preceding pointermove — pick on press so touch can select. */
  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.updatePointer(event);
    this.pick();
  };

  private readonly handlePointerLeave = (): void => {
    this.setHovered(null);
  };

  private updatePointer(event: PointerEvent): void {
    const bounds = this.options.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.options.camera);
  }

  /** Exact hit on a visible land wins; otherwise the enlarged spheres answer. */
  private pick(): void {
    const [hit] = this.raycaster.intersectObjects([...this.options.objects], false);
    let skillId: string | null = null;
    if (hit && !this.isOccluded(hit.distance, hit.object)) {
      skillId = (hit.object.userData['skillId'] as string | undefined) ?? null;
    }
    if (skillId === null) {
      skillId = this.pickByEnlargedTarget();
    }
    this.setHovered(skillId);
  }

  /**
   * FR-029 fallback: select the nearest land whose enlarged invisible pick
   * sphere the ray passes through. Occlusion is tested at the ray's closest
   * approach, so far-side lands glimpsed through the water still never hover.
   */
  private pickByEnlargedTarget(): string | null {
    const ray = this.raycaster.ray;
    let bestId: string | null = null;
    let bestT = Number.POSITIVE_INFINITY;
    for (const target of this.hitTargets) {
      this.hitCenter.copy(target.centerLocal).applyMatrix4(target.mesh.matrixWorld);
      const scale = worldScale(target.mesh.matrixWorld);
      const radius = Math.max(target.radiusLocal * scale + HIT_MARGIN, HIT_MIN_RADIUS);
      this.hitToCenter.subVectors(this.hitCenter, ray.origin);
      const t = this.hitToCenter.dot(ray.direction);
      if (t <= 0 || t >= bestT) {
        continue; // behind the camera, or farther than the current best
      }
      const offsetSq = this.hitToCenter.lengthSq() - t * t; // perpendicular distance²
      if (offsetSq > radius * radius) {
        continue; // ray misses the enlarged sphere
      }
      if (this.isOccluded(t, target.mesh)) {
        continue; // far side of the globe
      }
      bestT = t;
      bestId = (target.mesh.userData['skillId'] as string | undefined) ?? null;
    }
    return bestId;
  }

  /**
   * Analytic occluder-sphere test (research D6): the shell hides every land hit
   * the ray only reaches after passing through the planet's near side, so
   * far-side land glimpsed through the translucent ocean no longer hovers.
   * The sphere is concentric with the shell, so its center and scale come from
   * the matched mesh's world matrix (island meshes sit at the planet origin)
   * and therefore follow the tour's growth scale automatically.
   */
  private isOccluded(hitDistance: number, object: Object3D): boolean {
    this.occluderCenter.setFromMatrixPosition(object.matrixWorld);
    this.occluderScale.setFromMatrixScale(object.matrixWorld);
    const shellRadius =
      PLANET.radius * ((this.occluderScale.x + this.occluderScale.y + this.occluderScale.z) / 3);
    const radius = shellRadius * OCCLUDER_RADIUS_SCALE;

    const origin = this.raycaster.ray.origin;
    const direction = this.raycaster.ray.direction;
    this.toCenter.subVectors(origin, this.occluderCenter);
    const b = 2 * this.toCenter.dot(direction);
    const c = this.toCenter.lengthSq() - radius * radius;
    const discriminant = b * b - 4 * c;
    if (discriminant < 0) {
      // No near-side shell along the ray — nothing to trust a hit against.
      return true;
    }
    const nearestT = (-b - Math.sqrt(discriminant)) / 2;
    return nearestT < 0 || hitDistance > nearestT;
  }

  private setHovered(skillId: string | null): void {
    if (skillId === this.hoveredSkillId) {
      return;
    }
    this.hoveredSkillId = skillId;
    this.options.onHover(skillId);
  }
}
