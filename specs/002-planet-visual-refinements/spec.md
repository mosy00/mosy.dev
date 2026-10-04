# Feature Specification: Planet Visual Refinements

**Feature Branch**: `002-planet-visual-refinements`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "The pole sections should be smaller like the poles on Earth. When the user scrolls, I want to just rotate the sphere a bit, as well as make it larger than it is — it is okay that the user cannot see the whole planet at the first glance. Consider making the free area of the planet a little bit transparent. There is a visible padding between the land and the surface of the sphere when seen from the sides — I don't want it; the land should be a part of the sphere. It might even be a good idea that the free area (ocean) becomes like the land, built with hexagons, but with a light blue color that differentiates it from the lands; in this scenario we don't need the background sphere. The lands are very similar in terms of their shapes — I want them to have different shapes. Also, changing the percentage in the skills data does not have a big difference to the output; as I don't add a skill which is under 40%, I need a visible contrast between a 100% skill and a 40% skill."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Land fused with the globe (Priority: P1)

As a visitor rotating the skills planet, I want the skill lands to sit flush inside the
planet's surface with no visible padding or step between land and sea — especially when I
look at a coastline from the side — so the world reads as one coherent globe instead of
stickers floating above a ball.

**Why this priority**: The floating-land gap is the most visually damaging flaw: it is
noticeable at a glance from side angles and undermines the entire "one world" concept
built by the hex-lands feature. Every other polish item sits on top of a believable
surface.

**Independent Test**: Rotate the planet until a landmass sits near the silhouette edge,
then inspect its coastline from a grazing angle — no gap, ledge, or float is visible, and
the free area reads as part of the same continuous surface.

**Acceptance Scenarios**:

1. **Given** the planet rotated so a skill land approaches the silhouette edge, **When** I view its coastline from the side, **Then** no gap, ledge, or floating underside is visible — land and surface meet continuously.
2. **Given** the whole globe, **When** I inspect the boundary between any land and the free area (ocean), **Then** the two read as parts of one continuous surface, never as two stacked layers.
3. **Given** the hex-tiled ocean, **When** I look at the free area, **Then** it is clearly distinguishable from the lands by a light blue tone while sharing the same hexagonal surface language.

---

### User Story 2 - Calm scroll tour with a bigger globe (Priority: P2)

As a visitor scrolling through the planet section, I want the scroll to gently rotate the
sphere and bring it closer (larger on screen), instead of swinging the globe around to
center each land one at a time — which currently drags the poles to new positions. It is
acceptable that I cannot see the whole planet at once.

**Why this priority**: The current tour's re-centering fights the Earth-like mental model
(poles should stay up) and makes the section feel restless; the calmer, closer tour is the
main experiential change requested.

**Independent Test**: Scroll from the top to the bottom of the planet section and watch
the poles — they stay in their up/down region while the globe turns gently and grows; the
experience still works if parts of the planet crop outside the viewport.

**Acceptance Scenarios**:

1. **Given** the planet section, **When** I scroll through it from start to end, **Then** the globe only rotates gently and the poles do not jump or migrate to new positions as lands pass center.
2. **Given** the scroll progresses, **When** I compare the planet's apparent size at the end versus the start, **Then** the planet is clearly larger, even if it no longer fits entirely in the viewport.
3. **Given** the tour is scroll-driven, **When** I drag the planet during or after scrolling, **Then** the drag feel (inertia, pole clamp) behaves exactly as it does today.

---

### User Story 3 - Expertise visibly drives land size (Priority: P3)

As the portfolio owner, I want a skill's expertise percentage to strongly affect how much
territory its land occupies, so that a 100% skill is obviously more dominant than a 40%
skill. I only use the 40–100% range.

**Why this priority**: The percentage is the data that carries meaning on the map; if
editing it barely changes anything, the visualization lies about the data.

**Independent Test**: Raise one skill's percentage within the 40–100% range, rebuild, and
compare screenshots — the land's size changes clearly; comparing a 100% and a 40% skill
side by side shows an obvious difference.

**Acceptance Scenarios**:

1. **Given** a skill at 100% and a skill at 40%, **When** I compare their lands on the globe, **Then** the 100% skill's land is clearly larger — at least about twice the tile count of the 40% skill's land.
2. **Given** I change a skill's percentage in the data, **When** the planet is rebuilt, **Then** that skill's land size changes visibly between the two renders.
3. **Given** a 40% skill, **When** the planet is built, **Then** its land still satisfies the existing floor of more than 30 connected tiles.

### User Story 4 - Distinct land shapes (Priority: P4)

As a visitor touring the globe, I want each skill's land to have its own recognisable
silhouette, so the world looks like a real archipelago of different countries rather than
one blob recoloured ten times.

**Why this priority**: Shape variety is a strong art-direction upgrade but does not
affect correctness of the data story; it builds once the surface and sizing behave.

**Independent Test**: Capture the outlines of any two lands and compare them — they read
as different shapes, not recolours of the same outline.

**Acceptance Scenarios**:

1. **Given** any two skill lands, **When** I compare their silhouettes, **Then** they are recognisably different shapes rather than the same blob with a different colour.
2. **Given** the full set of lands, **When** I view the globe from several angles, **Then** no single dominant shape template repeats across the world.
3. **Given** the variety rules, **When** the planet is built, **Then** every land remains a single connected mass that still satisfies the more-than-30-tiles floor.

---

### User Story 5 - Earth-like polar ice caps (Priority: P5)

As a visitor rotating a pole toward me, I want the white ice cap to be compact — like
Earth's polar regions — instead of covering a large slice of the hemisphere, while staying
decorative and non-interactive.

**Why this priority**: Explicitly requested first in the feedback; it is a small,
self-contained visual correction.

**Independent Test**: Rotate the north or south pole to face the camera and compare the
cap's extent against the current build — it reaches noticeably less far toward the
equator.

**Acceptance Scenarios**:

1. **Given** either pole rotated to face the viewer, **When** I look at the ice cap, **Then** it is visibly smaller than the current cap, confined to the high latitudes near the pole (roughly poleward of 65–70° latitude).
2. **Given** the cap, **When** I compare north and south, **Then** both are equivalent in style and similarly compact.
3. **Given** I hover the cap, **When** the interaction resolves, **Then** no skill card and no highlight appear (unchanged non-interactive behaviour).

---

### User Story 6 - Slightly translucent free area (Priority: P6)

As a visitor looking at the planet against the page background, I want the free area
(ocean) to feel a little bit transparent, so the globe picks up some of the page's
atmosphere — while the lands themselves stay fully solid.

**Why this priority**: Pure atmosphere polish, explicitly framed as "consider" in the
feedback; lowest risk, lowest urgency.

**Independent Test**: View the planet over contrasting page background areas — the free
area shows a subtle hint of what is behind it; lands remain opaque.

**Acceptance Scenarios**:

1. **Given** the planet over a varying page background, **When** I look at the free area, **Then** it reads translucent at the specified ~25% transparency — the background clearly shows through — while every land and ice cap stays fully opaque.
2. **Given** the transparency, **When** I view the planet from any angle, **Then** no confusing see-through "hole" effect exposes the globe's interior or far-side geometry sharply.

---

### Edge Cases

- What happens when the pointer hovers the hex-tiled ocean? Same as open ocean today: no skill card, no highlight, no legend selection.
- What happens now that the background sphere is removed? The hex-tile shell MUST read as a closed surface from every angle — no holes, seeing-through gaps, or visible interior when the slight transparency is enabled (transparency MUST stay subtle, per FR-005).
- What happens when transparency reveals the far side of the globe? The effect must stay subtle; sharp see-through of interior/far-side geometry is a defect, not a feature.
- What happens when lands become flush with the surface? Coastlines must not flicker, z-fight, or show seams when viewed at grazing angles or while rotating.
- What happens when size contrast grows while the more-than-30-connected-tiles floor holds? A 40% land must still clear 30+ connected tiles, and a 100% land must grow without overlapping or swallowing neighbouring lands.
- What happens when shape variety is generated? Variety must not break connectivity (still one mass per skill), cause lands to collide or merge, or push seeds into the polar moat.
- What happens on mobile when the enlarged planet crops outside the viewport? Every skill must stay reachable through drag/touch rotation and the legend; no skill may become inaccessible.
- What happens to the existing pole clamp during drag? Unchanged: vertical drag stays clamped so the poles remain up; only the scroll tour's behaviour changes.
- What happens if expertise data ever falls below 40%? The build must still succeed and satisfy the 30+ connected-tile floor; the guaranteed 2× contrast is specified for the supported 40–100% range.
- What happens when reduced motion is requested? The scroll sweep and growth are minimized or shown statically (FR-012); drag, hover, and legend must still work, and the planet must still appear at its enlarged size.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every skill land MUST sit flush with the planet's surface — no visible padding, gap, ledge, or floating underside between a land and the sphere at any viewing angle, including grazing/side views.
- **FR-002**: The free area (ocean) MUST be built from light-blue hexagonal tiles using the same construction as the lands, and the plain background sphere MUST be removed — the globe becomes one continuous hex-tile shell (land tiles + ocean tiles + ice tiles), so "no padding" holds structurally because all surface kinds are the same geometry.
- **FR-003**: The ocean tiles MUST stay clearly distinguishable from the lands by a light blue tone, and hovering them MUST behave exactly like open ocean today: no skill card, no skill highlight, no legend selection.
- **FR-004**: The planet MUST already be enlarged when the planet section first comes into view — the full globe is not visible at first glance — and during scroll the tour MUST additionally sweep roughly 180° of gentle horizontal rotation across the section (about half the globe seen in total) while the planet's apparent size grows further (continuing beyond the viewport is expected). It MUST NOT re-centre lands one at a time in a way that moves the poles to new positions.
- **FR-005**: The free area MUST be about 25% transparent (ocean tiles at roughly 75% opacity) so the page background clearly shows through it, while skill lands and polar caps MUST remain fully opaque; the effect MUST NOT sharply expose the globe's interior or far-side geometry.
- **FR-006**: Each skill land MUST have a distinct silhouette; lands MUST NOT read as the same shape recoloured, while each land remains one connected mass exceeding 30 tiles.
- **FR-007**: Land size MUST track expertise visibly across the supported 40–100% range: a 100% skill's land MUST be at least about twice the tile count of a 40% skill's land, and changing a percentage MUST produce a visible size change between rebuilds.
- **FR-008**: Both polar ice caps MUST be smaller than the current caps — compact, Earth-like regions confined roughly poleward of 65–70° latitude — visually equivalent north and south, white, and non-interactive (no card, no highlight, no legend row).
- **FR-009**: All existing planet behaviour MUST be preserved: drag with inertia and the ±45° pole clamp, hover highlight + info card for skills, legend sync (mouse and keyboard), polar non-interactivity, the more-than-30-connected-tiles floor per skill, and the polar moat keeping lands away from the caps.
- **FR-010**: The planet section MUST hold at least 30 frames per second during drag, hover, and the scroll tour (60 fps remains the target); the refinements MUST NOT noticeably degrade smoothness.
- **FR-011**: With the planet enlarged and potentially cropped, every skill MUST remain reachable on touch devices via drag rotation and the legend; the mobile experience MUST preserve the intent and quality of desktop rather than degrade into a stripped fallback.
- **FR-012**: When the visitor has requested reduced motion in their system settings, the scroll-driven rotation and growth MUST be minimized or presented statically (for example, the enlarged planet shown without the continuous sweep) while the section, its content, and all interactions remain fully available.

### Key Entities *(include if feature involves data)*

- **Hex tile**: the unit of surface — carries one skill's colour (land), a light-blue ocean tone (free area), or white (ice) — and belongs to exactly one mass.
- **Skill landmass**: the connected group of tiles for one skill; its silhouette is distinct and its size reflects the skill's expertise percentage.
- **Polar cap**: the compact white non-interactive mass at one pole.
- **Ocean / free area**: the light-blue hex-tiled region between lands; part of the continuous surface, ~25% transparent, never interactive as a skill.
- **Expertise percentage**: the per-skill value in the supported 40–100% range that visibly drives land size.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a grazing-angle inspection of all lands (side views at several rotations), a reviewer finds zero visible gaps, ledges, or floating undersides between land and surface.
- **SC-002**: When the planet section first enters the viewport, the planet is already cropped (its apparent diameter exceeds the visible area, so the whole globe is not visible at first glance). Across a full top-to-bottom scroll of the section, the tour sweeps approximately 180° of horizontal rotation (measured on the globe's yaw), the poles' orientation drifts by less than ~10° (no re-centring jumps), and the planet's apparent diameter grows by at least a further ~30%.
- **SC-003**: In a spot check pairing a 100% skill against a 40% skill, the 100% land has at least ~2× the tile count; rebuilding after a percentage edit produces a change visible in side-by-side screenshots.
- **SC-004**: In a blind shape comparison, no two lands are mistaken for recolours of each other — a reviewer correctly pairs every land with its own unique silhouette.
- **SC-005**: When either pole faces the viewer, the ice cap reaches no further than roughly 65–70° latitude and is visibly smaller than the cap in the current build; north and south read as equivalent.
- **SC-006**: Over contrasting page backgrounds, the free area shows the background clearly through it at the specified ~25% transparency (a reviewer can identify the background pattern/color behind the globe), while lands and caps remain 100% opaque in the same views.
- **SC-007**: Drag feel, skill hover pick, legend sync, and scroll-tour motion are indistinguishable from the current site in a side-by-side exercise of each interaction, and the section holds ≥30 fps during drag, hover, and scroll.
- **SC-008**: With reduced motion requested, the planet section renders the enlarged planet with no continuous scroll-driven rotation or growth, and every interaction (drag, hover, legend) still passes the same checks as SC-007.

## Assumptions

- The supported expertise range is 40–100%; the guaranteed 2× size contrast is specified for that range. Values outside it must still build and satisfy the 30+ connected-tile floor, but no contrast guarantee is promised below 40%.
- "Slightly transparent" is quantified as about 25% transparency (ocean tiles at roughly 75% opacity) per FR-005; lands and ice caps stay fully opaque.
- The enlarged planet may crop outside the viewport on desktop and mobile alike; partial visibility is intended, but all skills must remain reachable.
- The scroll tour no longer showcases each land centred to camera; discovery of individual lands shifts to hover, the legend, and gentle rotation. Drag, inertia, and the pole clamp are untouched.
- All invariants from the hex-lands feature remain in force unless this spec explicitly changes them: hexagonal tiles, one connected land per skill, more than 30 tiles per land, non-interactive polar caps, and the latitude moat between lands and caps.
- No new downloadable assets: the world stays procedural; colour, transparency, cap extent, and shape variety are all generated from existing data.
- The exact visual tuning (cap latitude bounds, growth amount within SC-002, shape-generation style) is art-directed within the bounds stated above.

## Clarifications

### Session 2026-09-29

- Q: Should the ocean be built from light-blue hexagonal tiles with the background sphere removed, or kept as a smooth surface with the lands embedded flush into it? (FR-002) → A: Hex-tiled ocean — light-blue tiles cover the free area with the same construction as lands, and the plain background sphere is removed entirely.
- Q: How much should the planet rotate horizontally (left-right) as the visitor scrolls through the planet section? (FR-004) → A: Medium sweep — roughly 180° total horizontal rotation across the whole section.
- Q: When the planet section first appears, should the planet already be enlarged (partially cropped), or start fully visible and grow only as you scroll? (FR-004) → A: Enlarged from section entry — full planet not visible at first glance, and it grows further while scrolling.
- Q: How should the scroll-driven rotation and growth behave for visitors who have requested reduced motion in their system settings? (FR-004) → A: Respect reduced motion — keep the enlarged static planet, but replace the scroll rotation/growth with a minimal or instant presentation.
- Q: How transparent should the ocean tiles be, so "a little bit transparent" has a concrete pass/fail target? (FR-005) → A: Subtle but clear — about 25% transparency (background noticeable, water still solid).


