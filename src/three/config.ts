export const RENDERER = {
  maxPixelRatio: 2,
  clearColor: 0x000000,
  clearAlpha: 0,
} as const;

export const CAMERA = {
  fov: 42,
  near: 0.1,
  far: 60,
  position: { x: 0, y: 0.12, z: 4.6 },
  mobileZ: 5.4,
  offsetX: 0.85,
} as const;

export const PLANET = {
  radius: 1.15,
  segments: 96,
  baseColor: 0x1d2a4d,
  gridColor: 0x5ad1ff,
  graticule: { latBands: 9, meridians: 12, opacity: 0.16 },
  initialTilt: 0.42,
  floatAmplitude: 0.05,
  floatSpeed: 0.55,
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
