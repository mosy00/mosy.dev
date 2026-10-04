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
  // Border wobble (radians added to seed distances) — organic coastlines.
  borderNoise: 0.06,
  // Deterministic seed jitter so islands aren't perfectly symmetric.
  seedJitter: 0.22,
  // Angular radius of one seed's island, linear in the clamped expertise
  // (research D4): r(0.4) = 0.280, r(1.0) = 0.420 — measured ≥2× tile-count
  // contrast between 100% and 40% in the multi-skill context.
  islandRadius: { min: 0.187, max: 0.42 },
  // Expertise is clamped here before sizing so the 40% floor always holds
  // (out-of-range data such as a11y 0.1 builds at the floor, D10).
  expertiseRange: { min: 0.4, max: 1 },
  // Satellite seeds cluster this close (× island radius) to the primary
  // seed, so a skill's caps always merge into ONE connected landmass.
  satelliteOffset: 0.7,
  // Seeds stay within this latitude band (degrees from the equator) so the
  // scroll tour can face every island without tilting the poles.
  maxLatitude: 38,
  // Hard per-tile latitude cap: land never crosses this, so the moat to the
  // 66.5° polar caps is always ≥ 6.5° regardless of shape/size tuning (D3).
  maxLandLat: 60,
  // Per-skill silhouette profile (research D5): elliptical aspect, lobe
  // count, and lobe amplitude give every land a distinct outline.
  shape: {
    aspectMin: 0.8,
    aspectMax: 1.12,
    lobes: [3, 4, 5],
    ampMin: 0.1,
    ampMax: 0.17,
  },
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

