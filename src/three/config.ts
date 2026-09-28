export const RENDERER = {
  maxPixelRatio: 2,
  clearColor: 0x000000,
  clearAlpha: 0,
} as const;

export const CAMERA = {
  fov: 42,
  near: 0.1,
  far: 60,
  // The planet must fill ≥ 80% of the window: the camera distance is fitted
  // to these fractions (height-first, width fallback on portrait screens).
  fit: {
    heightFraction: 0.86,
    widthFraction: 0.9,
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
  //        Yields ~40-80 tiles per skill landmass (well above the >30 floor),
  //        organic coastlines, and loads in <15ms.
  detail: 4,
  // Per-tile deterministic lightness jitter for distinguishable tile boundaries
  shadeJitter: 0.06,
} as const;

export const POLAR = {
  // Minimum latitude (degrees) for polar ice cap tiles
  thresholdLat: 55,
  // White ice-like color
  color: 0xf2f6f8,
  roughness: 0.35,
  metalness: 0.1,
} as const;

export const REGIONS = {
  // Icosphere subdivisions: 5 → 20480 faces — smooth coastlines.
  detail: 5,
  // Border wobble (radians added to seed distances) — organic coastlines.
  borderNoise: 0.06,
  // Deterministic seed jitter so islands aren't perfectly symmetric.
  seedJitter: 0.22,
  // Angular radius of one seed's island, scaled by expertise.
  islandRadius: { min: 0.2, max: 0.3 },
  // How far islands are raised above the ocean sphere.
  raise: 1.02,
  // Satellite seeds cluster this close (× island radius) to the primary
  // seed, so a skill's caps always merge into ONE connected landmass.
  satelliteOffset: 0.7,
  // Seeds stay within this latitude band (degrees from the equator) so the
  // scroll tour can face every island without tilting the poles.
  maxLatitude: 42,
} as const;

export const OCEAN = {
  segments: 128,
  // Earth-like light blue so the islands read as land against sea.
  color: 0x3d8fd1,
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
  settleRate: 1.1,
  velocitySmoothing: 0.35,
  minPointerDt: 0.001,
} as const;

export const TOUR = {
  // Scroll-tour limits and pacing (radians / seconds of timeline).
  maxPitch: 0.35,
  rotateDuration: 1.2,
  holdDuration: 0.55,
  scrub: 0.8,
} as const;

