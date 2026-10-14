# Feature Specification: Planet Interaction Refinement

**Feature Branch**: `004-planet-interaction-refinement`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "scroll re-centers the sphere as well as rotating it; dragging feels the same at any scroll position (up reveals lower part); floating label above each land rotating with it; subtler hover tint plus slight lift."

## Clarifications

### Session 2026-10-13

- Q: When scrolling eases the planet back toward entry orientation, should it ease only tilt or spin too? → A: Ease tilt only; leave yaw where the visitor left it (Option A).
- Q: When several front-facing land labels would overlap, how should the collision resolve? → A: Show only the front-most land's label; hide the rest until rotation separates them (Option A).
- Q: After scroll re-centers the tilt, should the previous custom tilt be forgotten or restored on scroll-back? → A: One-way; re-centered tilt sticks until the visitor drags again (Option A).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scroll keeps the globe oriented (Priority: P1)

A visitor drags the planet to a tilted angle, then scrolls through the planet section. As scrolling progresses, the globe both rotates (tour sweep) and eases back toward its upright, centered orientation, so the poles stay roughly up/down and never swing to face the viewer, no matter how the visitor previously dragged.

**Why this priority**: Fixes the worst reported breakage — a tilted drag plus scroll compounds into poles-facing-viewer orientations that look broken. Re-centering keeps the scroll-tour storytelling while the globe stays legible.

**Independent Test**: Drag to a strong tilt, then scroll top-to-bottom of the planet section; the globe returns near-upright while completing its scroll rotation. Demonstrable without label or hover changes.

**Acceptance Scenarios**:

1. **Given** a drag-tilted planet, **When** the visitor scrolls through the planet section, **Then** the polar axis eases back toward upright as scroll progresses instead of compounding the tilt.
2. **Given** any prior drag orientation, **When** the visitor reaches the end of the planet scroll range, **Then** the poles are near entry alignment (top up, bottom down), neither pole facing the viewer.
3. **Given** no prior drag, **When** the scroll tour plays, **Then** the motion matches today (smooth rotation plus growth, poles stable).

---

### User Story 2 - Dragging always feels the same (Priority: P1)

A visitor drags the globe at any point — entry, mid-scroll, or after the full sweep. Dragging up always tips the globe so lower regions come into view, dragging down reveals upper regions, horizontal drags spin the same direction. The feel never flips after scrolling past 180 degrees.

**Why this priority**: Direction reversal breaks the core "grab and turn" promise; visitors perceive it as a bug the moment vertical drag flips.

**Independent Test**: At scroll start, mid, and end, drag straight up the same distance and confirm lower latitudes come into view each time with comparable magnitude.

**Acceptance Scenarios**:

1. **Given** the section at entry, **When** the visitor drags up, **Then** the globe reveals more of its lower part (drag down reveals the upper part).
2. **Given** mid- or end-scroll position, **When** the visitor drags up with the same gesture, **Then** the response is identical in direction with comparable magnitude.
3. **Given** a flick release, **When** inertia glides, **Then** it continues in the dragged direction, never reversing.

---
### User Story 3 - Subtle hover emphasis with lift (Priority: P2)

A visitor hovers a skill land. Instead of today's bright glow, the land shifts to a tint very close to its own color (slightly bolder sibling of the base hue) and rises slightly above the surface, as if popping up, then settles back when the pointer leaves.

**Why this priority**: The current hover glow is harsh against the refined palette; a close-tint-plus-lift keeps discoverability while matching the site's craft standard.

**Independent Test**: Hover each land; highlight reads as "same color, bolder" plus a visible small lift; unhover returns it flush. Testable without scroll/drag/label changes.

**Acceptance Scenarios**:

1. **Given** the pointer on a skill land, **When** hover engages, **Then** the land shifts to a close tint of its base color (same hue family, modestly bolder), not a strong white-hot glow.
2. **Given** a hovered land, **When** highlight is active, **Then** it sits visibly higher than neighbors and returns flush on pointer leave.
3. **Given** a touch device, **When** the visitor taps a land, **Then** an equivalent brief emphasis (tint plus lift) confirms selection without sticking.

---

### User Story 4 - Floating land labels (Priority: P3)

Each skill land carries a small text label naming the skill, floating slightly above the surface like a marker in the air. Labels travel with their land as the globe spins, always face the viewer when front-facing, and hide or fade when their land rotates to the far side.

**Why this priority**: Labels make the globe self-explanatory without hunting the legend and add playful character; ranked P3 because orientation and drag fixes land first.

**Independent Test**: Read skill names directly off the globe; rotate 180 degrees and confirm newly front-facing labels are readable while rear labels hide.

**Acceptance Scenarios**:

1. **Given** the planet at rest, **When** a skill land faces the viewer, **Then** its label is visible, floating just above the surface and readable.
2. **Given** globe rotation (drag, scroll, inertia, idle), **When** a land moves, **Then** its label moves with it, anchored above the same land.
3. **Given** a land on the far side, **When** occluded by the sphere, **Then** its label hides or fades rather than showing through the planet.

---

### Edge Cases

- Visitor drags WHILE scrolling: drag keeps direct control; re-centering resumes around it without jumps or fighting.
- Reduced-motion preference: scroll rotation/re-centering and idle motion are suppressed or minimized; drag, labels, hover emphasis stay usable, non-animated where appropriate.
- Small screens: labels stay legible without covering neighbors (smaller type, fewer simultaneous labels, or collision-avoiding placement acceptable).
- Planet already at maximum tilt: re-centering eases back rather than snapping; drag direction stays consistent at the clamp.
- Re-centered tilt sticks: scrolling back up keeps the entry tilt; the earlier custom tilt is not restored (one-way re-centering).
- Pointer leaves canvas mid-hover-lift: land settles flush and tint clears without sticking.
- Label layer failure: globe stays fully interactive; legend/info-card path still identifies every skill.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Scrolling through the planet section MUST both rotate the globe and ease any user-applied tilt back toward the entry tilt angle; scroll re-centering MUST NOT alter the visitor's yaw (spin) position.
- **FR-002**: At the end of the planet scroll range, the polar axis MUST be near entry alignment regardless of prior dragging (neither pole facing the viewer).
- **FR-003**: Scroll re-centering MUST NOT visibly jump or fight an in-progress drag; while the pointer is down, the drag has direct control.
- **FR-004**: Vertical drag MUST be directionally consistent at every scroll position: pointer-up reveals the lower part, pointer-down the upper part.
- **FR-005**: Horizontal drag MUST be directionally consistent at every scroll position (same gesture, same spin direction, comparable magnitude).
- **FR-006**: Post-release inertia MUST continue in the dragged direction and MUST NOT reverse at any scroll position.
- **FR-007**: Each skill land MUST show a floating text label slightly above its surface; when labels would overlap on screen, only the front-most land's label is shown.
- **FR-008**: Labels MUST move with their land under all globe motions (drag, scroll tour, inertia, idle).
- **FR-009**: Labels MUST face the viewer when front-facing and MUST hide or fade when their land is occluded on the far side.
- **FR-010**: Hover (or tap) emphasis MUST use a close tint of the land's own base color — same hue family, modestly bolder — not a high-intensity glow.
- **FR-011**: The hovered land MUST rise slightly above the surface while hovered and settle flush on pointer leave.
- **FR-012**: Emphasis and lift MUST clear reliably (no stuck highlight or raised land) when the pointer leaves the land or canvas.
- **FR-013**: All four behaviors MUST work with touch input and existing keyboard/assistive equivalents.
- **FR-014**: All four behaviors MUST respect reduced-motion preference (ambient motion suppressed; emphasis instant rather than animated where fitting) while every skill stays identifiable.

### Key Entities

- **Globe orientation**: Current tilt plus spin — visitor drag offset plus scroll-driven tour rotation; re-centering acts on the drag-applied tilt component.
- **Drag gesture**: Press-and-move rotating the globe with direct feel plus post-release glide; up-reveals-lower mapping is invariant across scroll positions.
- **Land label**: Floating text marker naming one skill land, anchored above its surface, visible only while front-facing.
- **Hover emphasis**: Combined close-tint recolor plus slight lift on exactly one land at a time (brief on tap).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After any drag plus full scroll, the polar axis returns near entry alignment (poles up/down, neither facing viewer) in every trial.
- **SC-002**: A fixed upward drag reveals the lower globe at entry, mid-scroll, and end-scroll — same direction, comparable magnitude in all three.
- **SC-003**: Visitors read every front-facing land's name off the globe without the legend; no far-side label shows through the planet.
- **SC-004**: Reviewers judge the hover state "same color, bolder" (close tint, not bright flash) and perceive the lift above neighbors.
- **SC-005**: Emphasis never sticks: after pointer leave, base color and flush height return within a fraction of a second, every trial.
- **SC-006**: With reduced motion, the globe stays near-static during scroll while drag, labels, and tap identification stay fully usable.

## Assumptions

- The existing scroll tour (half-turn sweep plus growth) and free-drag-with-inertia model stay; this refines them rather than replacing navigation.
- Label text defaults to the skill name from legend/info card; typography follows site direction at plan time.
- Close-tint hover color derives per-land from its base color; exact derivation is a plan-time visual decision.
- Hover lift is small (fraction of globe radius) — reads as "popping up" without breaking the silhouette.
- Mobile adaptations (smaller labels, tap-to-identify, no stuck hover) are design work per the mobile principle, not stripped fallbacks.
- Quality gates (`npm run typecheck`, `npm run build`) and review against all eight constitution principles apply unchanged.

