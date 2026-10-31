import { Group, Object3D, PointLight, Vector3 } from 'three';

export interface PointLightSettings {
  enabled: boolean;
  color: string;
  /** Luminous intensity in candela. */
  intensity: number;
  /** Finite cutoff radius in metres. */
  radius: number;
  decay: number;
}

const leaseBrand: unique symbol = Symbol('ObjectLightLease');
export interface ObjectLightHandle { readonly [leaseBrand]: true }
interface Lease { light: PointLight; settings: PointLightSettings }

export function validPointLightSettings(settings: PointLightSettings): boolean {
  const range = (value: number, min: number, max: number): boolean => Number.isFinite(value) && value >= min && value <= max;
  return typeof settings.enabled === 'boolean' && /^#[0-9a-f]{6}$/i.test(settings.color)
    && range(settings.intensity, 0, 200) && range(settings.radius, .1, 30) && range(settings.decay, 0, 4);
}

/** Bounded, reusable lights. Add root to the scene to keep idle slots in the renderer's light budget. */
export class ObjectLightPool {
  readonly root = new Group();
  readonly capacity: number;
  private readonly lights: PointLight[] = [];
  private readonly free: PointLight[] = [];
  private readonly leases = new Map<ObjectLightHandle, Lease>();
  private disposed = false;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 32) throw new RangeError('Light capacity must be an integer from 1 to 32.');
    this.capacity = capacity;
    this.root.name = 'Parked object lights';
    for (let i = 0; i < capacity; i++) {
      const light = new PointLight('#ffffff', 0, 1, 2);
      light.name = `Object light slot ${i + 1}`;
      light.castShadow = false;
      this.lights.push(light); this.free.push(light); this.root.add(light);
    }
  }
  get activeCount(): number { return this.leases.size; }

  attach(parent: Object3D, settings: PointLightSettings, offset = new Vector3()): ObjectLightHandle | null {
    if (this.disposed || !validPointLightSettings(settings) || !offset.toArray().every(Number.isFinite) || !this.free.length) return null;
    const light = this.free.pop()!;
    const handle: ObjectLightHandle = { [leaseBrand]: true };
    const lease = { light, settings: { ...settings } };
    this.leases.set(handle, lease);
    light.position.copy(offset);
    parent.add(light);
    this.apply(lease);
    return handle;
  }

  update(handle: ObjectLightHandle, patch: Partial<PointLightSettings>): boolean {
    const lease = this.leases.get(handle);
    if (this.disposed || !lease) return false;
    const settings = { ...lease.settings, ...patch };
    if (!validPointLightSettings(settings)) return false;
    lease.settings = settings; this.apply(lease); return true;
  }

  remove(handle: ObjectLightHandle): boolean {
    const lease = this.leases.get(handle);
    if (!lease) return false;
    this.leases.delete(handle);
    lease.light.intensity = 0;
    lease.light.position.set(0, 0, 0);
    this.root.add(lease.light);
    this.free.push(lease.light);
    return true;
  }

  private apply({ light, settings }: Lease): void {
    light.color.set(settings.color);
    light.intensity = settings.enabled ? settings.intensity : 0;
    light.distance = settings.radius;
    light.decay = settings.decay;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.leases.clear(); this.free.length = 0;
    for (const light of this.lights) { light.removeFromParent(); light.dispose(); }
    this.lights.length = 0;
    this.root.removeFromParent(); this.root.clear();
  }
}
