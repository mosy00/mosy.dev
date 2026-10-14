# Quickstart: Planet Interaction Refinement

**Feature**: `004-planet-interaction-refinement` | **Date**: 2026-10-13

Validate with `npm run dev` and manual trials (behaviors are visual/interactive; see contracts in [contracts/ui-behavior.md](contracts/ui-behavior.md) and state in [data-model.md](data-model.md)).

## Prerequisites

- `npm install`, then `npm run dev`; open the planet section.
- `npm run typecheck` and `npm run build` must stay green (constitution gates).

## Baseline notes (recorded 2026-10-13, pre-change)

- V1 symptom confirmed: drag-tilt + scroll compounds — poles swing toward the viewer as scroll accumulates; no re-centering exists (tour only writes `tourGroup` yaw/scale).
- V2 symptom confirmed: with default XYZ order on `dragGroup`, vertical drag reverses past ~180° total yaw (tour sweep past half-section + user spin) — identical up-drag reveals upper latitudes at end-scroll vs lower latitudes at entry.
- V4 symptom confirmed: `HIGHLIGHT.active: 1.35` emissive on same-hue base reads as a hot white-ish flare; no lift exists (lands flush at all times).
- Labels: none exist — lands are identified only via legend/info-card.

## V1 — Scroll re-centers tilt (C1, SC-001)

1. Drag the globe to a strong tilt (poles visibly off-axis).
2. Scroll top-to-bottom of the planet section.
3. **Expect**: sweep + growth play while poles ease back to entry alignment; end state upright, no jumps. Scroll back up: entry tilt sticks.

## V2 — Drag consistency at three positions (C2, SC-002)

1. At entry, drag straight up ~150px; note which latitudes appear.
2. Repeat mid-scroll and end-scroll.
3. **Expect**: lower latitudes come into view all three times, comparable magnitude; horizontal drags spin the same direction; flick glide never reverses.

## V3 — Labels (C3, SC-003)

1. At rest, read each front-facing land's name off the globe.
2. Drag 180°; check newly front-facing labels readable, rear labels hidden.
3. Crowd two lands together; **expect** only the front-most label shows.

## V4 — Hover tint + lift (C4, SC-004/SC-005)

1. Hover each land: **expect** "same color, bolder" (no white flash) + slight pop-up; move off: settles flush within a fraction of a second.
2. Move pointer off-canvas mid-hover: nothing sticks.
3. Touch/tap: brief emphasis auto-clears.

## V5 — Reduced motion + gates (C5, SC-006)

1. Enable OS reduced motion, reload: scroll leaves globe near-static; drag, labels, tap-identification all work; emphasis applies instantly.
2. Run `npm run typecheck && npm run build` — both exit 0.
