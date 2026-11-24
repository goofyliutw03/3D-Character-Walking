import { finitePoint, type Point3, type QueryHit } from '../world/WorldQuery.ts';

/** Immutable quantized vertices shared by GPU displacement and CPU triangle queries. */
export class HeightField {
  readonly segments = 64;
  readonly size = 32;
  readonly amplitude = 2;
  readonly bounds = { minX: -16, maxX: 16, minZ: -16, maxZ: 16 };
  readonly samples = new Uint8Array(65 * 65);

  constructor() {
    for (let j = 0; j <= this.segments; j++) for (let i = 0; i <= this.segments; i++) {
      const x = i * this.size / this.segments - this.size / 2;
      const z = j * this.size / this.segments - this.size / 2;
      const height = .85 + .42 * Math.sin(x * .18) * Math.cos(z * .16)
        + .26 * Math.sin(z * .23 + x * .12);
      this.samples[j * (this.segments + 1) + i] = Math.round(height / this.amplitude * 255);
    }
  }

  vertexHeight(index: number): number { return this.samples[index]! * this.amplitude / 255; }

  surfaceAt(x: number, z: number): { height: number; normal: Point3 } {
    const height = this.heightAt(x, z);
    if (!Number.isFinite(height)) return { height, normal: { x: NaN, y: NaN, z: NaN } };
    const cell = this.size / this.segments;
    const u = (x + 16) / cell, v = (z + 16) / cell;
    const i = Math.min(this.segments - 1, Math.floor(u)), j = Math.min(this.segments - 1, Math.floor(v));
    const a = j * (this.segments + 1) + i;
    const h00 = this.vertexHeight(a), h10 = this.vertexHeight(a + 1);
    const h01 = this.vertexHeight(a + this.segments + 1), h11 = this.vertexHeight(a + this.segments + 2);
    const lower = u - i + v - j <= 1;
    const dx = (lower ? h10 - h00 : h11 - h01) / cell;
    const dz = (lower ? h01 - h00 : h11 - h10) / cell;
    const length = Math.hypot(dx, 1, dz);
    return { height, normal: { x: -dx / length, y: 1 / length, z: -dz / length } };
  }

  /** Split the finite ray at grid and triangle edges; each interval is one affine plane. */
  raycast(origin: Point3, delta: Point3): QueryHit | null {
    if (!finitePoint(origin) || !finitePoint(delta)) return null;
    let lo = 0, hi = 1;
    const times: number[] = [];
    for (const axis of ['x', 'z'] as const) {
      if (!delta[axis]) { if (origin[axis] < -16 || origin[axis] > 16) return null; continue; }
      const t1 = (-16 - origin[axis]) / delta[axis], t2 = (16 - origin[axis]) / delta[axis];
      lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
      for (let n = 0; n <= this.segments; n++) {
        const t = (-16 + n * this.size / this.segments - origin[axis]) / delta[axis];
        if (t > 0 && t < 1) times.push(t);
      }
    }
    if (lo > hi) return null;
    times.push(lo, hi); times.sort((a, b) => a - b);
    const grid = times.filter(t => t >= lo && t <= hi);
    for (let n = 0; n < grid.length - 1; n++) {
      const a = grid[n]!, b = grid[n + 1]!, mid = (a + b) / 2;
      if (delta.x + delta.z === 0) continue;
      const i = Math.min(63, Math.floor((origin.x + delta.x * mid + 16) * 2));
      const j = Math.min(63, Math.floor((origin.z + delta.z * mid + 16) * 2));
      const t = (-32 + (i + j + 1) / 2 - origin.x - origin.z) / (delta.x + delta.z);
      if (t > a && t < b) times.push(t);
    }
    times.push(lo, hi); times.sort((a, b) => a - b);
    const clipped = times.filter(t => t >= lo && t <= hi);
    const position = (t: number): Point3 => ({ x: Math.max(-16, Math.min(16, origin.x + delta.x * t)),
      y: origin.y + delta.y * t, z: Math.max(-16, Math.min(16, origin.z + delta.z * t)) });
    for (let n = 0; n < clipped.length - 1; n++) {
      const a = clipped[n]!, b = clipped[n + 1]!;
      if (b - a < 1e-14) continue;
      const pa = position(a), pb = position(b);
      const da = pa.y - this.heightAt(pa.x, pa.z), db = pb.y - this.heightAt(pb.x, pb.z);
      if (da * db > 0 || Math.abs(da - db) < 1e-14) continue;
      const fraction = a + (b - a) * da / (da - db), hit = position(fraction);
      return { fraction, normal: this.surfaceAt(hit.x, hit.z).normal, layer: 'solid', id: 'terrain-ground' };
    }
    return null;
  }

  heightAt(x: number, z: number): number {
    if (!Number.isFinite(x) || !Number.isFinite(z) || x < -16 || x > 16 || z < -16 || z > 16) return NaN;
    const u = (x + 16) * this.segments / this.size, v = (z + 16) * this.segments / this.size;
    const i = Math.min(this.segments - 1, Math.floor(u)), j = Math.min(this.segments - 1, Math.floor(v));
    const a = j * (this.segments + 1) + i;
    const tx = u - i, tz = v - j;
    const h00 = this.vertexHeight(a), h10 = this.vertexHeight(a + 1);
    const h01 = this.vertexHeight(a + this.segments + 1), h11 = this.vertexHeight(a + this.segments + 2);
    return tx + tz <= 1 ? h00 + tx * (h10 - h00) + tz * (h01 - h00)
      : h11 + (1 - tx) * (h01 - h11) + (1 - tz) * (h10 - h11);
  }
}
