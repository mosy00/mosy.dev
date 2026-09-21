<!-- SYNC IMPACT REPORT
     Version change: (unratified scaffold) -> 1.0.0
     Modified principles: none (initial ratification; every principle below is new)
     Added principles:
       - I. Originality Over Convention
       - II. Creative Concepts Are Respected
       - III. Beauty With Clarity
       - IV. Quality Over Quantity
       - V. Craftsmanship & Consistency
       - VI. Preserve Intentionality
       - VII. Mobile Experience Matters
       - VIII. Scrolling Is Part of the Experience
     Added sections: Technology Constraints; Quality Gates & Review Process; Governance
     Removed sections: none
     Deferred items / TODOs: none
     Note: temporary review material; remove this report before committing.
-->

# Mosy.dev Constitution

## Core Principles

### I. Originality Over Convention

The website MUST feel personal, extraordinary, and intentionally different from typical
portfolio websites. Generic portfolio patterns (template layouts, boilerplate hero and card
grids, standard agency structures) MUST NOT be adopted as-is; they MUST be reinterpreted
through the site's own artistic language or rejected. **Rationale**: this is a personal
creative work, and sameness is its primary failure mode.

### II. Creative Concepts Are Respected

Every section MUST be built around a distinct creative idea. A section MUST NOT be reduced
to a generic website pattern without a clear, explicit reason. **Rationale**: the creative
concepts are the substance of the site; silently flattening them into standard patterns
erases the value of the work.

### III. Beauty With Clarity

Visual experimentation MUST remain understandable, usable, accessible, and coherent.
An experiment that costs the visitor orientation, readability, or accessibility MUST be
revised until it works. **Rationale**: clarity is what makes the beauty legible; beauty
that confuses fails both sides of this principle.

### IV. Quality Over Quantity

The site MUST prefer a small number of exceptional experiences over many ordinary sections
or features. Additions that grow volume without raising quality MUST be cut, merged, or
rejected. **Rationale**: polish does not scale with surface area, and every ordinary
section dilutes the exceptional ones.

### V. Craftsmanship & Consistency

Every addition MUST meet a high standard of visual, interactive, and technical quality
while remaining consistent with the project's overall artistic direction. This covers
polish of motion and interaction, disciplined design (type, color, spacing, timing), and
clean, typed, maintainable code. **Rationale**: consistent craft across all layers is what
makes the whole feel authored rather than assembled.

### VI. Preserve Intentionality

Features, patterns, or content that dilute the website's personal identity or artistic
purpose MUST NOT be introduced. Every proposed change MUST be able to answer "what
intention does this serve?"; changes that cannot are declined. **Rationale**: identity is
rarely lost in one large decision; it erodes through the accumulation of neutral ones.

### VII. Mobile Experience Matters

The website MUST be mobile-friendly. Every feature that cannot work on mobile devices MUST
have a thoughtful mobile alternative, and every mobile adaptation MUST preserve the quality
and intent of the desktop experience instead of degrading into a stripped fallback.
**Rationale**: mobile is a first-class surface for real visitors, so adaptation is part of
the design work, not an afterthought.

### VIII. Scrolling Is Part of the Experience

Pages MUST respond creatively and meaningfully to user scrolling where the content supports
it. Scroll-based interactions MUST enhance the website's atmosphere and uniqueness without
compromising usability or accessibility. **Rationale**: scrolling is one of the few
universal inputs on the web, which makes it the most powerful instrument the site has for
storytelling and atmosphere.

## Quality Gates & Review Process

- `npm run typecheck` MUST pass before any change is merged.
- `npm run build` MUST succeed, including the production build.
- Every change MUST be reviewed against all eight principles before merge.
- Work that introduces a new section or creative concept (Principle II) MUST state the idea
  behind it and its intended mobile adaptation as part of the change.

## Governance

- This constitution supersedes all other practices for the project; when a request conflicts
  with a principle, the principle wins unless the constitution is formally amended.
- All PRs and reviews MUST verify compliance with the principles; added complexity or scope
  MUST be justified against Principles IV and VI.
- **Amendments**: propose the change in writing (what changes and why), update this
  document, increment the version per the policy below, and refresh the Last Amended date.
- **Versioning policy**: MAJOR for backward-incompatible governance changes (principle
  removals or redefinitions), MINOR for new principles or materially expanded guidance,
  PATCH for clarifications, wording, and non-semantic refinements.

**Version**: 1.0.0 | **Ratified**: 2026-09-22 | **Last Amended**: 2026-09-22
