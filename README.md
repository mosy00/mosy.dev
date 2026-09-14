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
│  └─ scrollAnimations.ts   # hero intro, reveals, planet scale flourish
└─ ui/
   ├─ smoothScroll.ts       # Lenis <-> GSAP ticker integration
   ├─ skillLegend.ts        # legend built from the same skill data (hover-synced)
   ├─ infoCard.ts           # hovered-skill info card
   └─ nav.ts                # smooth in-page anchors
```

## Planet (steps 2–3)

- **Its own section** — the canvas lives inside `#planet` (the second section): dead-center,
  sized by a camera fit so the sphere spans ~86% of the viewport height (width-fit fallback
  on portrait screens). Sizes come from the canvas element, not the window.
- **Ocean & islands** — a smooth, glossy deep-navy ocean sphere; skills are raised island
  meshes carved by a spherical Voronoi over a 20k-face icosphere (noise-warped coastlines),
  merged into **one mesh per skill** (~11 draw calls total). Expertise buys territory
  (island radius + 1–3 seeds per skill) and deepens the tint via the shared formula in
  `data/skills.ts`. Most of the globe stays open ocean on purpose, so the lands read
  clearly as "skills".
- **Hover (step 3)** — a raycaster picks the island under the pointer (suppressed while
  dragging): the active island glows (GSAP-tweened emissive), the rest dim, the legend row
  lights up, and an info card shows name, blurb and an expertise meter. Legend rows are
  buttons, so keyboard focus triggers the same highlight.
- **Drag** — pointer events on the canvas: 1:1 rotation while dragging (yaw free, pitch
  clamped to ±60°), velocity-based inertia after release that settles into the idle spin.
  `touch-action: pan-y` keeps vertical page scrolling usable on touch devices.
- Island meshes carry `userData.skillId` — the raycaster and the legend both resolve
  through one hover pipeline in `main.ts`.

## HMR behaviour

- CSS edits hot-swap instantly (Vite CSS HMR).
- JS/TS edits trigger Vite's fast full reload by default; the scene tears down and rebuilds
  with the page. A custom `import.meta.hot` re-init (keeping WebGL state) can be added later
  via the exported `disposeExperience()` hook.

## Roadmap

- [x] **Step 1** — scaffold + draggable, auto-rotating planet
- [x] **Step 2** — skill "countries": polygon regions on the sphere
- [x] **Step 3** — raycast hover: expertise tint + info card
- [ ] **Step 4** — scroll-driven choreography of the planet through sections
- [ ] **Step 5** — polish: atmosphere fresnel shader, starfield, reduced-motion support

