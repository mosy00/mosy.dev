# Phase 0 Research: Palette, Continents & Land Scale

Every decision below was measured against the real hex grid (`buildHexSphereGrid(4)`,
2,562 tiles) with a throwaway prototype, then deleted. Numbers quoted are measured, not
estimated.

---

## D1 — Land size: expertise → exact tile quota

**Decision**: replace the radius-based sizing with a closed-form quota:
`tiles(e) = max(1, floor(62.5 × e − 12.5))`.

**Rationale**: the three owner-specified anchors fall exactly on one line. `62.5×1.0 − 12.5 =
50`, `62.5×0.6 − 12.5 = 25`, and the sub-20% clamp gives 1. Measured across the ten real skills:

| Skill | Expertise | Tiles |
|---|---|---|
| typescript | 0.95 | 46 |
| gsap | 0.90 | 43 |
| threejs | 0.85 | 40 |
| performance | 0.82 | 38 |
| creative | 0.80 | 37 |
| ui | 0.75 | 34 |
| glsl | 0.70 | 31 |
| node | 0.70 | 31 |
| design | 0.66 | 28 |
| a11y | 0.60 | 25 |

50 tiles = **1.95%** of the globe's surface; China is 1.88%, so the analogy is honoured
numerically rather than by eye (FR-023). Total land 353 tiles = **13.78%**, inside SC-005's
"at most one third of current coverage" (from ~89%).

**Alternatives considered**: (a) spherical-cap area maths — rejected, it cannot produce an
exact tile count without a search, and FR-022 demands exactness; (b) a piecewise anchor table —
rejected, a single linear rule is editable in one line and already matches all three anchors.

## D2 — Continent allocation: quota-driven BFS growth

**Decision**: seed each continent at one tile, then repeatedly claim the nearest unclaimed
neighbouring tile until the continent's quota (the sum of its members' quotas) is met,
**refusing any tile that is grid-adjacent to a tile already owned by a different continent**.
Seven rounds converge. Measured:

```
Front-end & Interface     87/87  OK      Back-end & Systems  115/115 OK
Graphics & Motion       114/114 OK      Creative & Quality   37/37  OK
```

**Rationale**: exactness comes from stopping at a count, not from tuning a radius.
Connectivity is *structural* — every claimed tile touches one already claimed — so FR-016 needs
no post-hoc flood-fill filter and can never be broken by a tuning change. Excluding
foreign-adjacent tiles during growth (rather than eroding afterwards, which the old code did)
means separation holds by construction and no erosion pass can silently eat a continent below
its quota.

**Alternatives considered**: (a) keep the old radius + erosion + flood-fill and only shrink the
radius — rejected, it cannot hit exact counts and would need the flood-fill filter back;
(b) assign by nearest-anchor Voronoi — rejected, tile counts are then a side effect of anchor
spacing rather than something the spec can state.

### D2.1 — The seeding bug found by prototyping

## D5 — Palette as the single colour source

**Decision**: `src/data/palette.ts` holds the eight supplied hexes plus their UI role
bindings; `src/styles/palette.css` is generated from it at boot as custom properties, so
`main.css` contains no literal hex values.

**Rationale**: FR-002 demands every colour in use trace to the palette file, and SC-002 is
checked by sampling the page. Generating the CSS variables from the same module the 3D
materials import means the legend swatch, the info card accent and the land mesh cannot drift —
they read the same function. A CSS file with hand-written hexes would satisfy FR-003 on paper
but fail the first time the owner edits a value.

Ocean (`74C0EC`) and polar cap (`F2F6F8`) stay in `three/config.ts` and are **not** palette
entries, per FR-021 (owner's Q2 answer).

## D6 — Skill colours as shades/tints of the continent colour

**Decision**: keep the continent's hue and saturation, and step **lightness** by expertise
rank with `spread = 0.14`, clamped to the room actually available above/below the base
lightness. Measured result:

| Continent (base) | Skill | Result |
|---|---|---|
| Front-end `#FFCD28` | ui / design / a11y | `#E0AC00` / `#FFCD28` / `#FFDE6F` |
| Back-end `#0978BE` | typescript / performance / node | `#064D7A` / `#0978BE` / `#1AA0F4` |
| Graphics `#E1E06C` | gsap / threejs / glsl | `#D5D331` / `#E1E06C` / `#EDEDA7` |
| Creative `#FFECC7` | creative | `#FFECC7` |

Worst within-continent pair separation (CIELAB ΔE): Front-end 12.4, Back-end 16.5, Graphics
18.4 — all above the ~10 "clearly different" floor, so FR-017's "individually identifiable"
holds without a second colour dimension.

**Alternatives considered**: (a) `spread = 0.10` — rejected, Front-end's worst pair collapsed
to **7.1**, below the readability floor, because amber already sits at L\* 84.5 and the clamp
swallowed most of the ramp; (b) `spread = 0.18`/`0.22` — rejected, they widen within-continent
separation but push Back-end's lightest step to ΔE 21.0 / 16.1 from the ocean, i.e. they trade
one legibility risk for a worse one. 0.14 is the measured optimum on both axes.

## D7 — Known residual: Back-end blue vs ocean

`0978BE` and its lightest step sit ΔE **26.0** from the raw ocean colour — above the 25
threshold, but the tightest pairing on the globe. Two mitigations are already in force, and one
honest caveat:

1. The ocean is translucent (`OCEAN.opacity = 0.8`) and the renderer applies **ACES Filmic tone
   mapping at exposure 1.1** (`Experience.ts:44-45`), so neither the ocean nor the land reaches
   the screen at its nominal sRGB value. Any raw-sRGB ΔE figure — including the 26.0 above — is
   an approximation that tone mapping widens in practice.
2. The owner reviewed this during `/speckit-clarify` and directed that `0978BE` be kept exactly
   as assigned, with separability confirmed visually after implementation.

**Caveat recorded rather than hidden**: a previous session reported this gap as ~24 and treated
it as indistinguishable, having computed it in raw sRGB while ignoring tone mapping. The
number was wrong in the pessimistic direction. The real risk is *smaller* than stated, not
larger — but it remains the closest pairing, so `quickstart.md` V4 lists it as an explicit
visual check for the owner rather than declaring it safe.

## D8 — Colour conventions that must not change

Ocean `#74C0EC` / cap `#F2F6F8` stay out of the palette (FR-021). The minimum skill-to-cap
separation measures **21.9** (Creative's `#FFECC7` vs the white cap) — below the 25 threshold.
This is a direct consequence of the owner assigning a beige continent alongside white polar
caps, and it is spatially harmless: caps are pinned to |lat| ≥ 66.5° while land is capped at
59.32°, so the two can never be adjacent or confused in the rendered globe. Recorded as an
accepted property, not a defect.

## D9 — No new library

Checked against the owner's "add a library only if it really helps": colour maths needs
`sRGB ↔ HSL ↔ CIELAB`, which is ~40 lines and already partly present in `skills.ts`
(`skillColorHSL`). Pulling in `tinycolor2` or `chroma-js` for that would add a dependency and
a build-time surface for no behavioural gain. **Decision: no new dependency.**
The first prototype returned **zero tiles for all four continents**. Cause: candidates must
touch an already-claimed tile, but on round 1 the bucket is empty, so no tile can ever be the
first. Fix: seed each continent with `grid.findNearestTileId(anchorDir)` before growth. Recorded
because the failure is silent — it type-checks and produces a valid, empty-looking globe.

## D3 — Connectivity and separation, measured

```
Front-end & Interface    components=1  largest=87/87   CONNECTED
Back-end & Systems       components=1  largest=115/115 CONNECTED
Graphics & Motion        components=1  largest=114/114 CONNECTED
Creative & Quality       components=1  largest=37/37   CONNECTED

cross-continent adjacency = 0        → FR-027 / SC-006 satisfied
max |lat| of land = 59.32°          → moat to 66.5° caps = 7.18°  (FR-028)
```

The latitude ceiling is inherited from the existing `REGIONS.maxLandLat = 60` hard cap; the
measured 59.32° is the highest tile the allocator can reach under it, and the polar-cap moat is
therefore never smaller than 6.5°.

## D4 — Per-skill partition inside a continent

**Decision**: after a continent's tile set is fixed, partition it among member skills by
nearest-seed, largest-quota-first, each skill drawing from the continent's unclaimed pool
until its own quota is met.

**Rationale**: FR-017 requires each skill to stay individually identifiable, and the colours
are derived from a *rank within the continent*, so skills need a stable position inside it.
Measuring nearest-first with largest-first ordering gave **10/10 exact** — every skill landed
on precisely its quota, no rounding drift between skills.