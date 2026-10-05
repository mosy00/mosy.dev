# Specification Quality Checklist: Palette, Continents & Land Scale

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-05
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`

### Iteration 1

- **Content Quality — pass.** The spec names the eight hex values because they are the requirement itself, not an implementation choice. No framework, language, file format, or API is prescribed; FR-001 requires "a single palette source file" without specifying CSS, JSON, or TypeScript.
- **Focused on user value — pass.** Four user stories cover the owner (restyle in one file, edit the continent map) and the visitor (read continents, see a calmer globe).
- **Non-technical readability — pass.** Terms like "shade", "tint", "landmass", "connected" are used in their ordinary visual sense and each is explained in context.
- **Mandatory sections — pass.** User Scenarios, Requirements, Success Criteria, Assumptions, and Out of Scope are all present and populated.
- **[NEEDS CLARIFICATION] markers — FAIL (3 remain: FR-020, FR-021, FR-022).** All three are genuine scope decisions the owner must make; each changes the delivered result materially. They are surfaced as Q1–Q3.
- **Testable and unambiguous — pass.** Each FR is a single MUST statement. FR-023/FR-024 are backed by SC-003/SC-004, which give numeric area bands rather than the looser "roughly".
- **Measurable success criteria — pass.** SC-003 to SC-007 quantify land coverage; SC-001, SC-002, SC-009 verify the single-source palette and grouping.
- **Technology-agnostic criteria — pass.** SC-002 asks that no non-palette colour appears, not how colours are stored; SC-011 defers to the project's existing performance target rather than naming a renderer.
- **Acceptance scenarios — pass.** Each of the four stories has Given/When/Then scenarios.
- **Edge cases — pass.** Nine cases cover empty continents, dangling continent references, insufficient contrast, sub-hoverable lands, continent overlap, and palette edits.
- **Scope bounded — pass.** Assumptions and an explicit Out of Scope list exclude skills changes, layout changes, continent animation, and a runtime theme switcher.
- **Dependencies and assumptions — pass.** Ten assumptions record the structural, interaction, and prioritisation decisions.
- **FRs have acceptance criteria — pass.** All 32 requirements trace to a scenario, an edge case, or a success criterion.
- **User scenarios cover primary flows — pass.** P1 restyle, P2 grouping, P2 scale, P3 extensibility; each is independently testable.
- **Meets measurable outcomes — pass.** The palette, grouping, and scale goals each map to at least two success criteria.
- **No implementation leakage — pass.** Terms avoided: hex tile resolution, shader/lighting parameters, HSL maths, specific file names.

### Iteration 2 — clarifications resolved

All three markers were resolved with the owner (Q1 grouping, Q2 ocean/caps scope, Q3 land scale). FR-020, FR-021 and FR-022 now state decisions instead of questions.

- **Q1 → Option B.** FR-020 fixes four continents (Front-end & Interface, Back-end & Systems, Graphics & Motion, Creative & Quality) as the starting arrangement and explicitly marks it editable, honouring the owner's "with ability to add or edit". FR-015 and SC-009 remain the enforceability mechanism.
- **Q2 → Option C.** FR-010, FR-011, FR-021 and SC-002 were rewritten so the palette binds the page and lands only; ocean and caps keep their current colours. FR-010 permits the owner to repoint them later without blocking this feature.
- **Q3 → Option A with explicit tile anchors.** FR-022 replaces the Germany target with tile counts: 50 at 100%, ~25 at 60%, 1 below 20%, linear in between, never below one tile. FR-023/FR-024, SC-003/SC-004 and SC-005 were restated against those anchors. Measured: 50 tiles ≈ 1.95% of the globe (China is 1.88%, so the China analogy is honoured numerically); total land falls from ~89% to ~14% of the surface.
- **Contradiction found and fixed.** FR-016 (one connected landmass per continent) contradicted FR-027 (no two lands may touch). Because continents merge their skills, "touching" is now scoped to *between* continents: FR-027 and SC-006 were rewritten, and the matching edge case annotated. Story 4's scenario 3 was updated the same way.
- **Hoverability gap found and fixed.** FR-029 assumed every land would be large enough to hover, which the new 1-tile minimum makes false. FR-029 now requires an enlarged invisible target area for any land too small to point at, and the edge case names the sub-20% case specifically.
- **Superseded assumption recorded.** The previous feature's ">30 tiles per land" floor is explicitly superseded rather than silently ignored, so a later review does not read it as a violation.

Re-validated: all 16 checklist items pass. No new markers were introduced.

### Session 2026-10-05 — clarify

Two clarifications were asked and answered; both are recorded in the spec's `## Clarifications` section.

- **Q1 — continent colour assignment.** The owner assigned the four continent colours directly: `FFCD28` → Front-end & Interface, `0978BE` → Back-end & Systems, `E1E06C` → Graphics & Motion, `FFECC7` → Creative & Quality. FR-020 now names each colour inline, and states that the assignment as well as the grouping is a starting point the owner may change in the data file alone (FR-015).
- **Q2 — Back-end vs ocean separability.** A measured concern was raised: `0978BE` sits about 24 perceptual units from the composited ocean colour, below the threshold SC-007's "at a glance" wording implies. The owner reviewed it and directed that the colour stay exactly as assigned, with separability to be confirmed visually after implementation. No requirement was weakened — SC-007 is unchanged — and the decision is recorded so a later implementation review does not silently re-open it.

**Correction logged.** An earlier question in this session asserted a contradiction between FR-022's tile anchors and a "0.5% minimum land size" attributed to FR-025. That contradiction did not exist — FR-025 requires only that land size increase with expertise and states no percentage. The question was withdrawn, the speculative edit was reverted, and the file was re-read before any change was made. No trace of it remains in the spec.

Re-validated after both clarifications: 16/16 items still pass, 0 unchecked, 0 `[NEEDS CLARIFICATION]` markers, 0 unresolved brackets. No marker changed state.