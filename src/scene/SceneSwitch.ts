import { Scene, type Group } from 'three';
import type { WalkableWorld } from '../character/motion';
import type { SolarSettings } from './SolarPosition';
import type { TimeOfDay } from './CityScene';
import type { EnvironmentLight } from './EnvironmentLights';
import type { Headlamp } from './Headlamp';
import { sceneControlPolicy, type SceneControlPolicy } from './SceneControlPolicy.ts';

export type EnvironmentId = 'city' | 'cave' | 'terrain';
export interface TerrainSettings { quality: 'standard' | 'low'; wind: boolean }
export interface Environment {
  readonly id: EnvironmentId;
  readonly scene: Scene;
  readonly environment: Group;
  readonly walkableWorld: WalkableWorld;
  readonly spawn: { x: number; z: number };
  readonly cityFeatures: boolean;
  readonly controls?: SceneControlPolicy;
  readonly ceiling?: number;
  readonly maxPlacementHeight?: number;
  readonly headlamp?: Headlamp;
  readonly lights?: readonly EnvironmentLight[];
  readonly terrain?: {
    getSettings(): TerrainSettings;
    configure(patch: Partial<TerrainSettings>): boolean;
  };
  readonly solar?: {
    getSettings(): SolarSettings;
    configure(patch: Partial<SolarSettings>): boolean;
    getTime(): TimeOfDay;
    setTime(time: TimeOfDay): boolean;
  };
  update?(delta: number, reducedMotion: boolean): void;
  dispose(): void;
}

export class SceneSwitch {
  readonly root = new Scene();
  private version = 0;
  private current: Environment;

  constructor(initial: Environment) {
    this.current = initial;
    this.root.add(initial.scene);
    this.syncAppearance();
  }

  get active(): Environment { return this.current; }
  get controls(): SceneControlPolicy {
    return this.current.controls ?? sceneControlPolicy(this.current.ceiling === undefined ? 'open' : 'enclosed');
  }

  syncAppearance(): void {
    this.root.background = this.current.scene.background;
    this.root.fog = this.current.scene.fog;
  }

  cancel(): void { this.version++; }

  async select(id: EnvironmentId, prepare: () => Promise<Environment>, bind: (next: Environment) => void): Promise<boolean> {
    const version = ++this.version;
    if (id === this.current.id) return true;
    let next: Environment;
    try {
      next = await prepare();
    } catch {
      return false;
    }
    if (version !== this.version) {
      next.dispose();
      return false;
    }
    const previous = this.current;
    previous.scene.removeFromParent();
    this.root.add(next.scene);
    this.current = next;
    this.syncAppearance();
    bind(next);
    previous.dispose();
    return true;
  }

  dispose(): void {
    this.cancel();
    this.current.scene.removeFromParent();
    this.current.dispose();
  }
}
