# Tasks: Planet Interaction Refinement

**Input**: Design documents from `/specs/004-planet-interaction-refinement/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No test framework in repo; validation is manual via quickstart.md V1–V5 (no test tasks generated).

**Organization**: Tasks grouped by user story; each story independently implementable and testable after Foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline gates and working branch

- [X] T001 Verify clean baseline on branch `004-planet-interaction-refinement`: `npm install`, `npm run typecheck` exits 0 in repo root
- [X] T002 Record pre-change behavior notes (drag tilt + scroll pole-flip, hover glow) per quickstart.md V1/V4 in specs/004-planet-interaction-refinement/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared invariants every story depends on (D1 order + config constants)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Set `dragGroup.rotation.order = 'YXZ'` in src/three/Planet.ts so pitch stays latitude-like at any yaw (research D1)
- [X] T004 [P] Add interaction constants to src/three/config.ts: label float height + text sizing, hover tint lightness lift + lift height + tap timeout, re-center target = PLANET.initialTilt

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Scroll keeps the globe oriented (Priority: P1) 🎯 MVP

**Goal**: Scroll rotates (sweep + growth unchanged) while drag pitch eases back to entry tilt; yaw untouched; one-way stick

**Independent Test**: quickstart.md V1 — drag to strong tilt, scroll top-to-bottom, poles return near entry alignment with no jumps; scroll-back keeps entry tilt

- [X] T005 [US1] Implement tilt-only scroll re-centering in src/animations/planetTour.ts: ease dragGroup pitch toward PLANET.initialTilt with scroll progress, never write yaw, never write while pointer down, one-way stick on scroll-back (research D2, contracts C1)
- [X] T006 [US1] Implement reduced-motion static re-center in src/animations/planetTour.ts: single set of dragGroup pitch to entry tilt, no timeline (research D5, contracts C5)

---

## Phase 4: User Story 2 - Dragging always feels the same (Priority: P1)

**Goal**: Up-drag reveals lower latitudes at entry, mid, and end scroll with comparable magnitude; glide never reverses

**Independent Test**: quickstart.md V2 — identical ~150px up-drag at three scroll positions reveals lower latitudes each time; flick glide continues dragged direction

- [X] T007 [US1] [US2] Compute yaw-compensated drag deltas in src/three/PlanetControls.ts so screen-space up maps to latitude pitch at any accumulated yaw (research D1, contracts C2)
- [X] T008 [US2] Fix glide seeding/integration in src/three/PlanetControls.ts so release velocity continues the dragged direction at any scroll position (research D1, contracts C2)
## Phase 5: User Story 3 - Subtle hover emphasis with lift (Priority: P2)

**Goal**: Close same-hue tint replaces bright glow; hovered land lifts slightly and settles back; tap auto-clears

**Independent Test**: quickstart.md V4 — hover each land reads "same color, bolder" with visible lift, clears flush on leave; off-canvas leave and tap both clear

- [X] T009 [P] [US3] Derive per-land close-tint hover color in src/three/skillRegions.ts (same hue family, lightness +~0.08–0.12, saturation held) and retune HIGHLIGHT.active in src/three/config.ts down from white-hot 1.35 (research D4, contracts C4)
- [X] T010 [US3] Implement hover lift + settle in src/three/Planet.ts setHighlighted: small radial offset while hovered, flush restore on null, tap auto-clear ~600ms, instant apply under reduced motion (research D4/D5, contracts C4)

---

## Phase 6: User Story 4 - Floating land labels (Priority: P3)

**Goal**: One skill-name sprite label per land floating above surface, moving with its land, front-facing only, front-most-wins overlap

**Independent Test**: quickstart.md V3 — every front-facing land name readable off-globe; 180° rotation swaps readable/hidden sets; crowded lands show front-most label only

- [X] T011 [P] [US4] Create sprite label system in src/three/landLabels.ts: one THREE.Sprite per skill (text from src/data/skills.ts names), positioned at skillDirections × (R + floatHeight), parented to dragGroup (research D3, contracts C3)
- [X] T012 [US4] Implement label visibility in src/three/landLabels.ts via PlanetInteraction occluder-sphere rule: hide far-side labels, front-most-only on overlap, smaller type on small screens (research D3, contracts C3)
- [X] T013 [US4] Wire labels into lifecycle in src/main.ts (or boot owner): create after Planet, dispose with experience, no-op path when WebGL labels unavailable with legend/info-card fallback intact (spec Edge Cases, contracts C3)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Full validation, gates, and cleanup across all stories

- [ ] T014 Run full quickstart.md V1–V5 validation in specs/004-planet-interaction-refinement/quickstart.md and fix regressions across src/three/ and src/animations/ (browser pass pending — owner runs V1–V5 via `npm run dev`)
- [X] T015 [P] Mobile pass in src/three/landLabels.ts and src/three/PlanetInteraction.ts: tap-to-identify brief emphasis, no stuck hover, legible labels without covering neighbors (FR-013, contracts C5)
- [X] T016 Final gate: `npm run typecheck` and `npm run build` both exit 0, `git status` confined to src/three/, src/animations/, src/data/ in repo root

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories (T003 YXZ order is prerequisite for T005 re-center math and T007 delta mapping)
- **User Stories (Phase 3–6)**: All depend on Foundational completion
  - US1 (tour) + US2 (controls) touch different files — parallel-safe
  - US3 (hover) + US4 (labels) touch different files — parallel-safe
  - Or sequentially in priority order (P1 → P1 → P2 → P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational - no other story dependencies
- **User Story 2 (P1)**: After Foundational - shares T003 invariant with US1, independently testable via V2
- **User Story 3 (P2)**: After Foundational - independent via V4
- **User Story 4 (P3)**: After Foundational - independent via V3; reuses occluder rule read-only

### Parallel Opportunities

- T003 first, then T005 + T007 + T009 + T011 can start across different files
- T006 (reduced-motion tour) || T010 (Planet lift) after their story cores
- T015 mobile pass || T014 validation fixes on different files

---

## Parallel Example: Post-Foundation Kickoff

```bash
# After T003 (YXZ order) lands:
Task: "T005 tilt-only scroll re-centering in src/animations/planetTour.ts"
Task: "T007 yaw-compensated drag deltas in src/three/PlanetControls.ts"
Task: "T009 close-tint derivation in src/three/skillRegions.ts"
Task: "T011 sprite label system in src/three/landLabels.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — joint P1)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T004 — CRITICAL)
3. Complete Phase 3 (US1 re-center) + Phase 4 (US2 drag)
4. **STOP and VALIDATE**: quickstart V1 + V2 independently
5. Demo if ready — the two reported bugs are fixed

### Incremental Delivery

1. Setup + Foundational → YXZ invariant + constants ready
2. Add US1 + US2 → V1/V2 pass → Deploy/Demo (core fixes!)
3. Add US3 → V4 pass → Deploy/Demo (calmer hover)
4. Add US4 → V3 pass → Deploy/Demo (self-explaining globe)
5. Polish (Phase 7) → V5 + gates green → merge

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- T007 carries [US1][US2] — shared D1 delta mapping both stories rely on; scheduled in Phase 4, US1 V1 validates no-drag-regression alongside
- Each user story independently completable and testable via its quickstart scenario
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

