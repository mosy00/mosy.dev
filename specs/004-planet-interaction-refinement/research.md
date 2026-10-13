# Research: Planet Interaction Refinement

**Feature**: `004-planet-interaction-refinement` | **Date**: 2026-10-13

## D1 — Why vertical drag reverses past 180° (root cause)

- **Decision**: Treat the reversal as Euler-order coupling in the single shared group, and fix by (a) setting `dragGroup.rotation.order = 'YXZ'` and (b) computing drag deltas in a yaw-compensated frame.
- **Rationale**: `tourGroup` already uses YXZ ("yaw spins about poles, pitch stays latitude-like"), but `dragGroup` — the actual drag target — never sets an order, so it uses default XYZ where pitch is applied in a yaw-rotated frame. Past ~180° of accumulated yaw the same screen-space upward drag maps to flipped world-space pitch. The nested tour/drag split (spec Assumption 1) is preserved; only the inner group's order and the delta mapping change.
- **Alternatives considered**: Quaternion trackball (rejected — changes the "grab and turn" feel and inertia model); clamping total yaw (rejected — breaks free spin and the scroll sweep composition).

## D2 — Scroll re-centering without fighting drag (tilt-only, one-way)

- **Decision**: The scroll tour eases the drag group's pitch component back toward `PLANET.initialTilt` as scroll progresses (tilt-only per clarification 1), leaves yaw untouched, never writes while the pointer is down (FR-003), and does not restore the old tilt on scroll-back (one-way per clarification 3).
- **Rationale**: Tilt-only keeps the visitor's spin intact so the sweep composes predictably; pointer-down gating gives drag direct control; one-way avoids snap-back complexity and matches the clarified acceptance test.
- **Alternatives considered**: Easing yaw too (rejected in clarification — would unwind visitor spin); resetting tilt instantly at section end (rejected — visible jump violates FR-003/SC-001 smoothness).

## D3 — Floating land labels that rotate with lands and hide far-side

- **Decision**: One `THREE.Sprite` per skill land, positioned at `skillDirections[i] × (R + floatHeight)`, parented to the drag group so all globe motions carry them; per-frame visibility from the existing occluder-sphere rule (front-most label only wins ties per clarification 2); canvas-generated text textures using skill names from legend/info-card data.
- **Rationale**: Sprites always face the camera (FR-009 "face the viewer" free), parenting to the drag group gives FR-008 motion-following free, and the `PlanetInteraction` occluder test already solves far-side hiding (FR-009). Front-most-only resolves overlap with zero layout machinery and no neighbor-covering.
- **Alternatives considered**: CSS2D overlay labels (rejected — extra DOM layer, manual projection each frame, harder occlusion); per-tile HTML (rejected — 13 lands × tiles = heavy DOM).

## D4 — Close-tint hover plus lift (replacing the white-hot glow)

- **Decision**: Derive the hover color per-land as the same-hue sibling of the base skill color (small lightness lift, e.g. HSL +~0.08–0.12 lightness, saturation held), tweened via the existing GSAP emissive path with `HIGHLIGHT.active` retuned down from 1.35 to a modest value; lift via a small radial offset of the hovered mesh (fraction of R) with settle-back on leave, reusing the `setHighlighted` pipeline.
- **Rationale**: Same-hue derivation satisfies FR-010 "same color, bolder" by construction; reusing `setHighlighted` keeps one highlight path (tap, legend, raycast all flow through it) and FR-012 clearing stays a single null-set. Small radial lift reads as "popping up" without breaking the flush-shell silhouette.
- **Alternatives considered**: White emissive flash (current behavior — explicitly rejected by the user); scale-up of the mesh (rejected — distorts tile boundaries and the ocean moat).

## D5 — Touch, keyboard, reduced-motion

- **Decision**: Tap reuses the existing `pointerdown` pick path with a brief timed emphasis (tint + lift, auto-clear ~600ms); keyboard/legend equivalents unchanged (legend rows already drive `applyHover`); under reduced motion the tour timeline stays uncreated (current), re-centering applies as a single static set to entry tilt, and emphasis changes apply instantly (duration 0).
- **Rationale**: Matches FR-013/FR-014 and SC-006 with no new input plumbing; the legend path already proves every skill stays identifiable without motion.
