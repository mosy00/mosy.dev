import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  FrontSide,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { HEX, OCEAN, PLANET } from './config';
import type { HexSphereGrid } from './hexGrid';
import { buildTileFan } from './tileFan';

export interface OceanShellBuild {
  readonly mesh: Mesh;
  readonly tileCount: number;
  dispose(): void;
}

function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

/**
 * US1/US6 — One merged hex ocean shell at the shared flush radius.
 * Covers every tile NOT owned by a skill land or a polar cap; carries NO
 * skillId userData and is never a raycast target (FR-003). Slightly
 * transparent (OCEAN.opacity) so far-side lands read through the water;
 * FrontSide culling keeps the sea's own far hemisphere and interior out of
 * the framebuffer, so what shows through is always a land or the page glow.
 */
export function buildOceanShell(
  grid: HexSphereGrid,
  excludedTileIds: ReadonlySet<number>,
): OceanShellBuild {
  const tiles = grid.tiles;
  const oceanIds = tiles.filter((tile) => !excludedTileIds.has(tile.id)).map((tile) => tile.id);

  const baseColor = new Color(OCEAN.color);
  const baseHSL = { h: 0, s: 0, l: 0 };
  baseColor.getHSL(baseHSL);
  const tempColor = new Color();

  const fan = buildTileFan(tiles, oceanIds, PLANET.radius, (tile) => {
    const jitter = (pseudoRandom(tile.id * 29 + 101) - 0.5) * 2 * HEX.shadeJitter;
    const tileLightness = Math.max(0.15, Math.min(0.9, baseHSL.l + jitter));
    return tempColor.setHSL(baseHSL.h, baseHSL.s, tileLightness).clone();
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(fan.positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(fan.normals, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(fan.colors, 3));

  const material = new MeshStandardMaterial({
    vertexColors: true,
    transparent: true,
    opacity: OCEAN.opacity,
    // Front-face-only culling keeps the sea's own far hemisphere and interior
    // out of the framebuffer, so you see far-side LANDS (both-sided) through
    // the water rather than a jumbled second sea (research D2).
    side: FrontSide,
    flatShading: true,
    roughness: OCEAN.roughness,
    metalness: OCEAN.metalness,
  });

  return {
    mesh: new Mesh(geometry, material),
    tileCount: oceanIds.length,
    dispose(): void {
      geometry.dispose();
      material.dispose();
    },
  };
}
