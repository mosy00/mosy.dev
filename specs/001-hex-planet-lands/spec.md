# Feature Specification: Hex Planet Lands

**Feature Branch**: `[001-hex-planet-lands]`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "The surface of the lands is built with triangles
which makes the results not realistic. Change the base shape to hexagons, like
the surface of strategic games. Use more hexagons on the surface: every land
is currently shaped with only 6 to 12 shapes; I want more than 30, so the
lands look more realistic. Also make the north and south poles visible by
creating figurative white lands there."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lands Built From Hexagons (Priority: P1)

A visitor scrolls to the skills planet and sees each skill landmass made of
distinct hexagonal tiles — the same visual language as a strategy-game world
map — instead of a smooth triangular patch. The hex structure is readable at
the default view: you can count the tiles that make up a land, and the
hexagon shape (six sides) is recognizable on individual tiles.

**Why this priority**: this is the core of the request — changing the base
unit of the lands from triangles to hexagons is what makes everything else
(land density, polar lands) meaningful.

**Independent Test**: Can be fully tested by opening the planet section and
inspecting any landmass — individual tiles must be visibly six-sided, and
the land must read as a cluster of hex tiles rather than one smooth shape.

**Acceptance Scenarios**:

1. **Given** the visitor views the planet, **When** they look at any skill
   landmass at the default camera distance, **Then** the land is composed of
   visibly hexagonal (six-sided) tiles, not triangles or a smooth surface.
2. **Given** the visitor inspects individual tiles, **When** they look at a
   tile's outline, **Then** it presents as a hexagon with straight edges and
   six distinct sides (allowing for the sphere's curvature).
3. **Given** the hexagonal surface, **When** the visitor compares a land to
   a strategy-game world map, **Then** the tiles visibly tile together edge
   to edge without gaps or overlaps.
4. **Given** two adjacent tiles of the same land, **When** the visitor looks
   at where they meet, **Then** their shade difference makes each tile's
   hexagonal outline distinguishable.

---

### User Story 2 - Denser Lands (More Than 30 Hexes Per Land) (Priority: P2)

A visitor counts or estimates the tiles in a skill landmass and sees a
rich, detailed shape — more than 30 hexagonal tiles per land, in contrast
to the current 6–12 — so even the smallest skill reads as a real territory
with an interesting, non-blocky coastline.

**Why this priority**: density is what sells realism; a hex land made of
only a handful of tiles would look cruder than the triangle version it
replaces, so hexes and density ship together or not at all.

**Independent Test**: Can be fully tested by counting visible tiles on any
skill landmass (or its largest one) — the count exceeds 30 for every land.

**Acceptance Scenarios**:

1. **Given** any skill landmass, **When** the visitor counts its hexagonal
   tiles, **Then** the land consists of more than 30 tiles.
2. **Given** lands of different expertise levels, **When** the visitor
   compares small and large lands, **Then** both exceed 30 tiles, with larger
   skills simply having proportionally more.
3. **Given** the increased tile count, **When** the visitor views a land's
   edge, **Then** its coastline varies naturally across tiles instead of
   appearing as a coarse blocky outline.

### User Story 3 - Visible Polar Lands (Priority: P3)

A visitor rotates the globe or lets the tour bring the poles into view and
sees white, ice-like lands capping both the north and south poles. The polar
lands make the globe read as Earth-like and complete; they are figurative
decorative caps, clearly distinct from the skill lands.

**Why this priority**: the caps complete the world visually but are
independent of the skills story — the planet works without them, so they
ship after the hex lands.

**Independent Test**: Can be fully tested by rotating the globe until each
pole faces the viewer — a white polar landmass is visible at each pole,
visually distinct from all skill lands.

**Acceptance Scenarios**:

1. **Given** the visitor rotates the globe so the north pole faces them,
   **When** they look at the pole, **Then** a white, ice-like landmass caps
   the pole.
2. **Given** the visitor rotates the globe to the south pole, **When** they
   look at the pole, **Then** a visually equivalent white landmass caps it.
3. **Given** a polar landmass in view, **When** the visitor compares it to
   skill lands, **Then** it reads as white/ice — clearly not a skill color —
   and is distinguishable by shape/size from any skill land.
4. **Given** the visitor hovers a polar landmass, **When** the pointer rests
   on it, **Then** no skill highlight or skill info card appears (the caps
   are not skills).

---

### Edge Cases

- What happens where a polar land and a skill land are close in latitude?
  The polar land MUST NOT overlap or visually merge with a skill land —
  the poles are reserved space, and skill lands already stay within a
  latitude band that leaves the poles free.
- What happens when the visitor drags the pole under the pointer? Drag
  behavior (free horizontal, ±45° vertical clamp) MUST remain unchanged;
  the polar lands simply ride the globe.
- What happens to hover on polar lands? No skill card, no skill highlight —
  the same open-ocean behavior as today (no card).
- What happens if a land's tile count would fall below or at 30 at any
  expertise level? The minimum tile count requirement (more than 30) MUST
  still hold for every skill land — density is not allowed to degrade for
  the smallest skills.
- What happens if a skill's region would quantize into disconnected pieces
  (tiles scattered instead of one blob)? The skill's tiles MUST be joined
  into a single connected landmass; disconnected leftover patches MUST be
  absorbed or dropped, never shown as stray fragments.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every skill landmass MUST be composed of hexagonal
  (six-sided) tiles rather than triangles or a smooth surface; the hexagon
  shape must be recognizable on individual tiles at the default view.
- **FR-002**: Tiles MUST fit together edge to edge (no gaps, no overlaps),
  reading as a tiled map surface like a strategy game; adjacent tiles MUST
  remain distinguishable from one another through slight per-tile shade
  variation of the skill color — not grout gaps and not drawn outlines.
- **FR-003**: Every skill landmass MUST consist of more than 30 hexagonal
  tiles, regardless of the skill's expertise level. Each skill's tiles MUST
  form one single connected landmass (no separate disconnected patches for
  one skill), and the 30+ count is taken on that single land.
- **FR-004**: The hexagonal structure MUST apply to all skill landmasses on
  the globe consistently (same tile shape and construction rules everywhere).
- **FR-005**: The north pole MUST be covered by a white, ice-like figurative
  landmass built from hexagonal tiles using the same construction rules as
  the skill lands (white-tinted, shade-varied tiles), visually distinct from
  every skill-colored land.
- **FR-006**: The south pole MUST be covered by a white, ice-like figurative
  landmass visually equivalent to the north pole's.
- **FR-007**: Polar lands MUST NOT be treated as skills: no skill highlight,
  no info card on hover, no legend row.
- **FR-008**: Polar lands MUST NOT overlap or merge with skill landmasses.
- **FR-009**: Existing planet behavior MUST be unchanged: drag with inertia
  and ±45° pole clamp, hover highlight + info card for skills, legend sync,
  and the scroll tour.
- **FR-010**: The increased tile count MUST NOT noticeably degrade the
  smoothness of the planet section compared to the current site.

### Key Entities *(include if feature involves data)*

- **Hex tile**: the single unit of land surface; carries one skill's color
  and belongs to exactly one landmass (or to a polar land).
- **Skill landmass**: the connected group of hex tiles representing one
  skill; keeps its skill hue, hover highlight, and info-card behavior.
- **Polar landmass**: a white, non-skill hex-tile landmass at one of the
  poles; decorative only, excluded from all skill interactions.
- **Ocean**: the open water between landmasses (unchanged).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every skill landmass visibly reads as a cluster of hexagonal
  tiles (not triangles or a smooth patch) at the default camera distance —
  confirmable by a reviewer counting six-sided tiles on any land.
- **SC-002**: Every skill landmass contains more than 30 hexagonal tiles —
  countable in a spot check of the smallest and largest lands.
- **SC-003**: A white polar landmass is visible when either pole is rotated
  to face the viewer, and it is visually distinct from every skill-colored
  land (checked north and south).
- **SC-004**: Hovering a polar land produces no skill info card and no
  skill highlight, matching current open-ocean hover behavior.
- **SC-005**: All existing interactions behave identically to before the
  change — drag feel, skill hover pick, tour motion — verified by exercising
  each and comparing to the pre-change site.
- **SC-006**: The planet section holds at least 30 frames per second
  (pass/fail floor) during drag, hover, and the scroll tour on a mid-range
  machine, measured with a frame-rate readout; 60 fps remains the target.

## Assumptions

- "Hexagons" means flat, clearly six-sided tiles arranged in a honeycomb
  pattern, like a strategy-game world map; small size irregularities from
  wrapping a flat tile pattern around a sphere are acceptable, but each tile
  must still read as hexagonal.
- Polar lands are figurative decorative caps (white ice-like), not tied to
  any skill or data; their exact shape is art-directed, not data-driven.
- The existing density floor is replaced by the new one: the "more than 30
  tiles" rule supersedes any current per-land tile count for skills.
- The existing latitude band that keeps skill lands away from the poles is
  retained so polar lands and skill lands never compete for space.
- Performance: the tile-count increase stays within the current smoothness
  of the planet section; no new interactions are added beyond polar-land
  non-responsiveness.
- Out of scope: snow/ice textures beyond a white material, polar-bear or
  landmark decoration, tile-level hover states, and any asset downloads —
  the world stays procedural and data-driven.

## Clarifications

### Session 2026-09-28

- Q: How are the boundaries between hex tiles made visible so that
  individual tiles can actually be seen and counted? → A: Slight per-tile
  shade variation of the skill color; no grout gaps and no drawn outlines.
- Q: Must a skill's 30+ hex tiles form one single connected landmass, or
  may a skill appear as several separate hex patches that only add up to
  30+ in total? → A: Single connected landmass per skill; 30+ tiles counted
  on that one land.
- Q: Should the white polar lands be built from hexagonal tiles too, like
  the skill lands, or left as smooth white caps? → A: Polar lands are
  hex-tiled like skill lands, just white-colored.
- Q: What minimum frame rate must the planet section hold after the hex
  rebuild, so the performance check has a hard pass/fail number? → A:
  30 fps floor (pass/fail), 60 fps target.

