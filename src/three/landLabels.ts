import {
  CanvasTexture,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  Vector3,
  type Group,
  type PerspectiveCamera,
} from 'three';
import { CONTINENTS } from '../data/continents';
import { paletteEntry } from '../data/palette';
import { CONTINENT_LABEL, LABEL, PLANET } from './config';
import type { Planet } from './Planet';

/**
 * US4 / research D3 / contracts C3 — floating land labels: one camera-facing
 * sprite per skill land, hovering at (R + floatHeight) above its surface and
 * parented to the DRAG GROUP, so every globe motion (drag, scroll tour,
 * inertia, idle) carries it (FR-008). Visibility is analytic (FR-009): a
 * label whose sight-line crosses the occluder sphere (0.998·R — the same rule
 * the picker uses) is hidden, so far-side labels never show through the
 * planet (SC-003); among the visible set only the front-most of any
 * screen-space overlap is kept (clarification 2). Text size is chosen once at
 * build time: compact below the mobile breakpoint (FR-013 / contracts C5).
 *
 * Owner follow-up (2026-10-13): each continent ALSO gets a larger label —
 * tinted with its own palette colour, anchored at the centroid of its member
 * lands and floating one level above the land labels, like the region heading
 * on a real Earth map. Continent headings keep overlap priority over land
 * names: a region is never unlabeled just because a land sits beneath it.
 *
 * If sprite labels fail to build (no 2D context), the class stays empty —
 * the globe keeps working and the legend/info-card identify every skill
 * (spec Edge Cases).
 */

/** Occluder radius as a fraction of the shell radius — matches PlanetInteraction. */
const OCCLUDER_RADIUS_SCALE = 0.998;

interface LabelEntry {
  readonly sprite: Sprite;
  texture: CanvasTexture;
  readonly name: string;
  /** Sprite world height — per kind (continent labels are larger). */
  readonly height: number;
  /** Canvas text colour (continent labels use their continent's tint). */
  readonly color: string;
  /** Continent headings keep overlap priority over land names. */
  readonly continent: boolean;
  /** Distance from camera to the label this frame (front-most sort). */
  depth: number;
}

function buildLabelTexture(
  name: string,
  fontPx: number,
  colorHex: string,
): { canvas: HTMLCanvasElement; texture: CanvasTexture } | null {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  const font = `600 ${fontPx}px "Space Grotesk", system-ui, -apple-system, "Segoe UI", sans-serif`;
  context.font = font;
  const textWidth = Math.ceil(context.measureText(name).width);
  canvas.width = textWidth + fontPx; // horizontal padding
  canvas.height = Math.ceil(fontPx * 1.5);
  // Resizing resets state — re-apply font before drawing.
  context.font = font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = colorHex;
  context.fillText(name, canvas.width / 2, canvas.height / 2);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { canvas, texture };
}

export class LandLabels {
  private readonly entries: LabelEntry[] = [];
  private readonly parent: Group;
  private readonly fontPx: number;
  private readonly landColor: string;
  private readonly planetCenter = new Vector3();
  private readonly labelWorld = new Vector3();
  private readonly camToLabel = new Vector3();
  private readonly camToCenter = new Vector3();
  private readonly occluderScale = new Vector3();
  private readonly projected = new Vector3();

  constructor(planet: Planet) {
    this.parent = planet.controlsTarget;
    const compact = typeof window !== 'undefined' && window.innerWidth < LABEL.compactBreakpoint;
    this.fontPx = compact ? LABEL.fontPxCompact : LABEL.fontPx;
    this.landColor = paletteEntry('mintCream').hex;
    const floatRadius = PLANET.radius * (1 + LABEL.floatHeight);

    for (const mesh of planet.meshes) {
      const name = mesh.userData['skillName'] as string | undefined;
      const direction = mesh.userData['radialDir'] as Vector3 | undefined;
      if (!name || !direction) {
        continue;
      }
      const built = buildLabelTexture(name, this.fontPx, this.landColor);
      if (!built) {
        continue; // no 2D context — legend/info-card path still identifies skills
      }
      const material = new SpriteMaterial({
        map: built.texture,
        transparent: true,
        // Visibility is handled analytically per frame — never by depth.
        depthTest: false,
        depthWrite: false,
      });
      const sprite = new Sprite(material);
      const aspect = built.canvas.width / Math.max(built.canvas.height, 1);
      sprite.scale.set(LABEL.worldHeight * aspect, LABEL.worldHeight, 1);
      sprite.position.copy(direction).normalize().multiplyScalar(floatRadius);
      this.parent.add(sprite);
      this.entries.push({
        sprite,
        texture: built.texture,
        name,
        height: LABEL.worldHeight,
        color: this.landColor,
        continent: false,
        depth: 0,
      });
    }

    // Continent labels (owner follow-up): one per continent, tinted with its
    // palette colour, anchored at the centroid of its member lands and
    // floating above the land-label level like a map's region heading.
    for (const continent of CONTINENTS) {
      const direction = new Vector3();
      let members = 0;
      for (const mesh of planet.meshes) {
        if (mesh.userData['continentId'] !== continent.id) {
          continue;
        }
        const dir = mesh.userData['radialDir'] as Vector3 | undefined;
        if (dir) {
          direction.add(dir);
          members += 1;
        }
      }
      if (members === 0) {
        continue; // continent with no rendered land — nothing to label
      }
      direction.normalize();
      const color = paletteEntry(continent.mainColor).hex;
      const built = buildLabelTexture(continent.name, this.fontPx, color);
      if (!built) {
        continue;
      }
      const material = new SpriteMaterial({
        map: built.texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const sprite = new Sprite(material);
      const aspect = built.canvas.width / Math.max(built.canvas.height, 1);
      sprite.scale.set(CONTINENT_LABEL.worldHeight * aspect, CONTINENT_LABEL.worldHeight, 1);
      sprite.position
        .copy(direction)
        .multiplyScalar(PLANET.radius * (1 + CONTINENT_LABEL.floatHeight));
      this.parent.add(sprite);
      this.entries.push({
        sprite,
        texture: built.texture,
        name: continent.name,
        height: CONTINENT_LABEL.worldHeight,
        color,
        continent: true,
        depth: 0,
      });
    }

    // Redraw once web fonts settle so the site typeface is used (canvas may
    // render fallback glyphs before Space Grotesk finishes loading).
    document.fonts?.ready.then(() => {
      for (const entry of this.entries) {
        const built = buildLabelTexture(entry.name, this.fontPx, entry.color);
        if (!built) {
          continue;
        }
        (entry.sprite.material as SpriteMaterial).map = built.texture;
        entry.texture.dispose();
        entry.texture = built.texture;
      }
    });
  }

  /** Called every frame from the Experience loop (contracts C3). */
  update(camera: PerspectiveCamera): void {
    if (this.entries.length === 0) {
      return;
    }
    this.parent.updateWorldMatrix(true, false);
    this.parent.getWorldPosition(this.planetCenter);
    this.parent.getWorldScale(this.occluderScale);
    const scale = (this.occluderScale.x + this.occluderScale.y + this.occluderScale.z) / 3;
    const occluderRadius = PLANET.radius * OCCLUDER_RADIUS_SCALE * scale;

    const visible: LabelEntry[] = [];
    for (const entry of this.entries) {
      this.labelWorld.copy(entry.sprite.position).applyMatrix4(this.parent.matrixWorld);
      const distance = this.camToLabel.subVectors(this.labelWorld, camera.position).length();
      entry.depth = distance;
      if (this.isOccluded(camera, distance, occluderRadius)) {
        entry.sprite.visible = false;
        continue;
      }
      entry.sprite.visible = true;
      visible.push(entry);
    }

    // Continent headings keep priority over land names when their padded
    // circles meet (a region name is never erased by one of its lands);
    // within each group the front-most (closest) label wins (clarification 2).
    // Comparisons happen in NDC y-units (x pre-scaled by aspect).
    visible.sort((a, b) =>
      a.continent === b.continent ? a.depth - b.depth : a.continent ? -1 : 1,
    );
    const kept: { x: number; y: number; r: number }[] = [];
    for (const entry of visible) {
      this.projected
        .copy(entry.sprite.position)
        .applyMatrix4(this.parent.matrixWorld)
        .project(camera);
      const x = this.projected.x * camera.aspect;
      const y = this.projected.y;
      const r = this.screenRadius(entry, camera);
      const clash = kept.some((k) => Math.hypot(k.x - x, k.y - y) < k.r + r);
      if (clash) {
        entry.sprite.visible = false;
      } else {
        kept.push({ x, y, r });
      }
    }
  }

  dispose(): void {
    for (const entry of this.entries) {
      this.parent.remove(entry.sprite);
      entry.texture.dispose();
      entry.sprite.material.dispose();
    }
    this.entries.length = 0;
  }

  /**
   * Analytic occluder test (research D3, same sphere rule as the picker):
   * hidden when the camera→label ray crosses the occluder sphere before
   * reaching the label — far-side labels never show through the planet.
   */
  private isOccluded(camera: PerspectiveCamera, distance: number, radius: number): boolean {
    const direction = this.camToLabel.normalize(); // camera → label (set by caller)
    this.camToCenter.subVectors(this.planetCenter, camera.position);
    const tClosest = this.camToCenter.dot(direction);
    const offsetSq = this.camToCenter.lengthSq() - tClosest * tClosest;
    if (offsetSq > radius * radius) {
      return false; // ray never comes within the occluder sphere
    }
    const tEntry = tClosest - Math.sqrt(Math.max(radius * radius - offsetSq, 0));
    return tEntry < distance; // sphere surface before the label → hidden
  }

  /** Padded NDC-y radius of the label at the camera (overlap comparisons). */
  private screenRadius(entry: LabelEntry, camera: PerspectiveCamera): number {
    const halfFov = (camera.fov * Math.PI) / 360; // degrees → half-radians
    const r = entry.height / 2 / Math.max(entry.depth * Math.tan(halfFov), 1e-6);
    return r * LABEL.overlapPad;
  }
}
