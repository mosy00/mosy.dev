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
  // Icosahedron subdivisions: 4 → 5120 faces partitioned among the skills.
  detail: 4,
  // Border wobble (radians added to seed distances) — organic "coastlines".
  borderNoise: 0.09,
  // Deterministic seed jitter so countries aren't perfectly symmetric.
  seedJitter: 0.22,
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
