import {
  Box3, Color, DirectionalLight, Group, HemisphereLight, Mesh, Scene, Vector3,
  type BufferGeometry, type Material, type Object3D,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { NavigationPortal, WalkableWorld } from '../character/motion.ts';
import { GroundWorldQuery, type GroundData, type GroundSurface } from '../world/GroundWorldQuery.ts';
import type { SolidBox } from '../world/CapsuleBox.ts';
import type { Point3 } from '../world/WorldQuery.ts';
import { sceneControlPolicy } from './SceneControlPolicy.ts';
import { solarPosition, validSolar, type SolarSettings } from './SolarPosition.ts';
import type { TimeOfDay } from './CityScene.ts';
import type { Environment } from './SceneSwitch.ts';

const bounds: GroundData['bounds'] = { minX: -14, maxX: 14, minZ: -21, maxZ: 21, minY: -3.6, maxY: 18 };
const round = (number: number): number => Math.round(number * 1e5) / 1e5;

export function manorWalkableWorld(model: Object3D): WalkableWorld & { cameraGroundHeight(position: Point3): number } {
  const surfaces: GroundSurface[] = [];
  const solids: SolidBox[] = [];
  const navigationWaypoints: Point3[] = [];
  const stairFlights = new Map<number, SolidBox[]>();
  const lowerLandings = new Map<number, Point3>();
  const upperLandings = new Map<number, Point3>();
  const box = new Box3();
  model.updateWorldMatrix(true, true);
  model.traverse(object => {
    if (object.userData.routeWaypoint === true) {
      const { x, y, z } = object.getWorldPosition(new Vector3());
      const position = { x: round(x), y: round(y), z: round(z) };
      navigationWaypoints.push(position);
      if (typeof object.userData.lowerFlight === 'number') lowerLandings.set(object.userData.lowerFlight, position);
      if (typeof object.userData.upperFlight === 'number') upperLandings.set(object.userData.upperFlight, position);
    }
    if (!(object instanceof Mesh) || !(object.userData.solid || object.userData.walkable)) return;
    box.setFromObject(object);
    const { min, max } = box;
    const volume = {
      id: object.name, minX: round(min.x), maxX: round(max.x), minZ: round(min.z), maxZ: round(max.z),
      minY: round(min.y), maxY: round(max.y),
    };
    if (object.userData.walkable) surfaces.push({ ...volume, height: volume.maxY });
    if (object.userData.solid) solids.push(volume);
    const flight = object.userData.stairFlight;
    if (typeof flight === 'number') {
      const treads = stairFlights.get(flight) ?? [];
      treads.push(volume);
      stairFlights.set(flight, treads);
    }
  });
  if (!surfaces.length || !solids.length || !navigationWaypoints.length) throw new Error('Manor GLB is missing navigation geometry');
  const stairs = [...stairFlights].filter(([, treads]) => treads.length >= 2).map(([flight, treads]) => {
    treads.sort((a, b) => a.minY - b.minY);
    const first = treads[0]!, last = treads[treads.length - 1]!;
    const ascendingZ = first.minZ < last.minZ;
    return {
      flight,
      minX: first.minX, maxX: first.maxX,
      startZ: ascendingZ ? first.minZ : first.maxZ, endZ: ascendingZ ? last.maxZ : last.minZ,
      base: first.minY, rise: last.maxY - first.minY, riser: first.maxY - first.minY,
    };
  });
  const navigationPortals: NavigationPortal[] = stairs.map(stair => {
    const lower = lowerLandings.get(stair.flight), upper = upperLandings.get(stair.flight);
    if (!lower || !upper || lower.y !== stair.base || upper.y !== round(stair.base + stair.rise))
      throw new Error('Manor GLB is missing a stair landing');
    return {
      lower, upper,
      contains({ x, y, z }) {
        const progress = (z - stair.startZ) / (stair.endZ - stair.startZ);
        return x >= stair.minX && x <= stair.maxX && progress >= 0 && progress <= 1 &&
          Math.abs(y - (stair.base + progress * stair.rise)) <= stair.riser + 1e-5;
      },
    };
  });
  const query = new GroundWorldQuery({ bounds, solids, surfaces });
  return {
    bounds, obstacles: solids, navigationWaypoints, navigationPortals, query,
    cameraGroundHeight({ x, y, z }) {
      for (const stair of stairs) {
        if (x < stair.minX || x > stair.maxX) continue;
        const progress = (z - stair.startZ) / (stair.endZ - stair.startZ);
        if (progress < 0 || progress > 1) continue;
        const height = stair.base + progress * stair.rise;
        if (Math.abs(y - height) <= stair.riser + 1e-5) return height;
      }
      return y;
    },
    groundHeight(x, z) {
      const sample = query.surfaceSample({ x, y: 0, z });
      return sample.ok ? sample.value.height : 0;
    },
  };
}

export async function createManor(): Promise<Environment> {
  const { scene: model } = await new GLTFLoader().loadAsync(import.meta.env.BASE_URL + 'assets/environments/manor.glb');
  const scene = new Scene();
  scene.background = new Color('#ccd5d5');
  const environment = new Group();
  environment.name = 'Limestone manor';
  model.userData.independentCameraBlockers = true;
  environment.add(model);
  scene.add(environment);
  const walkableWorld = manorWalkableWorld(model);

  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  model.traverse(object => {
    if (!(object instanceof Mesh)) return;
    if (object.userData.collisionOnly === true) object.visible = false;
    const decorative = object.userData.groundPickThrough === true;
    object.castShadow = !decorative && object.userData.walkable !== true;
    object.receiveShadow = true;
    if (decorative) object.userData.cameraObstruction = false;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });

  const daylight = new DirectionalLight('#fff0dd', 2.3);
  daylight.castShadow = true;
  Object.assign(daylight.shadow.camera, { left: -25, right: 25, top: 26, bottom: -26, near: .1, far: 68 });
  daylight.shadow.mapSize.set(2048, 2048);
  daylight.shadow.normalBias = .025;
  const ambient = new HemisphereLight('#f9f4e8', '#aa987c', 2.3);
  scene.add(ambient, daylight);
  let time: TimeOfDay = 'day';
  let solar: SolarSettings = { enabled: false, hour: 12, season: 'spring', latitude: 25 };
  const updateLighting = (): void => {
    const hour = solar.enabled ? solar.hour : { day: 12, evening: 17, night: 0 }[time];
    const sun = solarPosition(hour, solar.season, solar.latitude);
    const elevation = Math.max(0, Math.min(1, sun.y * 1.4));
    daylight.position.set(sun.x * 28, Math.max(.3, sun.y * 28), sun.z * 28);
    daylight.intensity = 2.3 * elevation;
    ambient.intensity = .8 + 1.5 * elevation;
  };
  updateLighting();

  return {
    id: 'room', scene, environment, spawn: { x: 0, z: 18 },
    targetSpawn: { x: -1.3, z: 16 }, cityFeatures: false,
    controls: sceneControlPolicy('semi-enclosed', {
      staticFraming: {
        overview: { position: [28, 25, 32], target: [0, 5, 0] },
        street: { position: [0, 4.8, 24], target: [0, 5, 0] },
        overhead: { position: [0, 48, .01], target: [0, 0, 0] },
      },
    }),
    walkableWorld,
    cameraGroundHeight: walkableWorld.cameraGroundHeight,
    solar: {
      getSettings: () => ({ ...solar }),
      getTime: () => time,
      configure(patch) {
        const next = { ...solar, ...patch };
        if (!validSolar(next)) return false;
        solar = next;
        updateLighting();
        return true;
      },
      setTime(next) {
        if (!['day', 'evening', 'night'].includes(next)) return false;
        time = next;
        solar.enabled = false;
        updateLighting();
        return true;
      },
    },
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      daylight.dispose();
      scene.clear();
    },
  };
}

