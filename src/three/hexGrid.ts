import { Vector3 } from 'three';

export interface HexTile {
  readonly id: number;
  readonly center: Vector3; // normalized, length = 1
  readonly latitude: number; // degrees [-90, +90]
  readonly corners: readonly Vector3[]; // 5 or 6 normalized vertices
  readonly neighborIds: readonly number[]; // adjacent tile IDs
  readonly isPentagon: boolean; // true for the 12 corner tiles
}

export interface HexSphereGrid {
  readonly tiles: readonly HexTile[];
  findNearestTileId(direction: Vector3): number;
}

/**
 * Builds a geodesic dual hex grid on the unit sphere.
 * Uses subdivided icosahedron dual construction: vertices become tile centers,
 * triangular face centroids become tile polygon corners.
 */
export function buildHexSphereGrid(subdivisions: number): HexSphereGrid {
  const lat = Math.atan(0.5);
  const yRing = Math.sin(lat);
  const rRing = Math.cos(lat);

  // 1. Initial 12 icosahedron vertices with poles at index 0 and 1
  const vertices: Vector3[] = [
    new Vector3(0, 1, 0), // North pole (idx 0)
    new Vector3(0, -1, 0), // South pole (idx 1)
  ];

  for (let i = 0; i < 5; i += 1) {
    const theta = (i * 2 * Math.PI) / 5;
    vertices.push(new Vector3(rRing * Math.cos(theta), yRing, rRing * Math.sin(theta)));
  }

  for (let i = 0; i < 5; i += 1) {
    const theta = (i * 2 * Math.PI) / 5 + Math.PI / 5;
    vertices.push(new Vector3(rRing * Math.cos(theta), -yRing, rRing * Math.sin(theta)));
  }

  // 2. Initial 20 faces with CCW outwards orientation
  let faces: [number, number, number][] = [];
  for (let i = 0; i < 5; i += 1) {
    const next = (i + 1) % 5;
    faces.push([0, 2 + next, 2 + i]);
  }
  for (let i = 0; i < 5; i += 1) {
    const next = (i + 1) % 5;
    faces.push([2 + i, 2 + next, 7 + i]);
    faces.push([2 + next, 7 + next, 7 + i]);
  }
  for (let i = 0; i < 5; i += 1) {
    const next = (i + 1) % 5;
    faces.push([1, 7 + i, 7 + next]);
  }

  // 3. Subdivide faces
  const middlePointCache = new Map<string, number>();
  function getMiddlePoint(p1: number, p2: number): number {
    const key = p1 < p2 ? `${p1}_${p2}` : `${p2}_${p1}`;
    const cached = middlePointCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const v1 = vertices[p1];
    const v2 = vertices[p2];
    if (!v1 || !v2) {
      throw new Error(`Invalid vertex indices: ${p1}, ${p2}`);
    }
    const mid = new Vector3().addVectors(v1, v2).normalize();
    const idx = vertices.length;
    vertices.push(mid);
    middlePointCache.set(key, idx);
    return idx;
  }

  for (let s = 0; s < subdivisions; s += 1) {
    const nextFaces: [number, number, number][] = [];
    for (const [v1, v2, v3] of faces) {
      const a = getMiddlePoint(v1, v2);
      const b = getMiddlePoint(v2, v3);
      const c = getMiddlePoint(v3, v1);
      nextFaces.push([v1, a, c], [v2, b, a], [v3, c, b], [a, b, c]);
    }
    faces = nextFaces;
  }

  return assembleGrid(vertices, faces);
}

function assembleGrid(vertices: Vector3[], faces: [number, number, number][]): HexSphereGrid {
  // 4. Compute face centroids (dual tile polygon corners)
  const faceCentroids = faces.map(([a, b, c]) => {
    const va = vertices[a];
    const vb = vertices[b];
    const vc = vertices[c];
    if (!va || !vb || !vc) {
      throw new Error(`Invalid face indices: ${a}, ${b}, ${c}`);
    }
    return new Vector3(
      va.x + vb.x + vc.x,
      va.y + vb.y + vc.y,
      va.z + vb.z + vc.z
    ).normalize();
  });

  // 5. Map vertices to incident faces and adjacent neighbors
  const vertexFaces: number[][] = Array.from({ length: vertices.length }, () => []);
  const neighborSets: Set<number>[] = Array.from({ length: vertices.length }, () => new Set());

  faces.forEach(([a, b, c], fIdx) => {
    const vfa = vertexFaces[a];
    const vfb = vertexFaces[b];
    const vfc = vertexFaces[c];
    const nsa = neighborSets[a];
    const nsb = neighborSets[b];
    const nsc = neighborSets[c];
    if (!vfa || !vfb || !vfc || !nsa || !nsb || !nsc) {
      return;
    }

    vfa.push(fIdx);
    vfb.push(fIdx);
    vfc.push(fIdx);

    nsa.add(b);
    nsa.add(c);
    nsb.add(a);
    nsb.add(c);
    nsc.add(a);
    nsc.add(b);
  });

  // 6. Build dual HexTiles
  const upRef = new Vector3();
  const uTan = new Vector3();
  const vBiTan = new Vector3();

  const tiles: HexTile[] = vertices.map((center, vIdx) => {
    const fIndices = vertexFaces[vIdx] ?? [];
    const isPentagon = fIndices.length === 5;

    // Tangent basis for sorting corners around normal center
    if (Math.abs(center.y) < 0.9) {
      upRef.set(0, 1, 0);
    } else {
      upRef.set(1, 0, 0);
    }

    uTan.crossVectors(upRef, center).normalize();
    vBiTan.crossVectors(center, uTan).normalize();

    // Sort incident face centroids in CCW order around outward normal
    const sortedFaceIndices = fIndices.slice().sort((fa, fb) => {
      const ca = faceCentroids[fa];
      const cb = faceCentroids[fb];
      if (!ca || !cb) {
        return 0;
      }
      const angleA = Math.atan2(ca.dot(vBiTan), ca.dot(uTan));
      const angleB = Math.atan2(cb.dot(vBiTan), cb.dot(uTan));
      return angleA - angleB;
    });

    const corners = sortedFaceIndices
      .map((fIdx) => faceCentroids[fIdx]?.clone())
      .filter((v): v is Vector3 => v !== undefined);
    const latitude = (Math.asin(Math.max(-1, Math.min(1, center.y))) * 180) / Math.PI;
    const neighborIds = Array.from(neighborSets[vIdx] ?? []);

    return {
      id: vIdx,
      center: center.clone(),
      latitude,
      corners,
      neighborIds,
      isPentagon,
    };
  });

  // 7. Fast nearest tile search via greedy hill climbing
  function findNearestTileId(direction: Vector3): number {
    const firstTile = tiles[0];
    if (!firstTile) {
      return 0;
    }
    let current = 0;
    let bestDot = direction.dot(firstTile.center);
    let improved = true;

    while (improved) {
      improved = false;
      const currentTile = tiles[current];
      if (!currentTile) {
        break;
      }
      for (const nId of currentTile.neighborIds) {
        const neighborTile = tiles[nId];
        if (!neighborTile) {
          continue;
        }
        const dot = direction.dot(neighborTile.center);
        if (dot > bestDot) {
          bestDot = dot;
          current = nId;
          improved = true;
        }
      }
    }
    return current;
  }

  return {
    tiles,
    findNearestTileId,
  };
}
