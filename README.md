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
├─ three/
│  ├─ config.ts             # tuning constants (camera, planet, controls)
│  ├─ Experience.ts         # renderer, camera, lights, resize, render loop, dispose
│  ├─ Planet.ts             # sphere mesh + graticule overlay in one group
│  ├─ PlanetControls.ts     # drag-to-rotate with inertia + idle spin
│  └─ graticule.ts          # lat/long line grid (1 draw call)
├─ animations/
│  ├─ gsap.ts               # single ScrollTrigger registration point
│  └─ scrollAnimations.ts   # hero intro, reveals, scrubbed planet dimming
└─ ui/
   ├─ smoothScroll.ts       # Lenis <-> GSAP ticker integration
   └─ nav.ts                # smooth in-page anchors
```

## Planet controls (step 1)

Pointer events on the fixed canvas: 1:1 rotation while dragging (yaw free, pitch clamped
to ±60°), velocity estimated from pointer deltas, exponential inertia decay after release
that settles into the slow idle spin. `touch-action: pan-y` keeps vertical page scrolling
usable on touch devices; `pointer-events` on the page passes through empty areas so the
planet stays draggable.

## HMR behaviour

- CSS edits hot-swap instantly (Vite CSS HMR).
- JS/TS edits trigger Vite's fast full reload by default; the scene tears down and rebuilds
  with the page. A custom `import.meta.hot` re-init (keeping WebGL state) can be added later
  via the exported `disposeExperience()` hook.

## Roadmap

- [x] **Step 1** — scaffold + draggable, auto-rotating planet
- [ ] **Step 2** — skill "countries": polygon regions on the sphere
- [ ] **Step 3** — raycast hover: expertise tint + info card
- [ ] **Step 4** — scroll-driven choreography of the planet through sections
- [ ] **Step 5** — polish: atmosphere fresnel shader, starfield, reduced-motion support

