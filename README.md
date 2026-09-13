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
│  └─ skillRegions.ts       # spherical-Voronoi carve: 1 mesh per skill
├─ animations/
│  ├─ gsap.ts               # single ScrollTrigger registration point
│  └─ scrollAnimations.ts   # hero intro, reveals, planet scale flourish
└─ ui/
   ├─ smoothScroll.ts       # Lenis <-> GSAP ticker integration
   ├─ skillLegend.ts        # legend built from the same skill data
   └─ nav.ts                # smooth in-page anchors
```

## Planet (step 2)

- **Its own section** — the canvas lives inside `#planet` (the second section): dead-center,
  sized by a camera fit so the sphere spans ~86% of the viewport height (width-fit fallback
  on portrait screens). Sizes come from the canvas element, not the window.
- **Skill countries** — the sphere is carved by a spherical Voronoi over a 5120-face
  icosphere: every face joins its nearest skill seed (noise-warped "coastlines"), then
  faces merge into **one flat-shaded mesh per skill** (~10 draw calls total). Expertise
  buys territory (1–3 seeds per skill) and deepens the tint via the shared formula in
  `data/skills.ts`.
- **Legend** — generated from the same data module, so swatch colors match the countries
  exactly.
- **Drag** — pointer events on the canvas: 1:1 rotation while dragging (yaw free, pitch
  clamped to ±60°), velocity-based inertia after release that settles into the idle spin.
  `touch-action: pan-y` keeps vertical page scrolling usable on touch devices.
- Region meshes carry `userData.skillId` — ready for the raycast hover + info card step.

## HMR behaviour

- CSS edits hot-swap instantly (Vite CSS HMR).
- JS/TS edits trigger Vite's fast full reload by default; the scene tears down and rebuilds
  with the page. A custom `import.meta.hot` re-init (keeping WebGL state) can be added later
  via the exported `disposeExperience()` hook.

## Roadmap

- [x] **Step 1** — scaffold + draggable, auto-rotating planet
- [x] **Step 2** — skill "countries": polygon regions on the sphere
- [ ] **Step 3** — raycast hover: expertise tint + info card
- [ ] **Step 4** — scroll-driven choreography of the planet through sections
- [ ] **Step 5** — polish: atmosphere fresnel shader, starfield, reduced-motion support

