import { Color, DirectionalLight, Group, HemisphereLight, Mesh, MeshBasicMaterial,
  PlaneGeometry, Scene, type BufferGeometry, type Material } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GroundWorldQuery, type GroundData } from '../world/GroundWorldQuery.ts';
import { sceneControlPolicy } from './SceneControlPolicy.ts';
import { solarPosition, validSolar, type SolarSettings } from './SolarPosition.ts';
import type { TimeOfDay } from './CityScene.ts';
import type { Environment } from './SceneSwitch.ts';

const floor = { id: 'room-floor', minX: -3, maxX: 3, minZ: -2.5, maxZ: 2.5, height: 0 };
const bounds = { ...floor, minY: 0, maxY: 3 };
const solids: GroundData['solids'] = [
  { id: 'sofa', minX: -1.43, maxX: 1.43, minZ: -2.085, maxZ: -.995, minY: 0, maxY: 1.285 },
  { id: 'table', minX: -.825, maxX: .825, minZ: -.175, maxZ: .675, minY: 0, maxY: .555 },
  { id: 'armchair', minX: 1.79, maxX: 2.75, minZ: .705, maxZ: 1.60, minY: 0, maxY: 1.235 },
  { id: 'bookcase', minX: -2.94, maxX: -2.38, minZ: -1.455, maxZ: .155, minY: 0, maxY: 1.22 },
  { id: 'plant', minX: 1.96, maxX: 2.74, minZ: -2.13, maxZ: -1.31, minY: 0, maxY: 1.60 },
  { id: 'lamp', minX: -2.23, maxX: -1.73, minZ: -1.90, maxZ: -1.40, minY: 0, maxY: 1.98 },
];

export async function createFurnishedRoom(): Promise<Environment> {
  const { scene: model } = await new GLTFLoader().loadAsync(
    import.meta.env.BASE_URL + 'assets/environments/furnished-room.glb',
  );
  const scene = new Scene();
  scene.background = new Color('#c7c0b5');
  const environment = new Group();
  environment.name = 'Furnished living room';
  scene.add(environment);
  environment.add(model);

  // A continuous picking surface spans plank seams and the decorative rug.
  const ground = new Mesh(new PlaneGeometry(6, 5), new MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  ground.name = 'Room floor picking surface';
  ground.rotation.x = -Math.PI / 2;
  ground.userData.walkable = true;
  ground.userData.cameraObstruction = false;
  environment.add(ground);

  const geometries = new Set<BufferGeometry>([ground.geometry]);
  const materials = new Set<Material>([ground.material]);
  model.traverse(object => {
    if (!(object instanceof Mesh)) return;
    object.castShadow = !/^(Floor_plank|Foundation|Woven_rug|Rug_border)/.test(object.name);
    object.receiveShadow = true;
    if (!object.castShadow) object.userData.cameraObstruction = false;
    if (object.name.startsWith('Floor_plank')) object.userData.walkable = true;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });

  const daylight = new DirectionalLight('#fff0dd', 2.3);
  daylight.position.set(3, 6, 5);
  daylight.castShadow = true;
  Object.assign(daylight.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .1, far: 16 });
  daylight.shadow.mapSize.set(1024, 1024);
  daylight.shadow.normalBias = .015;
  const ambient = new HemisphereLight('#fff6e9', '#b0937a', 2.3);
  scene.add(ambient, daylight);
  let time: TimeOfDay = 'day';
  let solar: SolarSettings = { enabled: false, hour: 12, season: 'spring', latitude: 25 };
  const updateLighting = (): void => {
    const hour = solar.enabled ? solar.hour : { day: 12, evening: 17, night: 0 }[time];
    const sun = solarPosition(hour, solar.season, solar.latitude);
    const elevation = Math.max(0, Math.min(1, sun.y * 1.4));
    daylight.position.set(sun.x * 6, Math.max(.3, sun.y * 6), sun.z * 6);
    daylight.intensity = 2.3 * elevation;
    ambient.intensity = .8 + 1.5 * elevation;
  };
  updateLighting();

  return {
    id: 'room', scene, environment, spawn: { x: 0, z: 1.72 },
    targetSpawn: { x: -1.65, z: .45 }, cityFeatures: false,
    controls: sceneControlPolicy('semi-enclosed', {
      staticFraming: {
        overview: { position: [6.5, 5.7, 8], target: [0, .7, 0] },
        street: { position: [0, 2.1, 5], target: [0, 1, -1] },
        overhead: { position: [0, 8.5, .01], target: [0, 0, 0] },
      },
    }),
    walkableWorld: { bounds, obstacles: solids, groundHeight: () => 0,
      query: new GroundWorldQuery({ bounds, solids, surfaces: [floor] }) },
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
