# Implementation Plan: Planet Interaction Refinement

**Branch**: `004-planet-interaction-refinement` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-planet-interaction-refinement/spec.md` (plus 3 clarify answers: tilt-only re-centering, front-most-label overlap, one-way stick)

## Summary

Fix the planet's disorienting scroll-plus-drag coupling (tilt-only scroll re-centering, yaw-compensated drag so up always reveals lower latitudes), replace the harsh hover glow with a close same-hue tint plus slight lift, and add one floating sprite label per skill land. Approach per [research.md](research.md): YXZ order on the drag group + yaw-compensated deltas (D1), tour-driven pitch ease with pointer-down gating (D2), drag-group-parented sprites with occluder visibility (D3), GSAP emissive retune + radial lift through `setHighlighted` (D4), tap-timeout and instant reduced-motion emphasis (D5).

## Technical Context

**Language/Version**: TypeScript 5.x (strict) + Vite 6, three.js 0.186, GSAP 3 + ScrollTrigger, Lenis smooth scroll

**Primary Dependencies**: three (globe, sprites, raycast), gsap (tour timeline, emissive tweens), lenis (scroll input)

**Storage**: N/A (all runtime scene state; see data-model.md)

**Testing**: Manual validation guide (quickstart.md V1–V5); `npm run typecheck` + `npm run build` gates; no test framework in repo

**Target Platform**: Modern desktop + mobile browsers (WebGL); touch + reduced-motion paths required

**Project Type**: Single-page creative portfolio site (single `src/` project)

**Performance Goals**: 60 fps globe interaction; label sprites add ≤13 draw calls; no geometry added for hover lift

**Constraints**: Nested tour/drag group architecture stays; free yaw + ±45° pitch clamp stay; flush hex-shell silhouette unbroken; palette owns all color

**Scale/Scope**: 13 skill lands, 1 label each; 4 behaviors in `src/three/` + `src/animations/`


## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Originality**: PASS — refines the signature globe interaction; no generic patterns introduced.
- **II. Creative concepts respected**: PASS — scroll tour, drag-globe, and land identity concepts preserved and strengthened, not flattened.
- **III. Beauty with clarity**: PASS — this feature IS the clarity fix (poles stay legible, labels self-explain, hover calms down).
- **IV. Quality over quantity**: PASS — zero new sections; deepens one exceptional experience.
- **V. Craftsmanship & consistency**: PASS — palette owns hover tints, typography follows site direction, typed strict TS, existing pipelines reused (`setHighlighted`, occluder rule).
- **VI. Intentionality**: PASS — every change answers "what intention": orientation legibility (re-center), trust (consistent drag), self-explanation (labels), calm emphasis (hover).
- **VII. Mobile**: PASS — tap auto-clear emphasis, smaller/front-most labels, no hover-stuck states; full design per FR-013, not a fallback.
- **VIII. Scrolling**: PASS — scroll both rotates and re-centers; the core scroll-as-storytelling upgrade.
- **Gates**: `npm run typecheck` + `npm run build` required green at implement end (quickstart V5).

*Post-design re-check: no new violations introduced by research D1–D5, data-model, or contracts. No Complexity Tracking entries needed (no new projects, patterns, or scope beyond the globe module).*

## Project Structure

### Documentation (this feature)

```text
specs/004-planet-interaction-refinement/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── ui-behavior.md   # C1–C5 observable behavior contracts
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── three/
│   ├── Planet.ts            # dragGroup YXZ order, hover tint + lift in setHighlighted
│   ├── PlanetControls.ts    # yaw-compensated drag deltas, glide direction fix
│   ├── PlanetInteraction.ts # occluder rule reused for label visibility, tap auto-clear
│   ├── landLabels.ts        # NEW: sprite labels parented to dragGroup
│   ├── config.ts            # retuned HIGHLIGHT, new LABEL/HOVER constants
│   └── skillRegions.ts      # per-land base colors feeding tint derivation
├── animations/
│   └── planetTour.ts        # tilt-only re-center ease, pointer-down gating, one-way stick
└── data/
    ├── skills.ts            # label text source (skill names)
    └── palette.ts           # tint derivation stays in palette space
```

**Structure Decision**: Single-project layout; all changes confined to the existing globe module (`src/three/`, `src/animations/`) plus one new `landLabels.ts` beside the builders. No new top-level structure.

## Complexity Tracking

> No violations — constitution check fully PASS, no new projects or patterns; table intentionally empty.

