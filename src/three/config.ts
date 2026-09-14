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

export const REGIONS = {
  // Icosphere subdivisions: 5 → 20480 faces — smooth coastlines.
  detail: 5,
  // Border wobble (radians added to seed distances) — organic coastlines.
  borderNoise: 0.08,
  // Deterministic seed jitter so islands aren't perfectly symmetric.
  seedJitter: 0.22,
  // Angular radius of one seed's island, scaled by expertise.
  islandRadius: { min: 0.1, max: 0.24 },
  // How far islands are raised above the ocean sphere.
  raise: 1.02,
} as const;

export const OCEAN = {
  segments: 128,
  color: 0x0a1633,
  roughness: 0.3,
  metalness: 0.35,
} as const;

export const HIGHLIGHT = {
  // Resting glow of an island, hover glow, and the dimmed rest while hovering.
  base: 0.22,
  active: 1.35,
  dimmed: 0.05,
} as const;

export const PLANET_CONTROLS = {
  rotationPerPixel: 0.0055,
  maxPitch: Math.PI / 3,
  idleSpeed: 0.12,
  damping: 1.8,
  settleRate: 1.1,
  velocitySmoothing: 0.35,
  minPointerDt: 0.001,
} as const;
