# Implementation Plan: Planet Visual Refinements

**Branch**: `002-planet-visual-refinements` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-planet-visual-refinements/spec.md`

## Summary

Replace the planet's smooth background sphere with one continuous, flush hex-tile shell: every surface tile (skill land, light-blue ocean, white polar caps) is built from the same geodesic dual-grid geometry at one shared radius, eliminating the raised-land padding entirely. Ocean tiles render as a single merged semi-transparent mesh (~75% opacity, front-face-only, no interior exposure) and the `SphereGeometry` ocean is deleted. The scroll tour abandons per-land re-centering for one scrubbed, constant-pitch yaw sweep of ~180° plus a scale-growth flourish, with the planet already cropped by the camera fit at section entry (poles never move). Land sizing switches to an expertise-driven radius mapping guaranteeing ≥2× tile-count contrast between 100% and 40% while keeping the >30-connected-tile floor; per-skill shape modulation (aspect + lobes + warp phase) gives each land a distinct silhouette; polar caps shrink to poleward of ~66.5°; `prefers-reduced-motion` gets a static enlarged presentation. All work uses the existing stack — three.js 0.186, GSAP/ScrollTrigger, Lenis, vanilla TS — with no new dependencies, no new sections, and no downloaded assets.

## Technical Context

**Language/Version**: TypeScript ~7 strict (ES2022 target), Vite 6.1.1 — unchanged

**Primary Dependencies**: three.js 0.186 (WebGL2 renderer, built-in `MeshStandardMaterial` transparency — sufficient for ~25% ocean transparency; no custom shaders or post-processing needed), GSAP 3.13 + ScrollTrigger (scrubbed tour timeline), Lenis 1.1 (smooth scroll host) — unchanged per user constraint: no new library without demonstrated necessity; none identified

**Storage**: N/A — world stays fully procedural from in-repo `src/data/skills.ts` (no assets, no DB)

**Testing**: Constitutional gates `npm run typecheck` + `npm run build`; manual validation scenarios in `quickstart.md` mapped to SC-001…SC-008; temporary offline Node scripts (as used in feature 001) to verify geometry invariants (cap size/connectivity, sizing contrast, silhouette distinctness, camera-fit crop) during development — not a test-runner framework

**Target Platform**: Evergreen desktop + mobile browsers, WebGL2

**Project Type**: Single-page static site (single project)

**Performance Goals**: ≥30 fps during drag/hover/scroll (60 fps target) — budget: one merged ocean mesh (~1.5k tiles) + 10 land meshes + 2 cap meshes ≈ 13 draw calls, ~16k triangles total (removes the 128×128 background sphere ≈ 32k tris, net win); raycast keeps island-only targets plus an O(1) analytic sphere-occlusion test

**Constraints**: Flush shell must be watertight (identical radius + identical corner math, no z-fighting at grazing angles); ocean transparency must never expose interior/far-side geometry (front-face culling only); planet must be cropped at section entry on every viewport while every skill stays reachable (drag/legend); reduced-motion must keep full interactivity; no new deps, no new sections, no assets

**Scale/Scope**: 10 skills, ~2,562-tile grid (detail=4), 12 pentagons, 2 polar caps; touches existing planet section only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Verdict | Notes |
|---|-----------|---------|-------|
| I | Originality Over Convention | PASS | Deepens the one-of-a-kind hex-world concept (ocean joins the same visual language); no generic patterns introduced |
| II | Creative Concepts Are Respected | PASS | Refines the existing planet concept (flush shell, calmer tour) rather than replacing it; intent stated in spec US1–US6 |
| III | Beauty With Clarity | PASS | Flush coastlines + readable hex ocean increase coherence; reduced-motion + color-separation checks keep it accessible (gates added in research) |
| IV | Quality Over Quantity | PASS | No new sections/features; modifies one section's craft |
| V | Craftsmanship & Consistency | PASS | Strict TS, config-driven constants, proper dispose paths, no new dependencies, follows hex-lands architecture |
| VI | Preserve Intentionality | PASS | Every change traces to explicit user feedback + clarified spec (5/5 clarifications); no neutral additions |
| VII | Mobile Experience Matters | PASS | Enlarged/cropped planet keeps touch drag + legend; camera-fit crop verified on portrait/landscape viewports (research) |
| VIII | Scrolling Is Part of the Experience | PASS | The ~180° scrubbed sweep + growth is the section's core scroll expression; gated by reduced-motion for accessibility |

**Quality Gates**: `npm run typecheck` must pass; `npm run build` must succeed; all 8 principles reviewed per change (evidence in `quickstart.md` gates).

**Gate verdict (pre-Phase 0): PASS** — no violations; Complexity Tracking empty.


## Project Structure

### Documentation (this feature)

```text
specs/002-planet-visual-refinements/
├── plan.md              # This file (/speckit-plan output)
├── spec.md              # Input (clarified)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── modules.md       # Phase 1 output — internal module contracts
├── checklists/
│   └── requirements.md  # 16/16 passing (from specify/clarify)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── three/
│   ├── config.ts            # EDIT: remove REGIONS.raise; POLAR threshold 55→66.5; CAMERA.fit fractions >1; TOUR sweep (~180°); ocean shell params
│   ├── hexGrid.ts           # UNCHANGED (grid geometry source for all surfaces)
│   ├── skillRegions.ts      # EDIT: flush radius; expertise→radius mapping (2× contrast); shape modulation (aspect/lobes/warp phase); expose land tile ids
│   ├── oceanTiles.ts        # NEW: merged light-blue ocean mesh from free tiles (shared fan-builder, ~75% opacity, FrontSide)
│   ├── polarLands.ts        # EDIT: threshold 66.5°, flush radius, white opaque
│   ├── Planet.ts            # EDIT: remove SphereGeometry ocean; add ocean shell; raycast-target contract
│   ├── PlanetControls.ts    # EDIT: ambient-motion gate for reduced motion (idle spin off); drag clamp untouched
│   ├── PlanetInteraction.ts # EDIT: analytic sphere-occlusion rule so ocean/ice/behind-shell hits return null
│   └── Experience.ts        # EDIT: camera fit fractions for entry crop; reduced-motion wiring
├── animations/
│   ├── planetTour.ts        # REWRITE: single scrubbed ~180° yaw sweep at constant pitch + scale growth; no per-land re-centering; reduced-motion static mode
│   └── scrollAnimations.ts  # EDIT: replace 0.88→1 elastic entry flourish with enlarged static entry (growth moved into tour)
└── (ui/, main.ts, styles/)  # unchanged unless wiring requires touch (legend/drag verified only)
```

**Structure Decision**: Keep the single-project structure from feature 001 — files organized by concern under `src/three/` (surface construction) and `src/animations/` (motion). One new module (`oceanTiles.ts`) follows the existing `polarLands.ts` builder pattern; everything else is targeted edits. No new top-level directories, no test framework (validation via quickstart scenarios + offline Node scripts).

## Complexity Tracking

> No Constitution Check violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |

## Phase 0 & 1 Outputs

See [research.md](./research.md) (decisions D1–D10 with validation results), [data-model.md](./data-model.md), [contracts/modules.md](./contracts/modules.md), [quickstart.md](./quickstart.md).


## Post-Design Constitution Re-Check *(after Phase 1)*

| # | Principle | Verdict | Design-phase evidence |
|---|-----------|---------|------------------------|
| I | Originality Over Convention | PASS | The flush hex-shell (ocean joins the land's visual language) is unique to this world; no template patterns (D1/D2) |
| II | Creative Concepts Are Respected | PASS | Planet concept refined, not flattened: calmer tour keeps the scroll narrative; intent restated in research D7 |
| III | Beauty With Clarity | PASS | Measured color separation (ΔL ≥ 0.12 lands vs ocean, D2), reduced-motion static mode (D8), hover-through fixed (D6), caps readable |
| IV | Quality Over Quantity | PASS | No new sections/deps/assets; two small source files + targeted edits (D10); perf strictly improves (D9) |
| V | Craftsmanship & Consistency | PASS | Shared `buildTileFan` enforces flushness in one place; config-driven constants; dispose contracts kept; contracts document every signature change |
| VI | Preserve Intentionality | PASS | Every decision (D1–D10) traces to a clarified spec item or a constitution principle; no neutral additions; scope guard: a11y data observation reported, not changed |
| VII | Mobile Experience Matters | PASS | Entry crop verified on 6 mobile/tablet viewports (1.15× min dim, D7); touch drag + legend reachability preserved (FR-011 → quickstart V10) |
| VIII | Scrolling Is Part of the Experience | PASS | Single 180° scrubbed sweep + growth is the section's scroll expression (D7), gated for accessibility (D8) |

**Gate verdict (post-Phase 1): PASS** — no violations, no unresolved clarifications, Complexity Tracking remains empty. Quality gates `npm run typecheck` + `npm run build` re-validated at implementation time per quickstart V12.

**Generated artifacts**: `research.md` (D1–D10, all NEEDS CLARIFICATION resolved), `data-model.md`, `contracts/modules.md` (13 module contracts + parity/traceability tables), `quickstart.md` (V1–V12). `tasks.md` NOT created (owned by `/speckit-tasks`).
