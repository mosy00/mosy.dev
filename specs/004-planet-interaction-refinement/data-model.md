# Data Model: Planet Interaction Refinement

**Feature**: `004-planet-interaction-refinement` | **Date**: 2026-10-13

No persistent entities; all state is per-session scene state. Entities below are runtime interaction state derived from the spec's Key Entities.

## 1. GlobeOrientation

Current tilt plus spin of the planet across its two nested groups.

- `entryTilt: number` — `PLANET.initialTilt` (0.42 rad); the re-center target.
- `dragPitch: number` — `dragGroup.rotation.x`, clamped to ±`PLANET_CONTROLS.maxPitch`; the tilt component re-centering acts on.
- `dragYaw: number` — `dragGroup.rotation.y`; free spin, NEVER written by re-centering (clarification 1).
- `tourYaw: number` — `tourGroup.rotation.y`; scroll-driven sweep, composes with `dragYaw`.
- **Invariant**: at end of scroll range, `dragPitch ≈ entryTilt` regardless of prior drag (one-way; scroll-back keeps entry tilt).
- **Invariant**: `dragGroup.rotation.order = 'YXZ'` so pitch stays latitude-like at any yaw (D1).

## 2. DragGesture

Pointer press-and-move with direct feel plus post-release glide.

- `active: boolean` — pointer down; while true, scroll re-centering never writes pitch (FR-003).
- `pitchDelta / yawDelta: number` — per-move deltas computed in the yaw-compensated frame so up-reveals-lower holds at every scroll position (FR-004/FR-005).
- `glideVelocity: { pitch, yaw }` — seeded from signed deltas; integrates in the dragged direction, never reversing (FR-006).
- **Invariant**: identical pointer-up gesture reveals lower latitudes at entry, mid, and end scroll.

## 3. LandLabel (one per skill land)

Floating text marker naming one skill land.

- `skillId: string` — key into `SKILL_AREAS` / legend data; text = skill name.
- `anchorDir: Vector3` — `skillDirections[i]` (land centroid); position = `anchorDir × (R + floatHeight)`, parented to the drag group (moves with all motions, FR-008).
- `visible: boolean` — true only while front-facing per the occluder-sphere rule; far-side hides (FR-009).
- `frontMostOnly: boolean` — when labels overlap on screen, only the front-most shows (clarification 2).
- **Validation**: every skill with a land mesh has exactly one label; label text matches legend/info-card name.

## 4. HoverEmphasis (at most one active)

Combined close-tint recolor plus slight lift on one land.

- `skillId: string | null` — null clears all (single null-set path, FR-012).
- `tintColor: Color` — same-hue sibling of the land base color (lightness +~0.08–0.12, saturation held), NOT white-hot (FR-010).
- `lift: number` — small radial offset, fraction of R; 0 when cleared (FR-011).
- `clearOn: pointerleave land | pointerleave canvas | tap timeout (~600ms)` — never sticks (FR-012, SC-005).
- **Validation**: at most one land emphasized; clear restores base color and flush height within a fraction of a second.
