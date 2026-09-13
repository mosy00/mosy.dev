import {
  ACESFilmicToneMapping,
  Clock,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  type Light,
} from 'three';
import { CAMERA, RENDERER } from './config';
import { Planet } from './Planet';
import { PlanetControls } from './PlanetControls';

/**
 * Owns the renderer, scene, camera, lights and the render loop.
 * The planet stays fixed behind the page content (the canvas is
 * position: fixed) and reacts to pointer drags with inertia.
 */
export class Experience {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly planet = new Planet();
  private readonly controls: PlanetControls;
  private readonly clock = new Clock();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER.maxPixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(RENDERER.clearColor, RENDERER.clearAlpha);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.camera = new PerspectiveCamera(
      CAMERA.fov,
      window.innerWidth / window.innerHeight,
      CAMERA.near,
      CAMERA.far,
    );
    this.camera.position.set(CAMERA.position.x, CAMERA.position.y, CAMERA.position.z);

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

  private readonly handleResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    this.renderer.setSize(width, height);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    const isLandscape = aspect > 1;
    this.planet.object3D.position.x = isLandscape ? CAMERA.offsetX : 0;
    this.camera.position.z = isLandscape ? CAMERA.position.z : CAMERA.mobileZ;
  };
}
