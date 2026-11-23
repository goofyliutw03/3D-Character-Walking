import type { CameraPreset } from '../engine/ViewerApp';
import type { CharacterVariant } from '../character/motion';
import type { SwimAppearance } from '../character/SwimAppearance.ts';
import type { ObstructionMode } from '../camera/CameraObstruction';
import type { LookSensitivity } from '../input/AutoRunControls';
import type { TrafficSettings } from '../simulation/TrafficSimulation';
import type { ParticleSettings } from '../interaction/ParticleInteraction';
import type { WaterSettings } from '../water/index';
import type { ExpressionState } from '../expression/ExpressionManager';
import type { SolarSettings } from '../scene/SolarPosition';
import type { TimeOfDay } from '../scene/CityScene';
import type { LightSettings } from '../scene/EnvironmentLights';
import type { HeadlampSettings } from '../scene/HeadlampSettings';
import type { EnvironmentId, TerrainSettings } from '../scene/SceneSwitch';
export type ProjectileAim = 'target' | 'camera';
export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  yaw: number;
  pitch: number;
  zoom: number;
}
export interface SceneSettings {
  time: TimeOfDay;
  solar: SolarSettings;
  lights: { id: string; settings: LightSettings }[];
  headlamp: HeadlampSettings | null;
  terrain?: TerrainSettings;
}
export interface InspectorSettings { enabled: boolean; pattern: string; ranges: string; uncheckedPaths: string[]; expandedPaths: Record<string, boolean> }
export interface ViewerSettings {
  environment: EnvironmentId;
  scenes: Partial<Record<EnvironmentId, SceneSettings>>;
  variant: CharacterVariant;
  camera: CameraPreset;
  cameraPose?: CameraPose;
  following: boolean;
  obstruction: ObstructionMode;
  groundPenetration: boolean;
  sensitivity: LookSensitivity;
  walkSpeed: number;
  expression: ExpressionState;
  traffic: TrafficSettings;
  particles: ParticleSettings;
  projectileAim?: ProjectileAim;
  water: WaterSettings;
  swimAppearance?: SwimAppearance;
  waterLens: boolean;
  shadows: boolean;
  lamps: number[];
  lampDetection: { enabled: boolean; radius: number };
  inspector: InspectorSettings;
}
