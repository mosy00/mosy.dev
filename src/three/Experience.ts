import {
  ACESFilmicToneMapping,
  Clock,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  type Light,
} from 'three';
import type { SkillArea } from '../data/skills';
import { CAMERA, PLANET, RENDERER } from './config';
import { Planet } from './Planet';
import { PlanetControls } from './PlanetControls';

/**
 * Owns the renderer, scene, camera, lights and the render loop. The canvas
 * lives inside the planet section: sizes come from the canvas element (not
 * the window) and the camera distance is fitted so the planet covers most
 * of the section while staying dead-center.
 */
export class Experience {
  public readonly planet: Planet;
  public readonly camera: PerspectiveCamera;
  public readonly controls: PlanetControls;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly clock = new Clock();


  constructor(canvas: HTMLCanvasElement, skills: readonly SkillArea[]) {
    this.canvas = canvas;
    this.planet = new Planet(skills);
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER.maxPixelRatio));
    this.renderer.setClearColor(RENDERER.clearColor, RENDERER.clearAlpha);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.camera = new PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);

    this.scene.add(this.planet.object3D, ...this.createLights());

    this.controls = new PlanetControls({ domElement: canvas, target: this.planet.controlsTarget });

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    this.renderer.setAnimationLoop(this.tick);
  }

  /**
   * Reduced motion (research D8): the controls drop their idle spin and the
   * planet stops its float bob. Drag, inertia, hover and the tour's static
   * fallback are handled elsewhere and stay untouched.
   */
  setReducedMotion(reduced: boolean): void {
    this.controls.setAmbientMotion(!reduced);
    this.planet.setReducedMotion(reduced);
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('resize', this.handleResize);
    this.controls.dispose();
    this.planet.dispose();
    this.renderer.dispose();
  }

  private createLights(): Light[] {
    const hemisphere = new HemisphereLight(0x9db4ff, 0x05060a, 0.55);
    const key = new DirectionalLight(0xffffff, 1.35);
    key.position.set(3.5, 2.2, 4);
    const rim = new DirectionalLight(0x5ad1ff, 1.1);
    rim.position.set(-4, -1.5, -3);
    return [hemisphere, key, rim];
  }

  private readonly tick = (): void => {
    const deltaTime = Math.min(this.clock.getDelta(), 0.05);
    this.controls.update(deltaTime);
    this.planet.update(deltaTime);
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Fits the planet to the VIEWPORT, not to the canvas. The canvas is
   * deliberately taller than the viewport (`--planet-bleed`) so the globe can
   * bleed into the neighbouring sections, and `CAMERA.fit` is expressed against
   * the viewport's smaller dimension — so both fractions are converted from
   * viewport-relative to canvas-relative here. Without that conversion the
   * taller canvas silently inflates the globe by the bleed factor and clips its
   * poles against the canvas edge (the visible symptom is a planet whose top and
   * bottom never appear, no matter how tall the canvas is).
   *
   * `camera.aspect` keeps using the canvas aspect, since that is what must not
   * be stretched; the camera always looks straight at the centred planet.
   */
  private readonly handleResize = (): void => {
    const canvasWidth = Math.max(this.canvas.clientWidth, 1);
    const canvasHeight = Math.max(this.canvas.clientHeight, 1);
    this.renderer.setSize(canvasWidth, canvasHeight, false);

    this.camera.aspect = canvasWidth / canvasHeight;
    this.camera.updateProjectionMatrix();

    const viewportWidth = Math.max(window.innerWidth, 1);
    const viewportHeight = Math.max(window.innerHeight, 1);
    const heightFraction = (CAMERA.fit.heightFraction * viewportHeight) / canvasHeight;
    const widthFraction = (CAMERA.fit.widthFraction * viewportWidth) / canvasWidth;

    const halfFov = MathUtils.degToRad(CAMERA.fov / 2);
    const fitHeight = PLANET.radius / (heightFraction * Math.tan(halfFov));
    const fitWidth = PLANET.radius / (widthFraction * Math.tan(halfFov) * this.camera.aspect);
    this.camera.position.set(0, 0, Math.max(fitHeight, fitWidth));
  };
}
