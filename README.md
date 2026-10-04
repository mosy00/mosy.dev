# mosy.dev — personal portfolio

Portfolio built around an interactive 3D **skills planet**: a hex-tiled globe where skill areas
become "countries" — hex regions on the surface, tinted by expertise and hoverable.

## Stack

- **Vite + vanilla TypeScript** — no framework, strict TS
- **three.js** — WebGL scene
- **GSAP + ScrollTrigger** — scroll choreography
- **Lenis** — smooth scrolling (driven by the GSAP ticker so there's a single rAF loop)

## Commands

```bash
npm install        # install deps
npm run dev        # vite dev server (http://localhost:5173)
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build (dist/)
npm run preview    # serve the production build
```

## Structure

```
src/
├─ main.ts                  # entry: boots scene, smooth scroll, nav, animations
├─ styles/main.css          # tokens, layout, sections
├─ data/
│  └─ skills.ts             # skill areas + shared expertise→color formula
├─ three/
│  ├─ config.ts             # tuning constants (camera fit, planet, regions, ocean, tour)
│  ├─ Experience.ts         # renderer, camera, lights, resize/fit, render loop, dispose
│  ├─ Planet.ts             # the planet group: lands + ocean + caps, float, highlight
│  ├─ PlanetControls.ts     # drag-to-rotate with inertia + idle spin
│  ├─ PlanetInteraction.ts  # raycast hover + occluder-sphere rule → skill highlight
│  ├─ hexGrid.ts            # geodesic dual hex grid (the tile lattice)
│  ├─ tileFan.ts            # shared flush fan-builder (lands/ocean/caps at one radius)
│  ├─ skillRegions.ts       # land assignment: seeds, erosion, flood fill, 1 mesh/skill
│  ├─ oceanTiles.ts         # merged translucent hex ocean shell
│  ├─ polarLands.ts         # the two white ice caps
│  └─ motionPrefs.ts        # prefers-reduced-motion helper
├─ animations/
│  ├─ gsap.ts               # single ScrollTrigger registration point
│  ├─ planetTour.ts         # scroll tour: ~180° sweep + 1.111× growth (static if reduced)
│  └─ scrollAnimations.ts   # hero intro + reveals
└─ ui/
   ├─ smoothScroll.ts       # Lenis <-> GSAP ticker integration
   ├─ skillLegend.ts        # legend built from the same skill data (hover-synced)
   ├─ infoCard.ts           # hovered-skill info card
   └─ nav.ts                # smooth in-page anchors
```

## Planet (steps 2–4)

- **Its own section** — the canvas lives inside `#planet` (the second section): dead-center,
  sized by a camera fit so the globe enters at `0.9315 × the smaller viewport dimension` and grows to
  `1.035 ×` as you scroll — both ~10 % smaller than the previous version. Both poles stay visible
  at every scroll position. The fit is computed against the viewport and converted to canvas-relative
  before fitting, because the canvas deliberately overhangs it (`--planet-bleed`) so the globe can
  bleed over the neighbouring sections; `.planet { z-index: 2 }` keeps those sections from painting
  over it.
- **One flush hex shell** — lands, a slightly translucent light-blue hex ocean (~80 % opaque)
  and white polar ice caps are all meshed at the same radius by one shared fan-builder
  (`three/tileFan.ts`), so there is no smooth background sphere and no padding at coastlines.
  The sea is ~20 % transparent and land/cap meshes render both sides, so continents on the
  far hemisphere read *through* the water like a glass marble — while the sea's own far
  hemisphere stays culled, so you never see a jumbled second ocean.
- **Connected lands & distinct shapes** — each skill is ONE connected landmass (primary seed
  plus clustered satellites, so its parts always merge) with its own silhouette profile
  (elliptical aspect + 3–5 radial lobes). Expertise visibly buys territory (100 % is ≥ 2× a
  40 % land) and deepens the tint via the shared formula in `data/skills.ts`; a symmetric
  erosion pass keeps lands from ever touching, and land stops at 60° latitude, leaving a moat
  to the 66.5° ice caps.
- **Earth-like drag** — free spin left/right; vertical drag is clamped to ±45° so the
  poles always stay up/down, and follows the pointer: dragging up tips the top of the globe away
  and reveals its lower parts (the original direction). A vertical flick keeps gliding in that same
  direction and eases out smoothly (`pitchGlideDecay`, separate from the yaw damping). Inertia then
  settles into the idle spin, and `touch-action: pan-y` keeps vertical page scrolling usable on touch.
- **Hover (step 3)** — a raycaster picks the island under the pointer (suppressed while
  dragging): the active island glows (GSAP-tweened emissive), the rest dim, the legend row
  lights up, and an info card shows name, blurb and an expertise meter. Legend rows are
  buttons, so keyboard focus triggers the same highlight.
- **Scroll tour (step 4)** — the planet section is tall (420vh) with a sticky stage;
  scrolling through it drives one scrubbed GSAP timeline that sweeps an outer "tour group"
  ~180° about the poles and grows the globe by 1.111× (from 0.9315× to 1.035× the smaller viewport
  dimension), at constant pitch so no land is ever
  re-centred and the poles never move. The tour owns its own nested group, so it never fights
  user drag. With `prefers-reduced-motion: reduce` no timeline is created: the globe stays
  enlarged and static, while drag, hover, the legend and the cards keep working.

## HMR behaviour

- CSS edits hot-swap instantly (Vite CSS HMR).
- JS/TS edits trigger Vite's fast full reload by default; the scene tears down and rebuilds
  with the page. A custom `import.meta.hot` re-init (keeping WebGL state) can be added later
  via the exported `disposeExperience()` hook.

## Roadmap

- [x] **Step 1** — scaffold + draggable, auto-rotating planet
- [x] **Step 2** — skill "countries": polygon regions on the sphere
- [x] **Step 3** — raycast hover: expertise tint + info card
- [x] **Step 4** — scroll tour: ~180° sweep + 1.111× growth (static under reduced motion)
- [ ] **Step 5** — polish: atmosphere shader, terrain relief, clouds, starfield (see suggestions)

