# Module Contracts: Palette, Continents & Land Scale

Internal contracts only — this feature adds no public API and no external interface.
All paths are relative to the repository root.

---

## 1. `src/data/palette.ts` — NEW

The single source of colour truth (FR-001).

```ts
export type PaletteRole =
  | 'background' | 'textPrimary' | 'textSecondary'
  | 'button' | 'buttonHover' | 'accent' | 'accentAlt' | 'surface';

export type PaletteEntryId =
  | 'navy' | 'amber' | 'mainBlue' | 'lightBlue' | 'mintCream'
  | 'deepBlue' | 'paleAmber' | 'beige';

export interface PaletteEntry {
  readonly id: PaletteEntryId;
  readonly hex: `#${string}`;
  readonly role: readonly PaletteRole[];
  readonly label: string;
}

/** The eight supplied colours. Order is the owner's stated order. */
export const PALETTE: readonly PaletteEntry[];

/** Lookup a palette entry by id. Throws if the id is unknown. */
export function paletteEntry(id: PaletteEntryId): PaletteEntry;

/** '--palette-<kebab-id>' → the entry's hex, e.g. '--palette-main-blue'. */
export function cssVarName(id: PaletteEntryId): string;

/**
 * Every `--palette-*` custom property plus the legacy aliases the existing
 * stylesheet already uses (--bg, --ink, --accent, --line, ...).
 * Applied to document.documentElement at boot so main.css holds no literal hex.
 */
export function applyPaletteVariables(target: HTMLElement): void;
```

**Rules**
- The eight hexes are fixed requirements (spec Assumptions) — editing the file is the
  supported operation, not changing the set.
- Ocean and polar-cap colours are **not** here (FR-021); they stay in `three/config.ts`.
- `applyPaletteVariables` MUST run before `Experience` constructs the renderer, so no
  colour is sampled from a pre-palette stylesheet.

## 2. `src/data/continents.ts` — NEW

```ts
export type ContinentId = string;

export interface Continent {
  readonly id: ContinentId;
  readonly name: string;
  readonly mainColor: PaletteEntryId;
  readonly skills: readonly string[];   // SkillArea ids
}

export const CONTINENTS: readonly Continent[];

/** Continent owning a skill, or null when the id is unknown. */
export function continentForSkill(skillId: string): Continent | null;

/**
 * Throws on: unknown continent id, unknown skill id, duplicate ids, or a skill
 * listed in more than one continent (INV-06).
 */
export function validateContinents(skills: readonly SkillArea[]): void;
```

**Rules**
- Ships the four continents from FR-020 with the owner's assigned colours; explicitly a
  starting point (FR-015).
- Membership is declared on the **continent**, so adding a skill means editing one line here.

## 3. `src/data/skills.ts` — EDIT

```ts
export interface SkillArea {
  readonly id: string;
  readonly name: string;
  readonly expertise: number;   // 0–1, unchanged
  readonly blurb: string;
  readonly continentId: ContinentId;  // NEW — replaces the removed `hue`
}

export const SKILL_AREAS: readonly SkillArea[];

/** FR-022 tile quota. Clamped to [0,1] first, floored at 1. */
export function skillTileQuota(expertise: number): number;

export function skillLevelLabel(skill: SkillArea): string;  // unchanged
```

**Removed** (breaking, and intentional):
- `hue` — superseded by `continentId` (FR-013).
- `skillColorHSL()` — replaced by §4; it derived colour from `hue`.
- `skillCssColor()` — replaced by the palette-aware equivalent in §5.

Both removals are compile errors at every call site (`skillRegions.ts`, `skillLegend.ts`,
`infoCard.ts`), which is the intended forcing function for this rewrite.

## 4. `src/three/skillRegions.ts` — REWRITE

Same public contract as today, different algorithm (research D2/D4).

```ts
export interface SkillIslandsBuild {
  readonly meshes: Mesh[];                    // one per skill, unchanged
  readonly skillDirections: readonly Vector3[];// one per skill, unchanged
  readonly grid: HexSphereGrid;
  readonly landTileIds: ReadonlySet<number>;  // union for ocean exclusion
  dispose(): void;
}

export function buildSkillIslands(skills: readonly SkillArea[]): SkillIslandsBuild;
```

**Implementation order** (each step measured in research.md):
1. Clamp expertise → `skillTileQuota` per skill; continent quota = Σ member quotas.
2. Place continent anchors via Fibonacci sphere spread; seed each continent with
   `grid.findNearestTileId(anchor)` — **the seed step is mandatory** (research D2.1).
3. BFS growth: claim nearest unclaimed neighbour of the continent, refusing any tile
   adjacent to another continent, until quota met (7 rounds measured).
4. Partition each continent's tiles among members: largest quota first, nearest-seed
   first, each drawing from the continent's remaining pool (10/10 exact, measured).
## 5. `src/ui/skillLegend.ts` — EDIT

```ts
export function renderSkillLegend(
  container: HTMLElement,
  onHover: (skillId: string | null) => void,
): SkillLegendController;   // SkillLegendController unchanged
```

**Rules**
- Rows are grouped under continent headers in `CONTINENTS` order (FR-019).
- Each header shows the continent name and a swatch in `continent.mainColor`.
- Each row's swatch uses the same `skillColor()` the 3D material uses, so the legend
  cannot drift from the globe (Principle V).
- Hover, focus and blur handlers are unchanged, so keyboard access (FR-012) is preserved.

## 6. `src/ui/infoCard.ts` — EDIT

```ts
export class InfoCard {
  showSkill(skill: SkillArea, continent: Continent | null): void;
  hide(): void;
  dispose(): void;
}
```

**Rules**
- `--skill-color` is set from `skillColor()`.
- The existing kicker line changes from the literal `'Skill area'` to the continent name,
  satisfying FR-018. When `continent` is null the kicker is omitted rather than blank.

## 7. `src/three/config.ts` — EDIT

Only removals plus a new spread constant. No colour moves here (FR-021 keeps ocean/cap here).

```ts
export const REGIONS = {
  borderNoise: 0.06,      // retained
  maxLandLat: 60,         // retained
};

export const LAND_COLOR = {
  spread: 0.14,           // research D6, measured optimum
  minLightness: 0.12,
  maxLightness: 0.92,
};
```

## 8. Unchanged — explicit preservation list

These modules MUST NOT be modified beyond compile fixes, because feature 002's behaviour is
carried forward by FR-012:

`hexGrid.ts`, `tileFan.ts`, `oceanTiles.ts`, `polarLands.ts`, `Planet.ts`,
`PlanetInteraction.ts`, `PlanetControls.ts`, `Experience.ts`, `motionPrefs.ts`,
`animations/*.ts`, `ui/nav.ts`, `ui/smoothScroll.ts`.

Specifically preserved: `Planet.meshes` (islands only), `Planet.controlsTarget`,
`buildOceanShell` / `buildPolarLands` signatures, the occluder hover rule, the ±45° pitch
clamp, the scroll tour, reduced-motion handling, and ACES tone mapping at exposure 1.1.

## 9. Requirement → module traceability

| Requirement | Satisfied in |
|---|---|
| FR-001…FR-007 (palette single source) | §1, §7, `main.ts` |
| FR-008 (no non-palette land colours) | §4 (skillColor derives only from palette) |
| FR-009 (per-tile jitter retained) | §4, `HEX.shadeJitter` |
| FR-010, FR-011, FR-021 (ocean/cap excluded) | `three/config.ts`, §8 |
| FR-012 (existing behaviour preserved) | §8 |
| FR-013…FR-016 (continents) | §2, §4 |
| FR-017, FR-018 (per-skill identity + continent shown) | §4, §5, §6 |
| FR-019 (legend grouped) | §5 |
| FR-020 (four starting continents) | §2 |
| FR-022…FR-025 (tile quota) | §3 (`skillTileQuota`), §4 |
| FR-026 (coverage reduced) | §4, measured 13.78% |
| FR-027…FR-029 (separation, latitude, hoverability) | §4, `main.ts` |
5. Build one `buildTileFan` mesh per **skill**, colouring tiles with `skillColor()`.

**Rules**
- `mesh.userData` gains `continentId` alongside the existing `skillId` (FR-018 consumers).
- `mesh.userData['skillId']` unchanged — the raycaster and hover pipeline depend on it.
- Materials keep `vertexColors: true`, `side: DoubleSide`, `flatShading: true`,
  `emissiveIntensity: HIGHLIGHT.base` — all preserved from feature 002.
- Removed from `three/config.ts` by this feature: `REGIONS.islandRadius`,
  `REGIONS.expertiseRange`, `REGIONS.shape`, `REGIONS.seedJitter`, `REGIONS.satelliteOffset`.
  `REGIONS.borderNoise` and `REGIONS.maxLandLat` are retained (still used for organic coasts
  and the latitude cap).
- `buildSkillIslands` MUST NOT throw for an empty continent; it simply renders no tiles.