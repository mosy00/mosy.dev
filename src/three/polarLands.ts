import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { HEX, PLANET, POLAR } from './config';
import type { HexSphereGrid } from './hexGrid';
import { buildTileFan } from './tileFan';

export interface PolarLandsBuild {
  /** The 2 merged meshes (north and south caps). Added to scene, never raycasted. */
  readonly meshes: readonly Mesh[];
  /** Tile ids covered by either cap (for ocean exclusion in US1). */
  readonly capTileIds: ReadonlySet<number>;
  dispose(): void;
}

function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

/**
 * Builds white figurative ice cap meshes for north and south poles from the
 * hex grid at the shared flush radius (no "raise"). Same fan-builder, same
 * per-tile shade jitter language as the skill lands.
 */
export function buildPolarLands(grid: HexSphereGrid): PolarLandsBuild {
  const tiles = grid.tiles;

  const northIds = tiles.filter((t) => t.latitude >= POLAR.thresholdLat).map((t) => t.id);
  const southIds = tiles.filter((t) => t.latitude <= -POLAR.thresholdLat).map((t) => t.id);
  const capTileIds = new Set<number>([...northIds, ...southIds]);

  const meshes: Mesh[] = [];
  const baseColor = new Color(POLAR.color);
  const baseHSL = { h: 0, s: 0, l: 0 };
  baseColor.getHSL(baseHSL);

  const caps = [
    { name: 'polar-north', tileIds: northIds },
    { name: 'polar-south', tileIds: southIds },
  ];

  for (const cap of caps) {
    if (cap.tileIds.length === 0) {
      continue;
    }

    const tempColor = new Color();
    const fan = buildTileFan(tiles, cap.tileIds, PLANET.radius, (tile) => {
      const jitter = (pseudoRandom(tile.id * 17 + 83) - 0.5) * 2 * HEX.shadeJitter;
      const tileLightness = Math.max(0.7, Math.min(1.0, baseHSL.l + jitter));
      return tempColor.setHSL(baseHSL.h, baseHSL.s, tileLightness).clone();
    });

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(fan.positions, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(fan.normals, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(fan.colors, 3));

    const material = new MeshStandardMaterial({
      vertexColors: true,
      // Same both-sides reasoning as the skill lands, so the far polar cap shows
      // through the translucent sea near the pole.
      side: DoubleSide,
      roughness: POLAR.roughness,
      metalness: POLAR.metalness,
      flatShading: true,
    });

    const mesh = new Mesh(geometry, material);
    mesh.userData = { isPolar: true, capName: cap.name };
    meshes.push(mesh);
  }

  return {
    meshes,
    capTileIds,
    dispose() {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        (mesh.material as MeshStandardMaterial).dispose();
      }
    },
  };
}
