import { Raycaster, Vector2, type Mesh, type PerspectiveCamera } from 'three';
import type { PlanetControls } from './PlanetControls';

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
    const skillId = (hit?.object.userData['skillId'] as string | undefined) ?? null;
    this.setHovered(skillId);
  };

  private readonly handlePointerLeave = (): void => {
    this.setHovered(null);
  };

  private setHovered(skillId: string | null): void {
    if (skillId === this.hoveredSkillId) {
      return;
    }
    this.hoveredSkillId = skillId;
    this.options.onHover(skillId);
  }
}
