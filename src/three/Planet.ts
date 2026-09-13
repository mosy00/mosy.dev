import { Group } from 'three';
import type { SkillArea } from '../data/skills';
import { PLANET } from './config';
import { buildSkillRegions, type SkillRegionBuild } from './skillRegions';

/**
 * The skills planet: the whole surface is carved into skill "countries" —
 * one flat-shaded mesh per skill area, merged from spherical-Voronoi faces.
 * Drag controls rotate this group; region meshes carry userData.skillId
 * ready for the raycast hover work in the next step.
 */
export class Planet {
  public readonly object3D = new Group();
  private readonly regions: SkillRegionBuild;
  private elapsedTime = 0;

  constructor(skills: readonly SkillArea[]) {
    this.regions = buildSkillRegions(skills);
    for (const mesh of this.regions.meshes) {
      this.object3D.add(mesh);
    }
    this.object3D.rotation.x = PLANET.initialTilt;
  }

  update(deltaTime: number): void {
    this.elapsedTime += deltaTime;
    this.object3D.position.y = Math.sin(this.elapsedTime * PLANET.floatSpeed) * PLANET.floatAmplitude;
  }

  dispose(): void {
    this.regions.dispose();
    this.object3D.clear();
  }
}

