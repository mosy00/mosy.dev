# Internal Module Contracts: Hex Planet Lands

**Branch**: `001-hex-planet-lands` | **Date**: 2026-09-28 | **Spec**: [spec.md](../spec.md)

This document formalizes the TypeScript module interfaces and behavioral
contracts for the hexagonal landmass system.

---

## 1. Module Overview

| Module | Responsibility | Key Export(s) |
|---|---|---|
| `src/three/config.ts` | Configuration constants for hex resolution, jitter, and polar lands. | `HEX`, `POLAR`, updated `REGIONS` |
| `src/three/hexGrid.ts` | Dual-geodesic lattice generation (hexagonal tiling of $S^2$). | `buildHexSphereGrid(subdivisions: number): HexSphereGrid` |
| `src/three/skillRegions.ts` | Landmass assignment, connectivity flood-fill, and mesh creation. | `buildSkillIslands(skills: readonly SkillArea[]): SkillIslandsBuild` |
| `src/three/polarLands.ts` | Non-interactive ice caps at north/south poles. | `buildPolarLands(grid: HexSphereGrid): PolarLandsBuild` |
| `src/three/Planet.ts` | Planet composition, adding polar meshes to dragGroup, preserving meshes contract. | `Planet` class |

---

## 2. Interface Definitions

### 2.1 `src/three/hexGrid.ts`

```typescript
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
 * triangular faces become tile corners.
 */
export function buildHexSphereGrid(subdivisions: number): HexSphereGrid;
```

### 2.2 `src/three/polarLands.ts`

```typescript
import { Mesh } from 'three';
import { HexSphereGrid } from './hexGrid';

export interface PolarLandsBuild {
  /** The 2 merged meshes (north and south caps). Added to scene, never raycasted. */
  readonly meshes: readonly Mesh[];
  dispose(): void;
}

/**
 * Builds white figurative ice cap meshes for north and south poles from the hex grid.
 * Configured via POLAR.thresholdLat and POLAR.color.
 */
export function buildPolarLands(grid: HexSphereGrid): PolarLandsBuild;
```

### 2.3 `src/three/skillRegions.ts`

```typescript
import { Mesh, Vector3 } from 'three';
import type { SkillArea } from '../data/skills';

export interface SkillIslandsBuild {
  /** One merged faceted mesh per skill with vertex colors. */
  readonly meshes: Mesh[];
  /** One representative direction per skill (primary seed) for tour targeting. */
  readonly skillDirections: readonly Vector3[];
  dispose(): void;
}

/**
 * Partitions the hex grid among skills, enforcing:
 * 1. Single connected component per skill (flood fill).
 * 2. More than 30 tiles per skill (growth loop).
 * 3. Subtle shade variation per tile (vertex colors).
 */
export function buildSkillIslands(skills: readonly SkillArea[]): SkillIslandsBuild;
```

---

## 3. Behavioral Contracts

### Contract 1: Raycaster Target Invariance (`Planet.meshes`)
- **Caller**: `main.ts` -> `PlanetInteraction`
- **Guarantee**: `planet.meshes` MUST contain ONLY skill landmass meshes (`mesh.userData['skillId'] !== undefined`).
- **Guarantee**: `polarLands.meshes` and `ocean` MUST NOT be in `planet.meshes`.
- **Outcome**: Raycaster never triggers hover/select events on polar caps or ocean (satisfies FR-007, SC-004).

### Contract 2: Landmass Single Connectivity & Tile Floor (`INV-01`, `INV-02`)
- **Caller**: `Planet` constructor calling `buildSkillIslands(skills)`
- **Guarantee**: For each `skill` in `skills`:
  - `tiles.length >= 31` (strictly $> 30$).
  - For any two tiles $A, B$ in the landmass, there exists a path of adjacent tiles within the landmass connecting $A$ and $B$.
  - Disconnected patches or islands belonging to the same skill ID are purged.

### Contract 3: Open-Ocean Moat (`INV-04`)
- **Caller**: `buildSkillIslands` and `buildPolarLands`
- **Guarantee**: No tile with $|\text{latitude}| \ge \text{POLAR.thresholdLat}$ will ever be assigned to a skill.
- **Guarantee**: No skill landmass will be within angular distance $\theta_{moat} < 10^\circ$ of polar lands.
