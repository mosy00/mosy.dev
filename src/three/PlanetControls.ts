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
  /**
   * Pitch sign, applied EXACTLY ONCE — in `onPointerMove`.
   *
   * `rotation.x` is positive when the globe's top tilts TOWARD the camera.
   * Pointer `deltaY` grows downward, so dragging up (negative deltaY) yields a
   * negative angle, which tips the top away and brings the LOWER parts of the
   * globe into view — the "grab and turn" feel. `+1` is therefore correct, and
   * matches the pre-existing behaviour this constant preserves.
   *
   * The sign must be applied here and ONLY here: `velocity.x` is seeded from
   * this already-signed pitch, so `update()` integrates it as-is. Negating in
   * both places cancels out and makes the planet spin backwards on release
   * (the bug reported 2026-10-04).
   */
  private static readonly PITCH_DIRECTION = 1;
  private ambientIdleSpeed: number = PLANET_CONTROLS.idleSpeed;
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
    this.velocity.y *= decay;
    this.target.rotation.y += this.velocity.y * deltaTime;

    // Vertical inertia. `velocity.x` was seeded in `onPointerMove` from the
    // already-signed pitch, so PITCH_DIRECTION is deliberately NOT applied here
    // — a second negation would cancel the drag's own sign and make the planet
    // reverse the moment it is released (reported 2026-10-04). Drag and glide
    // therefore always agree on direction.
    //
    // Its own gentler decay makes a vertical flick ease out smoothly instead of
    // stalling, and reaching the ±maxPitch limit zeroes the velocity so the
    // planet cannot spring back off the clamp.
    const pitchDecay = Math.exp(-PLANET_CONTROLS.pitchGlideDecay * deltaTime);
    this.velocity.x *= pitchDecay;
    const nextPitch = this.target.rotation.x + this.velocity.x * deltaTime;
    if (nextPitch > PLANET_CONTROLS.maxPitch || nextPitch < -PLANET_CONTROLS.maxPitch) {
      this.target.rotation.x = clamp(nextPitch, -PLANET_CONTROLS.maxPitch, PLANET_CONTROLS.maxPitch);
      this.velocity.x = 0;
    } else {
      this.target.rotation.x = nextPitch;
    }

    // Ease yaw velocity towards the idle spin so the planet never dies.
    const settle = 1 - Math.exp(-PLANET_CONTROLS.settleRate * deltaTime);
    this.velocity.y += (this.ambientIdleSpeed - this.velocity.y) * settle;
  }

  /**
   * Ambient-motion gate (research D8): under reduced motion the idle spin
   * target drops to 0 while drag, inertia, damping and the pitch clamp stay
   * byte-for-byte unchanged (FR-009).
   */
  setAmbientMotion(enabled: boolean): void {
    this.ambientIdleSpeed = enabled ? PLANET_CONTROLS.idleSpeed : 0;
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
    // PITCH_DIRECTION keeps the vertical mapping in one place. It is applied
    // here only: `velocity.x` below is seeded from this same signed pitch, and
    // `update()` integrates that value as-is (see PITCH_DIRECTION's comment).
    const pitch = PlanetControls.PITCH_DIRECTION * deltaY * PLANET_CONTROLS.rotationPerPixel;

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
