# Feature Specification: Palette, Continents & Land Scale

**Feature Branch**: `003-palette-continents`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: change the website colour palette to a supplied 8-colour set held in a single editable file; apply the palette to the planet lands; regroup skills into colour-coded continents; and shrink lands so a 100% skill reads like China and a 40% skill like Germany, adding white space.

## Clarifications

### Session 2026-10-05

- Q: Which palette colours should the four continents use? → A: `FFCD28` amber → Front-end & Interface; `0978BE` main blue → Back-end & Systems; `E1E06C` pale amber → Graphics & Motion; `FFECC7` beige → Creative & Quality
- Q: How should the Back-end continent be kept distinguishable from the ocean, given `0978BE` sits only ~24 perceptual units from the composited water? → A: Change nothing. `0978BE` is kept exactly as assigned. The owner will confirm or reject separability visually after implementation; if the continent proves indistinguishable from the ocean in the running site, the colour is revisited then.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The owner restyles the whole site from one file (Priority: P1)

The site owner wants to change the site's colours by editing a single file, without hunting through stylesheets and 3D scene files to find colour definitions.

**Why this priority**: Every other change in this feature depends on the palette being a single source of truth. Until colours live in one place, neither continent colouring nor easy restyling is maintainable.

**Independent Test**: Edit the single palette file to a different colour, reload, and observe that page background, text, buttons, links, focus rings, scrollbar, and the 3D planet all change. No other file is touched.

**Acceptance Scenarios**:

1. **Given** the site is running, **When** the owner changes a palette value, **Then** every surface that used that colour changes, with no further edits required.
2. **Given** the site is running, **When** the owner inspects any colour in use, **Then** it traces back to the palette file or to a shade/tint of a palette entry.

---

### User Story 2 - A visitor reads skills as continents (Priority: P2)

A visitor sees the planet and can tell that back-end skills form one landmass, front-end skills form another, and the two are separate. Each continent reads as one idea, and each skill inside it is still individually findable.

**Why this priority**: Grouping is the core narrative change — it turns a scattered set of skills into a small number of legible ideas. It depends on P1 for its colours.

**Independent Test**: Rotate the globe and confirm each continent appears as one continuous landmass in its own colour family, that distinct continents never touch, and that hovering an individual skill still identifies that skill.

**Acceptance Scenarios**:

1. **Given** the globe is rotated to any face, **When** the visitor looks at the lands, **Then** skills belonging to the same continent appear together as one connected landmass sharing a colour family.
2. **Given** two different continents, **When** they are both visible, **Then** a band of ocean separates them and their colours are distinguishable.
3. **Given** a visitor hovers a single skill inside a continent, **When** the skill is read out, **Then** the continent name is shown alongside that skill's name and level.

---
### User Story 3 - The owner edits the continent map by hand (Priority: P3)

The owner adds a continent, renames one, or moves a skill between continents by editing one data file — with no other change required.

**Why this priority**: It is the maintainability promise that keeps the grouping from becoming hard-coded. Valuable, but it is a consequence of the data model rather than the visual result.

**Independent Test**: Add a new continent with a palette colour and one existing skill, reload, and confirm the new continent renders with that colour and the skill moved without any other file being edited.

**Acceptance Scenarios**:

1. **Given** a continent is added with a name and a palette colour, **When** the page loads, **Then** the new continent renders on the globe in that colour family.
2. **Given** a skill's continent is changed, **When** the page loads, **Then** the skill renders in its new continent and no longer in the old one.

---

### User Story 4 - A visitor sees a calmer, less crowded planet (Priority: P2)

A visitor sees lands that are recognisably smaller than before, with far more ocean between them, so the globe reads as minimal and clean rather than crowded.

**Why this priority**: The scale reduction is an explicit visual goal and it is what makes continent grouping legible in the first place — grouped lands would merge into an unreadable mass at the current size.

**Independent Test**: Compare the globe before and after: total land coverage is visibly lower, the largest skill is 50 tiles against the same globe, and no two continents touch.

**Acceptance Scenarios**:

1. **Given** a skill at 100% expertise, **When** it is measured against the globe, **Then** its land covers 50 tiles, roughly 2% of the globe's surface.
2. **Given** a skill at 60% expertise, **When** it is measured against the globe, **Then** its land covers roughly 25 tiles, visibly smaller than the 100% skill.
3. **Given** two adjacent continents, **When** they are viewed, **Then** ocean separates them.

---

### Edge Cases

- A skill's colour is derived from a continent whose main colour is close to the ocean's colour, reducing legibility.
- A continent is defined but contains no skills, or a skill names a continent that does not exist.
- A continent colour is edited to a value that fails text-contrast against the background.
- A skill's expertise falls below 20%, making its land a single tile that is hard to hover or tap.
- Two continents' seeded lands grow toward each other and touch, or overlap. (Skills within one continent are expected to touch — that is what makes it one landmass.)
- A continent has only one low-expertise skill, leaving a landmass too small to hover or read.
- A skill is moved to a continent while the legend or the scroll tour still expects the old grouping.
## Requirements *(mandatory)*

### Functional Requirements

**Colour palette**

- **FR-001**: The site MUST define all of its colours in a single palette source file that the owner can edit.
- **FR-002**: The palette MUST contain the following eight colours, with these intended roles: `0C1E37` dark navy background; `FFCD28` bright amber for buttons; `0978BE` main blue; `80C5DC` light blue for secondary text; `F1FFFA` mint cream for primary text; `193D6A` shade of main blue for hover over navy; `E1E06C` pale amber as a secondary accent; `FFECC7` beige as a tertiary accent.
- **FR-003**: Every colour used on the page and on the planet's lands MUST originate from the palette file; colours elsewhere in the site — page styling, UI components, and land rendering — MUST be derived from it rather than hard-coded. The ocean and polar caps are exempt (see FR-021).
- **FR-004**: Changing any palette value MUST change every surface that uses it, without requiring edits to any other file.
- **FR-005**: Each palette entry MUST carry a name and role so the owner can tell which colour to change for which purpose.
- **FR-006**: The site MUST remain readable and operable when the palette is changed, retaining legible contrast for text, controls, and focus indicators.

**Planetary lands**

- **FR-007**: Every land on the planet MUST be rendered using only palette colours or shades/tints of palette colours.
- **FR-008**: Land colours MUST stay distinguishable from the ocean and from each other, so no continent becomes unreadable against the sea.
- **FR-009**: Skills within one continent MUST be coloured as shades or tints of that continent's main colour, with greater expertise reading as a deeper shade.
- **FR-010**: The ocean and the polar caps are NOT restricted to the palette. They retain their existing colours, and the owner MAY optionally repoint them at a palette entry later. No other planet colour is exempt.
- **FR-011**: Polar caps MUST remain visually distinct from land and from the ocean, and MUST NOT be recoloured as part of this feature.
- **FR-012**: Existing planet behaviour MUST be preserved: far-side lands visible through the water, hovering a far-side land does not trigger it, the scroll tour keeps both poles in view, and reduced-motion preferences are honoured.

**Continents**

- **FR-013**: Skills MUST be grouped into named continents, and each continent MUST have exactly one main colour drawn from the palette.
- **FR-014**: Continent names, continent colours, and the skills in each continent MUST be defined in a single data file the owner can edit.
- **FR-015**: Adding, renaming, or removing a continent, and moving a skill between continents, MUST require editing only that data file.
- **FR-016**: The skills of one continent MUST render as a single connected landmass, and distinct continents MUST NOT touch or overlap.
- **FR-017**: Individual skills MUST remain separately identifiable — by hover, by keyboard focus, and in the legend — within their continent.
- **FR-018**: Where a skill's identity is presented to the visitor, its continent MUST also be shown.
- **FR-019**: The legend MUST be organised by continent, so a visitor can see the grouping without rotating the globe.
- **FR-020**: Skills MUST be grouped into the following four continents as the starting arrangement, each with one palette colour: **Front-end & Interface** (`FFCD28` amber — UI engineering, Design systems, Accessibility); **Back-end & Systems** (`0978BE` main blue — TypeScript, Node.js & APIs, Web performance); **Graphics & Motion** (`E1E06C` pale amber — three.js/WebGL, GLSL shaders, GSAP/motion); **Creative & Quality** (`FFECC7` beige — Creative coding). The arrangement and the colour assignment are a starting point only — the owner MUST be able to change either in the data file alone (FR-015).
- **FR-021**: Only the page and the lands are bound to the palette. The ocean and polar caps keep their current colours (FR-010).
- **FR-022**: Land area MUST be measured in globe tiles at the current globe resolution, which is unchanged by this feature. A 100% skill MUST occupy 50 tiles; a 60% skill MUST occupy approximately 25 tiles; a skill below 20% MUST occupy a single tile. Between those anchors, area MUST increase linearly with expertise and MUST never fall below one tile.

**Land scale**

- **FR-023**: Land size MUST follow the anchors set in FR-022 (50 tiles at 100%, 25 tiles at 60%, 1 tile below 20%), which places a 100% skill at roughly 2% of the globe's surface — comparable to China on a world map.
- **FR-024**: A 40% skill MUST occupy approximately 12 tiles. Because the globe resolution is unchanged, this is somewhat larger than a literal Germany; the visual goal is "clearly smaller than the 100% skill with generous ocean around it", not a literal landmass match.
- **FR-025**: Land size MUST increase with expertise, so a 100% skill is visibly larger than a 40% skill.
- **FR-026**: Total land coverage MUST decrease compared with the current planet, leaving predominantly ocean.
- **FR-027**: Distinct continents MUST be separated by a visible band of ocean and MUST NOT touch or overlap. Skills inside one continent MAY share a coastline, since they form that continent's single landmass.
- **FR-028**: Lands MUST remain within the habitable band of the globe and MUST NOT overlap the polar caps.
- **FR-029**: Every land MUST remain selectable by the visitor. Where a land is too small to hover or tap accurately — including the single-tile lands allowed by FR-022 — it MUST have an enlarged invisible target area covering the same skill, so the skill can always be identified.

**Quality**

- **FR-030**: The site MUST continue to render at a smooth frame rate during the planet section on a typical desktop and a typical mobile device.
- **FR-031**: The planet MUST remain usable by keyboard and touch, and MUST keep its existing hover, focus, and drag behaviour.
- **FR-032**: The new palette and grouping MUST NOT reduce legibility or usability relative to the current design, per the project's Beauty With Clarity principle.

### Key Entities

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner can restyle the entire site by editing only the palette file; a spot check of the page background, primary text, secondary text, a button, a focus ring, and the planet shows all six changed after a single-file edit.
- **SC-002**: No colour appears on the page or on the planet's lands that is not a palette entry or a shade/tint of one, verified by sampling the page and the globe. The ocean and polar caps are excluded, per FR-021.
- **SC-003**: A 100% skill's land occupies 50 globe tiles (within ±2 tiles), and no skill's land exceeds 50 tiles.
- **SC-004**: A 60% skill's land occupies 25 globe tiles (within ±2 tiles) and a 40% skill's land occupies 12 tiles (within ±2 tiles); a skill below 20% occupies exactly one tile.
- **SC-005**: Total land coverage is at most one third of the current coverage — measured from roughly 89% to about 14% of the globe's surface — so the globe reads as predominantly ocean from any angle.
- **SC-006**: Every pair of distinct continents is separable by a visible band of ocean, at every rotation of the globe.
- **SC-007**: Each continent's skills appear as one connected landmass in a single colour family, and two continents can be told apart by colour at a glance in a screenshot review.
- **SC-008**: A visitor can identify any single skill within its continent in under 5 seconds, by hover, keyboard focus, or the legend, at desktop and mobile sizes.
- **SC-009**: Adding a new continent, or moving a skill between continents, requires edits to exactly one data file and no other file.
- **SC-010**: Primary and secondary text, buttons, and focus indicators remain readable against the background across the full palette, with no pairing dropping below the commonly accepted contrast threshold for its use.
- **SC-011**: The planet section holds a smooth frame rate during the scroll tour on a typical desktop and a typical mobile device, meeting the project's existing performance target.
- **SC-012**: Every skill remains reachable and identifiable when the visitor prefers reduced motion, and on a mobile viewport.

## Assumptions

- The site keeps its existing single-page structure; only the palette, the land colouring, the skill grouping, and the land scale change.
- The owner edits a source file and reloads or rebuilds; no live theme editor, colour picker, or saved preference is in scope.
- Shades and tints are permitted on the planet, so individual skills can vary within a continent's colour family without being separate palette entries.
- Continents are a presentation and organisation layer over the existing skills; they do not add new skills, remove skills, or change any skill's expertise value.
- The site's structure, sections, copy, and layout are out of scope. Where the palette reduces contrast, the fix is to adjust which palette colour is used where, not to change the layout.
- The scroll tour, drag behaviour, hover behaviour, legend, and info card keep working as they do today; this feature changes what is drawn and how it is grouped, not how it is interacted with.
- The existing ">30 tiles per land" floor from the previous feature is superseded by the tile anchors in FR-022. The globe resolution is unchanged, and the planet gets a better total look from smaller lands, not from a coarser globe.
- Land size follows a single linear rule from expertise, with anchors chosen to match the requested sizes; the owner may later adjust the anchors without changing the data model.
- Polarity: the globe's existing orientation, the visible poles, and the scroll choreography are unchanged.
- The eight supplied colours are treated as fixed requirements, not as a starting point for further refinement.

## Out of Scope

- Adding, removing, or renaming skills.
- Changing expertise values.
- Changing sections, layout, or copy.
- Animating continents, adding continent-level motion, or animating colour transitions on rotation.
- A user-facing theme switcher, dark/light toggle, or persisted colour preference.
- The planet's geometry method, hex resolution, or coastline detail beyond what the new land scale requires.
- **Palette colour**: One named colour with a hex value and a stated role (background, primary text, secondary text, button, hover, accent). The site-wide single source of colour truth.
- **Continent**: A named grouping of skills, carrying one main palette colour as its identity.
- **Skill**: An individual capability with a name, an expertise level from 0% to 100%, and a description. Belongs to exactly one continent.
- **Land**: The rendered territory of a skill on the globe. Its colour is a shade or tint of its continent's colour; its area reflects its expertise.
- **Globe**: The rendered planet, comprising ocean, lands, and polar caps.
- A palette colour is edited to an invalid or unreadable value.
- Very small lands drift past the polar caps or below the hoverable region during the scroll tour.