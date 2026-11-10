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
