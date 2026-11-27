import { GroundWorldQuery, type GroundData } from './GroundWorldQuery.ts';
import { contactTolerance } from './RangePolicy.ts';
import { finitePoint, type Capsule, type Point3, type WorldQuery } from './WorldQuery.ts';

export const pool = Object.freeze({
  minX: -6, maxX: 6, minZ: -6, maxZ: 6, bottom: -4, water: 0, deck: .45,
  exitHalfWidth: 1, exitZ: 7.2, exitReach: 1.5,
});

const bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10, minY: pool.bottom, maxY: 8 };
const volumes = [
  { id: 'pool-floor', minX: -10, maxX: 10, minZ: -10, maxZ: 10, minY: -4.5, maxY: pool.bottom },
  { id: 'west-deck', minX: -10, maxX: pool.minX, minZ: -10, maxZ: 10 },
  { id: 'east-deck', minX: pool.maxX, maxX: 10, minZ: -10, maxZ: 10 },
  { id: 'north-deck', minX: pool.minX, maxX: pool.maxX, minZ: -10, maxZ: pool.minZ },
  { id: 'exit-deck', minX: pool.minX, maxX: pool.maxX, minZ: pool.maxZ, maxZ: 10 },
];
const solids = volumes.map(volume => ({ minY: pool.bottom, maxY: pool.deck, ...volume }));
const data: GroundData = {
  bounds,
  solids,
  surfaces: solids.map(solid => ({ ...solid, height: solid.maxY })),
};

export class PoolWorldQuery implements WorldQuery {
  readonly capabilities = Object.freeze({
    geometry: 'ground-volume', motion: ['ground', 'swim'], horizontalRaycast: true,
  } as const);
  private readonly geometry = new GroundWorldQuery(data);
  private elapsed = 0;

  get time(): number { return this.elapsed; }
  advance(delta: number): void {
    if (Number.isFinite(delta) && delta > 0) this.elapsed += Math.min(delta, .05);
  }

  waterAt(position: Point3) {
    if (!finitePoint(position) || position.x <= pool.minX || position.x >= pool.maxX ||
      position.z <= pool.minZ || position.z >= pool.maxZ) return null;
    return {
      height: pool.water,
      time: this.elapsed,
      depth: Math.min(pool.water - pool.bottom, Math.max(0, pool.water - position.y)),
      submerged: position.y >= pool.bottom - contactTolerance && position.y < pool.water,
    };
  }

  clear(position: Point3, capsule: Capsule): boolean {
    const sample = this.overlap(position, capsule);
    return sample.ok && !sample.value;
  }

  exit(position: Point3, capsule: Capsule): Point3 | null {
    if (!this.waterAt(position)?.submerged || position.z < pool.maxZ - pool.exitReach ||
      Math.abs(position.x) + capsule.radius > pool.exitHalfWidth || pool.water - position.y > capsule.height) return null;
    const raised = { ...position, y: pool.deck };
    const target = { ...raised, z: pool.exitZ };
    for (const [from, to] of [[position, raised], [raised, target]] as const) {
      const sweep = this.sweep(from, { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z }, capsule);
      if (!sweep.ok || (sweep.value && sweep.value.fraction < 1 - contactTolerance) ||
        !this.clear(to, capsule)) return null;
    }
    return target;
  }

  sweep: WorldQuery['sweep'] = (...args) => this.geometry.sweep(...args);
  overlap: WorldQuery['overlap'] = (...args) => this.geometry.overlap(...args);
  raycast: WorldQuery['raycast'] = (...args) => this.geometry.raycast(...args);
  surfaceSample: WorldQuery['surfaceSample'] = (...args) => this.geometry.surfaceSample(...args);
  regionSample: WorldQuery['regionSample'] = (...args) => this.geometry.regionSample(...args);
}

export const poolGeometry = Object.freeze({ bounds, solids });
