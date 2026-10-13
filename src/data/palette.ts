/**
 * THE PALETTE — single source of colour truth for the whole site.
 *
 * Edit a hex below and reload: the page background, text, buttons, links, focus
 * ring, scrollbar and the planet's lands all follow. Nothing else is a colour
 * source. The 3D land materials import the same values (see `skillColor` in
 * `continents.ts`), so the legend swatch, the info card and the globe cannot
 * drift apart.
 *
 * Ocean and polar-cap colours deliberately live in `three/config.ts` instead:
 * they are scenery, not identity (spec FR-021).
 */

export type PaletteRole =
  | 'background'
  | 'textPrimary'
  | 'textSecondary'
  | 'button'
  | 'buttonHover'
  | 'accent'
  | 'accentAlt'
  | 'accentTertiary'
  | 'surface';

export type PaletteEntryId =
  | 'navy'
  | 'amber'
  | 'mainBlue'
  | 'lightBlue'
  | 'mintCream'
  | 'deepBlue'
  | 'paleAmber'
  | 'beige';

export interface PaletteEntry {
  readonly id: PaletteEntryId;
  readonly hex: `#${string}`;
  readonly role: readonly PaletteRole[];
  readonly label: string;
}

/** The eight supplied colours, in the owner's stated order. */
export const PALETTE: readonly PaletteEntry[] = [
  { id: 'navy', hex: '#0C1E37', role: ['background'], label: 'Dark navy — background' },
  { id: 'amber', hex: '#FFCD28', role: ['button', 'accentAlt'], label: 'Bright amber — buttons' },
  { id: 'mainBlue', hex: '#0978BE', role: ['accent'], label: 'Main blue — graphic accent' },
  { id: 'lightBlue', hex: '#80C5DC', role: ['textSecondary'], label: 'Light blue — secondary text' },
  { id: 'mintCream', hex: '#F1FFFA', role: ['textPrimary'], label: 'Mint cream — primary text' },
  { id: 'deepBlue', hex: '#193D6A', role: ['surface', 'buttonHover'], label: 'Deep blue — hover / surface' },
  { id: 'paleAmber', hex: '#E1E06C', role: ['accentAlt'], label: 'Pale amber — lighter yellow' },
  { id: 'beige', hex: '#FFECC7', role: ['accentTertiary'], label: 'Beige — tertiary accent' },
];

/** Lookup a palette entry by id. Throws on an unknown id (fail fast at boot). */
export function paletteEntry(id: PaletteEntryId): PaletteEntry {
  const found = PALETTE.find((entry) => entry.id === id);
  if (!found) {
    throw new Error(`[mosy.dev] Unknown palette id "${id}". Check src/data/palette.ts.`);
  }
  return found;
}

/** The first palette entry holding a role. */
function byRole(role: PaletteRole): PaletteEntry {
  const found = PALETTE.find((entry) => entry.role.includes(role));
  if (!found) {
    throw new Error(`[mosy.dev] No palette entry provides the "${role}" role.`);
  }
  return found;
}

/** '--palette-<kebab-id>' → the entry's hex, e.g. '--palette-main-blue'. */
export function cssVarName(id: PaletteEntryId): string {
  return `--palette-${id.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
}

/** `#RRGGBB` + alpha → `rgba(r, g, b, a)`, so no literal rgba() lives in the CSS. */
export function withAlpha(hex: `#${string}`, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** `#RRGGBB` → [hue 0-360, saturation 0-1, lightness 0-1]. */
export function hexToHsl(hex: `#${string}`): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) {
    return [0, 0, l];
  }
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, l];
}

/** [hue 0-360, saturation 0-1, lightness 0-1] → '#RRGGBB'. */
export function hslToHex(hue: number, saturation: number, lightness: number): `#${string}` {
  const h = (((hue % 360) + 360) % 360) / 360;
  const s = Math.max(0, Math.min(1, saturation));
  const l = Math.max(0, Math.min(1, lightness));
  if (s === 0) {
    const part = Math.round(l * 255).toString(16).padStart(2, '0');
    return `#${part}${part}${part}` as `#${string}`;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t0: number): number => {
    let t = t0;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const to255 = (v: number): string =>
    Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
  return `#${to255(channel(h + 1 / 3))}${to255(channel(h))}${to255(channel(h - 1 / 3))}` as `#${string}`;
}

/**
 * Writes every colour the stylesheet needs as a custom property on `target`.
 *
 * Solid roles map to palette entries; the alpha variants are derived from the
 * same entries so the stylesheet contains no literal colours at all (FR-003).
 *
 * Deliberate contrast split (SC-010): `mainBlue` measures 3.53:1 on navy, which
 * is fine for graphics (focus ring, strokes, glows) but below the 4.5:1 text
 * threshold — so text accents use amber (7.3:1) instead.
 */
export function applyPaletteVariables(target: HTMLElement): void {
  const bg = byRole('background');
  const ink = byRole('textPrimary');
  const muted = byRole('textSecondary');
  const accent = byRole('accent');
  const accentAlt = byRole('accentAlt');
  const button = byRole('button');
  const surface = byRole('surface');
  const tertiary = byRole('accentTertiary');
  const amber = paletteEntry('amber');

  const vars: Record<string, string> = {
    // raw palette entries, addressable by id
    ...Object.fromEntries(PALETTE.map((entry) => [cssVarName(entry.id), entry.hex])),

    // role aliases consumed by main.css
    '--bg': bg.hex,
    '--ink': ink.hex,
    '--muted': muted.hex,
    '--accent': accent.hex,
    '--accent-2': accentAlt.hex,
    '--accent-3': tertiary.hex,
    '--accent-text': amber.hex,
    '--button': button.hex,
    '--surface': surface.hex,

    // derived alpha variants (no literal rgba() in the stylesheet)
    '--line': withAlpha(ink.hex, 0.12),
    '--line-strong': withAlpha(ink.hex, 0.2),
    '--ink-soft': withAlpha(ink.hex, 0.5),
    '--ink-softer': withAlpha(ink.hex, 0.6),
    '--meter-bg': withAlpha(ink.hex, 0.1),
    '--panel': withAlpha(bg.hex, 0.6),
    '--row-wash': withAlpha(accent.hex, 0.07),
    '--glow-core': withAlpha(accent.hex, 0.18),
    '--glow-edge': withAlpha(muted.hex, 0.05),
    '--pulse': withAlpha(accent.hex, 0.55),
    '--pulse-out': withAlpha(accent.hex, 0),
  };

  for (const [name, value] of Object.entries(vars)) {
    target.style.setProperty(name, value);
  }
}
