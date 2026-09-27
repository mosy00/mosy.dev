# Research: Hex Planet Lands

Feature: hex-tile lands (>30/land) + white polar lands
Date: 2026-09-28 · Constraint: current stack; new libs allowed only if clearly better

## R1 — How do you tile a sphere with hexagons?

**Decision**: Dual of a subdivided icosahedron (a Goldberg-style geodesic
grid): build a geodesic icosphere, then place one tile per triangle-pair
around each original vertex — every interior vertex of an icosphere has
exactly 6 face-neighbors, which yields a true hexagon; the 12 icosahedron
corner vertices have 5 neighbors and yield **exactly 12 pentagons**
(Euler's theorem: a sphere tiled with hexes+pentagons must have 12
pentagons — hex-only tiling is mathematically impossible). Orientation
decides where those 12 sit — see R2 for the handling.

**Rationale**: this is the only construction that produces genuine
six-sided tiles with honeycomb adjacency (edge-to-edge, FR-002) on a
sphere; the same lattice doubles as the land-assignment grid.

**Alternatives considered**:
- Spherical Voronoi from random points — cells are irregular polygons
  (often 5–8 sides); fails FR-001's readable-hexagon requirement.
- Latitudinal hex bands (cylindrical mapping) — pure hexes but a hard seam
  ring at the "equator wrap" and bad distortion near poles; looks banded.
- Grouping the existing triangle mesh's triangles into hexes — equivalent
  to the dual construction above; kept as an implementation insight, not
  an alternative.

## R2 — Where do the unavoidable 12 pentagons go?

**Decision**: orient the base icosahedron with vertices at both poles →
2 pentagons land exactly at the poles, INSIDE the white polar caps. The
remaining 10 pentagons fall in mid-latitudes: they get the same shade
treatment as hexes and are covered by the spec's wrapping-irregularity
assumption; they are distributed by construction so at most 1–2 ever touch
a skill land, and a pentagon inside a land still reads as "a tile" at
default distance. Documented tolerance: ≤12 non-hex tiles planet-wide,
of which 2 are invisible (white-on-white at poles).

**Rationale**: Euler's theorem can't be voted down; parking 2 at the poles
maximizes how few irregularities are visible where the spec is strict
(skill lands). The alternative constructions all trade more regularity for
worse topology.

**Alternatives considered**: subdividing pentagons into hexes (creates
overlapping/over-sized tiles), or leaving a hole ring at pentagons (holes
read as bugs — worse than a rare pentagon).

## R3 — How many tiles? (the >30-per-land constraint)

**Decision**: choose the geodesic frequency so the planet carries
**~1,300–1,600 tiles total** (each ≈3–4° across at default camera). Skill
lands cover ~30–35% of the globe; with 10 skills that yields ≈40–60 tiles
per average land and ≈31+ for the smallest after tuning the min island
radius. The land-assignment threshold is DERIVED from the count: the
builder verifies every skill's connected component ≥31 tiles and grows the
skill's radius step-wise (deterministically) until the floor holds.

**Rationale**: turns FR-003 from "hope" into an enforced invariant; the
growth loop only runs at load time over tile centers (cheap).

**Alternatives considered**: fixed radius + hope (fails SC-002 for the
smallest skill), or per-skill hardcoded radii (data drift when expertise
changes).

## R4 — How to make tiles visible (clarification Q1: shade variation)

**Decision**: per-tile deterministic lightness jitter (±~6%) of the skill
color, seeded from the tile center — no gaps, no outlines. Jitter is
per-tile-uniform (all vertices of a tile share one shade), so tiles read as
flat colored hexagons. Flat (per-face) normals on tile tops give the
strategy-game facet look.

**Rationale**: exactly the clarified requirement; deterministic = stable
across reloads; zero extra draw cost (vertex colors).

**Alternatives considered**: grout gaps and edge outlines — explicitly
rejected by Q1.

## R5 — How is one-connected-land-per-skill guaranteed? (clarification Q2)

**Decision**: after tile assignment, run a flood fill over tile adjacency
per skill; keep the largest connected component, absorb any component
adjacent to it (merge bridges), and drop stragglers into ocean. Enforce
FR-003 as a post-condition: if the kept component <31 tiles, apply the R3
radius-growth loop and re-run.

**Rationale**: the current triangle code already clusters seeds to keep
lands connected; the hex quantization is coarser, so an explicit flood-fill
guarantee is the only way to make connectivity a checked invariant rather
than an assumption. Stragglers dropped to ocean also satisfies the spec's
"never shown as stray fragments" edge case.

**Alternatives considered**: merging stragglers by nearest-neighbor bridges
(visible as artificial tile chains — uglier than dropping), or leaving
fragments (explicitly forbidden by the spec).

## R6 — How are the polar lands built? (clarification Q3)

**Decision**: same lattice, same builder; tiles whose center latitude is
within a cap threshold (start ±55°, tune so caps are clearly visible when
a pole faces the camera) are assigned to `polar-north` / `polar-south`
with a white base color plus the same ±6% shade jitter. Polar meshes are
merged (2 meshes) and excluded from raycast targets (FR-007). Skill seed
latitude band stays ±42° → a guaranteed open-ocean moat between caps and
skills (FR-008 by construction).

**Rationale**: reuses every rule from the hex builder (consistency),
hides the 2 pole pentagons in white, and the moat makes overlap
structurally impossible.

**Alternatives considered**: hand-authored cap outlines (not data-driven),
or a smooth cap (rejected by Q3).

## R7 — Performance structure (≥30 fps, SC-006)

**Decision**: build ALL tile geometry as vertex-colored merged meshes —
10 skill-land meshes + 2 polar meshes (+ existing ocean): ~13 draw calls,
≈9k triangles for tiles + caps (6 tris × ~1,500), flat-shaded facet tops.
Generation runs once at load (the ~1,500-center assignment is a few
million distance ops — single-digit milliseconds budget; same one-shot
pattern as the current builder). Hover/highlight keeps its existing
per-skill emissive material tween — unchanged contract.

**Rationale**: draw calls stay flat vs the current build (13 ≈ today's 11),
geometry triples but is still trivial; the 30 fps floor is met by
construction, not tuning.

**Alternatives considered**: one mesh per tile (1,500 draw calls — instant
FAIL), or texture-based tiles (bakes tiles into an image — loses
data-driven per-skill color and hover targeting).

## R8 — Is any new library worth it? (user allowance evaluated)

**Decision**: **none**. Hex-on-sphere math is ~150 lines of geometry
(equivalent to or better than `d3-geo-hexgrid` which targets flat maps,
`h3-js` which is a discrete index system with no rendering, or
`three_.geo`'s unmaintained HexagonalGeoJSONLayer). No library improves
the design output; adding one would violate Principle V for zero gain.

**Rationale**: evaluated per the user's explicit allowance; the quality
comes from the lattice math and shade rules, which we control better than
any off-the-shelf package.

**Alternatives considered**: `d3-geo` + `d3-geo-hexgrid` (flat-map bias,
new dep, no rendering help), `h3-js` (wrong abstraction), `threejs-geo`
(legacy).

