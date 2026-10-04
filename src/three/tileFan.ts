import { Color, Vector3 } from 'three';
import type { HexTile } from './hexGrid';

export interface TileFanGeometry {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly colors: Float32Array;
}

/**
 * Shared flush fan-builder for every surface kind on the planet
 * (skill lands, ocean tiles, polar caps). Every vertex lands on
 * `center|corner × radius`, so callers passing the same radius get a
 * watertight shell with zero padding by construction — the single
 * enforcement point for FR-001 flushness.
 */
export function buildTileFan(
  tiles: readonly HexTile[],
  tileIds: readonly number[],
  radius: number,
  colorForTile: (tile: HexTile) => Color,
): TileFanGeometry {
  let totalTriangles = 0;
  for (const tileId of tileIds) {
    const tile = tiles[tileId];
    if (tile) {
      totalTriangles += tile.corners.length;
    }
  }

  const positions = new Float32Array(totalTriangles * 9);
  const normals = new Float32Array(totalTriangles * 9);
  const colors = new Float32Array(totalTriangles * 9);

  const centerPos = new Vector3();
  const cornerA = new Vector3();
  const cornerB = new Vector3();
  const edgeA = new Vector3();
  const edgeB = new Vector3();
  const facetNormal = new Vector3();

  let triOffset = 0;
  for (const tileId of tileIds) {
    const tile = tiles[tileId];
    if (!tile) {
      continue;
    }
    const tileColor = colorForTile(tile);
    const cornerCount = tile.corners.length;
    centerPos.copy(tile.center).multiplyScalar(radius);

    for (let cIdx = 0; cIdx < cornerCount; cIdx += 1) {
      cornerA.copy(tile.corners[cIdx]!).multiplyScalar(radius);
      cornerB.copy(tile.corners[(cIdx + 1) % cornerCount]!).multiplyScalar(radius);

      edgeA.subVectors(cornerA, centerPos);
      edgeB.subVectors(cornerB, centerPos);
      facetNormal.crossVectors(edgeA, edgeB).normalize();

      const pIdx = triOffset * 9;
      positions[pIdx] = centerPos.x;
      positions[pIdx + 1] = centerPos.y;
      positions[pIdx + 2] = centerPos.z;
      positions[pIdx + 3] = cornerA.x;
      positions[pIdx + 4] = cornerA.y;
      positions[pIdx + 5] = cornerA.z;
      positions[pIdx + 6] = cornerB.x;
      positions[pIdx + 7] = cornerB.y;
      positions[pIdx + 8] = cornerB.z;

      for (let v = 0; v < 3; v += 1) {
        normals[pIdx + v * 3] = facetNormal.x;
        normals[pIdx + v * 3 + 1] = facetNormal.y;
        normals[pIdx + v * 3 + 2] = facetNormal.z;
        colors[pIdx + v * 3] = tileColor.r;
        colors[pIdx + v * 3 + 1] = tileColor.g;
        colors[pIdx + v * 3 + 2] = tileColor.b;
      }

      triOffset += 1;
    }
  }

  return { positions, normals, colors };
}