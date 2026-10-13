---

description: "Task list for Palette, Continents & Land Scale"
---

# Tasks: Palette, Continents & Land Scale

**Input**: Design documents from `/specs/003-palette-continents/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/modules.md,
quickstart.md

**Tests**: No test tasks are generated. The project has **no automated test runner**, and the
spec does not request one. Verification is `npm run typecheck` + `npm run build` plus the
browser scenarios V1–V9 in `quickstart.md`, referenced inline below as checkpoints.

**Organization**: Tasks are grouped by user story so each story can be implemented and
validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

- Single project: `src/` at repository root

---

## Build-green discipline

Tasks are ordered so the build **stays green at every checkpoint**: `hue` is added-then-removed
around the allocator rewrite rather than deleted up front, and `applyPaletteVariables` is
introduced before the stylesheet is rewired.

## Two deviations from `plan.md`, both deliberate

1. **No `src/styles/palette.css`.** A static stylesheet holding hex values would be a *second*
   source of colour truth and would violate FR-001. Instead `palette.ts` injects the
   `--palette-*` custom properties onto `document.documentElement` at boot and `main.css` only
   ever reads `var(--palette-*)`.
2. **US2 and US4 share one implementation unit** (`src/three/skillRegions.ts`). The allocator
   is rewritten once and that rewrite delivers both continent grouping (US2) and quota sizing
   (US4). Phase 5 verifies sizing; the two cannot be worked in parallel.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new data modules. Every task is purely additive, so the build stays
green and no story is blocked by a half-finished refactor.

- [x] T001 Create `src/data/palette.ts` with `PaletteRole` and `PaletteEntryId` unions, the `PaletteEntry` interface, and the `PALETTE` array holding the eight supplied hexes (`0C1E37`, `FFCD28`, `0978BE`, `80C5DC`, `F1FFFA`, `193D6A`, `E1E06C`, `FFECC7`) in the owner's stated order, each with its role(s) and label per `data-model.md`
- [x] T002 [P] Add `paletteEntry(id)` (throws on unknown id) and `cssVarName(id)` returning `--palette-<kebab-id>` in `src/data/palette.ts`
- [x] T003 [P] Add `applyPaletteVariables(target: HTMLElement)` in `src/data/palette.ts`, writing every `--palette-*` property plus the role aliases the existing stylesheet already consumes (`--bg`, `--ink`, `--accent`, `--line`) onto the target element
- [x] T004 [P] Create `src/data/continents.ts` with the `Continent` interface, the four starting continents from FR-020 (`Front-end & Interface` → `FFCD28`; `Back-end & Systems` → `0978BE`; `Graphics & Motion` → `E1E06C`; `Creative & Quality` → `FFECC7`), `continentForSkill(skillId)`, and `validateContinents(skills)` enforcing every throw rule listed in `data-model.md`
- [x] T005 Add `skillTileQuota(expertise: number): number` to `src/data/skills.ts` implementing `max(1, floor(62.5 × clamp(e,0,1) − 12.5))` (research D1) — additive, `hue` untouched at this stage

**Checkpoint**: `npm run typecheck` and `npm run build` both pass; nothing on screen has
changed yet.
---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Colour derivation and the tuning constants that every story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Add the `LAND_COLOR` block to `src/three/config.ts` with `spread: 0.14`, `minLightness: 0.12`, `maxLightness: 0.92` (research D6, the measured optimum — do not substitute another value without re-measuring)
- [x] T007 Add `skillColor(skill: SkillArea, continent: Continent): string` to `src/data/continents.ts`, keeping the continent's hue and saturation and stepping lightness by expertise rank, clamping the ramp to the room available above/below the base lightness
- [x] T008 Verify `npm run typecheck` and `npm run build` both exit 0 in `src/data/skills.ts` and `src/three/skillRegions.ts` — these files are still untouched, so this must pass with no call-site changes

**Checkpoint**: Foundation ready — user story implementation can now begin.
## Phase 3: User Story 1 - The owner restyles the whole site from one file (Priority: P1) 🎯 MVP

**Goal**: The eight colours become the single source of truth for every page surface —
background, text, buttons, links, focus rings, scrollbar — driven by one editable file.

**Independent Test**: Edit `navy.hex` in `src/data/palette.ts`, reload, and observe the page
background, primary and secondary text, buttons, links, focus ring, scrollbar and the planet
all change, with no other file touched. Then run quickstart **V1**.

> **Scope note (read first).** US1 as written covers the whole site including the 3D planet.
> Land colours are not palette-driven until the allocator rewrite in Phase 4, because until a
> skill's colour comes from its continent there is no palette entry for it to trace to. US1
> therefore delivers the page surfaces and the mechanism; the planet completes in Phase 4
> (US2), and V1's land check is re-run in T022.

- [x] T009 [US1] Rewrite the `:root` block in `src/styles/main.css` so every colour is a `var(--palette-*)` or role alias (`--bg`, `--ink`, `--accent`, `--line`) — no literal hex may remain (FR-003)
- [x] T010 [US1] Replace every remaining literal colour in `src/styles/main.css` (selection, scrollbar thumb, borders, glows, `.skill-card`, `.skill-legend`, `.site-header`, `.button--solid` and its hover) with the matching palette variable
- [x] T011 [US1] Call `applyPaletteVariables(document.documentElement)` in `src/main.ts` **before** `new Experience(...)` so no colour is ever sampled from a pre-palette stylesheet
- [x] T012 [US1] Verify `src/styles/main.css` with `grep -nE '#[0-9a-fA-F]{3,8}' src/styles/main.css` (expect no output) and confirm `npm run typecheck` plus `npm run build` exit 0, then run quickstart V1 steps 1–4 in `specs/003-palette-continents/quickstart.md`

---

**Checkpoint**: Edit one hex in `src/data/palette.ts` → the whole page restyles. This is the MVP.

---

## Phase 4: User Story 2 - A visitor reads skills as continents (Priority: P2)

**Goal**: Skills render grouped into four colour-coded continents, each one continuous
landmass in its own colour family, with every skill still individually identifiable.

**Independent Test**: Run quickstart **V2**, **V3** and **V4** in
`specs/003-palette-continents/quickstart.md` — rotate the globe and confirm each continent is
one connected landmass in its own colours, that distinct continents never touch, and that
hovering a skill identifies it *and* names its continent.

> This phase also lands US4's sizing, because the allocator is rewritten once here. US4's own
> verification is Phase 5.

- [x] T013 [US2] Add `continentId: ContinentId` to `SkillArea` in `src/data/skills.ts` and set the correct continent on all ten skills; **keep `hue` for now** so the build stays green until T018
- [x] T014 [US2] Rewrite the allocator in `src/three/skillRegions.ts`: replace the seed + radius + erosion + flood-fill pipeline with quota-driven BFS growth — seed each continent via `grid.findNearestTileId(anchor)`, then claim the nearest unclaimed neighbour until the continent's quota is met, **refusing any tile grid-adjacent to a tile owned by a different continent** (research D2)
- [x] T015 [US2] Add the per-skill partition in `src/three/skillRegions.ts`: split each continent's tile set among members largest-quota-first, nearest-seed-first, each drawing from the continent's remaining pool until its own quota is met (research D4, measured 10/10 exact)
- [x] T016 [US2] Colour land tiles in `src/three/skillRegions.ts` via `skillColor()`, keeping the existing per-tile lightness jitter (`HEX.shadeJitter`) so tiles stay countable, and preserving `vertexColors: true`, `side: DoubleSide`, `flatShading: true` and `emissiveIntensity: HIGHLIGHT.base`
- [x] T017 [US2] Add `continentId` to `mesh.userData` in `src/three/skillRegions.ts` alongside the existing `skillId`, leaving `skillId` and the `SkillIslandsBuild` return shape untouched
- [x] T018 [US2] Remove `hue`, `skillColorHSL()` and `skillCssColor()` from `src/data/skills.ts`, and delete the now-unused `REGIONS.islandRadius`, `expertiseRange`, `shape`, `seedJitter` and `satelliteOffset` from `src/three/config.ts` — keeping `borderNoise` and `maxLandLat`
- [x] T019 [US2] Group the legend under continent headers in `src/ui/skillLegend.ts` (headers in `CONTINENTS` order, swatch in `continent.mainColor`, rows swatched with `skillColor()`), leaving the hover/focus/blur handlers and `SkillLegendController` unchanged
- [x] T020 [US2] Change `showSkill()` in `src/ui/infoCard.ts` to take the continent and render its name in the kicker line (replacing the literal `'Skill area'`), omitting the kicker when the continent is null
- [x] T021 [US2] Update the `applyHover` pipeline in `src/main.ts` to pass the continent into `infoCard.showSkill()`
- [x] T022 [US2] Verify `npm run typecheck` and `npm run build` exit 0 for the rewritten `src/three/skillRegions.ts`, `src/data/skills.ts` and `src/ui/`, then run quickstart V2, V3 and V4 in `specs/003-palette-continents/quickstart.md` — plus V1's land check, which now passes since land colour finally traces to the palette

---

## Phase 5: User Story 4 - A visitor sees a calmer, less crowded planet (Priority: P2)

**Goal**: Lands shrink to the expertise-driven tile quota, so the globe reads as predominantly
ocean — the largest land about the size of China rather than a sprawling continent.

**Independent Test**: Run quickstart **V5** in
`specs/003-palette-continents/quickstart.md` — count tiles per land and compare against the
table in research D1; the globe must read as predominantly ocean from any angle.

> Implementation already landed in Phase 4 (T014/T015). This phase verifies it.

- [x] T023 [US4] Verify every skill's tile count in `src/three/skillRegions.ts` against the research D1 table — typescript 46, gsap 43, threejs 40, performance 38, creative 37, ui 34, glsl 31, node 31, design 28, a11y 25 — any mismatch means the quota or partition step is wrong
- [x] T024 [US4] Verify total land coverage from `src/three/skillRegions.ts` is about 13.78% (353 of 2,562 tiles), down from about 89%, and that the globe reads as predominantly ocean at every rotation (SC-005)
- [x] T025 [US4] Confirm in `src/three/skillRegions.ts` that each continent is exactly one connected component, cross-continent adjacency is 0, and max land latitude is under 60 degrees leaving the polar-cap moat intact (research D3 baselines)
- [ ] T026 [US4] Run quickstart V5 and V7 in `specs/003-palette-continents/quickstart.md`, including the keyboard pass proving the smallest lands are still selectable (FR-029)

---

## Phase 6: User Story 3 - The owner edits the continent map by hand (Priority: P3)

**Goal**: Adding, renaming or removing a continent, or moving a skill between continents,
requires editing exactly one data file and nothing else.
---

**Independent Test**: Run quickstart **V6** in
`specs/003-palette-continents/quickstart.md` — add a fifth continent with a palette colour and
one existing skill, reload, and confirm it renders in that colour with the skill moved, having
touched no other file.

- [x] T027 [US3] Wire `validateContinents(SKILL_AREAS)` into the boot sequence in `src/main.ts` so an unknown `continentId` or duplicate skill membership fails fast with a message naming the offending id, rather than rendering an uncoloured land
- [x] T028 [US3] Handle a zero-skill continent in `src/data/continents.ts` and `src/ui/skillLegend.ts`: omit its land and its legend header, and do **not** throw
- [x] T029 [US3] Verify quickstart V6 in `specs/003-palette-continents/quickstart.md` passes in both directions — add the continent and move a skill, then remove and restore — with no file other than `src/data/continents.ts` edited

**Checkpoint**: All user stories are independently functional.

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T030 Run the full quickstart pass V1–V9 in `specs/003-palette-continents/quickstart.md` in the documented regression order and record each result — especially **V8**, where any regression in feature 002's behaviour will surface
- [ ] T031 Verify contrast pairings for `src/styles/main.css` per quickstart V9 in `specs/003-palette-continents/quickstart.md`: mint cream and light blue text on navy at 4.5:1 or better, amber button fill vs label at 4.5:1 or better, focus ring at 3:1 or better; confirm continent colours are used only as graphical fills and never as label text, since `0978BE` measures 3.53:1 and is graphic-only
- [ ] T032 [P] Confirm in `src/three/Experience.ts` that draw calls have not grown versus the pre-feature baseline, and that the frame rate still meets the project's existing target (SC-011)
- [x] T033 [P] Update `README.md` to describe the palette file, the continent map and the new land-scale rule
- [x] T034 Final gate: run `npm run typecheck` and `npm run build` (both must exit 0) and confirm `git status` shows changes confined to the files named in `plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user stories**
- **User Stories (Phase 3–6)**: All depend on Phase 2 completing
- **Polish (Phase 7)**: Depends on all desired stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Phase 2. Independent of the others.
- **User Story 2 (P2)**: Starts after Phase 1 (needs `continents.ts`). **Also delivers US4's
  allocator**, so it must complete before US4 can be verified.
- **User Story 4 (P2)**: Verification only — depends on US2's allocator landing (T014/T015).
  Cannot be worked in parallel with US2.
- **User Story 3 (P3)**: Starts after Phase 2; touches `continents.ts` and `main.ts`, so it must
  not run concurrently with US2's T021.

### Critical path

```
T001 -> T003 -> T006 -> T007 -> [T009 -> T012  (MVP: demo here)]
                                 -> T013 -> T014 -> T015 -> T016 -> T018 -> T022 -> T023 -> T026
```

T014 is the highest-risk task: it is the allocator rewrite, and it is where research D2.1's
seeding bug would reappear — a continent whose growth rule requires touching an existing tile
produces **zero** tiles when it starts empty, which type-checks and looks like an empty globe.

### Within Each User Story

- Data modules before consumers: `palette.ts` before `main.css` rewiring; `continents.ts`
  before `skills.ts` gains `continentId`; the allocator before the legend and info card.
- Additive before subtractive: `hue` is added then removed (T013/T018) so no intermediate
  commit is broken.
- Story complete before moving to the next priority.

### Parallel Opportunities

- **Phase 1**: T002, T003 and T004 touch different files — run together after T001.
- **Phase 4**: T019 and T020 are independent of each other (`skillLegend.ts` vs `infoCard.ts`).
- **Phase 7**: T032 and T033 are independent.
- **Not parallel despite appearing so**: T014 and T015 both rewrite `skillRegions.ts` and are
  strictly ordered; T013 and T018 both touch `skills.ts`.

---

## Parallel Example: Phase 1

```bash
# T001 first (creates the module), then these three together:
Task: "Add paletteEntry(id) and cssVarName(id) in src/data/palette.ts"
Task: "Add applyPaletteVariables(target) in src/data/palette.ts"
Task: "Create src/data/continents.ts with the four starting continents"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart V1 — edit one hex, the whole page restyles
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 (Phase 3) → validate V1 → **MVP: the site is palette-driven**
3. US2 + US4 (Phases 4–5) → validate V2/V3/V4/V5 → four continents on a predominantly-ocean world
4. US3 (Phase 6) → validate V6 → the continent map is owner-editable
5. Polish (Phase 7) → full V1–V9 regression pass

### Critical sequencing warning

Phase 4 is the largest and riskiest phase and should land as **one commit or one uninterrupted
run**: the allocator rewrite (T014), the partition (T015) and the recolour (T016) are mutually
dependent, and an intermediate state renders an uncoloured or wrongly-sized globe.

---

## Notes

- [P] = different files, no dependencies
- [Story] label maps each task to its user story for traceability
- Each user story is independently completable and testable via its quickstart scenarios
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
- **Do not** substitute different values for `LAND_COLOR.spread` (0.14) in `src/three/config.ts`
  or for the quota formula in `src/data/skills.ts` without re-measuring; both were chosen from
  measured data in `specs/003-palette-continents/research.md`

---

## Phase 8: Convergence

**Purpose**: Close the gaps found by `/speckit-converge` between spec/plan/tasks and the
implemented code. Verification-only tasks T026, T030, T031 and T032 already cover the remaining
browser/contrast/perf passes and are intentionally not duplicated here.

- [x] T036 Implement FR-029's enlarged invisible target area so every land — including the single-tile lands allowed by FR-022 — can be hovered and tapped directly (e.g. per-skill invisible proxy geometry or proximity picking wired into `src/three/PlanetInteraction.ts`), preserving the far-side occluder rule and the `SkillIslandsBuild`/`Planet.meshes` contracts per FR-029 and SC-008 (missing)
- [x] T037 Make moving a skill between continents a single-file edit of `src/data/continents.ts` by removing the second forced edit — the redundant `SkillArea.continentId` in `src/data/skills.ts` and/or the mismatch throw in `validateContinents()` — while keeping fail-fast on unknown continent ids and duplicate membership per FR-015, SC-009 and US3 acceptance scenario 1 (contradicts)
- [x] T038 Review the `ContinentShape`/`ContinentVoid` silhouette machinery in `src/data/continents.ts` and `src/three/skillRegions.ts` (aspects, lobes, lakes/rivers, `validateShape`, derived-shape fallback) — justify it in writing against the spec and plan (it is not called for by any artifact and touches the out-of-scope coastline-detail rule) or remove it per spec Out of Scope (unrequested)
- [x] T039 Give the `FFECC7` beige entry its intended tertiary-accent role in `src/data/palette.ts` — or document the deliberate omission in the file — so every palette entry carries a name and a role per FR-002 and FR-005 (partial)
- [x] T040 Replace the literal `'#F1FFFA'` fallbacks in `src/three/skillRegions.ts` and `src/ui/infoCard.ts` with `paletteEntry('mintCream').hex` (matching `src/ui/skillLegend.ts`), and resolve the off-palette favicon colours in `public/favicon.svg` (`#7f6bff`, `#12162b`, `#5ad1ff`) as palette-derived or explicitly documented scenery, per FR-003 and SC-002 (partial)
- [x] T041 Remove the unconsumed `continentAnchors` and `landTilesBySkill` fields from the `SkillIslandsBuild` return shape in `src/three/skillRegions.ts` — or give them a real consumer — restoring the return shape T017 required untouched (contradicts)

