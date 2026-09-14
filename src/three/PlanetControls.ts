import type { Object3D } from 'three';
import { PLANET_CONTROLS } from './config';

interface PlanetControlsOptions {
  readonly domElement: HTMLElement;
  readonly target: Object3D;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Drag-to-rotate controls for the planet with inertia after release
 * and a gentle idle spin. Free yaw, pitch clamped so the planet never
 * flips over. Direct 1:1 manipulation while dragging; angular velocity
 * is estimated from pointer deltas and integrated afterwards.
 */
export class PlanetControls {
  private readonly domElement: HTMLElement;
  private readonly target: Object3D;
  private readonly velocity = { x: 0, y: 0 };
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private lastMoveTime = 0;

  constructor(options: PlanetControlsOptions) {
    this.domElement = options.domElement;
    this.target = options.target;
    this.bindEvents();
  }

  update(deltaTime: number): void {
    if (this.dragging) {
      return;
    }
    const decay = Math.exp(-PLANET_CONTROLS.damping * deltaTime);
    this.velocity.x *= decay;
    this.target.rotation.y += this.velocity.y * deltaTime;
    this.target.rotation.x = clamp(
      this.target.rotation.x + this.velocity.x * deltaTime,
      -PLANET_CONTROLS.maxPitch,
      PLANET_CONTROLS.maxPitch,
    );
    // Ease yaw velocity towards the idle spin so the planet never dies.
    const settle = 1 - Math.exp(-PLANET_CONTROLS.settleRate * deltaTime);
    this.velocity.y += (PLANET_CONTROLS.idleSpeed - this.velocity.y) * settle;
  }

  /** True while the user is dragging — hover raycasts are suppressed then. */
  get isDragging(): boolean {
    return this.dragging;
  }

  dispose(): void {
    const element = this.domElement;
    element.removeEventListener('pointerdown', this.onPointerDown);
    element.removeEventListener('pointermove', this.onPointerMove);
    element.removeEventListener('pointerup', this.onPointerUp);
    element.removeEventListener('pointercancel', this.onPointerUp);
    element.removeEventListener('lostpointercapture', this.onPointerUp);
    element.classList.remove('is-grabbing');
  }

  private bindEvents(): void {
    const element = this.domElement;
    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('pointermove', this.onPointerMove);
    element.addEventListener('pointerup', this.onPointerUp);
    element.addEventListener('pointercancel', this.onPointerUp);
    element.addEventListener('lostpointercapture', this.onPointerUp);
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.lastMoveTime = event.timeStamp;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.domElement.setPointerCapture(event.pointerId);
    this.domElement.classList.add('is-grabbing');
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging) {
      return;
    }
    const deltaX = event.clientX - this.lastX;
    const deltaY = event.clientY - this.lastY;
    const deltaTime = Math.max(
      (event.timeStamp - this.lastMoveTime) / 1000,
      PLANET_CONTROLS.minPointerDt,
    );
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.lastMoveTime = event.timeStamp;

    const yaw = deltaX * PLANET_CONTROLS.rotationPerPixel;
    const pitch = deltaY * PLANET_CONTROLS.rotationPerPixel;

    this.target.rotation.y += yaw;
    this.target.rotation.x = clamp(
      this.target.rotation.x + pitch,
      -PLANET_CONTROLS.maxPitch,
      PLANET_CONTROLS.maxPitch,
    );

    const smoothing = PLANET_CONTROLS.velocitySmoothing;
    this.velocity.y += (yaw / deltaTime - this.velocity.y) * smoothing;
    this.velocity.x += (pitch / deltaTime - this.velocity.x) * smoothing;
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    if (this.domElement.hasPointerCapture(event.pointerId)) {
      this.domElement.releasePointerCapture(event.pointerId);
    }
    this.domElement.classList.remove('is-grabbing');
  };
}
