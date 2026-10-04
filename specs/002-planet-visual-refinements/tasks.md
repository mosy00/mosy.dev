---
description: "Task list for feature 002-planet-visual-refinements"
---

# Tasks: Planet Visual Refinements

**Input**: Design documents from `/specs/002-planet-visual-refinements/`

**Prerequisites**: plan.md, spec.md (6 user stories, P1–P6), research.md (D1–D10), data-model.md, contracts/modules.md (13 module contracts), quickstart.md (V1–V12)

**Tests**: Not requested — no automated test tasks are generated; validation is manual via the quickstart.md scenarios cited per story.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently. Config (`src/three/config.ts`) is touched by US1, US2, US3, US4, US5 and US6 — run story phases sequentially in priority order (single default), as shown.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US6; Setup/Foundational/Polish phases carry no story label
- Every task names its exact file path.

## Path Conventions

Single project: `src/` at repository root; feature docs under `specs/002-planet-visual-refinements/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline is green before any change (constitution gates exist already — no project scaffolding needed).

- [ ] T001 Verify baseline gates pass before changes: run `npm run typecheck` and `npm run build` in the repository root (scripts in `package.json`) and confirm both succeed on the current tree

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Two new, zero-behavior-change helper modules that later phases consume.

**⚠️ CRITICAL**: Both helpers MUST exist before US1/US2 work begins.

- [ ] T002 [P] Create the shared flush fan-builder `src/three/tileFan.ts` implementing `buildTileFan(tiles, tileIds, radius, colorForTile): { positions; normals; colors }` per `specs/002-planet-visual-refinements/contracts/modules.md` §2 — every vertex = `unit × radius`, per-triangle facet normals exactly like the current builders (this is the single enforcement point for FR-001 flushness)
- [ ] T003 [P] Create the reduced-motion helper `src/three/motionPrefs.ts` exporting `prefersReducedMotion(): boolean` per contracts §12 — boot-time `window.matchMedia('(prefers-reduced-motion: reduce)').matches` (research D8)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - Land fused with the globe (Priority: P1) 🎯 MVP

**Goal**: One continuous flush hex shell — skill lands, light-blue hex ocean and ice caps all meshed at `PLANET.radius` with the background `SphereGeometry` deleted; no padding at grazing angles; ocean hover-inert (FR-001, FR-002, FR-003).

**Independent Test**: `specs/002-planet-visual-refinements/quickstart.md` V1 (grazing coastline, no gap/ledge/flicker), V2 steps 1–4 (hex ocean, hover returns null incl. behind-shell sweep), V5 greps (`SphereGeometry`/`raise` gone, single radius).

### Implementation for User Story 1

- [ ] T004 [US1] Refactor `src/three/skillRegions.ts` to emit land geometry via `buildTileFan(..., PLANET.radius, ...)` (delete the `REGIONS.raise` usage) and expose `landTileIds: ReadonlySet<number>` on `SkillIslandsBuild` per contracts §3; remove `REGIONS.raise` and the stale `REGIONS.detail` entry from `src/three/config.ts` (depends T002)
- [ ] T005 [US1] Refactor `src/three/polarLands.ts` to mesh caps via `buildTileFan(..., PLANET.radius, ...)`, expose `capTileIds: ReadonlySet<number>` per contracts §5, and refresh its doc comment (no more "raise" wording) (depends T004 — shares the `REGIONS.raise` removal)
- [ ] T006 [P] [US1] Create `src/three/oceanTiles.ts` implementing `buildOceanShell(grid, excludedTileIds)` per contracts §4 — merges every non-land, non-cap tile via `buildTileFan` at `PLANET.radius` into one mesh with a **solid** `MeshStandardMaterial` (`vertexColors`, `side: FrontSide`, `flatShading`, `OCEAN.roughness`/`OCEAN.metalness`, per-tile `±HEX.shadeJitter` lightness), **no** `skillId` userData; NOTE: `transparent`/`opacity` flags are added later by US6 (depends T002)
- [ ] T007 [US1] Rework `src/three/Planet.ts` per contracts §6: delete the `SphereGeometry` ocean mesh and its construction, build the polar caps (`latitude ≥ ±POLAR.thresholdLat`) and the ocean shell (`excludedTileIds = landTileIds ∪ capTileIds`), `dragGroup.add(oceanShell, ...islandMeshes, ...capMeshes)`, update `dispose()`; remove `OCEAN.segments` from `src/three/config.ts` (depends T004, T005, T006)
- [ ] T008 [P] [US1] Add the analytic occluder-sphere hover rule to `src/three/PlanetInteraction.ts` per contracts §7 and research D6: `ρ = PLANET.radius × 0.998`, nearest land hit accepted only when `t_sphere ≥ t_land`, otherwise return `null`; raycast target list stays `planet.meshes`
- [ ] T009 [US1] Validate US1 with `npm run dev`: execute quickstart V1, V2 (steps 1–4), and V5 (`git grep -n "SphereGeometry" src/three` empty, `git grep -n "raise" src/three/config.ts` empty, all builders use `PLANET.radius`) (depends T004–T008)

**Checkpoint**: The flush hex shell works — US1 is independently deliverable (MVP).

---

## Phase 4: User Story 2 - Calm scroll tour with a bigger globe (Priority: P2)

**Goal**: Planet already cropped at section entry (`D = 1.15 × min(viewport)`), one scrubbed ~180° constant-pitch yaw sweep plus ×1.3 scale growth across the section, no per-land re-centering (poles never move), and a reduced-motion static mode (FR-004, FR-012).

**Independent Test**: quickstart V3 (entry crop, ≈180° total sweep, ~+30 % growth, pole drift ≈ 0°, drag unaffected) + V11 (reduced motion: enlarged static planet, no sweep/growth/idle spin/float, interactions intact).

### Implementation for User Story 2

- [ ] T010 [US2] Rework `src/three/config.ts` per contracts §1 / research D7: `CAMERA.fit = { heightFraction: 1.15, widthFraction: 1.15 }` with an updated comment (entry crop, `distance = max(fitHeight, fitWidth)` rule unchanged in Experience), and `TOUR = { sweepYaw: Math.PI, growthScale: 1.3, scrub: 0.8 }` removing `maxPitch`, `rotateDuration`, `holdDuration`
- [ ] T011 [US2] Rewrite `src/animations/planetTour.ts` per contracts §8: one `gsap.timeline` on `#planet` (`start: 'top top'`, `end: 'bottom bottom'`, `scrub: TOUR.scrub`) containing exactly `planet.tourGroup.rotation.y += TOUR.sweepYaw` (ease `power1.inOut`) and `planet.object3D.scale → TOUR.growthScale` (x/y/z, same timeline start); never write `rotation.x`; when `prefersReducedMotion()` create no timeline and return a no-op disposer (scale stays 1, yaw stays 0); delete `shortestAngle` and all `planet.tourTargets` usage (depends T003, T010)
- [ ] T012 [P] [US2] Remove the `#planet` scale flourish from `src/animations/scrollAnimations.ts` per contracts §9: delete `PLANET_HIDDEN_SCALE`, the `gsap.set(planet.scale, …)`, and the onEnter/onLeaveBack elastic tween block, and drop the `planet: Object3D | null` parameter (hero intro and `[data-reveal]` tweens untouched)
- [ ] T013 [US2] Update `src/three/Planet.ts` per contracts §6: delete the now-dead `tourTargets` getter, `TourTarget` interface and cache (after T011), and add `setReducedMotion(reduced: boolean)` gating the float-bob in `update()` (depends T011, T007)
- [ ] T014 [P] [US2] Add `setAmbientMotion(enabled: boolean)` to `src/three/PlanetControls.ts` per contracts §11: settle target becomes `enabled ? PLANET_CONTROLS.idleSpeed : 0`; drag, inertia, damping, `maxPitch` clamp byte-for-byte unchanged (FR-009)
- [ ] T015 [US2] Add `setReducedMotion(reduced: boolean)` to `src/three/Experience.ts` per contracts §10 forwarding to `controls.setAmbientMotion(!reduced)` and `planet.setReducedMotion(reduced)` (depends T013, T014)
- [ ] T016 [US2] Wire `src/main.ts` per contracts §13: import `prefersReducedMotion`, call `activeExperience.setReducedMotion(prefersReducedMotion())` after construction, change `initSectionAnimations(activeExperience.planet.object3D)` → `initSectionAnimations()` (depends T011, T012, T015)
- [ ] T017 [US2] Validate US2 with `npm run dev`: execute quickstart V3 (all four steps), V11 (OS-level `prefers-reduced-motion: reduce` emulated, reload), and the drag/inertia/pole-clamp checks of V8 (depends T016)

**Checkpoint**: The calm tour + enlarged entry + reduced-motion mode work independently of the shell internals.

---

## Phase 5: User Story 3 - Expertise visibly drives land size (Priority: P3)

**Goal**: Linear expertise→radius mapping `0.187 + 0.233 × clamp(e, 0.4, 1.0)` giving ≥2× tile-count contrast between 100 % and 40 %, visible change on ≥5 pp edits, placement band 38°, hard 60° land cap (moat ≥ 6.5°), erosion pass so bigger lands never touch (FR-007; supports FR-009 moat; research D3/D4/D5).

**Independent Test**: quickstart V6 — 100 % vs 40 % lands side by side ≥ 2× (research measured 2.18–2.65× in multi-skill context), ≥5 pp edit visibly changes size, >30-tile floor holds, `a11y: 0.1` data still builds.

### Implementation for User Story 3

- [ ] T018 [US3] Update `REGIONS` in `src/three/config.ts` per contracts §1 / research D4: `islandRadius: { min: 0.187, max: 0.42 }` (comment: r(0.4)=0.280, r(1.0)=0.420, measured ≥2× contrast), add `expertiseRange: { min: 0.4, max: 1 }`, change `maxLatitude` 42 → 38, add `maxLandLat: 60` (comment: guarantees ≥6.5° moat to the 66.5° caps); refresh the stale `HEX.detail` comment's per-skill tile-count note in `src/three/config.ts`
- [ ] T019 [US3] Rework the assignment loop in `src/three/skillRegions.ts` per research D4/D5: clamp `skill.expertise` to `REGIONS.expertiseRange` before computing radius and satellite quota; skip tiles with `Math.abs(tile.latitude) >= REGIONS.maxLandLat` (replacing the old `POLAR.thresholdLat` skip); insert the symmetric erosion pass (drop any tile grid-adjacent to a *different* skill's tile, both sides) after raw assignment and before flood fill in **every** growth-loop iteration; keep the ≥31 growth loop as dormant safety net and keep flood fill anchor-component selection (depends T018)
- [ ] T020 [US3] Validate US3 with `npm run dev`: execute quickstart V6 (including restoring `src/data/skills.ts` after the 1.0/0.4 swap) and confirm every land is still exactly one connected mass > 30 tiles with no land-land contact (depends T019)

**Checkpoint**: Data story is honest — percentage edits visibly reshape the map.

---

## Phase 6: User Story 4 - Distinct land shapes (Priority: P4)

**Goal**: Each land gets a distinct silhouette via a deterministic per-skill shape profile (aspect × lobes × phase × amplitude) while every land stays one connected mass > 30 tiles and no lands collide/merge (FR-006; research D5).

**Independent Test**: quickstart V7 — blind silhouette pairing: no two lands read as recolours of the same outline; single connected mass per skill; no land-land contact; none in the cap moat.

### Implementation for User Story 4

- [ ] T021 [US4] Add shape constants to `REGIONS` in `src/three/config.ts` per contracts §1: `shape: { aspectMin: 0.8, aspectMax: 1.12, lobes: [3, 4, 5], ampMin: 0.1, ampMax: 0.17 }` with a comment citing research D5 ranges
- [ ] T022 [US4] Implement the per-skill shape profile in `src/three/skillRegions.ts` per research D5: derive `{ aspect, lobes K, phase, amp }` deterministically from `skillIndex` via the existing `pseudoRandom` stream style; for the **primary seed only** compute elliptical distance `du/aspect` in the skill's tangent frame and divide the threshold by `(1 + amp · sin(K · bearing + phase))`; satellite seeds stay isotropic; keep the erosion pass and flood-fill guarantees untouched (depends T021, and T019 from US3)
- [ ] T023 [US4] Validate US4 with `npm run dev`: execute quickstart V7 (all checks, incl. connectivity and no-contact after the new shapes) (depends T022)

**Checkpoint**: The world reads as an archipelago of different countries.

---

## Phase 7: User Story 5 - Earth-like polar ice caps (Priority: P5)

**Goal**: Caps shrink to poleward of 66.5° (Arctic-circle extent, ~103 tiles/hemisphere vs 233 before), north ≡ south, white, non-interactive; moat preserved (FR-008; research D3).

**Independent Test**: quickstart V4 — pole rotated to camera: cap visibly smaller than current build, within ~65–70°, both poles equivalent; V2 step 3 (hover inert).

### Implementation for User Story 5

- [ ] T024 [US5] Set `POLAR.thresholdLat: 66.5` in `src/three/config.ts` and update the comment (Earth-like extent inside the spec's 65–70° band; cap = 103 connected tiles/hemisphere per research D3; moat already ≥6.5° via `REGIONS.maxLandLat: 60` from US3)
- [ ] T025 [US5] Validate US5 with `npm run dev`: execute quickstart V4 plus the hover-inert cap check (V2 step 3) and confirm both caps render white, flush, and connected (depends T024)

**Checkpoint**: Poles read like Earth's, not giant ice sheets.

---

## Phase 8: User Story 6 - Slightly translucent free area (Priority: P6)

**Goal**: Ocean tiles at ~25 % transparency (75 % opacity) with a pre-lightened light-blue base so the page background clearly shows through while lands/caps stay fully opaque and no interior/far-side geometry is exposed (FR-005; research D2).

**Independent Test**: quickstart V2 step 5 (background discernible through ocean, lands/caps opaque in the same view) + V1 re-run (still no interior/z-fight artifacts).

### Implementation for User Story 6

- [ ] T026 [US6] Update `OCEAN` in `src/three/config.ts` per contracts §1 / research D2: `color: 0x3d8fd1` → `0x74c0ec` (comment: blends to L≈0.525 at 75 % over `#05060a`, ΔL ≥ 0.12 vs every supported land) and add `opacity: 0.75`
- [ ] T027 [US6] Enable translucency in `src/three/oceanTiles.ts` per contracts §4 / research D2: material gets `transparent: true, opacity: OCEAN.opacity`; keep `side: FrontSide` and default depth settings (front-face culling is what prevents interior exposure) (depends T026, T006)
- [ ] T028 [US6] Validate US6 with `npm run dev`: execute quickstart V2 step 5 over contrasting background areas, re-run V1 (grazing view), and confirm lands/caps remain 100 % opaque in the same views (depends T027)

**Checkpoint**: Atmosphere polish lands without weakening the shell.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story cleanup and full-feature validation (FR-009 parity, FR-010 performance, FR-011 mobile reachability, constitution gates).

- [ ] T029 Sweep stale comments and docs left by the stories: `src/three/Planet.ts` class docstring (still says "light-blue ocean sphere with skill islands raised out of it"), `src/three/config.ts` header comments, `src/three/hexGrid.ts` comments if they reference the raised-ocean design, and `README.md`'s planet description if it mentions the smooth ocean sphere
- [ ] T030 Run the constitution gates: `npm run typecheck` and `npm run build` (scripts in `package.json`) must both pass on the final tree
- [ ] T031 Execute the full `specs/002-planet-visual-refinements/quickstart.md` V1–V12 on desktop AND a mobile viewport (device emulation) with reduced-motion emulated for V11; fix any gaps found and re-run the failed scenario
- [ ] T032 Review the final diff against all eight principles in `.specify/memory/constitution.md` and against every FR/SC in `specs/002-planet-visual-refinements/spec.md` (12 FRs, 8 SCs); confirm `specs/002-planet-visual-refinements/checklists/requirements.md` still passes 16/16 (annotation-only if updated)
