import { Raycaster, Vector2, Vector3, type Object3D, type Mesh, type PerspectiveCamera } from 'three';
import { PLANET } from './config';
import type { PlanetControls } from './PlanetControls';

/**
 * Occluder sphere radius as a fraction of the shell radius (research D6): the
 * flat fan facets dip at most ~0.001·R below the shell, so a sphere at 0.998·R
 * sits behind every near-side land while blocking anything on the far side.
 */
const OCCLUDER_RADIUS_SCALE = 0.998;

export interface PlanetInteractionOptions {
  readonly canvas: HTMLElement;
  readonly camera: PerspectiveCamera;
  readonly objects: readonly Mesh[];
  readonly controls: PlanetControls;
  /** Called whenever the hovered skill changes (null = open ocean / off planet). */
  readonly onHover: (skillId: string | null) => void;
}

/**
 * Raycast hover for the planet: picks the island under the pointer and
 * reports skill ids through onHover. Suppressed while the user drags —
 * dragging rotates, hovering inspects.
 */
export class PlanetInteraction {
  private readonly options: PlanetInteractionOptions;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly occluderCenter = new Vector3();
  private readonly occluderScale = new Vector3();
  private readonly toCenter = new Vector3();
  private hoveredSkillId: string | null = null;

  constructor(options: PlanetInteractionOptions) {
    this.options = options;
    options.canvas.addEventListener('pointermove', this.handlePointerMove);
    options.canvas.addEventListener('pointerleave', this.handlePointerLeave);
  }

  dispose(): void {
    this.options.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.options.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.options.controls.isDragging) {
      this.setHovered(null);
      return;
    }
    const bounds = this.options.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.options.camera);
    const [hit] = this.raycaster.intersectObjects([...this.options.objects], false);
    let skillId: string | null = null;
    if (hit && !this.isOccluded(hit.distance, hit.object)) {
      skillId = (hit.object.userData['skillId'] as string | undefined) ?? null;
    }
    this.setHovered(skillId);
  };

  private readonly handlePointerLeave = (): void => {
    this.setHovered(null);
  };

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
