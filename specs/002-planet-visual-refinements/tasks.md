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

- [X] T001 Verify baseline gates pass before changes: run `npm run typecheck` and `npm run build` in the repository root (scripts in `package.json`) and confirm both succeed on the current tree

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Two new, zero-behavior-change helper modules that later phases consume.

**⚠️ CRITICAL**: Both helpers MUST exist before US1/US2 work begins.

- [X] T002 [P] Create the shared flush fan-builder `src/three/tileFan.ts` implementing `buildTileFan(tiles, tileIds, radius, colorForTile): { positions; normals; colors }` per `specs/002-planet-visual-refinements/contracts/modules.md` §2 — every vertex = `unit × radius`, per-triangle facet normals exactly like the current builders (this is the single enforcement point for FR-001 flushness)
- [X] T003 [P] Create the reduced-motion helper `src/three/motionPrefs.ts` exporting `prefersReducedMotion(): boolean` per contracts §12 — boot-time `window.matchMedia('(prefers-reduced-motion: reduce)').matches` (research D8)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - Land fused with the globe (Priority: P1) 🎯 MVP

**Goal**: One continuous flush hex shell — skill lands, light-blue hex ocean and ice caps all meshed at `PLANET.radius` with the background `SphereGeometry` deleted; no padding at grazing angles; ocean hover-inert (FR-001, FR-002, FR-003).

**Independent Test**: `specs/002-planet-visual-refinements/quickstart.md` V1 (grazing coastline, no gap/ledge/flicker), V2 steps 1–4 (hex ocean, hover returns null incl. behind-shell sweep), V5 greps (`SphereGeometry`/`raise` gone, single radius).

### Implementation for User Story 1

- [X] T004 [US1] Refactor `src/three/skillRegions.ts` to emit land geometry via `buildTileFan(..., PLANET.radius, ...)` (delete the `REGIONS.raise` usage) and expose `landTileIds: ReadonlySet<number>` on `SkillIslandsBuild` per contracts §3; remove `REGIONS.raise` and the stale `REGIONS.detail` entry from `src/three/config.ts` (depends T002)
- [X] T005 [US1] Refactor `src/three/polarLands.ts` to mesh caps via `buildTileFan(..., PLANET.radius, ...)`, expose `capTileIds: ReadonlySet<number>` per contracts §5, and refresh its doc comment (no more "raise" wording) (depends T004 — shares the `REGIONS.raise` removal)
- [X] T006 [P] [US1] Create `src/three/oceanTiles.ts` implementing `buildOceanShell(grid, excludedTileIds)` per contracts §4 — merges every non-land, non-cap tile via `buildTileFan` at `PLANET.radius` into one mesh with a **solid** `MeshStandardMaterial` (`vertexColors`, `side: FrontSide`, `flatShading`, `OCEAN.roughness`/`OCEAN.metalness`, per-tile `±HEX.shadeJitter` lightness), **no** `skillId` userData; NOTE: `transparent`/`opacity` flags are added later by US6 (depends T002)
- [X] T007 [US1] Rework `src/three/Planet.ts` per contracts §6: delete the `SphereGeometry` ocean mesh and its construction, build the polar caps (`latitude ≥ ±POLAR.thresholdLat`) and the ocean shell (`excludedTileIds = landTileIds ∪ capTileIds`), `dragGroup.add(oceanShell, ...islandMeshes, ...capMeshes)`, update `dispose()`; remove `OCEAN.segments` from `src/three/config.ts` (depends T004, T005, T006)
- [X] T008 [P] [US1] Add the analytic occluder-sphere hover rule to `src/three/PlanetInteraction.ts` per contracts §7 and research D6: `ρ = PLANET.radius × 0.998`, nearest land hit accepted only when `t_sphere ≥ t_land`, otherwise return `null`; raycast target list stays `planet.meshes`
- [ ] T009 [US1] Validate US1 with `npm run dev`: execute quickstart V1, V2 (steps 1–4), and V5 (`git grep -n "SphereGeometry" src/three` empty, `git grep -n "raise" src/three/config.ts` empty, all builders use `PLANET.radius`) (depends T004–T008)

**Checkpoint**: The flush hex shell works — US1 is independently deliverable (MVP).

---

## Phase 4: User Story 2 - Calm scroll tour with a bigger globe (Priority: P2)

**Goal**: Globe at `D = 0.9315 × min(viewport)` at entry, one scrubbed ~180° constant-pitch yaw sweep plus ×1.111 scale growth to `D = 1.035 × min(viewport)`, no per-land re-centering (poles never move), a reduced-motion static mode (FR-004, FR-012), and both poles visible at every scroll position.

**Independent Test**: quickstart V3 (entry `0.9315`, ≈180° total sweep, growth to `1.035`, pole drift ≈ 0°, drag unaffected, both poles always visible, planet visible where it overlaps neighbouring sections) + V11 (reduced motion: static planet, no sweep/growth/idle spin/float, interactions intact).

### Implementation for User Story 2

- [X] T010 [US2] Rework `src/three/config.ts` per contracts §1 / research D7: `CAMERA.fit = { heightFraction: 0.9315, widthFraction: 0.9315 }` with an updated comment (entry size; see the Phase 10 retunes), and `TOUR = { sweepYaw: Math.PI, growthScale: 1.111, scrub: 0.8 }` removing `maxPitch`, `rotateDuration`, `holdDuration`
- [X] T011 [US2] Rewrite `src/animations/planetTour.ts` per contracts §8: one `gsap.timeline` on `#planet` (`start: 'top top'`, `end: 'bottom bottom'`, `scrub: TOUR.scrub`) containing exactly `planet.tourGroup.rotation.y += TOUR.sweepYaw` (ease `power1.inOut`) and `planet.object3D.scale → TOUR.growthScale` (x/y/z, same timeline start); never write `rotation.x`; when `prefersReducedMotion()` create no timeline and return a no-op disposer (scale stays 1, yaw stays 0); delete `shortestAngle` and all `planet.tourTargets` usage (depends T003, T010)
- [X] T012 [P] [US2] Remove the `#planet` scale flourish from `src/animations/scrollAnimations.ts` per contracts §9: delete `PLANET_HIDDEN_SCALE`, the `gsap.set(planet.scale, …)`, and the onEnter/onLeaveBack elastic tween block, and drop the `planet: Object3D | null` parameter (hero intro and `[data-reveal]` tweens untouched)
- [X] T013 [US2] Update `src/three/Planet.ts` per contracts §6: delete the now-dead `tourTargets` getter, `TourTarget` interface and cache (after T011), and add `setReducedMotion(reduced: boolean)` gating the float-bob in `update()` (depends T011, T007)
- [X] T014 [P] [US2] Add `setAmbientMotion(enabled: boolean)` to `src/three/PlanetControls.ts` per contracts §11: settle target becomes `enabled ? PLANET_CONTROLS.idleSpeed : 0`; drag, inertia, damping, `maxPitch` clamp byte-for-byte unchanged (FR-009)
- [X] T015 [US2] Add `setReducedMotion(reduced: boolean)` to `src/three/Experience.ts` per contracts §10 forwarding to `controls.setAmbientMotion(!reduced)` and `planet.setReducedMotion(reduced)` (depends T013, T014)
- [X] T016 [US2] Wire `src/main.ts` per contracts §13: import `prefersReducedMotion`, call `activeExperience.setReducedMotion(prefersReducedMotion())` after construction, change `initSectionAnimations(activeExperience.planet.object3D)` → `initSectionAnimations()` (depends T011, T012, T015)
- [ ] T017 [US2] Validate US2 with `npm run dev`: execute quickstart V3 (all four steps), V11 (OS-level `prefers-reduced-motion: reduce` emulated, reload), and the drag/inertia/pole-clamp checks of V8 (depends T016)

**Checkpoint**: The calm tour + enlarged entry + reduced-motion mode work independently of the shell internals.

---

## Phase 5: User Story 3 - Expertise visibly drives land size (Priority: P3)

**Goal**: Linear expertise→radius mapping `0.187 + 0.233 × clamp(e, 0.4, 1.0)` giving ≥2× tile-count contrast between 100 % and 40 %, visible change on ≥5 pp edits, placement band 38°, hard 60° land cap (moat ≥ 6.5°), erosion pass so bigger lands never touch (FR-007; supports FR-009 moat; research D3/D4/D5).

**Independent Test**: quickstart V6 — 100 % vs 40 % lands side by side ≥ 2× (research measured 2.18–2.65× in multi-skill context), ≥5 pp edit visibly changes size, >30-tile floor holds, `a11y: 0.1` data still builds.

### Implementation for User Story 3

- [X] T018 [US3] Update `REGIONS` in `src/three/config.ts` per contracts §1 / research D4: `islandRadius: { min: 0.187, max: 0.42 }` (comment: r(0.4)=0.280, r(1.0)=0.420, measured ≥2× contrast), add `expertiseRange: { min: 0.4, max: 1 }`, change `maxLatitude` 42 → 38, add `maxLandLat: 60` (comment: guarantees ≥6.5° moat to the 66.5° caps); refresh the stale `HEX.detail` comment's per-skill tile-count note in `src/three/config.ts`
- [X] T019 [US3] Rework the assignment loop in `src/three/skillRegions.ts` per research D4/D5: clamp `skill.expertise` to `REGIONS.expertiseRange` before computing radius and satellite quota; skip tiles with `Math.abs(tile.latitude) >= REGIONS.maxLandLat` (replacing the old `POLAR.thresholdLat` skip); insert the symmetric erosion pass (drop any tile grid-adjacent to a *different* skill's tile, both sides) after raw assignment and before flood fill in **every** growth-loop iteration; keep the ≥31 growth loop as dormant safety net and keep flood fill anchor-component selection (depends T018)
- [ ] T020 [US3] Validate US3 with `npm run dev`: execute quickstart V6 (including restoring `src/data/skills.ts` after the 1.0/0.4 swap) and confirm every land is still exactly one connected mass > 30 tiles with no land-land contact (depends T019)

**Checkpoint**: Data story is honest — percentage edits visibly reshape the map.

---

## Phase 6: User Story 4 - Distinct land shapes (Priority: P4)

**Goal**: Each land gets a distinct silhouette via a deterministic per-skill shape profile (aspect × lobes × phase × amplitude) while every land stays one connected mass > 30 tiles and no lands collide/merge (FR-006; research D5).

**Independent Test**: quickstart V7 — blind silhouette pairing: no two lands read as recolours of the same outline; single connected mass per skill; no land-land contact; none in the cap moat.

### Implementation for User Story 4

- [X] T021 [US4] Add shape constants to `REGIONS` in `src/three/config.ts` per contracts §1: `shape: { aspectMin: 0.8, aspectMax: 1.12, lobes: [3, 4, 5], ampMin: 0.1, ampMax: 0.17 }` with a comment citing research D5 ranges
- [X] T022 [US4] Implement the per-skill shape profile in `src/three/skillRegions.ts` per research D5: derive `{ aspect, lobes K, phase, amp }` deterministically from `skillIndex` via the existing `pseudoRandom` stream style; for the **primary seed only** compute elliptical distance `du/aspect` in the skill's tangent frame and divide the threshold by `(1 + amp · sin(K · bearing + phase))`; satellite seeds stay isotropic; keep the erosion pass and flood-fill guarantees untouched (depends T021, and T019 from US3)
- [ ] T023 [US4] Validate US4 with `npm run dev`: execute quickstart V7 (all checks, incl. connectivity and no-contact after the new shapes) (depends T022)

**Checkpoint**: The world reads as an archipelago of different countries.

---

## Phase 7: User Story 5 - Earth-like polar ice caps (Priority: P5)

**Goal**: Caps shrink to poleward of 66.5° (Arctic-circle extent, ~103 tiles/hemisphere vs 233 before), north ≡ south, white, non-interactive; moat preserved (FR-008; research D3).

**Independent Test**: quickstart V4 — pole rotated to camera: cap visibly smaller than current build, within ~65–70°, both poles equivalent; V2 step 3 (hover inert).

### Implementation for User Story 5

- [X] T024 [US5] Set `POLAR.thresholdLat: 66.5` in `src/three/config.ts` and update the comment (Earth-like extent inside the spec's 65–70° band; cap = 103 connected tiles/hemisphere per research D3; moat already ≥6.5° via `REGIONS.maxLandLat: 60` from US3)
- [ ] T025 [US5] Validate US5 with `npm run dev`: execute quickstart V4 plus the hover-inert cap check (V2 step 3) and confirm both caps render white, flush, and connected (depends T024)

**Checkpoint**: Poles read like Earth's, not giant ice sheets.

---

## Phase 8: User Story 6 - Slightly translucent free area (Priority: P6)

**Goal**: Ocean tiles at ~20 % transparency (80 % opacity) with a pre-lightened light-blue base, so far-hemisphere lands read faintly through the water like a glass marble while the sea's own interior/far tiles stay culled and near lands/caps stay fully opaque (FR-005; research D2).

**Independent Test**: quickstart V2 step 5 (a far-side land discernible through the ocean; no second jumbled ocean; near lands/caps opaque in the same view) + V1 re-run (still no gaps/z-fight artifacts).

### Implementation for User Story 6

- [X] T026 [US6] Update `OCEAN` in `src/three/config.ts` per contracts §1 / research D2: `color: 0x3d8fd1` → `0x74c0ec` (comment: pre-lightened so the sea blends to ≈#5e9bbf / L≈0.56 / H≈202° at 80 % over `#05060a`, separated from lands by hue, saturation and land emissive — the original ΔL ≥ 0.12 claim was incorrect, see D2) and set `opacity: 0.8`
- [X] T027 [US6] Enable translucency in `src/three/oceanTiles.ts` per contracts §4 / research D2: material gets `transparent: true, opacity: OCEAN.opacity`; keep `side: FrontSide` and default depth settings (front-face culling is what keeps the sea's own far hemisphere/interior out of the framebuffer) (depends T026, T006)
- [ ] T028 [US6] Validate US6 with `npm run dev`: execute quickstart V2 step 5 over contrasting background areas, re-run V1 (grazing view), and confirm lands/caps remain 100 % opaque in the same views (depends T027)

**Checkpoint**: Atmosphere polish lands without weakening the shell.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story cleanup and full-feature validation (FR-009 parity, FR-010 performance, FR-011 mobile reachability, constitution gates).

- [X] T029 Sweep stale comments and docs left by the stories: `src/three/Planet.ts` class docstring (still says "light-blue ocean sphere with skill islands raised out of it"), `src/three/config.ts` header comments, `src/three/hexGrid.ts` comments if they reference the raised-ocean design, and `README.md`'s planet description if it mentions the smooth ocean sphere
- [X] T030 Run the constitution gates: `npm run typecheck` and `npm run build` (scripts in `package.json`) must both pass on the final tree
- [ ] T031 Execute the full `specs/002-planet-visual-refinements/quickstart.md` V1–V12 on desktop AND a mobile viewport (device emulation) with reduced-motion emulated for V11; fix any gaps found and re-run the failed scenario
- [X] T032 Review the final diff against all eight principles in `.specify/memory/constitution.md` and against every FR/SC in `specs/002-planet-visual-refinements/spec.md` (12 FRs, 8 SCs); confirm `specs/002-planet-visual-refinements/checklists/requirements.md` still passes 16/16 (annotation-only if updated)
---

## Phase 10: Post-implementation spec revision (2026-10-04)

**Purpose**: Implementation feedback reversed the *intent* of the transparency decision — the page behind the canvas is near-black (`--bg #05060a`), so "the page shows through" was invisible; the real payoff is the globe's own far side. Strength was also retuned down from 25 % to 20 %. Code and spec artifacts were revised together so they no longer contradict each other.

- [X] T033 [US6] Render land and cap meshes with `side: DoubleSide` in `src/three/skillRegions.ts` and `src/three/polarLands.ts` so far-hemisphere lands render in the opaque pass and read through the translucent sea (the "glass marble"); the ocean stays `FrontSide` so the sea's own far hemisphere and interior never appear (research D2, contracts §3/§4/§5)
- [X] T034 [US6] Retune `OCEAN.opacity` to `0.8` (~20 % transparency) and revise every artifact that encoded the old decision: `spec.md` (US6 story, acceptance scenarios, edge cases, FR-005, glossary, SC-006, assumptions + a new 2026-10-04 clarification session), `research.md` (D2 decision/rationale/alternatives incl. the corrected ΔL analysis; D6 marked load-bearing), `contracts/modules.md` (§1, §3, §4, §5, parity + traceability tables), this `tasks.md`, and `README.md`

**Note**: the D6 occluder-sphere test (T008) changed from a hardening measure to a load-bearing one — far-side lands are now both visible and raycastable, so it is the only thing stopping hover from selecting a land seen through the water (FR-003).



**Status (implementation session)**: all code tasks above are implemented and 
pm run typecheck + 
pm run build pass on the final tree. The 
pm run dev validation tasks (T009, T017, T020, T023, T025, T028, T031) stay OPEN because they need visual confirmation in a browser; the geometry-side claims they cover were verified headlessly (tile counts, single connected mass per land, 0 land-land contacts, 60 deg land cap with a 7.18 deg polar moat, symmetric 111-tile caps, 2.62x 100%-vs-40% size contrast, a11y clamped to the 0.4 floor). T033/T034 (Phase 10) then revised the transparency decision after implementation feedback; the US6 visual checks in V2 step 5 should be re-run against the revised values.

### Retune (implementation feedback #2, 2026-10-04)

- [X] T035 [US2] Planet size retune in `src/three/config.ts`: `CAMERA.fit = 1.035/1.035` (entry, 10 % smaller than before) and `TOUR.growthScale = 1.111` so the globe **ends at the size it used to start at** (`1.15 × min(viewport w, h)`)
- [X] T036 [US2] Planet never hidden by neighbouring sections: `.planet { z-index: 2 }` in `src/styles/main.css` (the real bug — `section, footer { position: relative }` made `#manifesto`/`#work` positioned siblings painting over the canvas), `.planet__stage { overflow: visible }`, and the canvas made taller than the viewport (`--planet-bleed: 125vh`, vertically centred) so the oversized globe is drawn in full and may overlap the neighbours
- [X] T037 [US2] Decouple the camera fit from the canvas in `src/three/Experience.ts`: fit against the **viewport's** smaller dimension while `camera.aspect` keeps using the canvas aspect — otherwise the bleed would re-inflate the globe by the bleed factor on landscape screens and break T035's numbers

### Retune round 2 (implementation feedback #3, 2026-10-04)

- [X] T038 [US2] Shrink **both** sizes a further 10 % in `src/three/config.ts`: `CAMERA.fit = 0.9315/0.9315` (entry) and `TOUR.growthScale = 1.111` (end = `1.035 × min(viewport)`); growth is unchanged. Accepted deviation: the entry size is now below `1.0`, so the whole globe is visible at section entry and the original "entry crop" no longer holds (recorded in `spec.md` SC-002)
- [X] T039 [US2] **Bug fix** in `src/three/Experience.ts` — `handleResize` now converts `CAMERA.fit` from viewport-relative to canvas-relative (`fraction × viewport / canvas`). The vertical camera FOV spans the canvas, so the 125 vh `--planet-bleed` canvas was inflating the globe 1.25× (≈129vh at entry) and clipping its poles against the canvas edge; this is why the planet's top and bottom stayed invisible no matter how the canvas was sized

### Interaction retune (2026-10-04)

- [x] T040 [US2] Vertical drag: **no direction change** — the original mapping (`+deltaY`, documented as `PITCH_DIRECTION = 1` and applied exactly once) already reveals the globe's lower parts on drag-up and is kept. An intermediate revision negated in both the drag and the inertia; this cancelled the drag's sign and reversed the planet on release, so it was reverted
- [X] T041 [US2] **Bug fix** — `PITCH_DIRECTION` is now applied only in `onPointerMove`; `update()` integrates `velocity.x` as-is (reported 2026-10-04: the planet spun backwards after release)
- [X] T042 [US2] Give pitch inertia its own decay `PLANET_CONTROLS.pitchGlideDecay = 0.85` (instead of sharing `damping = 1.8`) so a vertical flick eases out smoothly rather than stalling in ~0.5 s, and zero `velocity.x` when hitting the ±45° clamp so the planet cannot spring back

---

## Phase 11: Convergence (2026-10-04)

**Purpose**: Assess the implemented tree against `spec.md` / `plan.md` / the constitution and append the remaining work. `npm run typecheck` and `npm run build` both pass; every gap below is behavioural, visual, or a spec-internal contradiction found after the size / transparency / drag retunes.

### Findings (CRITICAL first)

- [ ] T043 Reconcile `FR-004`'s entry-crop clause with the accepted deviation per `FR-004` (contradicts) — **CRITICAL**. `spec.md` FR-004 still requires "the full globe is not visible at first glance", but `CAMERA.fit = 0.9315` (< 1.0) makes the whole globe visible at entry and `SC-002` already records this as a "Known deviation". Rewrite the FR-004 clause so the requirement and the shipped behaviour agree (either drop the entry-crop clause or restate it as a superseded one). Per-operating-constraint this command must not edit `spec.md`, so the fix is routed here.
- [ ] T044 Clamp the end-of-scroll globe size to <= 1.0 x min(viewport w, h), or narrow `SC-002`'s "drawn in full" claim per `SC-002` (partial) — **HIGH**. `0.9315 x 1.111 = 1.0349` still exceeds 1.0, so the globe is clipped ~7-19px per side at the section end on 1920x1080, 1440x900, 390x844 and 820x1180, contradicting "top and bottom visible at **every** scroll position". Either lower `TOUR.growthScale` so `fit x growth <= 1.0`, or change `SC-002` to exempt the final positions.
- [ ] T045 Validate that a far-hemisphere land is actually discernible through the ~20% ocean per `SC-006` / `FR-005` (missing) — **HIGH**. Land and cap meshes are `DoubleSide` (`skillRegions.ts`, `polarLands.ts`) and the ocean is `opacity: 0.8` `FrontSide`, but nothing confirms the read-through is visible in practice. Run quickstart V2 step 5 with one land directly behind another; if it reads too faintly, adjust `OCEAN.opacity` (raising it shrinks the far-side contribution — re-check the `D2` lightness note in `config.ts`).
- [ ] T046 Measure frame rate with the bleeding canvas and revert or reduce `--planet-bleed` if the >= 30 fps gate is at risk per `FR-010` / `SC-007` (missing) — **HIGH**. The canvas is now `125vh` (`main.css`), roughly +25% fragment work versus the previous viewport-sized canvas, and performance has not been measured since. Use quickstart V9; if fps drops, lower `--planet-bleed` to ~`115vh` (the fit no longer depends on the canvas, so the sizing numbers in `config.ts` are unaffected).
- [ ] T047 Run the mobile viewport pass per `FR-011` / quickstart V10 (missing) — **HIGH**. `--planet-bleed: 125vh` and the viewport-referenced camera fit (`Experience.ts`) were never exercised on a small screen, and portrait is where T004's end-size clipping bites hardest. Confirm every skill stays reachable via drag + legend and that the globe is not locked out.
- [ ] T048 Verify the corrected vertical drag and its inertia in a browser per `FR-009` / `SC-007` / quickstart V8 (missing) — **MEDIUM**. `PITCH_DIRECTION` passed through three incorrect states during this session; the shipped value (`1`, applied once) has never been seen running. Check: dragging up reveals the globe's lower parts, a vertical flick continues in the same direction as the drag that started it (never reverses), the glide eases out smoothly rather than stalling, and dragging into the +/-45 deg limit does not spring back.
- [ ] T049 Re-tune `.planet__glow` to the actual globe size per Constitution IV (partial) — **MEDIUM`. `main.css` still sizes the halo at `115vmin`, which matched the previous oversized planet; the globe is now 0.93-1.03x min(viewport w, h), so the glow no longer tracks it. Confirm the halo still reads as a soft atmosphere rather than a detached ring.
- [ ] T050 Confirm `.skill-card` and `#skill-legend` still read correctly against the bleeding canvas per `FR-004` / quickstart V10 (partial) — **MEDIUM**. The 125 vh canvas plus `overflow: visible` lets the globe render over roughly 12.5vh above and below the sticky stage; the fixed overlays inside the stage were not re-checked for legibility or collision.
- [ ] T051 Execute the outstanding browser validation tasks per T009, T017, T020, T023, T025, T028, T031 (missing) — **MEDIUM**. Every `npm run dev` validation task in this feature is still open, so no visual acceptance criterion (SC-001 through SC-006, SC-008) has been confirmed on the final tree. Run quickstart V1-V12 on desktop and mobile with reduced-motion emulated for V11, and close the original tasks when each passes.
