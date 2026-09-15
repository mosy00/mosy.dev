# mosy.dev — personal portfolio

Portfolio built around an interactive 3D **skills planet**: a sphere where skill areas become
"countries" — polygon regions on the surface, tinted by expertise and hoverable.

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
│  ├─ config.ts             # tuning constants (camera fit, planet, regions, controls)
│  ├─ Experience.ts         # renderer, camera, lights, resize/fit, render loop, dispose
│  ├─ Planet.ts             # the planet group: skill regions + float
│  ├─ PlanetControls.ts     # drag-to-rotate with inertia + idle spin
│  ├─ PlanetInteraction.ts  # raycast hover → skill highlight callbacks
│  └─ skillRegions.ts       # spherical-Voronoi islands: 1 mesh per skill
├─ animations/
│  ├─ gsap.ts               # single ScrollTrigger registration point
│  ├─ planetTour.ts         # scroll tour: spins each island to the camera
│  └─ scrollAnimations.ts   # hero intro, reveals, planet scale flourish
└─ ui/
   ├─ smoothScroll.ts       # Lenis <-> GSAP ticker integration
   ├─ skillLegend.ts        # legend built from the same skill data (hover-synced)
   ├─ infoCard.ts           # hovered-skill info card
   └─ nav.ts                # smooth in-page anchors
```

## Planet (steps 2–4)

- **Its own section** — the canvas lives inside `#planet` (the second section): dead-center,
  sized by a camera fit so the sphere spans ~86% of the viewport height (width-fit fallback
  on portrait screens). Sizes come from the canvas element, not the window.
- **Earth-like ocean & connected lands** — a glossy light-blue ocean sphere; each skill is
  ONE connected landmass (primary seed + clustered satellites, so the caps always merge)
  raised above the sea, carved from a 20k-face icosphere with noise-warped coastlines and
  merged into **one mesh per skill** (~11 draw calls total). Expertise buys island size
  and deepens the tint via the shared formula in `data/skills.ts`; most of the globe
  stays open ocean on purpose.
- **Earth-like drag** — free spin left/right; vertical drag is clamped to ±45° so the
  poles always stay up/down. Velocity-based inertia settles into the idle spin, and
  `touch-action: pan-y` keeps vertical page scrolling usable on touch.
- **Hover (step 3)** — a raycaster picks the island under the pointer (suppressed while
  dragging): the active island glows (GSAP-tweened emissive), the rest dim, the legend row
  lights up, and an info card shows name, blurb and an expertise meter. Legend rows are
  buttons, so keyboard focus triggers the same highlight.
- **Scroll tour (step 4)** — the planet section is tall (420vh) with a sticky stage;
  scrolling through it drives a scrubbed GSAP timeline that rotates an outer "tour group"
  so each skill island takes a turn facing the camera. The tour owns its own nested group,
  so it never fights user drag; its pitch is clamped too, keeping the poles up.

## HMR behaviour

- CSS edits hot-swap instantly (Vite CSS HMR).
- JS/TS edits trigger Vite's fast full reload by default; the scene tears down and rebuilds
  with the page. A custom `import.meta.hot` re-init (keeping WebGL state) can be added later
  via the exported `disposeExperience()` hook.

## Roadmap

- [x] **Step 1** — scaffold + draggable, auto-rotating planet
- [x] **Step 2** — skill "countries": polygon regions on the sphere
- [x] **Step 3** — raycast hover: expertise tint + info card
- [x] **Step 4** — scroll tour: the globe spins each skill to face you
- [ ] **Step 5** — polish: atmosphere shader, terrain relief, clouds, starfield (see suggestions)

