# Implementation Plan: Hex Planet Lands

**Branch**: `001-hex-planet-lands` | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-hex-planet-lands/spec.md`

## Summary

Rebuild the planet's land surface from triangles into hexagonal tiles — a
strategy-game world-map language — with every skill landmass forming ONE
connected land of MORE THAN 30 tiles (shade-varied per tile so tile edges
read), plus white hex-tiled polar lands at both poles that stay out of all
skill interactions. The existing interaction layer (drag + inertia + ±45°
clamp, hover highlight + info card, legend sync, scroll tour) is untouched,
and the section must hold ≥30 fps (60 target).

## Technical Context

**Language/Version**: TypeScript 7 (strict, `tsc --noEmit`), ES2022 target

**Primary Dependencies**: Vite 6, three.js 0.186, GSAP 3 + ScrollTrigger,
Lenis — **unchanged, no new libraries** (user allowance considered: the hex
grid on a sphere is pure geometry math; no third-party library beats it,
and the project convention forbids magic-free dependencies for decoration)

**Storage**: N/A (static site, no DB per user)

**Testing**: `npm run typecheck` + `npm run build` (automated gates);
visual/interactive QA via `quickstart.md` scenarios (manual — project has no
test runner)

**Target Platform**: Modern evergreen browsers, desktop + mobile; WebGL2

**Project Type**: Single-page static site (vanilla TS, no framework)

**Performance Goals**: ≥30 fps floor during drag/hover/tour (pass/fail),
60 fps target (spec SC-006); hex-grid generation stays a load-time one-shot

**Constraints**: Procedural/data-driven only (no downloaded assets);
tiles ≈ ~1,300–1,600 total so lands hold 30+ tiles each while draw calls
stay ~13 (per-skill merged meshes + polar caps + ocean); interaction
contracts preserved (`Planet.meshes` = skill lands only); mobile parity
via the existing camera fit

**Scale/Scope**: 10 skills + 2 polar caps on one globe; 1 new geometry
module + rework of the land-building pass; zero interaction changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design:
all rows still PASS.*

| Principle | Verdict | Notes |
|-----------|---------|-------|
| I. Originality Over Convention | PASS | The strategy-game hex world-map language is distinctly this site's own (no template portfolio does this) |
| II. Creative Concepts Are Respected | PASS | "Skills as lands on a hex world map" is the section's creative idea, taken deeper — not flattened |
| III. Beauty With Clarity | PASS | Tile visibility solved (shade variation, Q1); polar lands non-interactive (FR-007); hover legibility preserved |
| IV. Quality Over Quantity | PASS | Rebuilds the existing centerpiece; no new sections or features added |
| V. Craftsmanship & Consistency | PASS | Strict TS, config-driven constants, merged-mesh draw-call discipline, no new deps |
| VI. Preserve Intentionality | PASS | Serves the planet identity directly; out-of-scope list rejects decoration creep |
| VII. Mobile Experience Matters | PASS | Same globe on mobile; camera fit already handles sizing; fps floor applies |
| VIII. Scrolling Is Part of the Experience | PASS | Scroll tour unchanged and continues to rotate every land into view |

Quality gates: `npm run typecheck` and `npm run build` MUST pass (governance).
No violations → Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-hex-planet-lands/
├── plan.md              # This file
├── research.md          # Phase 0 — hex-grid-on-sphere decisions
├── data-model.md        # Phase 1 — tile/landmass/polar-cap entities
├── quickstart.md        # Phase 1 — validation scenarios V1–V6
├── contracts/           # Phase 1 — internal module contracts
│   └── modules.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── three/
│   ├── config.ts          # + HEX, POLAR constant blocks; REGIONS re-tuned
│   ├── hexGrid.ts         # NEW — hex tile lattice on the sphere
│   ├── skillRegions.ts    # Reworked: hex-tile lands + connectivity pass
│   ├── polarLands.ts      # NEW — white hex caps at both poles
│   ├── Planet.ts          # + polar caps in scene; land meshes contract kept
│   ├── atmosphere.ts      # absent (reverted feature) — unchanged
│   └── (controls/interaction/tour unchanged)
├── data/skills.ts         # unchanged (single source of truth)
└── (ui/, animations/ unchanged)
```

**Structure Decision**: existing single-project layout kept. Two new modules
(`hexGrid.ts`, `polarLands.ts`) + rework of `skillRegions.ts`; everything
else (Planet wiring aside), including the whole interaction layer, is
untouched. No test runner introduced; validation = typecheck + build +
quickstart manual scenarios.

## Complexity Tracking

> No constitution violations — table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

