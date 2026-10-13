# Phase 1 Data Model: Palette, Continents & Land Scale

## Entities

### PaletteEntry — one supplied colour with a role

| Field | Type | Rule |
|---|---|---|
| `id` | `PaletteEntryId` | unique, kebab-case; the CSS custom-property name derives from it |
| `hex` | `` `#${string}` `` | 6-digit uppercase hex; one of the eight supplied values |
| `role` | `PaletteRole` | how the UI consumes it |
| `label` | `string` | human name for the owner reading the file |

**Roles** (one colour may hold several): `background`, `textPrimary`, `textSecondary`,
`button`, `buttonHover`, `accent`, `accentAlt`, `surface`.

The eight supplied colours map to roles as follows (owner's original descriptions):

| Colour | Hex | Roles |
|---|---|---|
| Dark navy | `0C1E37` | `background` |
| Bright amber | `FFCD28` | `button` |
| Main blue | `0978BE` | `accent`, `continent:be` |
| Light blue | `80C5DC` | `textSecondary` |
| Mint cream | `F1FFFA` | `textPrimary` |
| Shade of main blue | `193D6A` | `surface`, `buttonHover` |
| Pale amber | `E1E06C` | `accentAlt`, `continent:gm` |
| Beige | `FFECC7` | `continent:cq` |

Plus `FFCD28` → `continent:fe`.

> **Note on role collisions.** `0978BE` is both the UI `accent` *and* the Back-end continent
> colour (owner's Q1 assignment). This is intentional and permitted: FR-002 requires every
> colour to trace to a palette entry, not that a colour serve only one purpose.

### Continent — a named, colour-coded grouping of skills

| Field | Type | Rule |
|---|---|---|
| `id` | `ContinentId` | unique, kebab-case |
| `name` | `string` | visitor-facing label (FR-018, FR-019) |
| `mainColor` | `PaletteEntryId` | MUST resolve to a palette entry (FR-013) |
| `skills` | `readonly SkillId[]` | the member skills; every skill appears in **exactly one** continent |

### SkillArea — an individual capability

| Field | Type | Rule |
|---|---|---|
| `id` | `SkillId` | unique |
| `name` | `string` | unchanged |
| `expertise` | `number` | 0–1, unchanged by this feature |
| `blurb` | `string` | unchanged |
| `continentId` | `ContinentId` | **replaces the removed `hue`**; must resolve to a declared continent |

**Removed field**: `hue`. With continents supplying the colour, a per-skill hue is redundant
and would contradict FR-013's single-colour-per-continent rule.

### Derived values (computed, never authored)

| Name | Formula | Source |
|---|---|---|
| `skillTileQuota(e)` | `max(1, floor(62.5 × e − 12.5))` | FR-022 (research D1) |
| `continentQuota(c)` | `sum(skillTileQuota(e) for each member)` | FR-016 |
| `skillColor(skill)` | continent `mainColor` HSL, lightness stepped by expertise rank, `spread 0.14` clamped to available room | FR-018 (research D6) |

## Relationships

```text
PaletteEntry (8, fixed by FR-001)
      │  mainColor ──► Continent.mainColor  (1:1 per continent)
      │
      └── referenced by CSS custom properties + 3D materials

Continent (4) ──1:n──► SkillArea
      │                    │
      │ continentId        │ continentId
      ▼                    ▼
   (validated)      skillTileQuota(expertise)
                            │
                            ▼
                 continentQuota = Σ member quotas
                            │
                            ▼
                  hex tile allocation (D2)
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        SkillLandmass  SkillLandmass  SkillLandmass
        (per continent)  (one per skill)
              │
              ├── mesh.userData.skillId      → raycaster, info card, legend sync
              ├── mesh.userData.continentId  → NEW, for continent-level styling
              └── tileFan colors             → skillColor() per tile
```

## Invariants

| Id | Invariant | Verified by |
|---|---|---|
| INV-01 | `skillTileQuota` is monotonically non-decreasing in expertise | FR-025 |
| INV-02 | Every continent's allocated tile count **equals** its quota exactly | FR-016, SC-003/004 |
| INV-03 | Each continent is exactly **one** connected component | FR-016 |
| INV-04 | No tile is grid-adjacent to a tile owned by a different continent | FR-027, SC-006 |
| INV-05 | Land tile latitude is < 60°, leaving ≥ 6.5° to the polar caps | FR-028 |
| INV-06 | Every `SkillArea.continentId` resolves to a declared continent | FR-015 |
| INV-07 | Every `Continent.mainColor` resolves to a palette entry | FR-013 |
| INV-08 | Two skills in the same continent differ in colour by ΔE ≥ 10 (CIELAB) | FR-017 |
| INV-09 | Land coverage ≤ ⅓ of pre-feature coverage | FR-026, SC-005 |

Measured values for the shipped data: INV-02 exact (4/4 continents, 10/10 skills), INV-03
`components = 1` for all four, INV-04 adjacency `0`, INV-05 max |lat| `59.32°`,
INV-08 worst pair `12.4`, INV-09 coverage `13.78%`.

## State transitions

None. The palette and continent map are static build-time data; there is no runtime state,
no persistence and no migration. The only lifecycle is module load → boot.

## Validation rules (edge cases from the spec)

| Condition | Required behaviour |
|---|---|
| Continent with zero skills | Rendered nowhere; excluded from the legend's continent headers; not an error |
| `SkillArea.continentId` naming an undeclared continent | Throws at boot with a message naming the unknown id — fail fast rather than render an uncoloured land |
| Continent colour naming an unknown palette entry | Throws at boot, same pattern |
| Two skills sharing an id | Throws at boot (duplicate ids would break hover identity) |
| Expertise outside 0–1 | Clamped to `[0, 1]` before the quota formula, so `0.1` builds at the 1-tile floor |