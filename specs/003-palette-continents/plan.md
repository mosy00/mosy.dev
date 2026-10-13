# Implementation Plan: Palette, Continents & Land Scale

**Branch**: `003-palette-continents` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-palette-continents/spec.md`

## Summary

Make the eight-colour palette a single editable source of truth for the whole site, apply it
to the planet's lands, regroup the ten skills into four colour-coded continents rendered as
one connected landmass each, and shrink every land from its current ~43–122 tiles down to
1–50 tiles via an expertise→tile-count formula (100% → 50 tiles ≈ 1.95% of the globe, roughly
China), leaving the planet predominantly ocean.

The technical spine is a single new `src/data/palette.ts` module that both the CSS custom
properties and the 3D materials read from, and a rewrite of the island allocator in
`src/three/skillRegions.ts` from "seed + radius + erosion" to "seed + quota-driven BFS growth
with a hard inter-continent exclusion", so a continent's tile count is exact and connectivity
is structural rather than filtered after the fact.

## Technical Context

**Language/Version**: TypeScript 7.0 (strict), ES2022 modules
**Primary Dependencies**: three.js 0.186, GSAP 3.15 + ScrollTrigger, Lenis 1.3 — all existing
**Storage**: N/A — static site, no database. Palette and continents live in versioned `.ts` files
**Testing**: No automated runner in the project. Verification is `npm run typecheck` +
`npm run build` + manual browser checks per `quickstart.md`
**Target Platform**: Modern evergreen browsers with WebGL2; mobile Safari/Chrome
**Project Type**: Single-page client-rendered 3D web app (Vite)
**Performance Goals**: Existing project target — ≥30 fps floor, 60 fps goal on the planet
section; SC-011 defers to it. Draw calls must not grow
**Constraints**: Strict TS; no framework; **no new library required** (the owner allowed one only
if it materially improves output — none is needed here); palette must remain the single colour
source; land/ocean/cap geometry method and globe resolution unchanged
**Scale/Scope**: 2,562 hex tiles total; 10 skills → 4 continents; 353 land tiles (13.78%)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Evidence |
|---|---|---|---|
| I. Originality Over Convention | No conventional portfolio patterns added | PASS | Continent grouping deepens the existing planet concept; no new section or template layout |
| II. Creative Concepts Respected | Planet concept strengthened, not flattened | PASS | The globe stays the centrepiece; continents are a new expressive layer *on* it |
| III. Beauty With Clarity | Readability, orientation, accessibility preserved | PASS | Contrast measured per SC-010; hover/keyboard/legend paths retained (FR-012) |
| IV. Quality Over Quantity | No volume growth | PASS | Land coverage falls 89% → 13.78%; four continents, no new sections |
| V. Craftsmanship & Consistency | Visual + code quality | PASS | One palette module, one shared colour formula used by CSS and 3D so legend/swatch/land cannot drift |
| VI. Preserve Intentionality | Every change serves a stated intention | PASS | All three user requests (palette, continents, scale) implemented directly |
| VII. Mobile Experience Matters | Mobile preserved | PASS | FR-012 preserves existing mobile behaviour; smaller lands are strictly easier to tap (FR-029) |
| VIII. Scrolling Is Part of the Experience | Scroll choreography untouched | PASS | Tour, growth and reduced-motion paths unchanged |

**Complexity Tracking**: no violations — no new sections, no new dependencies, no new runtime
concepts beyond the continent grouping the owner asked for.

### Post-Phase-1 re-check

Re-evaluated after the Phase 0/1 design was written. All eight principles still PASS:

- **I, II** — the continent concept is a new expressive layer on the existing globe, not a
  replacement or a conventional portfolio pattern. No section added.
- **III** — accessibility is preserved by construction (§8 preservation list keeps hover,
  keyboard, legend and reduced-motion paths) and the one colour risk is documented with a
  named owner check (quickstart V4) rather than assumed away.
- **IV** — land coverage falls to 13.78%; the feature *removes* visual noise rather than adding.
- **V** — one colour function feeds CSS and 3D together (§1, §4, §5), which is the mechanism
  that prevents legend/land drift; that is a craftsmanship gain, not just a refactor.
- **VI** — all three owner requests are implemented as asked; the one place the spec and the
  owner's colour choice conflict (Back-end vs ocean) was surfaced for their decision and
  honoured, not silently overridden.
- **VII** — smaller lands are strictly easier to tap; FR-029 keeps the smallest reachable.
- **VIII** — the scroll tour, growth and reduced-motion behaviour are untouched.

No gate failures. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/003-palette-continents/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── modules.md       # Phase 1 output
├── checklists/
│   └── requirements.md  # Built-in spec-quality checklist (owned by specify/clarify)
└── tasks.md             # Phase 2 output (/speckit-tasks) — not created by /speckit-plan
```

### Source Code (repository root)

```text
src/
├── data/
│   ├── palette.ts       # NEW — the 8 supplied colours + UI role bindings (single source of truth)
│   ├── continents.ts    # NEW — continent id/name/mainColor/memberSkillIds
│   └── skills.ts        # EDIT — drop `hue`; add `continentId`; drop skillColorHSL/skillCssColor
├── styles/
│   ├── main.css         # EDIT — replace hardcoded hex values with var(--palette-*)
│   └── palette.css      # NEW — generated custom properties, written from palette.ts at boot
├── three/
│   ├── config.ts        # EDIT — REMOVE islandRadius/expertiseRange/shape; ocean/cap colours stay
│   ├── skillRegions.ts  # REWRITE — quota-driven continent growth + per-skill partition
│   ├── hexGrid.ts       # unchanged
│   ├── tileFan.ts       # unchanged
│   ├── Planet.ts        # unchanged — islands.meshes contract preserved
│   ├── oceanTiles.ts    # unchanged — ocean colour excluded from palette (FR-021)
│   ├── polarLands.ts    # unchanged — cap colour excluded from palette (FR-021)
│   ├── PlanetInteraction.ts # unchanged — raycast contract preserved
│   ├── Experience.ts    # unchanged — tone mapping untouched
│   └── PlanetControls.ts    # unchanged
├── ui/
│   ├── skillLegend.ts   # EDIT — group rows by continent, show continent name
│   └── infoCard.ts      # EDIT — show continent name alongside skill name (FR-018)
├── animations/          # unchanged — tour targets are per-skill, still valid
└── main.ts              # EDIT — import palette bootstrap before first paint
```

**Structure Decision**: keep the existing `src/` layout. Two new data modules (`palette.ts`,
`continents.ts`) sit beside the existing `skills.ts` so the owner edits colour and grouping in
one place each — the owner explicitly asked for `.ts` data files "as before". A new
`palette.css` holds the generated custom properties so the stylesheet itself contains no
literal hex values (FR-003), which is what makes the "edit one file" acceptance test
mechanical rather than a manual hunt.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. No section is added, no dependency is added, and no existing runtime concept is
replaced — the palette and continent data are new inputs to code that already exists.
