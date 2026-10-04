# Data Model: Planet Visual Refinements

**Feature**: `002-planet-visual-refinements` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

All entities are runtime/in-memory (procedural world, no storage). Validation rules cite the FRs they come from; invariants carry the feature-001 INV ids still in force (spec assumptions).

## HexTile (unchanged, `hexGrid.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | 0 … 2561 (detail=4) |
| `center` | `Vector3` (unit) | tile direction |
| `corners` | `Vector3[]` (unit) | fan polygon (6 corners, 12 pentagons have 5) |
| `latitude` | `number` (deg) | from `center.y` |
| `neighborIds` | `number[]` | shared-edge adjacency (icosphere faces) |

Unchanged — `hexGrid.ts` is read-only this feature.

## TileKind & SurfaceShell (new classification, FR-002)

- **`TileKind = 'land' | 'ocean' | 'ice'`** — exactly one kind per tile; the three sets form a **partition of all 2562 tiles** (validation: `land + ice + ocean = 2562`, measured 955 + 206 + 1401 with real data).
- **SurfaceShell** = the union of the three mesh groups, every vertex at `radius = PLANET.radius` (1.15). `REGIONS.raise` no longer exists — flush by construction (FR-001).
  - `ocean mesh`: 1 merged mesh, `opacity 0.75`, `FrontSide`, color `OCEAN.color = #74c0ec` + ±`HEX.shadeJitter` (FR-002/005, D2).
  - `land meshes`: 10 per-skill meshes (unchanged material contract for highlight).
  - `ice meshes`: 2 (north/south), `isPolar` userData, never raycast-reported (FR-008/009).

## SkillLandmass (reworked, `skillRegions.ts`)

| Field | Type | Validation |
|---|---|---|
| `skillId` / `skillName` | from `SkillArea` | unchanged userData contract |
| `tileIds` | `number[]` | **>30 tiles** (INV-01/FR-009), **exactly one connected component** after flood fill (INV-02), no tile adjacent to another skill's tiles (erosion pass → "no collide/merge", edge case) |
| `shapeProfile` | `{ aspect: 0.80–1.12, lobes: 3\|4\|5, phase: 0–2π, amp: 0.10–0.17 }` | deterministic from `skillIndex`; distinct per skill (FR-006) |
| `radius` | `0.187 + 0.233 × clamp(expertise, 0.4, 1.0)` | monotone; `tileCount(1.0) ≥ 2 × tileCount(0.4)` (FR-007, measured 2.18–2.84×) |
| `seeds` | primary + `1 + round(e·2) − 1` satellites | all within `REGIONS.maxLatitude = 38°` + jitter; satellite offset ≤ 0.7·r |
| latitude extent | any tile `\|lat\| ≤ REGIONS.maxLandLat = 60°` | guarantees ≥6.5° moat to caps at 66.5° (FR-009 moat; measured 6.5–10.7°) |

State transitions: none (rebuilt once at boot; "rebuild" = reload after data edit — sizing/shape are pure functions of `SKILL_AREAS`).

## OceanRegion (new, `oceanTiles.ts`)

`{ tileIds: all tiles not in land ∪ caps }` — never interactive: no `skillId` userData, not a raycast target; hover returns `null` (FR-003). Light blue, ~75 % opaque, shade-jittered so hex facets read (INV-05 applied to ocean too).

## PolarCap (reworked, `polarLands.ts`)

| Field | Value | Validation |
|---|---|---|
| `hemisphere` | `'north' \| 'south'` | symmetric thresholds |
| `tileIds` | `latitude ≥ ±POLAR.thresholdLat`, **`thresholdLat = 66.5`** | 103 tiles/hemisphere, **connected**, white, non-interactive (FR-008; measured vs 233 at old 55°) |
| radius | `PLANET.radius` (flush) | no step vs ocean/land (FR-001) |

## TourMotion (reworked, `planetTour.ts` + `config.ts`)

| Field | Value | Validation |
|---|---|---|
| `sweepYaw` | `π` (~180°), `tourGroup.rotation.y` only | poles stay up: **pitch is never written** (FR-004; drift 0° ≤ SC-002's 10°) |
| `growth` | `object3D.scale 1 → 1.3`, same scrubbed timeline | +30 % apparent diameter (SC-002) |
| `entry` | camera fit `1.15/1.15` ⇒ `D = 1.15 × min(w,h)` | cropped at first glance on every viewport (FR-004; measured 10/10) |
| `scrub` | `0.8` (unchanged) | SC-007 parity |
| states | `scroll-driven (default)` ⇄ `static` (reduced motion: no timeline, scale 1, yaw 0) | boot-time switch (FR-012/SC-008) |

## AmbientMotion state (new, FR-012 + Constitution III)

`{ reducedMotion: boolean }` — when true: idle spin target `0` (PlanetControls), float bob skipped (Planet), tour static. Drag/inertia/hover/legend/keyboard unaffected (SC-007 subset of SC-008). Not part of FR-009's preserved list.

## Relationships

```text
SkillArea (data) ──1:N──> SkillLandmass ──owns──> land tiles (partition)
                       └─N:1─ shapeProfile, radius(expertise)
SurfaceShell = land tiles ∪ ocean tiles ∪ ice tiles = 2562 (partition)
PolarCap (2) ──adjacent-to-nothing─ SkillLandmass (≥6.5° moat, enforced by 60° cap)
TourMotion ──drives──> planet.tourGroup.rotation.y + planet.object3D.scale
AmbientMotion ──gates──> TourMotion, PlanetControls.idleSpeed, Planet float
```
