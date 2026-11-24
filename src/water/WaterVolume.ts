import type { WalkableBounds } from '../character/motion.ts';
import type { Point3 } from '../world/WorldQuery.ts';
import type { WaterShaderModule } from './WaterShaderModule.ts';

export class WaterVolume {
  constructor(
    readonly footprint: WalkableBounds,
    readonly bottom: number,
    readonly level: number,
    readonly shader: WaterShaderModule,
  ) {}

  surfaceAt(x: number, z: number): number {
    return this.level + this.shader.surfaceOffset(x, z);
  }

  submerged(point: Point3, previous: boolean): boolean {
    return this.contains(point, previous ? .1 : -.1);
  }

  contains(point: Point3, surfaceMargin = 0): boolean {
    const b = this.footprint;
    return point.x >= b.minX && point.x <= b.maxX && point.z >= b.minZ && point.z <= b.maxZ &&
      point.y >= this.bottom && point.y < this.surfaceAt(point.x, point.z) + surfaceMargin;
  }

  get current(): number {
    const { enabled, paused, flowSpeed } = this.shader.settings;
    return enabled && !paused ? flowSpeed * .28 : 0;
  }
}
