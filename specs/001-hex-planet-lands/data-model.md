# Data Model: Hex Planet Lands

**Branch**: `001-hex-planet-lands` | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

This document formalizes the entities, value objects, lifecycle, and validation
invariants for the hexagonal landmass system on the skills globe.

---

## 1. Domain Entities & Value Objects

```text
                  +-----------------------------------+
                  |           HexSphereGrid           |
                  |  (geodesic dual lattice, N tiles) |
                  +-----------------+-----------------+
                                    | 1:N
                                    v
                          +-------------------+
                          |      HexTile      |
                          |  (id, center,     |
                          |   corners[5|6],   |
                          |   neighbors[5|6]) |
                          +---------+---------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v (assigned to)                                     v (assigned to)
+-----------------------+                           +-------------------+
|     SkillLandmass     |                           |   PolarLandmass   |
| (skill, tiles[>30],   |                           | (pole, tiles,     |
|  mesh, seedDirection) |                           |  mesh, isCap)     |
+-----------------------+                           +-------------------+
```

### 1.1 `HexTile` (Lattice Cell)
The discrete hexagonal spatial quantum on the unit sphere $S^2$.

- **`id`**: `number` (0-indexed integer uniquely identifying the cell in the lattice).
- **`center`**: `Vector3` (normalized direction vector on unit sphere, $\|c\| = 1$).
- **`latitude`**: `number` (in degrees, derived as $\arcsin(c.y) \times \frac{180}{\pi}$, range $[-90, +90]$).
- **`corners`**: `readonly Vector3[]` (5 or 6 coplanar/spherical vertex coordinates defining the tile perimeter in counter-clockwise winding relative to outwards normal, $\|v\| = 1$).
  - Exactly 12 cells across the sphere have 5 corners (pentagons from the dual of the 12 icosahedron corners).
  - All remaining cells have 6 corners (regular hexagons).
- **`neighborIds`**: `readonly number[]` (array of 5 or 6 adjacent tile IDs sharing an edge).
- **`shadeJitter`**: `number` (deterministic lightness delta in $[-0.06, +0.06]$ computed via pseudo-random hash of `center` / `id`).

### 1.2 `HexSphereGrid` (Dual Geodesic Lattice)
The complete spherical partition.

- **`tiles`**: `readonly HexTile[]` (~1,300–1,600 tiles at subdivision frequency $f$).
- **`adjacency`**: Map or index array mapping `tileId -> readonly number[]`.
- **`findNearestTile(dir: Vector3)`**: helper method to find the closest tile cell for seed anchoring.

### 1.3 `SkillLandmass` (Connected Skill Territory)
The single continuous land mass dedicated to one portfolio skill.

- **`skill`**: `SkillArea` (from `src/data/skills.ts`: `id`, `name`, `category`, `expertise`, `description`, etc.).
- **`tileIds`**: `Set<number>` (set of tile IDs belonging to this skill).
- **`primaryDirection`**: `Vector3` (centroid / primary anchor direction for scroll tour targeting).
- **`mesh`**: `Mesh<BufferGeometry, MeshStandardMaterial>` (merged 3D mesh raised to `PLANET.radius * REGIONS.raise`).
  - `geometry`: contains flat-shaded faceted positions and vertex-attribute colors (`color` attribute with base HSL + `shadeJitter`).
  - `userData`: `{ skillId: skill.id }` (for raycasting interaction pick).

### 1.4 `PolarLandmass` (Non-Interactive Ice Cap)
The figurative white ice cap at a pole.

- **`pole`**: `'north' | 'south'`.

---

## 2. Invariants & Business Rules

| Rule ID | Statement | Enforced By |
|---|---|---|
| **INV-01 (FR-003)** | Every `SkillLandmass` MUST contain $> 30$ tiles (`tileIds.size >= 31`). | `buildSkillIslands` growth loop: if post-flood-fill count $< 31$, increment radius by step $\delta$ until condition holds. |
| **INV-02 (FR-003)** | Every `SkillLandmass` MUST form exactly ONE connected component. | Graph flood-fill over `neighborIds`: retain the single largest connected component containing the primary seed; drop or reassign disconnected satellites. |
| **INV-03 (FR-007)** | `PolarLandmass` meshes MUST NOT be returned in `Planet.meshes`. | `Planet.meshes` returns strictly `islands.meshes`. Polar meshes are added to `dragGroup` directly. |
| **INV-04 (FR-008)** | No `SkillLandmass` may share tiles or touch `PolarLandmass`. | Seed latitudes clamped to $[-\text{REGIONS.maxLatitude}, +\text{REGIONS.maxLatitude}]$ ($42^\circ$), while polar cap starts at $\ge 55^\circ$, ensuring a minimum open-ocean moat $\ge 13^\circ$. |
| **INV-05 (FR-002)** | All tiles in a landmass must be visually distinct without grout gaps. | Vertex colors per tile modulate the base skill HSL lightness by `shadeJitter` ($\pm 6\%$). Shared edge vertices are co-located (zero gap), normal is facet-based. |
| **INV-06 (FR-001)** | Total non-hex tiles on the entire sphere MUST NOT exceed 12. | Mathematical consequence of Euler's formula on Goldberg dual polyhedron $V - E + F = 2$. Exactly 12 pentagons, 2 situated at polar axis vertices. |

---

## 3. State Transitions & Lifecycle

Since the planet landmasses are procedural and static during runtime, the lifecycle is divided into **Load-Time Generation** and **Runtime Interaction**:

### 3.1 Load-Time Generation Pipeline (Synchronous, $< 20\text{ms}$)

```text
[1. Generate HexSphereGrid]
       |
       v
[2. Identify Polar Landmasses] (tiles with |lat| >= thresholdLat)
       |
       v
[3. Generate Skill Seeds] (Fibonacci spiral within [-42°, +42°])
       |
       v
[4. Tile Distance & Noise Assignment]
       |
       v
[5. Enforce Single-Component Flood Fill] (INV-02)
       |
       v
[6. Verify Density Floor (count >= 31)] (INV-01)
       |  (if < 31: expand radius and repeat steps 4-5)
       v
[7. Assemble Merged BufferGeometries with Vertex Colors]
       |
       +--> islands.meshes (10 meshes with userData.skillId)
       +--> polarMeshes (2 meshes with userData.isPolar)
```

### 3.2 Runtime Interaction State

- **`Idle`**:
  - `Planet.setHighlighted(null)`: all skill island materials have `emissiveIntensity = HIGHLIGHT.base` (or `dimmed`).
  - Polar caps remain static white.
- **`Hover(skillId)`**:
  - `Planet.setHighlighted(skillId)`: matching mesh transitions `emissiveIntensity -> HIGHLIGHT.active` (1.35) via GSAP; others dim to `HIGHLIGHT.dimmed` (0.05).
  - Info card displays skill name, expertise, and description.
  - Hovering polar caps or ocean triggers `Hover(null)`.
- **`Tour Target Transition`**:
  - `Planet.tourTargets` calculates camera yaw/pitch angles pointing at each `SkillLandmass.primaryDirection`. Polar caps have no tour targets.

- **`tileIds`**: `Set<number>` (tiles whose center latitude satisfies $|\text{lat}| \ge \text{POLAR.thresholdLat}$).
- **`mesh`**: `Mesh<BufferGeometry, MeshStandardMaterial>` (merged 3D mesh raised to `PLANET.radius * REGIONS.raise`).
  - `geometry`: vertex colors with ice-white palette + `shadeJitter`.
  - `userData`: `{ isPolar: true }` (explicitly excluded from skill raycasting).
