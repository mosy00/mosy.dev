import { Group, Mesh, SphereGeometry, type BufferGeometry, type Material, MeshStandardMaterial } from 'three';
import { PLANET } from './config';
import { createGraticule } from './graticule';


/**
 * The skills planet: one sphere mesh + a graticule overlay, wrapped in a
 * group that drag controls rotate. Skill "countries" will be attached to
 * this same group in a later step.
 */
export class Planet {
  public readonly object3D = new Group();
  private readonly surfaceGeometry: SphereGeometry;
  private readonly graticuleGeometry: BufferGeometry;
  private readonly materials: Material[] = [];
  private elapsedTime = 0;

  constructor() {
    const { radius, segments } = PLANET;

    this.surfaceGeometry = new SphereGeometry(radius, segments, segments);
    const surfaceMaterial = new MeshStandardMaterial({
      color: PLANET.baseColor,
      roughness: 0.5,
      metalness: 0.3,
    });
    this.materials.push(surfaceMaterial);
    const surface = new Mesh(this.surfaceGeometry, surfaceMaterial);

    const graticule = createGraticule({
      radius: radius * 1.004,
      latBands: PLANET.graticule.latBands,
      meridians: PLANET.graticule.meridians,
      color: PLANET.gridColor,
      opacity: PLANET.graticule.opacity,
    });
    this.graticuleGeometry = graticule.geometry;
    this.materials.push(graticule.material);

    this.object3D.add(surface, graticule.line);
    this.object3D.rotation.x = PLANET.initialTilt;
  }

  update(deltaTime: number): void {
    this.elapsedTime += deltaTime;
    this.object3D.position.y = Math.sin(this.elapsedTime * PLANET.floatSpeed) * PLANET.floatAmplitude;
  }

  dispose(): void {
    this.surfaceGeometry.dispose();
    this.graticuleGeometry.dispose();
    for (const material of this.materials) {
      material.dispose();
    }
    this.object3D.clear();
  }
}
