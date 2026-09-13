import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments } from 'three';

interface GraticuleOptions {
  readonly radius: number;
  readonly latBands: number;
  readonly meridians: number;
  readonly color: number;
  readonly opacity: number;
  readonly segmentsPerCircle?: number;
}

export interface Graticule {
  readonly line: LineSegments;
  readonly geometry: BufferGeometry;
  readonly material: LineBasicMaterial;
}


/**
 * Builds a low-cost lat/long "graticule" as line segments.
 * One draw call, a few thousand vertices — a placeholder grid that
 * hints at the skill "countries" that will be carved later.
 */
export function createGraticule(options: GraticuleOptions): Graticule {
  const { radius, latBands, meridians, color, opacity } = options;
  const segments = options.segmentsPerCircle ?? 96;
  const positions: number[] = [];

  // Latitude rings (excluding the exact poles).
  for (let band = 1; band < latBands; band += 1) {
    const phi = (band / latBands) * Math.PI;
    const ringRadius = radius * Math.sin(phi);
    const y = radius * Math.cos(phi);
    for (let i = 0; i < segments; i += 1) {
      const angle0 = (i / segments) * Math.PI * 2;
      const angle1 = ((i + 1) / segments) * Math.PI * 2;
      positions.push(Math.cos(angle0) * ringRadius, y, Math.sin(angle0) * ringRadius);
      positions.push(Math.cos(angle1) * ringRadius, y, Math.sin(angle1) * ringRadius);
    }
  }

  // Longitude meridians, pole to pole.
  for (let m = 0; m < meridians; m += 1) {
    const theta = (m / meridians) * Math.PI * 2;
    for (let i = 0; i < segments; i += 1) {
      const phi0 = (i / segments) * Math.PI;
      const phi1 = ((i + 1) / segments) * Math.PI;
      positions.push(
        radius * Math.sin(phi0) * Math.cos(theta),
        radius * Math.cos(phi0),
        radius * Math.sin(phi0) * Math.sin(theta),
      );
      positions.push(
        radius * Math.sin(phi1) * Math.cos(theta),
        radius * Math.cos(phi1),
        radius * Math.sin(phi1) * Math.sin(theta),
      );
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const material = new LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const line = new LineSegments(geometry, material);
  return { line, geometry, material };
}
