import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { HEX, PLANET, POLAR, REGIONS } from './config';
import type { HexSphereGrid } from './hexGrid';

export interface PolarLandsBuild {
  /** The 2 merged meshes (north and south caps). Added to scene, never raycasted. */
  readonly meshes: readonly Mesh[];
  dispose(): void;
}

function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

/**
 * Builds white figurative ice cap meshes for north and south poles from the hex grid.
 * Guaranteed invariants:
 * - Uses the same hex geometry system and raise as skill lands
 * - White ice-like color with per-tile shade jitter for readable hex facets
 * - Excluded from raycasting (tagged userData.isPolar = true)
 * - Separated from skill lands by guaranteed open-ocean moat
 */
export function buildPolarLands(grid: HexSphereGrid): PolarLandsBuild {
  const tiles = grid.tiles;
  const landRadius = PLANET.radius * REGIONS.raise;

  const northTiles = tiles.filter((t) => t.latitude >= POLAR.thresholdLat);
  const southTiles = tiles.filter((t) => t.latitude <= -POLAR.thresholdLat);

  const meshes: Mesh[] = [];
  const baseColor = new Color(POLAR.color);
  const baseHSL = { h: 0, s: 0, l: 0 };
  baseColor.getHSL(baseHSL);

  const caps = [
    { name: 'polar-north', tiles: northTiles },
    { name: 'polar-south', tiles: southTiles },
  ];

  for (const cap of caps) {
    if (cap.tiles.length === 0) {
      continue;
    }

    let totalTriangles = 0;
    for (const tile of cap.tiles) {
      totalTriangles += tile.corners.length;
    }

    const positions = new Float32Array(totalTriangles * 9);
    const normals = new Float32Array(totalTriangles * 9);
    const colors = new Float32Array(totalTriangles * 9);

    const tempColor = new Color();
    let triOffset = 0;

    for (const tile of cap.tiles) {
      // Deterministic per-tile shade variation
      const jitter = (pseudoRandom(tile.id * 17 + 83) - 0.5) * 2 * HEX.shadeJitter;
      const tileLightness = Math.max(0.7, Math.min(1.0, baseHSL.l + jitter));
      tempColor.setHSL(baseHSL.h, baseHSL.s, tileLightness);

      const centerPos = tile.center.clone().multiplyScalar(landRadius);
      const cornerCount = tile.corners.length;

      for (let cIdx = 0; cIdx < cornerCount; cIdx += 1) {
        const c0 = tile.corners[cIdx]!.clone().multiplyScalar(landRadius);
        const c1 = tile.corners[(cIdx + 1) % cornerCount]!.clone().multiplyScalar(landRadius);

        // Compute flat facet outward normal
        const edge0 = new Vector3().subVectors(c0, centerPos);
        const edge1 = new Vector3().subVectors(c1, centerPos);
        const facetNormal = new Vector3().crossVectors(edge0, edge1).normalize();

        const pIdx = triOffset * 9;

        // Vertex 0: center
        positions[pIdx] = centerPos.x;
        positions[pIdx + 1] = centerPos.y;
        positions[pIdx + 2] = centerPos.z;
        normals[pIdx] = facetNormal.x;
        normals[pIdx + 1] = facetNormal.y;
        normals[pIdx + 2] = facetNormal.z;
        colors[pIdx] = tempColor.r;
        colors[pIdx + 1] = tempColor.g;
        colors[pIdx + 2] = tempColor.b;

        // Vertex 1: c0
        positions[pIdx + 3] = c0.x;
        positions[pIdx + 4] = c0.y;
        positions[pIdx + 5] = c0.z;
        normals[pIdx + 3] = facetNormal.x;
        normals[pIdx + 4] = facetNormal.y;
        normals[pIdx + 5] = facetNormal.z;
        colors[pIdx + 3] = tempColor.r;
        colors[pIdx + 4] = tempColor.g;
        colors[pIdx + 5] = tempColor.b;

        // Vertex 2: c1
        positions[pIdx + 6] = c1.x;
        positions[pIdx + 7] = c1.y;
        positions[pIdx + 8] = c1.z;
        normals[pIdx + 6] = facetNormal.x;
        normals[pIdx + 7] = facetNormal.y;
        normals[pIdx + 8] = facetNormal.z;
        colors[pIdx + 6] = tempColor.r;
        colors[pIdx + 7] = tempColor.g;
        colors[pIdx + 8] = tempColor.b;

        triOffset += 1;
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

    const material = new MeshStandardMaterial({
      vertexColors: true,
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
    dispose() {
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        (mesh.material as MeshStandardMaterial).dispose();
      }
    },
  };
}
