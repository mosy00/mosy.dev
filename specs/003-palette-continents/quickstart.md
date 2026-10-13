# Quickstart: Validating Palette, Continents & Land Scale

A runnable manual verification guide. The project has **no automated test runner**, so every
scenario below is a browser check. Automated gates (`npm run typecheck`, `npm run build`) are
run first and must pass before any visual scenario is attempted.

## Prerequisites

```bash
npm install          # only on a fresh clone
npm run typecheck    # gate 1 — must exit 0
npm run build        # gate 2 — must exit 0
npm run dev          # serve at http://localhost:5173
```

Reference docs: [`contracts/modules.md`](./contracts/modules.md) for the interfaces under test,
[`data-model.md`](./data-model.md) for entities and invariants,
[`research.md`](./research.md) for the measured baselines quoted below.

---

## Gate scenarios (automated)

| Id | Command | Expected |
|---|---|---|
| G1 | `npm run typecheck` | exit 0, no errors |
| G2 | `npm run build` | exit 0, no new warnings beyond chunk-size notices |

---

## V1 — Palette is the single source of truth (US1, SC-001, FR-001…FR-004)

1. Open the site. Note the navy background and the mint/light-blue text.
2. Edit `src/data/palette.ts`, changing `navy.hex` to any other value (e.g. `#123456`).
3. Reload (Vite HMR or a full refresh).
4. **Expected**: page background, primary text, secondary text, buttons, links, focus ring,
   scrollbar and the planet's lands all change. No other file was touched.
5. Also grep the stylesheet: `grep -nE '#[0-9a-fA-F]{3,8}' src/styles/main.css` — any hit is a
   **failure** of FR-003 (a literal hex should have become a `var(--palette-*)`).

## V2 — Continent grouping renders (US2, SC-007, FR-013…FR-016)

1. Scroll to the planet section and rotate the globe.
2. **Expected**: each continent appears as **one continuous landmass** in its own colour family;
   three amber-ish lands (Front-end), three blue lands (Back-end), three pale lands (Graphics),
   one beige land (Creative).
3. Hover a land. **Expected**: the info card shows the skill name *and* its continent name as
   the kicker line (FR-018).
4. Read the legend. **Expected**: it is grouped under the four continent headers, and the
   swatch beside each skill matches that skill's land on the globe (FR-019, Principle V).

## V3 — Distinct continents never touch (US2, SC-006, FR-027)

1. Rotate through at least 8 orientations, including both poles.
2. **Expected**: a band of ocean always separates any two differently-coloured continents.
   No coast where amber touches blue, or blue touches pale yellow.
3. Measured baseline from research D3: cross-continent adjacency = **0**.

## V4 — Back-end blue vs the ocean (known residual, research D7)

This is the tightest colour pairing on the globe (`0978BE` sits ΔE ≈ 26 from the raw ocean
colour) and the owner has accepted it pending visual confirmation.

1. Rotate until the blue Back-end continent is against open water.
2. **Expected**: the continent reads clearly as land, distinguishable from the sea.
3. If it reads as *indistinguishable*, report it — the owner has already approved revisiting
   the colour in exactly this case. Do **not** change the colour unilaterally.

## V5 — Land size matches expertise (US4, SC-003/004/005, FR-022…FR-026)

Count the hex tiles in each land (or compare against the measured table in research D1):

| Skill | Expertise | Expected tiles |
|---|---|---|
| typescript | 0.95 | 46 |
| gsap | 0.90 | 43 |
| threejs | 0.85 | 40 |
| a11y | 0.60 | 25 |

- **Expected**: the largest land (TypeScript, 46 tiles) is roughly **2%** of the globe — about
  the size of China — and the smallest about a third of that.
- **Expected**: the globe reads as **predominantly ocean** from any angle (~13.8% land, down
  from ~89%).
- **Expected**: per-tile jitter is still visible, so tiles remain countable.
## V6 — Owner can edit the continent map by hand (US3, SC-009, FR-014, FR-015)

1. In `src/data/continents.ts`, add a fifth continent with a name, a palette colour and one
   existing skill (remove that skill from its current continent).
2. Reload. **Expected**: the new continent renders in its colour and the skill moves with it.
   **No other file was edited.**
3. Remove the continent and restore the skill; reload; confirm the original four return.

## V7 — Small lands stay hoverable (FR-029, SC-008)

1. Tab through the legend with the keyboard.
2. **Expected**: every skill is reachable and its card appears; the globe highlights the
   matching land.
3. Tap or click the smallest land directly. **Expected**: it selects, thanks to the enlarged
   invisible target area.

## V8 — Existing behaviour preserved (US3, FR-012, SC-012)

| Check | Expected |
|---|---|
| Drag the globe | Free yaw; vertical drag clamped to ±45°; inertia after release |
| Far-side lands | Visible through the translucent ocean |
| Hover a far-side land | Nothing is selected (occluder rule) |
| Polar caps | White, hover-inert, unchanged from feature 002 |
| Scroll tour | Globe still sweeps and grows; poles stay put |
| `prefers-reduced-motion` | Float bob frozen; static enlarged planet |
| Draw calls | No growth (devtools renderer info) |

## V9 — Contrast (SC-010)

Sample the rendered page (devtools colour picker or a contrast tool):

| Pairing | Requirement |
|---|---|
| Mint cream text on navy | ≥ 4.5:1 (body text) |
| Light blue text on navy | ≥ 4.5:1 (body text) |
| Amber button fill vs its label | ≥ 4.5:1 |
| Focus ring vs its background | ≥ 3:1 (non-text) |

Note: continent colours are **graphical** objects (lands), so the 3:1 graphical threshold
applies to them, not 4.5:1. `0978BE` measures 3.53:1 on navy — acceptable for landmasses, but
**not** for continent label text; labels must use a palette text colour instead.

---

## Regression checklist (run in order after any change to the allocator)

1. `npm run typecheck` → 0
2. `npm run build` → 0
3. V5 first (a wrong allocator shows up as wrong sizes before anything else)
4. V2, V3 (grouping and separation)
5. V8 (behavioural regressions — this is where feature 002's guarantees live)
6. V1, V6 (palette and editability)

## Known accepted properties

- Ocean `#74C0EC` and polar cap `#F2F6F8` are intentionally outside the palette (FR-021).
- Creative's beige sits ΔE ≈ 21.9 from the white polar cap — below the "clearly different"
  threshold, but spatially impossible to confuse because caps start at 66.5° and land stops at
  59.32° (research D8).