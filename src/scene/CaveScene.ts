import { AmbientLight, BoxGeometry, ConeGeometry, Color, Fog, Group, Mesh, MeshStandardMaterial, Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, Scene } from 'three';
import type { Environment } from './SceneSwitch';
import { createCaveFixtures, createSkylight } from './CaveLighting.ts';
import { environmentLight } from './EnvironmentLights.ts';
import { Headlamp } from './Headlamp.ts';
import { sceneControlPolicy } from './SceneControlPolicy.ts';
import { declareGroundBox } from '../navigation/GroundPicker.ts';

const width = 22;
const depth = 32;
const ceiling = 5;
const halfOpening = 1.6;
const bounds = { minX: -width / 2, maxX: width / 2, minZ: -depth / 2, maxZ: depth / 2 };
const obstacles = [
  { minX: -6, maxX: -3, minZ: -5, maxZ: -2 },
  { minX: 2, maxX: 5, minZ: 1, maxZ: 4 },
];

export function createCave(): Environment {
  const scene = new Scene();
  scene.background = new Color('#15151d');
  scene.fog = new Fog('#15151d', 12, 36);
  const environment = new Group();
  environment.name = 'Cave';
  const ambient = new AmbientLight('#bbc7ef', .65);
  scene.add(environment, ambient);
  const ambientControl = environmentLight('ambient', 'Ambient', 'ambient', 2,
    { enabled: true, intensity: 1, color: '#bbc7ef', effects: false }, state => {
      ambient.visible = state.enabled;
      ambient.intensity = .65 * state.intensity;
      ambient.color.set(state.color);
    });
  const rock = new MeshStandardMaterial({ color: '#5b514f', roughness: 1 });
  const floorMaterial = new MeshStandardMaterial({ color: '#463e43', roughness: 1 });
  const meshes: Mesh[] = [];

  function box(name: string, w: number, h: number, d: number, x: number, y: number, z: number, material = rock): Mesh {
    const mesh = new Mesh(new BoxGeometry(w, h, d), material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    meshes.push(mesh);
    environment.add(mesh);
    return mesh;
  }

  declareGroundBox(box('Walkable cave floor', width, 1, depth, 0, -.5, 0, floorMaterial));
  for (const side of [-1, 1]) {
    const roofSide = width / 2 + 1 - halfOpening;
    const roofEnd = depth / 2 + 1 - halfOpening;
    box('Cave ceiling side', roofSide, 1, depth + 2, side * (halfOpening + roofSide / 2), ceiling + .5, 0);
    box('Cave ceiling end', 2 * halfOpening, 1, roofEnd, 0, ceiling + .5, side * (halfOpening + roofEnd / 2));
    box('Side wall', 1, ceiling, depth + 2, side * (width + 1) / 2, ceiling / 2, 0);
    box('End wall', width, ceiling, 1, 0, ceiling / 2, side * (depth + 1) / 2);
  }
  for (const { minX, maxX, minZ, maxZ } of obstacles) {
    box('Rock column', maxX - minX, ceiling, maxZ - minZ, (minX + maxX) / 2, ceiling / 2, (minZ + maxZ) / 2);
  }
  const skylight = createSkylight(ceiling, halfOpening);
  const fixtures = createCaveFixtures();
  const headlamp = new Headlamp();
  environment.add(skylight.group, fixtures.group);
  scene.add(headlamp.group);

  const drops = new Float32BufferAttribute(new Float32Array(24), 3);
  const dropGeometry = new BufferGeometry().setAttribute('position', drops);
  const dropMaterial = new PointsMaterial({ color: '#b5d3ff', size: .065 });
  const drip = new Points(dropGeometry, dropMaterial);
  drip.name = 'Cave drips';
  drip.frustumCulled = false;
  environment.add(drip);
  for (let i = 0; i < drops.count; i++) {
    const x = Math.sin(i * 3.7) * 8;
    const z = Math.cos(i * 2.1) * 12;
    const rockTip = new Mesh(new ConeGeometry(.35 + .04 * i, .8, 6), rock);
    rockTip.name = 'Stalactite';
    rockTip.rotation.z = Math.PI;
    rockTip.position.set(x, ceiling - .42, z);
    if (Math.abs(x) >= halfOpening + .5 || Math.abs(z) >= halfOpening + .5) {
      meshes.push(rockTip);
      environment.add(rockTip);
    } else rockTip.geometry.dispose();
    drops.setXYZ(i, x, 4.05, z);
  }
  let elapsed = 0;

  return {
    id: 'cave', scene, environment, spawn: { x: 0, z: 5 }, ceiling, cityFeatures: false, solar: skylight.solar, headlamp,
    controls: sceneControlPolicy('enclosed'),
    lights: [skylight.control, ambientControl, ...fixtures.controls],
    // Leave clearance below hanging rock even after switching to the tallest character.
    maxPlacementHeight: 2.1,
    walkableWorld: { bounds, obstacles, groundHeight: () => 0 },
    update(delta, reducedMotion) {
      fixtures.update(delta, reducedMotion);
      drip.visible = !reducedMotion;
      if (reducedMotion) return;
      elapsed += delta;
      for (let i = 0; i < drops.count; i++) drops.setY(i, 4.05 - ((elapsed * 3.2 + i * .63) % 4.05));
      drops.needsUpdate = true;
    },
    dispose() {
      headlamp.dispose();
      skylight.dispose();
      fixtures.dispose();
      dropGeometry.dispose();
      dropMaterial.dispose();
      for (const mesh of meshes) mesh.geometry.dispose();
      rock.dispose();
      floorMaterial.dispose();
      scene.clear();
    },
  };
}
