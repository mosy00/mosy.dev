# Tasks: Hex Planet Lands

**Input**: Design documents from `/specs/001-hex-planet-lands/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/modules.md`, `quickstart.md`
**Tests**: Automated typecheck and production build gates (`npm run typecheck`, `npm run build`), plus manual interactive verification scenarios V1–V6 in `quickstart.md`.
**Organization**: Tasks are grouped strictly by user story (US1: Hexagonal Lands [P1, MVP], US2: Denser Lands >30 tiles [P2], US3: Polar Lands [P3]) following the required checklist format.

---

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes an explicit, project-relative file path

---

## Phase 1: Setup (Configuration & Data Constants)

**Purpose**: Define the procedural configuration constants for hex subdivision, jitter, polar caps, and tuned skill region parameters before geometry construction.

- [x] T001 Add `HEX` and `POLAR` configuration objects and update `REGIONS` parameters in `src/three/config.ts` per `specs/001-hex-planet-lands/plan.md` and `contracts/modules.md` (subdivisions: 3 or 4 targeting ~1,300–1,600 tiles, shadeJitter: 0.06, polarThresholdLat: 55°, polarColor: 0xf2f6f8).

---

## Phase 2: Foundational (Hex Sphere Grid Lattice)

**Purpose**: Core mathematical infrastructure that MUST be completed before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Implement geodesic dual icosphere math and `HexSphereGrid` construction in `src/three/hexGrid.ts` per `specs/001-hex-planet-lands/contracts/modules.md` (generate normalized vertices as tile centers, dual faces as 5/6 polygon corners with CCW winding, adjacency list mapping `tileId -> neighborIds`, and `findNearestTileId(dir: Vector3)`).
- [x] T003 Enforce Euler's formula invariant INV-06 in `src/three/hexGrid.ts` ensuring exactly 12 pentagons with 2 pinned to the polar vertices and all remaining cells having strictly 6 corners.

**Checkpoint**: Foundation ready — hex grid lattice generation produces valid spherical honeycomb topology.

---

## Phase 3: User Story 1 - Lands Built From Hexagons (Priority: P1) 🎯 MVP

**Goal**: Transform skill landmasses from triangle-based meshes to distinct flat-shaded hexagonal tiles with honeycomb adjacency and per-tile shade variations (FR-001, FR-002, FR-004, SC-001).

**Independent Test**: Load the skills globe; inspect any skill land at default zoom. Individual tiles are visibly six-sided, flat-shaded, fit edge-to-edge without gaps, and are discernable via subtle per-tile lightness variations (Quickstart V1).

### Implementation for User Story 1

- [x] T004 [US1] Implement hex tile assignment and facet geometry assembly in `src/three/skillRegions.ts` replacing triangle-based face assignment (assign tiles to nearest skill seed, build merged `BufferGeometry` with flat facet positions raised to `PLANET.radius * REGIONS.raise`).
- [x] T005 [US1] Implement per-tile shade variation in `src/three/skillRegions.ts` per `specs/001-hex-planet-lands/data-model.md` INV-05 (compute deterministic pseudo-random lightness jitter in $[-0.06, +0.06]$ from tile center/id, applying modulated vertex colors so each tile's outline is distinguishable without gaps or line outlines).
- [x] T006 [US1] Preserve the `SkillIslandsBuild` module interface and raycaster contract in `src/three/skillRegions.ts` and `src/three/Planet.ts` per `specs/001-hex-planet-lands/contracts/modules.md` (populate `mesh.userData['skillId'] = skill.id`, keep `Planet.meshes` returning skill lands, maintain emissive hover highlight and tour target orientation).

**Checkpoint**: User Story 1 MVP complete and functional. Skill lands visibly read as strategy-game hex tiles with readable seams.


---

## Phase 4: User Story 2 - Denser Lands (More Than 30 Hexes Per Land) (Priority: P2)

**Goal**: Ensure every skill forms exactly ONE single connected landmass composed of strictly more than 30 tiles (FR-003, INV-01, INV-02, SC-002).

**Independent Test**: Spot check both the smallest and largest skill landmasses on the globe. Every skill consists of $\ge 31$ tiles forming a single continuous land without orphan or disconnected satellite fragments (Quickstart V2, V3).

### Implementation for User Story 2

- [x] T007 [US2] Implement graph flood-fill connectivity filter in `src/three/skillRegions.ts` per `specs/001-hex-planet-lands/data-model.md` INV-02 (traverse `neighborIds` from primary seed tile, keep only the single largest connected component per skill, and release disconnected satellite tiles back to open ocean).
- [x] T008 [US2] Implement deterministic radius growth loop in `src/three/skillRegions.ts` per `specs/001-hex-planet-lands/data-model.md` INV-01 (if a skill's post-flood-fill tile count is $< 31$, iteratively increment its assignment radius by $\delta$ and re-run assignment until `tileIds.size >= 31`).
- [x] T009 [US2] Retune satellite seed offsets and border noise in `src/three/skillRegions.ts` and `src/three/config.ts` to ensure organic coastlines while preserving connectivity across all 10 portfolio skills.

**Checkpoint**: User Story 2 complete. All skill landmasses satisfy the strict $> 30$ tile floor on a single connected territory.

---

## Phase 5: User Story 3 - Visible Polar Lands (Priority: P3)

**Goal**: Create figurative white hex-tiled polar caps covering the north and south poles that are non-interactive and clearly separated from skill lands (FR-005, FR-006, FR-007, FR-008, SC-003, SC-004).

**Independent Test**: Tilt or rotate globe to view north and south poles. White hex-tiled ice caps appear with open ocean separating them from skill lands. Hovering cursor over polar caps triggers zero highlight, zero info card, and zero legend state change (Quickstart V4).

### Implementation for User Story 3

- [x] T010 [P] [US3] Create polar land generator `buildPolarLands(grid)` in `src/three/polarLands.ts` per `specs/001-hex-planet-lands/contracts/modules.md` (identify tiles with $|\text{latitude}| \ge \text{POLAR.thresholdLat}$, assemble merged north/south cap geometries with white vertex colors plus shade jitter, tag with `userData['isPolar'] = true`).
- [x] T011 [US3] Integrate polar lands into `src/three/Planet.ts` (call `buildPolarLands(grid)`, add polar meshes to `dragGroup` for unified rotation, dispose geometries in `Planet.dispose()`, and strictly exclude polar meshes from the `Planet.meshes` getter per Contract 1).
- [x] T012 [US3] Enforce the open-ocean moat invariant INV-04 between polar caps ($\ge 55^\circ$) and skill seed limits ($\le 42^\circ$) in `src/three/config.ts` and `src/three/skillRegions.ts` ensuring a minimum open water band $\ge 13^\circ$.


---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, performance auditing, cleanup, and verification of non-regression across existing interactions.

- [x] T013 [P] Verify interaction and tour parity in `src/three/Planet.ts`, `src/three/PlanetControls.ts`, and `src/three/PlanetTour.ts` per Quickstart scenario V5 (verify drag inertia, $\pm 45^\circ$ pitch clamp, and hover pick behavior).
- [x] T014 Run performance audit against the $\ge 30$ fps floor (60 fps target) during continuous drag, hover pick, and tour animation in `src/three/Planet.ts` per Quickstart scenario V6 and FR-010.
- [x] T015 Run automated verification gates (`npm run typecheck` and `npm run build`) ensuring zero TypeScript compilation errors and clean production bundle generation.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories.
- **User Story 1 (Phase 3 - P1 MVP)**: Depends on Phase 2 — establishes the hex land rendering pipeline.
- **User Story 2 (Phase 4 - P2)**: Depends on Phase 3 — refines tile density ($> 30$ tiles) and connectivity on the hex rendering pipeline.
- **User Story 3 (Phase 5 - P3)**: Depends on Phase 2 (HexSphereGrid) and Phase 3 (Hex rendering). Can run in parallel with US2 for `polarLands.ts` generation.
- **Polish (Phase 6)**: Depends on completion of all user stories (Phases 3–5).

### User Story Dependencies

- **US1 (P1)**: Independent of US2 and US3. Delivers the core hex aesthetic (MVP).
- **US2 (P2)**: Extends US1 geometry pass with flood fill and radius growth to enforce $> 30$ tiles and single connectivity.
- **US3 (P3)**: Uses `HexSphereGrid` from Foundational phase; integrates into `Planet.ts` alongside US1/US2.

---

## Parallel Opportunities

- **Across Stories**:
  - T010 (`polarLands.ts`) can be authored in parallel with T007–T009 (`skillRegions.ts` flood-fill & density pass) once `hexGrid.ts` is available.
- **Phase 6 Polish**:
  - T013 (interaction audit) and T014 (FPS audit) can run in parallel before final build check T015.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete **Phase 1: Setup** (T001: configuration constants).
2. Complete **Phase 2: Foundational** (T002–T003: `hexGrid.ts` geodesic dual).
3. Complete **Phase 3: User Story 1** (T004–T006: basic hex land rendering with shade jitter).
4. **STOP and VALIDATE**: Verify Quickstart V1 (hex visual language, no gaps, shade variation). This provides an immediate playable/reviewable milestone.

### Incremental Delivery
1. Add **Phase 4: User Story 2** (T007–T009): Flood fill ensures single connected landmass; growth loop guarantees $> 30$ tiles per land. Validate Quickstart V2 & V3.
2. Add **Phase 5: User Story 3** (T010–T012): Polar caps generated in ice-white, added to `dragGroup`, excluded from raycasting. Validate Quickstart V4.
3. Finish with **Phase 6: Polish** (T013–T015): Verify 30+ fps floor, interaction parity, and execute automated typecheck/build gates.

**Checkpoint**: User Story 3 complete. Polar caps render with hex tiles in ice-white and respect all non-interaction rules.
