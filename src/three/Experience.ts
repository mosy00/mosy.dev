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

    this.controls = new PlanetControls({ domElement: canvas, target: this.planet.object3D });

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    this.renderer.setAnimationLoop(this.tick);
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
   * Fits the planet to the canvas: the sphere spans `fit.heightFraction` of
   * the viewport height (portrait screens fall back to a width fit) and the
   * camera always looks straight at the centered planet.
   */
  private readonly handleResize = (): void => {
    const width = Math.max(this.canvas.clientWidth, 1);
    const height = Math.max(this.canvas.clientHeight, 1);
    this.renderer.setSize(width, height, false);

    const aspect = width / height;
    this.camera.aspect = aspect;
    const halfFov = MathUtils.degToRad(CAMERA.fov / 2);
    const fitHeight = PLANET.radius / (CAMERA.fit.heightFraction * Math.tan(halfFov));
    const fitWidth = PLANET.radius / (CAMERA.fit.widthFraction * Math.tan(halfFov) * aspect);
    this.camera.position.set(0, 0, Math.max(fitHeight, fitWidth));
    this.camera.updateProjectionMatrix();
  };
}
