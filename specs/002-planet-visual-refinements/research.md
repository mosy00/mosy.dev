# Research: Planet Visual Refinements

**Feature**: `002-planet-visual-refinements` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

All Technical Context items are resolved — **no NEEDS CLARIFICATION remains**. Findings below come from two offline validation scripts (icosphere census / camera-fit / color math, and a full re-implementation of the land-assignment pipeline with candidate parameters) run against the production algorithm's exact logic (seed placement, warp field, satellite offsets, flood fill, growth loop).

## D1 — Flush hex shell construction

**Decision**: The planet becomes ONE hex-tile shell at radius `PLANET.radius` (1.15). All three surface kinds — skill lands, ocean tiles, polar caps — are emitted by a shared fan-builder (`src/three/tileFan.ts`) that takes `(tiles, tileIds, radius, colorForTile)` and produces `position/normal/color` arrays with identical vertex math. `REGIONS.raise` (1.02) is deleted; the `SphereGeometry` ocean is deleted. Each tile fans triangles from `center·R` to `corner·R`, so adjacent tiles share *bit-identical* edge vertices → watertight, no overlapping geometry → no z-fight possible at coastlines (FR-001).

**Rationale**: Padding exists today only because lands float 2 % above a smooth sphere; when the sphere is gone and everything is emitted at one radius from one function, "no padding" holds *structurally* — there is no second layer to float above. A shared builder also guarantees the flush property can never drift apart between modules (Constitution V).

**Alternatives considered**: (a) Keep sphere + sink lands into it — rejected: z-fighting between coincident surfaces requires permanent epsilon hacks, and spec FR-002 removes the sphere anyway; (b) three separate geometry builders (copy-paste) — rejected: drift risk on the one invariant the feature is about; (c) a single merged mesh for the whole shell — rejected: lands must keep per-skill materials for highlight/emissive tweening and raycast identity.

## D2 — Ocean rendering (~20 % transparency, glass-marble far side)

**Decision** (revised 2026-10-04): One merged `MeshStandardMaterial` mesh: `vertexColors: true` (light-blue base + existing ±6 % shade jitter so hex facets read), `transparent: true, opacity: 0.8`, `side: FrontSide`, `flatShading: true`, roughness/metalness from `OCEAN`. Base colour changes `#3d8fd1 → #74c0ec`. The transparency is aimed at the **globe, not the page**: the canvas sits on `--bg #05060a`, so page show-through is imperceptible. Instead, land and cap meshes use `side: DoubleSide`, so far-hemisphere lands render in the opaque pass and the transparent sea blends over them (`0.8 × sea + 0.2 × far land`). The ocean keeps `FrontSide`, so the sea's own far hemisphere and interior are still culled and never appear.

**Rationale**: Two-sided land/cap materials cost nothing (same 13 draw calls, no extra geometry) and are what actually makes the transparency *visible* — with `FrontSide` lands the whole far hemisphere was back-face culled, so there was nothing in the framebuffer for the sea to reveal and the blend was lost against near-black. Render order does the rest: the opaque pass paints near-side lands, far-side lands and caps (depth written), then the transparent pass draws the near-side sea, which depth-tests in front of the far side and blends over it. `FrontSide` on the ocean is retained precisely so the sea's own back hemisphere cannot produce a second, jumbled ocean behind the water. The colour must be **pre-lightened**: `#3d8fd1` at 80 % over near-black blends to L≈0.44, colliding with mid-tone lands; `#74c0ec` blends to ≈`#5e9bbf` (L≈0.56, H≈202°, S≈0.43). **Correction to the original analysis**: the earlier "ΔL ≥ 0.12 against every land" claim does not hold, and never did — the lightest supported land (e = 0.4 → L = 0.48, jittered to 0.54) sits within 0.02–0.12 L of the sea at any opacity. Land/ocean separation is actually carried by **hue** (the sea sits at ≈202°, lands span the wheel; the nearest, `performance` at 190.8°, is still ΔL ≥ 0.145 and ΔS ≈ 0.22), by saturation, and by the lands' own emissive glow, which the sea does not have. The value stays art-directable.

**Alternatives considered**: (a) ocean `DoubleSide` — rejected: renders the sea's own far hemisphere and interior, producing a jumbled double ocean; only lands and caps go both-sided; (b) `depthWrite: false` — unnecessary and harmful here (nothing transparent sits behind the sea, and the sea still needs to depth-test against the far-side lands); keep default; (c) custom fresnel/edge-fade shader — rejected: new complexity and no new deps (Constitution IV), when constant transparency is sufficient; (d) keeping `#3d8fd1` — rejected: measured lightness collision after alpha blending; (e) revealing the *page* through the water instead of the globe — rejected (clarification 2026-10-04): the page is near-black, so the effect is invisible; the glass-marble far side is the actual payoff.

## D3 — Surface composition & spatial invariants (measured)

**Decision** (constants for `config.ts`):

| Constant | Value | Evidence |
|---|---|---|
| `POLAR.thresholdLat` | **66.5°** (Arctic-circle latitude) | Script A: 103 tiles/hemisphere (was 233 at 55°, −56 %), **connected = true**, N/S symmetric — sits inside spec band 65–70° (SC-005) |
| `REGIONS.maxLatitude` (seed band) | **38°** | Keeps seed jitter + growth inside the land cap |
| land latitude cap (new `REGIONS.maxLandLat`) | **60°** | Script B: worst land reaches 60.0° → **moat ≥ 6.5° guaranteed**, observed 6.5–10.7° across variants (spec invariant: moat preserved) |
| census | 2562 tiles / 5120 faces / 12 pentagons | unchanged grid (`hexGrid.ts` untouched) |
| composition (real data) | lands 955 + caps 206 + **ocean 1401** = 2562 | Script B final run; ocean is ~55 % of the shell |

The hard 60° land cap is a per-tile assignment check (hex-lattice jagged edge = natural coastline, not a cut line) — it guarantees the moat regardless of future shape/size tuning.

**Alternatives considered**: relying on seed-band + radius reach alone — rejected: aspect×lobe stretch can reach ~31° past the seed, making the moat tuning-dependent (measured 3.3° before the cap was added — under spec expectations).


## D4 — Expertise → land size mapping (FR-007, SC-003)

**Decision** (in `REGIONS`): `islandRadius = { min: 0.187, max: 0.42 }` — linear in `expertise` **clamped to [0.4, 1.0]** (`expertiseRange`), so `r(0.4) = 0.280`, `r(1.0) = 0.420`. Seed quota formula stays `1 + round(e·2)`; warp, satellites (offset 0.7·r), flood-fill anchor component and the ≥31 growth loop stay as safety nets. Measured results:

| Check | Result |
|---|---|
| Isolated probe 100 % vs 40 % | 122 vs 43 tiles → **2.84× PASS** |
| Multi-context variants (10-skill data, 100 %/40 % at band edge, swapped, mid-band) | ratios **2.18 / 2.44 / 2.65 / 2.21 — all ≥ 2.0 PASS** |
| ≥31 floor everywhere | min 43 isolated, min 50 in variants — **PASS**, growth loop never fired (dormant ⇒ never compresses contrast) |
| Same-skill monotonicity across rebuilds | 43→51→59→68→70→90→97→99→104→108→117→122 strictly increasing — visible size change per percentage edit (≥5 pp edits ≈ +19 % tiles) |
| Clamped 0.1 (current a11y data) | equals 0.4 → builds, floor holds, no contrast promise (per assumption) |
| Capacity | lands 955 + caps 206 ≤ 2562, ocean 1401 remains — **PASS** |

**Accepted variance** (documented, spec-compliant): at *equal* radius, placement/warp/neighbours move counts by ±15 %, so two *different* skills' counts need not order by expertise (e.g. gsap 0.9 → 144 vs typescript 0.95 → 120). FR-007/SC-003 measure (a) the same skill across rebuilds and (b) the 100 % vs 40 % pair — both hold.

**Alternatives considered**: (a) radius span 0.20–0.30 (current) — rejected: measured contrast only ~1.6–1.99× in context; (b) tile-count quota mapping (assign exact counts per expertise) — rejected: breaks organic flood-fill construction and satellites; (c) removing the 31-floor loop — rejected: keep as spec-required INV-01 safety net; with the clamp + R0 it simply never triggers.

## D5 — Distinct land silhouettes (FR-006, SC-004)

**Decision**: per-skill **shape profile** derived deterministically from `skillIndex` (seeded `pseudoRandom`, same stream style as existing code), stored on the skill's primary seed:
- **aspect** `A ∈ [0.80, 1.12]` — elliptical squash in the skill's tangent frame (`du/A`);
- **lobes** `K ∈ {3,4,5}` with **phase** `φ₀ = rand·2π` and **amplitude** `L ∈ [0.10, 0.17]` — radius threshold divided by `1 + L·sin(K·bearing + φ₀)` around the primary seed;
- satellite seeds stay isotropic (they read as bays/peninsulas); the existing `boundaryWarp` stays (its per-seed phases already vary coastlines).

Connectivity by construction: the modulated primary region is star-shaped around its seed ⇒ connected; satellites at ≤0.7·r overlap the primary ⇒ union connected; the flood-fill anchor + growth loop remain as runtime guarantees. Measured on real data: all 10 connected, `comps>1` = false everywhere; shape signatures distinct — A spans 0.80–1.11, K spans 3–5, phases differ; **min pairwise silhouette-profile L1 distance = 0.221** (threejs/ui pair) — a 22 % average deviation of the radial profile, i.e. no two lands read as recolours (final acceptance = SC-004 visual check).

**Collision/merge prevention (edge case "lands must not collide or merge")**: a per-tile score-margin gap was tested and **proved insufficient** — mathematically the margin must exceed the tile edge length (0.104 rad) to make adjacent cross-assignments impossible, which would gut the lands. Instead: after assignment each growth iteration, one **symmetric erosion pass** removes every tile grid-adjacent to a *different* skill's tile (both sides), then flood fill runs. Single pass is provably sufficient (removals only shrink the adjacency graph). Measured: **touch pairs = 0** in every run; tile cost is a few fringe tiles.

**Alternatives considered**: (a) margin gap GAP=0.045 — rejected: 3 touching pairs observed; (b) Voronoi ocean padding of 2+ tiles — rejected: costs ~10 % of land area and hurts the floor; (c) hand-authored per-skill outlines — rejected: violates procedural/no-assets assumption.

## D6 — Hover occlusion without an occluder mesh (FR-003 edge cases)

**Decision**: keep the raycast target list exactly as today (`planet.meshes` = skill islands only) and add an **analytic occluder-sphere test** in `PlanetInteraction`: sphere radius `ρ = PLANET.radius × 0.998`; a land hit is accepted only if the ray's nearest intersection with that sphere occurs *after* the land hit (`t_sphere ≥ t_land`); otherwise (or with no land hit) → `null`.

**Rationale / math**: with the shell flush, lands are fan facets between points at exactly R — the deepest chord dip of any fan triangle is ≤ R·(1−cos 0.045) ≈ **9.5e-4·R**. An occluder at `0.998R` is behind every land facet: near-side land always satisfies `z_land > z_sphere` (slack ≥ 0.001·R proved for all impact parameters b ≤ 0.998R); any *far-side* land hit sits at `t > C > t_sphere` → occluded → hovering open ocean can no longer pop a card for a land behind the sea. Cost is O(1) per pointer move — no extra triangles. Residual: a sub-pixel-to-1px ring at the very silhouette rim where the occluder sphere has no intersection; imperceptible at grazing angles.

**Load-bearing since 2026-10-04**: once land and cap materials became `DoubleSide` (D2), far-side lands are *visible* through the water **and** raycastable — the raycaster's back-face culling no longer removes them. This test is therefore now the only thing preventing hover on a land the visitor can plainly see through the ocean, which is exactly the behaviour FR-003 forbids. Implementation note: the sphere center and radius are derived from the hit mesh's world matrix (island meshes sit at the planet origin), so the test automatically follows the tour's growth scale.

**Alternatives considered**: (a) include the ocean mesh in the raycast list (nearest-hit wins) — rejected: +15k triangle tests per pointer move and a contract change with no visual benefit; (b) occluder at `1.0002R` — rejected by analysis: the facet dip (9.5e-4R) exceeds the bulge (2e-4R), so it would occlude *all* lands; (c) stencil/depth-buffer picking — rejected: renderer-level complexity, no precedent in codebase.


## D7 — Scroll tour & enlarged entry (FR-004, SC-002)

**Decision**:
- **Camera fit** `CAMERA.fit = { heightFraction: 0.9315, widthFraction: 0.9315 }` (0.86/0.9 in the original build → 1.15 → 1.035 → **0.9315** after two feedback rounds). Entry `D = 0.9315 × min(viewport w, h)` → end `D = 1.035 × min(viewport w, h)`; both are 10 % under the previous retune. The `distance = max(fitHeight, fitWidth)` rule is unchanged, but both fractions are converted from viewport-relative to canvas-relative first (`fraction × viewport / canvas`), because the canvas is deliberately taller than the viewport (`--planet-bleed: 125vh`) to bleed into the neighbouring sections. **This conversion is load-bearing:** the vertical camera FOV spans the canvas, so omitting it inflates the globe by the bleed factor (1.25× → ≈129vh at entry) and clips its poles against the canvas edge — the symptom being a planet whose top and bottom never appear however tall the canvas is made.
- **Tour timeline** (`planetTour.ts` rewrite): one scrubbed timeline over `#planet` (`top top → bottom bottom`, `scrub: 0.8` kept) containing exactly two tweens: `tourGroup.rotation.y` sweeps **`TOUR.sweepYaw = π` (~180°)** with `power1.inOut`, and `planet.object3D.scale` grows **1 → `TOUR.growthScale = 1.111`** (= 1.035 / 0.9315, so entry `0.9315 × min(w,h)` → end `1.035 × min(w,h)`). **Pitch never changes** → poles cannot move (pole drift 0° vs SC-002's 10° allowance); per-land re-centering, `tourTargets`, `shortestAngle`, `TOUR.maxPitch/rotateDuration/holdDuration` are deleted (`Planet.tourTargets`/`TourTarget` removed with them).
- **Entry flourish**: the `PLANET_HIDDEN_SCALE 0.88 → 1` elastic tween in `scrollAnimations.ts` is removed (planet sits at scale 1; growth belongs to the tour). Hero intro and `[data-reveal]` tweens are untouched.

**Rationale**: scrubbed tweens ride Lenis/ScrollTrigger exactly like the current tour; a single monotonic yaw + monotonic scale is the "calm" reading of the request, and constant pitch structurally guarantees the Earth-like poles-stay-up model (US2). Entry cropping via camera fit costs two constants instead of runtime scale bookkeeping.

**Alternatives considered**: (a) per-land targets with pitch held — rejected: still re-centres lands (spec forbids); (b) entry via scale > 1 instead of fit — rejected: interacts with float position and the tour's growth on the same property; fit fractions are simpler and verified; (c) `scrub: true` (0 lag) — rejected: 0.8 matches current feel (SC-007 parity); (d) 180° as two halves with hold — rejected: holds re-introduce the restless pacing.

## D8 — Reduced motion (FR-012, SC-008)

**Decision**: a tiny helper `prefersReducedMotion()` (wraps `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, evaluated at boot; live-toggle without reload is out of scope — assumption documented) consulted in three places:
1. `initPlanetTour` → **no timeline is created**; the planet keeps scale 1 (already cropped/enlarged by the fit → SC-008's "enlarged planet, no continuous rotation or growth") and yaw 0.
2. `Experience.setReducedMotion(true)` → `PlanetControls` idle-spin target becomes 0 (drag, inertia, damping untouched) and `Planet` skips the float bob — ambient continuous motion stops.
3. All interactions (drag/hover/legend/keyboard) are untouched → SC-007 checks still pass verbatim (SC-008).

**Rationale**: FR-012 covers scroll-driven rotation/growth; pausing the *ambient* idle spin and float bob is additionally required by Constitution III (clarity/accessibility — continuous motion is exactly what `prefers-reduced-motion` exists to suppress) and does not conflict with FR-009's enumerated preserved behaviours (idle spin/float are not listed; drag with inertia is explicitly preserved and remains). Boot-time evaluation keeps it dependency-free.

**Alternatives considered**: (a) GSAP `matchMedia` timeline swapping — rejected: overkill for a static fallback; (b) live re-creation of the tour on media change — rejected: ScrollTrigger re-init complexity, not in spec; (c) hiding the section under reduced motion — rejected: violates FR-012 + Constitution VII.

## D9 — Performance budget (FR-010, SC-007)

**Decision**: measured/derived budget: total shell = `3 × faces = 15,360` triangles (ocean ≈ 4,200 + lands ≈ 2,870 + caps ≈ 620) versus the current build's `128×128 sphere ≈ 32,768` + lands + caps — a net **>50 % triangle reduction**. Draw calls unchanged at 13 (1 ocean + 10 lands + 2 caps). Transparency costs one sorted object (none needed within a single mesh); raycast unchanged + O(1) sphere math per pointer move; geometry build stays ~<15 ms (same single pass + one erosion pass over ≤2562 tiles). No new dependencies, no per-frame allocations added.

**Rationale**: FR-010's ≥30 fps floor (60 target) is met with headroom because the feature *removes* the heaviest object; keeps SC-007 parity for drag/hover/scroll.

**Alternatives considered**: (a) `InstancedMesh` per tile — rejected: overkill, breaks the per-skill merged highlight pattern; (b) one merged material for lands + ocean — rejected: hover/dimming contract.

## D10 — Stack & scope discipline (Constitution IV/V/VI)

**Decision**: **No new libraries.** Transparency = built-in material flags; motion = existing GSAP/ScrollTrigger/Lenis; geometry = hand-built buffers exactly like feature 001; reduced motion = one matchMedia wrapper. Two new *source* files (`three/tileFan.ts` extracted helper + `three/oceanTiles.ts` builder), both internal, both following existing builder patterns. No new sections, no assets, no network data, no test framework (validation = `quickstart.md` scenarios + the offline scripts used here, deleted after research).

**Data observation (not in spec scope, reported for the user)**: `src/data/skills.ts` has `a11y: 0.1` (10 %), below the stated 40 % floor. The design clamps sizing to ≥40 % so the build stays correct and the floor holds; no data edit is made by this feature (spec assumption covers out-of-range values).

**Assumptions locked into the plan**: boot-time reduced-motion evaluation; size edits <5 percentage points may be visually subtle (≥5 pp is clearly visible); cross-skill count ordering at equal expertise may vary ±15 % by placement; exact art tuning (1.15 fit, 1.3 growth, `#74c0ec`, shape ranges) is parameterized within the measured constraints.
