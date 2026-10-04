# Quickstart Validation: Planet Visual Refinements

**Feature**: `002-planet-visual-refinements` | **Spec**: [spec.md](./spec.md) | **Contracts**: [contracts/modules.md](./contracts/modules.md)

## Prerequisites & setup

```powershell
npm install          # once
npm run dev          # dev server (default Vite port)
```

Quality gates (constitution — must pass before merge):

```powershell
npm run typecheck    # MUST pass
npm run build        # MUST succeed (production build)
```

Optional offline geometry re-check (development aid — research scripts are deleted before commit; recreate from `research.md` if needed): D3/D4 cite the measured numbers (caps 103/hemisphere connected; contrast 2.18–2.84×; moat 6.5–10.7°; touch pairs 0).

## Validation scenarios

Run each against `npm run dev` in a browser; desktop AND a mobile viewport (device toolbar) unless noted. **US = user story, SC = success criterion** from the spec.

### V1 — Flush surface (US1, FR-001, SC-001)
1. Scroll to the planet section; drag until a coastline sits near the silhouette edge.
2. Inspect the coast from the grazing angle while slowly dragging both directions.
- **PASS**: no gap, ledge, or floating underside anywhere; land, ocean, and ice read as one surface; no flicker/z-fight seams while rotating. At ~20 % transparency you see far-hemisphere lands through the ocean — never a second smooth layer or a jumbled sea interior (sphere removed).

### V2 — Hex ocean look & behavior (FR-002/003, SC-001/006)
1. Observe the free area: light-blue hexagonal tiles with visible facet shading (same language as lands).
2. Hover over open ocean → nothing: no card, no highlight, no legend selection.
3. Hover over white caps → nothing.
4. Sweep the pointer across the middle of the globe (ocean with land *behind* it) → still nothing (occlusion rule, D6).
5. Look at water with a land directly behind it → the far land is faintly discernible through the ~20 % transparency; near lands/caps fully opaque in the same view.
- **PASS**: all five; ocean clearly lighter-blue than every skill land (pre-lightened `#74c0ec`, D2); the sea's own far hemisphere and interior never render as a second jumbled ocean, and hovering a far-side land seen through the water selects nothing.

### V3 — Calmer, bigger scroll tour (US2, FR-004, SC-002)
1. From the top of the section: the globe's apparent diameter is `0.9315 × min(w,h)` and **both poles are visible**; the whole globe may be in view at entry (the original entry crop no longer applies — see spec SC-002 deviation).
2. Scroll to the bottom watching the poles: globe turns ~half a turn total (≈180°) and grows from `0.9315 × min(w,h)` to `1.035 × min(w,h)` (+11 %), never swinging lands to centre. Top and bottom stay visible throughout.
3. Track a pole marker: it stays in its up/down region the whole way (drift ≈ 0°).
4. Scroll back up: motion reverses smoothly (scrub 0.8 feel ≈ current site).
5. Scroll so the planet section's top and bottom edges cross the viewport while the globe is oversized → the globe stays visible over the previous/next sections; it is never covered or cut at the section boundary.
- **PASS**: entry `0.9315 × min(w,h)`, ~a tenth smaller than the previous retune; sweep ≈180°; end `1.035 × min(w,h)`; poles never repositioned; **both poles visible at every scroll position**; neighbours never hide the planet.

### V4 — Smaller Earth-like caps (US5, FR-008, SC-005)
1. Rotate so the north pole faces you; then the south.
- **PASS**: each cap reaches no further than ~65–70° latitude (visibly smaller than the old 55° caps), north ≡ south, white with hex facets, hover inert.

### V5 — Flush-by-construction smoke (edge cases)
1. `git grep -n "SphereGeometry" src/three` → no ocean sphere; `git grep -n "raise" src/three/config.ts` → no `REGIONS.raise`.
2. Confirm land, ocean, caps all mesh at `PLANET.radius`.
- **PASS**: sphere gone, `raise` gone, single radius constant.

### V6 — Size contrast (US3, FR-007, SC-003)
1. In `src/data/skills.ts` set one skill to `expertise: 1.0` and another to `0.4`; reload; screenshot.
2. Compare the two lands (tile counts or visual size). Restore data.
3. Edit one real skill by ≥5 pp (e.g. `0.82 → 0.9`), reload, compare.
- **PASS**: 100 % land visibly ≥ 2× the 40 % land (measured 2.18–2.65× in multi-skill context, D4); ≥5 pp edits produce a visible size change; every land still clears 30+ connected tiles; the a11y outlier (0.1) still builds (sizing clamps at 0.4).


### V7 — Distinct shapes (US4, FR-006, SC-004)
1. Sight the ten lands one by one (drag + legend), or screenshot each.
- **PASS**: blind pairing test — no two lands read as the same silhouette recoloured; aspect/lobe variety visible (research: min profile distance 0.221); exactly one connected mass per skill; no land touches another (erosion pass); none enters the cap moat.

### V8 — Preserved interactions (FR-009, SC-007)
1. Drag: 1:1 follow, inertia after release, vertical drag stops at ±45°. Dragging UP tips the top of the globe away and reveals its lower parts (the original direction, unchanged). **A vertical flick must continue in the same direction as the drag that started it** — never reverse on release — and must ease out to a smooth stop rather than stalling within ~0.5 s. Dragging into the ±45° limit must not spring back.
2. Hover a land: card + glow, other lands dim; leave: restore.
3. Legend: mouse hover sync both directions; keyboard focus/activate syncs card + planet highlight.
4. Scroll tour during all of the above: drag and tour never fight (inner/outer groups).
- **PASS**: indistinguishable from the current site side by side.

### V9 — Performance (FR-010, SC-007)
1. DevTools performance monitor while dragging, hovering across lands, and auto-scrolling the section.
- **PASS**: ≥30 fps sustained (60 target); `npm run build` output ≈ unchanged or smaller (sphere removed; D9 budget 13 draw calls / ~15.4k tris).

### V10 — Mobile / cropped reachability (FR-011, SC-007)
1. Device viewport (e.g. 390×844 and a tablet): globe at ~0.9315× the smaller dimension at entry, growing to ~1.035× on scroll, poles always visible (or static — V11).
2. Touch-drag rotates with inertia; tap a land shows the card; legend reachable; every skill reachable via drag + legend despite cropping.
- **PASS**: no skill unreachable; quality matches desktop (Constitution VII).

### V11 — Reduced motion (US6, FR-012, SC-008)
1. OS/browser emulate `prefers-reduced-motion: reduce`; reload the page (boot-time check, D8).
2. Scroll through the planet section.
- **PASS**: enlarged (cropped) planet shown statically — no continuous sweep, no growth animation, no idle spin, no float bob; drag, hover, legend, keyboard, and cards all work exactly as in V8; section content intact.

### V12 — Final gates & principle review
```powershell
npm run typecheck   # MUST pass
npm run build       # MUST succeed
```
- Review the change against all 8 constitution principles (esp. III readability of the new ocean tone, VII mobile, VIII scroll expression + reduced-motion accessibility).
