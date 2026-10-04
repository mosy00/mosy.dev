# Module Contracts: Planet Visual Refinements

**Feature**: `002-planet-visual-refinements` | **Date**: 2026-09-29 | Internal TypeScript contracts (no external APIs — single-page site). Signatures are normative for the implementation phase; types marked `→` are new or changed.

## 1. `src/three/config.ts` (changed)

```ts
CAMERA.fit = { heightFraction: 0.9315, widthFraction: 0.9315 }  // entry 0.9315 → end 1.035 (D7)
POLAR.thresholdLat = 66.5                                          // smaller caps (D3)
OCEAN = { color: 0x74c0ec, opacity: 0.8, roughness: 0.28, metalness: 0.25 }   // segments removed (D2)
REGIONS = { borderNoise, seedJitter, satelliteOffset: 0.7, maxLatitude: 38,
            islandRadius: { min: 0.187, max: 0.42 },
            expertiseRange: { min: 0.4, max: 1 },                  // → new
            maxLandLat: 60,                                        // → new
            shape: { aspectMin: 0.8, aspectMax: 1.12,
                     lobes: [3, 4, 5], ampMin: 0.1, ampMax: 0.17 } // → new
            // raise REMOVED, stale detail REMOVED
TOUR = { sweepYaw: Math.PI, growthScale: 1.111, scrub: 0.8 }      // maxPitch/rotateDuration/holdDuration REMOVED
```

## 2. `src/three/tileFan.ts` (NEW — extracted helper)

```ts
export function buildTileFan(
  tiles: readonly HexTile[], tileIds: readonly number[], radius: number,
  colorForTile: (tile: HexTile) => Color,
): { positions: Float32Array; normals: Float32Array; colors: Float32Array };
```
- **Invariant (FR-001)**: every vertex = `unit * radius`; callers MUST pass `PLANET.radius` for all three surface kinds — this is the single place flushness can be enforced.
- Facet normals computed per fan triangle exactly as today (flat shading).

## 3. `src/three/skillRegions.ts` (changed)

```ts
export interface SkillIslandsBuild {
  readonly meshes: Mesh[];                    // unchanged (raycast + highlight targets)
  readonly skillDirections: readonly Vector3[]; // kept (seed directions; tour no longer uses it)
  readonly grid: HexSphereGrid;               // unchanged
  → readonly landTileIds: ReadonlySet<number>; // NEW — for ocean exclusion
  dispose(): void;
}
```
Pipeline (inside `buildSkillIslands`): seeds (band 38°, quota `1+round(e·2)`, shape profile per skill) → per-tile assignment (modulated score, lat cap 60°, growth loop ≥31) → **symmetric erosion pass** (drop tiles adjacent to another skill's tile) → flood fill keep anchor component → mesh via `buildTileFan` at `PLANET.radius` (raise gone). Land material is `side: DoubleSide` so the far hemisphere renders and reads through the translucent sea (D2).
- **Invariants**: >30 tiles/skill (INV-01), one component (INV-02), shade jitter (INV-05), no cross-skill adjacency, `tileCount(1.0) ≥ 2 × tileCount(0.4)` over expertise range (FR-007), `|lat| ≤ 60°` (moat, FR-009).

## 4. `src/three/oceanTiles.ts` (NEW)

```ts
export interface OceanShellBuild { readonly mesh: Mesh; readonly tileCount: number; dispose(): void; }
export function buildOceanShell(grid: HexSphereGrid, excludedTileIds: ReadonlySet<number>): OceanShellBuild;
```
- Merges every non-excluded tile via `buildTileFan(…, PLANET.radius, …)`; material `MeshStandardMaterial({ vertexColors, opacity: OCEAN.opacity, transparent: true, side: FrontSide, flatShading, …OCEAN })`; shade jitter like lands; **no `skillId` userData**.
- **Contract (FR-003/005)**: visually light blue & ~80 % opaque; interaction-invisible (not a raycast target); the **sea** is front-face-only so its own far hemisphere and interior never render, while **land and cap meshes are `DoubleSide`** so far-hemisphere lands read through the water (glass-marble, D2). Hovering such a far-side land still yields `null` via the D6 occluder test (§7).

## 5. `src/three/polarLands.ts` (changed)

```ts
export interface PolarLandsBuild {
  readonly meshes: readonly Mesh[];           // userData.isPolar unchanged
  → readonly capTileIds: ReadonlySet<number>; // NEW — for ocean exclusion
  dispose(): void;
}
```
`buildPolarLands(grid)` filters `|latitude| ≥ POLAR.thresholdLat (66.5)`, meshes at `PLANET.radius` via `buildTileFan`, white jittered color (clamp ≥0.7) unchanged. Cap material is `side: DoubleSide` (same far-side read-through as lands, D2); caps stay non-interactive.

## 6. `src/three/Planet.ts` (changed)

```ts
constructor(skills)  // builds islands → caps → ocean shell; dragGroup.add(oceanMesh, ...islandMeshes, ...capMeshes)
get meshes(): Mesh[]                 // UNCHANGED semantics: skill islands only (raycast list)
get controlsTarget(): Group          // unchanged
→ // REMOVED: tourTargets, TourTarget, tourTargetsCache, ocean SphereGeometry
setHighlighted(skillId) / update(dt) / dispose()  // update(dt) skips float bob when reducedMotion
→ setReducedMotion(reduced: boolean)  // NEW — forwarded to float gate (controls get theirs from Experience)
```
- **Invariant**: no `SphereGeometry` anywhere; shell = the three mesh groups at one radius.

## 7. `src/three/PlanetInteraction.ts` (changed)

```ts
// after intersectObjects(objects), before reporting skillId:
//   ρ = PLANET.radius * 0.998; nearest ray/sphere intersection at t_sphere
//   accept first (nearest) land hit only if it exists and t_sphere >= t_land, else null
```
- **Behavior contract (FR-003 edge cases, D6)**: hover over ocean / ice / far-side-behind-shell → `null` (no card, no highlight, no legend selection); hover over a visible land → its `skillId`; drag suppression unchanged; **raycast target list stays `planet.meshes`** (no contract change for callers).

## 8. `src/animations/planetTour.ts` (REWRITE)

```ts
export function initPlanetTour(planet: Planet): () => void;
// reduced motion → returns no-op disposer (no timeline, scale stays 1, yaw stays 0)
// else one gsap.timeline({ scrollTrigger: { trigger: '#planet', start: 'top top',
//   end: 'bottom bottom', scrub: TOUR.scrub } }) with:
//   • planet.tourGroup.rotation.y  → "+=TOUR.sweepYaw"   (power1.inOut)  — rotation.x NEVER written
//   • planet.object3D.scale x/y/z  → TOUR.growthScale                      (same timeline position 0)
```
- **Contract**: ~180° total yaw across the section, poles never move, no per-land targeting (FR-004); disposer kills trigger + timeline (main.ts wiring unchanged).


## 9. `src/animations/scrollAnimations.ts` (changed)

```ts
export function initSectionAnimations(): () => void;   // planet param REMOVED (unused)
```
- **Removed**: `PLANET_HIDDEN_SCALE`, the `gsap.set(planet.scale, …)`, and the `#planet` onEnter/onLeaveBack elastic flourish (entry is cropped via camera fit; growth belongs to the tour).
- **Kept**: hero intro, `[data-reveal]` tweens, `document.fonts.ready → ScrollTrigger.refresh()`, disposer semantics.

## 10. `src/three/Experience.ts` (changed)

```ts
constructor(canvas, skills)     // unchanged apart from wiring below
→ setReducedMotion(reduced: boolean): void  // NEW — forwards to controls (idle target 0/0.12) + planet (float gate)
```
- `handleResize` keeps the `max(fitHeight, fitWidth)` rule but converts `CAMERA.fit` from **viewport-relative to canvas-relative** first: `heightFraction × window.innerHeight / canvas.clientHeight` and `widthFraction × window.innerWidth / canvas.clientWidth`. This is REQUIRED, not cosmetic: the vertical camera FOV spans the canvas, so without the conversion the taller-than-viewport canvas (`--planet-bleed`, 125 vh) inflates the globe by the bleed factor and clips its poles against the canvas edge. `camera.aspect` still uses the canvas aspect so nothing stretches.
- Owns no tour (main.ts still creates it).
- **Stacking (FR-004)**: `.planet { z-index: 2 }` in `main.css` is REQUIRED — `section, footer { position: relative }` inside `main { position: relative; z-index: 1 }` makes every section a positioned sibling in one stacking context, so the later `#manifesto` / `#work` otherwise paint over the canvas. `.planet__stage { overflow: visible }` (was `hidden`) so the bleed is not clipped.

## 11. `src/three/PlanetControls.ts` (changed)

```ts
→ setAmbientMotion(enabled: boolean): void  // NEW — settle target = enabled ? PLANET_CONTROLS.idleSpeed : 0
→ private static readonly PITCH_DIRECTION = 1   // NEW — documents the pitch sign; applied ONCE
```
- Drag 1:1, inertia, `maxPitch ±45°`, velocity smoothing **byte-for-byte unchanged** (FR-009). Vertical direction is deliberately the **original** one: dragging up tips the globe's top away and reveals its lower parts. Two changes made 2026-10-04:
  1. **`PITCH_DIRECTION` is applied exactly once**, in `onPointerMove`. `velocity.x` is seeded from that already-signed pitch, so `update()` integrates it as-is. An intermediate revision negated in *both* places, which cancelled the drag's sign and made the planet spin backwards on release — reported, diagnosed and reverted. `PITCH_DIRECTION = 1` reproduces the original mapping and exists purely to keep the sign in one documented place.
  2. **Pitch inertia has its own decay constant** `PLANET_CONTROLS.pitchGlideDecay = 0.85` (it previously shared `damping = 1.8`), so a vertical flick eases out to a smooth stop instead of stalling within ~0.5 s. Reaching the ±45° limit zeroes `velocity.x` so the planet cannot spring back off the clamp.

## 12. `src/three/motionPrefs.ts` (NEW — tiny helper)

```ts
export function prefersReducedMotion(): boolean;  // matchMedia('(prefers-reduced-motion: reduce)').matches, boot-time
```

## 13. `src/main.ts` (minimal wiring)

```ts
// after Experience construction, before animations:
activeExperience.setReducedMotion(prefersReducedMotion());
initSectionAnimations();                 // no planet arg
disposeTour = initPlanetTour(planet);    // internally static under reduced motion
```
Everything else (legend, InfoCard, `PlanetInteraction` options, dispose path) unchanged.

## Behavior-parity contract (FR-009 — must hold identically after the feature)

| Behavior | Must remain |
|---|---|
| Drag + inertia, pitch clamp ±45° | unchanged code path; `PITCH_DIRECTION = 1` documents the original vertical mapping and is applied once (a double negation was introduced and reverted 2026-10-04) |
| Hover land → card + emissive highlight + dim others | unchanged (`setHighlighted`, `showSkill`) |
| Hover ocean / ice / background → nothing | **strengthened** by occlusion rule: far-side lands are now *visible* (DoubleSide) **and** raycastable, so the D6 occluder test is what keeps them from being hovered |
| Legend mouse + keyboard sync | untouched |
| Caps non-interactive (`isPolar`, no legend row) | unchanged |
| ≥30 connected tiles per skill, one mass | verified at build (growth loop + flood fill + erosion) |
| Polar moat | ≥6.5° structurally (60° land cap vs 66.5° cap) |
| ≥30 fps drag/hover/scroll | 13 draw calls, ~15.4k tris (D9) |

## Invariant → FR traceability

| Invariant | FRs | Enforced by |
|---|---|---|
| Flush shell, no padding/z-fight | FR-001, FR-002 | single radius in `buildTileFan`, sphere deleted (D1) |
| Hex ocean, sphere removed, hover-inert | FR-002, FR-003 | `oceanTiles.ts` + raycast list + occlusion (D2/D6) |
| Entry size, 180° sweep, growth, poles fixed | FR-004 | fit 0.9315/0.9315 (entry) → ×1.111 (end = 1.035) + two-tween tour (D7); `.planet { z-index: 2 }` + canvas bleed so neighbours never hide the planet; viewport→canvas fraction conversion in `handleResize` so the bleed cannot inflate the globe |
| ~20 % ocean transparency; far side reads through | FR-005 | opacity 0.8 + land/cap `DoubleSide` + ocean `FrontSide` + pre-lightened colour (D2) |
| Distinct silhouettes, one mass >30 | FR-006 | shape profile + star-shape + flood fill (D5) |
| 2× contrast 40–100 %, visible edits | FR-007 | radius mapping + clamp (D4, measured) |
| Small equivalent caps, white, dead | FR-008 | 66.5° threshold, `isPolar` (D3) |
| Preserved behaviors | FR-009 | parity table above |
| 30 fps | FR-010 | budget D9 |
| Mobile reachability | FR-011 | fit guarantees crop not lockout; legend + touch drag untouched |
| Reduced motion | FR-012 | D8 static mode |
