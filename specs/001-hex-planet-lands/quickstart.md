# Quickstart Validation Guide: Hex Planet Lands

**Branch**: `001-hex-planet-lands` | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

This document provides step-by-step procedures to validate all functional requirements
and success criteria of the hexagonal planet landmass implementation.

---

## 1. Automated Build & Typecheck Gate

Prerequisite before running manual interactive validation:

```bash
# 1. Verify strict TypeScript compliance
npm run typecheck

# 2. Verify Vite production bundling
npm run build
```

**Expected Outcome**: Both commands complete with zero errors and exit code 0.

---

## 2. Interactive Validation Scenarios

Run the local dev server:
```bash
npm run dev
```
Open browser at `http://localhost:5173/` and navigate to the Skills section.

### V1 — Strategy-Game Hexagonal Tiling (FR-001, FR-002, SC-001)
1. **Action**: Scroll to the skills globe. Inspect any skill landmass (e.g. TypeScript, React, Three.js) at default camera zoom.
2. **Verification**:
   - The surface is visibly composed of flat, six-sided hexagonal tiles.
   - Tiles fit tightly together in a honeycomb pattern without gaps or outlines.
   - Adjacent tiles within the same landmass have subtle shade variations (lightness jitter) allowing tile boundaries to be clearly counted/discerned.

### V2 — Tile Density Floor (>30 Tiles Per Land) (FR-003, SC-002)
1. **Action**: Identify the smallest skill landmass (e.g., skill with lowest expertise) and count the visible hexagonal tiles.
2. **Verification**:
   - The tile count for this single continuous landmass strictly exceeds 30 tiles ($N \ge 31$).
   - Identify the largest skill landmass: it possesses proportionally more tiles.
   - Coastlines show organic step-variation along hex edges rather than coarse triangle blocks.

### V3 — Single Connected Landmass Per Skill (FR-003, Edge Cases)
1. **Action**: Rotate the globe full $360^\circ$ and inspect each of the 10 skills.
2. **Verification**:
   - Each skill forms exactly ONE contiguous territory.
   - There are zero disconnected satellite islands or orphan tiles of that color floating elsewhere in the ocean.

### V4 — Non-Interactive White Polar Caps (FR-005, FR-006, FR-007, SC-003, SC-004)
1. **Action**: Drag the globe vertically to inspect the north pole, then the south pole.
2. **Verification**:
   - Both poles feature a distinct white, ice-like landmass composed of the same hexagonal tile system with subtle shade variation.
   - An open-ocean water channel clearly separates polar ice from any colored skill landmass (FR-008).
3. **Action**: Hover the cursor directly over the white polar hex tiles.
4. **Verification**:
   - No skill info card appears.
   - No glow or highlight triggers.
   - The cursor and legend remain in the neutral open-ocean state.

### V5 — Skill Hover & Legend Sync Parity (FR-009, SC-005)
1. **Action**: Hover cursor over a colored skill hex landmass.
2. **Verification**:
   - Entire connected landmass illuminates with the active emissive glow.
   - Corresponding skill card pops in with name, expertise bar, and description.
   - Corresponding legend row syncs active state.
   - Moving cursor off landmass returns to dimmed resting glow.

### V6 — Performance & Framerate Floor (FR-010, SC-006)
1. **Action**: Open Chrome DevTools -> Rendering -> "Frame Rendering Stats" (FPS meter).
2. **Verification**:
   - Continuously drag and spin the globe: FPS stays above 30 fps (target 60 fps).
   - Scroll through the tour triggers: smooth transitions without stutter or frame drops below 30 fps.
