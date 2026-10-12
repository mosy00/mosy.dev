export const RENDERER = {
  maxPixelRatio: 2,
  clearColor: 0x000000,
  clearAlpha: 0,
} as const;

export const CAMERA = {
  fov: 42,
  near: 0.1,
  far: 60,
  // Entry size and the size the planet grows TO by the end of the section —
  // both 10 % under the previous retune (entry 1.035 → 0.9315, end 1.15 →
  // 1.035). Growth is simply the ratio between the two: 1.035 / 0.9315 ≈
  // 1.111. Because the canvas is deliberately taller than the viewport
  // (`--planet-bleed`, so the globe can bleed into the neighbouring sections),
  // these fractions are viewport-relative and `Experience` converts them to
  // canvas-relative before fitting.
  fit: {
    heightFraction: 0.9315,
    widthFraction: 0.9315,
  },
} as const;

export const PLANET = {
  radius: 1.15,
  initialTilt: 0.42,
  floatAmplitude: 0.05,
  floatSpeed: 0.55,
} as const;

export const HEX = {
  // Icosphere subdivisions for the dual hex grid:
  // Subdivisions:
  //   4 -> base icosphere 2562 vertices -> dual grid has 2562 tiles
  //        Yields ~43 tiles (40% expertise) up to ~122 tiles (100%) per skill
  //        landmass — well above the >30 floor (research D3/D4) — with organic
  //        coastlines, and loads in <15ms.
  detail: 4,
  // Per-tile deterministic lightness jitter for distinguishable tile boundaries
  shadeJitter: 0.06,
} as const;

export const POLAR = {
  // Arctic-circle extent: 66.5 -> ~103 connected tiles per hemisphere
  // (was 55 -> 233; moat vs the 60 deg land cap is guaranteed >= 6.5 deg).
  thresholdLat: 66.5,
  // White ice-like color
  color: 0xf2f6f8,
  roughness: 0.35,
  metalness: 0.1,
} as const;

export const REGIONS = {
  // Border wobble (radians added to continent growth distances) — organic coasts.
  borderNoise: 0.06,
  // Hard per-tile latitude cap: land never crosses this, so the moat to the
  // 66.5° polar caps is always >= 6.5° regardless of size tuning (D3).
  maxLandLat: 60,
} as const;

export const LAND_COLOR = {
  // Lightness spread across a continent's skills (research D6). MEASURED
  // OPTIMUM, not a taste call:
  //   0.10 -> Front-end's closest pair collapses to dE 7.1 (indistinguishable)
  //   0.18 / 0.22 -> better within-continent, but Back-end's light step slides
  //                  toward the ocean (dE 21.0 / 16.1)
  //   0.14 -> clears both. Do not change without re-measuring.
  spread: 0.14,
  minLightness: 0.12,
  maxLightness: 0.92,
} as const;

export const OCEAN = {
  // Earth-like light blue, pre-lightened (D2): at 80% opacity over the #05060a
  // page it blends to ≈#5e9bbf (L≈0.56). Lands separate from it by hue (the sea
  // sits at ≈202°, lands span the wheel), saturation and their own emissive.
  color: 0x74c0ec,
  // ~20% transparency: enough for far-hemisphere lands to read through the
  // water (the glass-marble read) without the sea turning milky (FR-005).
  opacity: 0.8,
  roughness: 0.28,
  metalness: 0.25,
} as const;

export const HIGHLIGHT = {
  // Resting glow of an island, hover glow, and the dimmed rest while hovering.
  base: 0.22,
  active: 1.35,
  dimmed: 0.05,
} as const;

export const PLANET_CONTROLS = {
  rotationPerPixel: 0.0055,
  // Earth simulation: free spin left/right, but the poles stay up/down —
  // vertical drag is clamped to ±45°.
  maxPitch: Math.PI / 4,
  idleSpeed: 0.12,
  damping: 1.8,
  // Vertical inertia decays more gently than the yaw damping (2026-10-04): a
  // vertical flick glides to a smooth stop instead of stalling within ~0.5 s.
  // 0.85 halves the pitch velocity roughly every 0.8 s.
  pitchGlideDecay: 0.85,
  settleRate: 1.1,
  velocitySmoothing: 0.35,
  minPointerDt: 0.001,
} as const;

export const TOUR = {
  // Calm scroll tour (research D7): one yaw sweep plus growth across the
  // planet section, at constant pitch so the poles never move. Growth is the
  // ratio between the two sizes above: 1.035 / 0.9315 ≈ 1.111.
  sweepYaw: Math.PI,
  growthScale: 1.111,
  scrub: 0.8,
} as const;

