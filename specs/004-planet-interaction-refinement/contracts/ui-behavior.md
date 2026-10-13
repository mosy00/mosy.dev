# UI Contracts: Planet Interaction Refinement

**Feature**: `004-planet-interaction-refinement` | **Date**: 2026-10-13

The planet exposes no network APIs; its contracts are the user-observable interaction behaviors. Each contract names the observable behavior, the trigger, and the pass criterion from the spec.

## C1 — Scroll re-centers tilt (FR-001/FR-002/FR-003, SC-001)

- **Trigger**: scroll through `#planet` after any drag tilt.
- **Behavior**: globe rotates (sweep + growth unchanged) while drag pitch eases toward entry tilt; yaw untouched; no writes while pointer down; one-way (scroll-back keeps entry tilt).
- **Pass**: end-of-scroll polar axis near entry alignment; no jumps; drag-while-scroll keeps direct control.

## C2 — Direction-consistent drag (FR-004/FR-005/FR-006, SC-002)

- **Trigger**: pointer drag at entry, mid, end scroll; flick release.
- **Behavior**: pointer-up reveals lower latitudes with comparable magnitude at all three positions; horizontal spins same direction; glide continues dragged direction.
- **Pass**: identical up-gesture → lower latitudes visible in all three positions; glide never reverses.

## C3 — Floating land labels (FR-007/FR-008/FR-009, SC-003)

- **Trigger**: load, rotate (any motion), occlude.
- **Behavior**: one skill-name label floats just above each land; moves with its land; faces viewer; far-side hides; overlap shows front-most only.
- **Pass**: every front-facing land name readable off-globe; no far-side label legible through planet.

## C4 — Hover tint plus lift (FR-010/FR-011/FR-012, SC-004/SC-005)

- **Trigger**: hover land, tap land (touch), pointer leave land/canvas.
- **Behavior**: close same-hue tint (not bright flash) + slight radial lift; clears to base color + flush height on leave; tap auto-clears briefly.
- **Pass**: reviewers judge "same color, bolder" with visible lift; nothing sticks.

## C5 — Reduced motion + touch/keyboard (FR-013/FR-014, SC-006)

- **Trigger**: `prefers-reduced-motion`, touch tap, legend/keyboard path.
- **Behavior**: scroll sweep static, re-center as single set, emphasis instant; tap identifies via brief emphasis; legend path unchanged.
- **Pass**: near-static globe during scroll; every skill identifiable without motion.
