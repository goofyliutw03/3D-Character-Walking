import {
  BoxGeometry, Color, DirectionalLight, Fog, Group, HemisphereLight, InstancedMesh, Mesh, MeshStandardMaterial,
  Object3D, PlaneGeometry, Scene, SphereGeometry, type BufferGeometry, type Material,
} from 'three';
import type { SolidBox } from '../world/CapsuleBox.ts';
import { GroundWorldQuery } from '../world/GroundWorldQuery.ts';
import { WaterShaderModule } from '../water/WaterShaderModule.ts';
import { WaterVolume } from '../water/WaterVolume.ts';
import { sceneControlPolicy } from './SceneControlPolicy.ts';
import type { Environment } from './SceneSwitch.ts';

export function createSwim(): Environment {
  const scene = new Scene();
  const environment = new Group();
  environment.name = 'Tidal Pool';
  scene.add(environment);
  const sky = new Color('#b3d9e0');
  const waterColor = new Color('#176370');
  const underwaterFog = new Fog(waterColor, .7, 16);
  scene.background = sky;

  const footprint = { minX: -9, maxX: 9, minZ: -6, maxZ: 6 };
  const bounds = { ...footprint, minY: -5, maxY: 4 };
  const deck = { id: 'swim-exit', minX: -2.2, maxX: 2.2, minY: -5, maxY: .22, minZ: 3.8, maxZ: 6.45 };
  const solids: SolidBox[] = [
    deck,
    { id: 'intake', minX: 2.4, maxX: 4.5, minY: -5, maxY: -2.3, minZ: -2.8, maxZ: -.4 },
    { id: 'column', minX: -4.7, maxX: -3.5, minY: -5, maxY: .25, minZ: -1.2, maxZ: .3 },
  ];
  const query = new GroundWorldQuery({
    bounds, solids, surfaces: [{ ...footprint, id: 'pool-bottom', height: -5 }, { ...deck, height: deck.maxY }],
  });
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const box = (b: SolidBox, color: string): Mesh => {
    const geometry = new BoxGeometry(b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ);
    const material = new MeshStandardMaterial({ color, roughness: .83 });
    geometries.add(geometry);
    materials.add(material);
    const mesh = new Mesh(geometry, material);
    mesh.name = b.id;
    mesh.position.set((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, (b.minZ + b.maxZ) / 2);
    mesh.receiveShadow = true;
    environment.add(mesh);
    return mesh;
  };
  box({ ...footprint, id: 'Pool floor', minY: -5.3, maxY: -5 }, '#778f91');
  for (const solid of solids) box(solid, solid === deck ? '#d5ae69' : '#45666e');
  const wall = { minY: -5, maxY: .24 };
  const walls = [
    { ...wall, id: 'West wall', minX: -9.4, maxX: -9, minZ: -6.4, maxZ: 6.4 },
    { ...wall, id: 'East wall', minX: 9, maxX: 9.4, minZ: -6.4, maxZ: 6.4 },
    { ...wall, id: 'North wall', minX: -9, maxX: 9, minZ: -6.4, maxZ: -6 },
    { ...wall, id: 'South wall', minX: -9, maxX: 9, minZ: 6, maxZ: 6.4 },
  ];
  for (const bounds of walls) box(bounds, '#507179');
  const cameraSolids = [...solids, ...walls];
  const cameraPositionIsBlocked = (x: number, y: number, z: number, margin: number): boolean =>
    cameraSolids.some(bounds => x > bounds.minX - margin && x < bounds.maxX + margin &&
      y < bounds.maxY + margin && z > bounds.minZ - margin && z < bounds.maxZ + margin);

  const shader = new WaterShaderModule();
  const water = new WaterVolume(footprint, -5, 0, shader);
  shader.setSurfaceSize(18, 12);
  const surfaceGeometry = new PlaneGeometry(18, 12, 180, 120);
  const lowSurfaceGeometry = new PlaneGeometry(18, 12, 72, 48);
  surfaceGeometry.rotateX(-Math.PI / 2);
  lowSurfaceGeometry.rotateX(-Math.PI / 2);
  geometries.add(surfaceGeometry);
  geometries.add(lowSurfaceGeometry);
  shader.surfaceMaterial.transparent = true;
  shader.surfaceMaterial.opacity = .58;
  shader.surfaceMaterial.depthWrite = false;
  const surface = new Mesh(surfaceGeometry, shader.surfaceMaterial);
  surface.name = 'Pool surface';
  surface.userData.cameraObstruction = false;
  surface.userData.preserveLightMaterial = true;
  surface.raycast = () => {};
  environment.add(surface);

  const sun = new DirectionalLight('#fff0d6', 2.6);
  sun.position.set(-4, 12, 7);
  scene.add(sun, new HemisphereLight('#c2f8f9', '#2f6a5b', 2.1));

  const plantsGeometry = new SphereGeometry(1, 6, 5);
  const plantsMaterial = new MeshStandardMaterial({ color: '#268468', roughness: .8 });
  const bubbleGeometry = new SphereGeometry(.045, 6, 5);
  const bubbleMaterial = new MeshStandardMaterial({ color: '#bdffff', roughness: .2, transparent: true, opacity: .65, depthWrite: false });
  geometries.add(plantsGeometry);
  geometries.add(bubbleGeometry);
  materials.add(plantsMaterial);
  materials.add(bubbleMaterial);
  const plants = new InstancedMesh(plantsGeometry, plantsMaterial, 40);
  const bubbles = new InstancedMesh(bubbleGeometry, bubbleMaterial, 28);
  for (const [effect, name] of [[plants, 'Aquatic plants'], [bubbles, 'Air bubbles']] as const) {
    effect.name = name;
    effect.frustumCulled = false;
    effect.raycast = () => {};
    effect.userData.cameraObstruction = false;
    environment.add(effect);
  }

  const instance = new Object3D();
  let submerged = false;
  let disposed = false;
  const spawn = { x: 0, z: 4.9 };
  const updateEffects = (reduced: boolean): void => {
    const { enabled, quality } = shader.settings;
    surface.geometry = quality === 'low' ? lowSurfaceGeometry : surfaceGeometry;
    const t = reduced ? 0 : shader.elapsed;
    plants.count = enabled ? (quality === 'low' ? 12 : 40) : 0;
    bubbles.count = enabled && !reduced ? (quality === 'low' ? 8 : 28) : 0;
    for (let i = 0; i < plants.count; i++) {
      const x = Math.cos(i * 2.4) * (5.5 + i % 3);
      const z = Math.sin(i * 2.4) * (3 + i % 2);
      const height = .25 + i % 4 * .12;
      instance.position.set(x, -5 + height, z);
      instance.scale.set(.10, height, .055);
      instance.rotation.set(.12, 0, Math.sin(t * 1.7 + i) * .31);
      instance.updateMatrix();
      plants.setMatrixAt(i, instance.matrix);
    }
    instance.scale.setScalar(1);
    instance.rotation.set(0, 0, 0);
    for (let i = 0; i < bubbles.count; i++) {
      instance.position.set(-1.6 + Math.sin(i * 2.4 + t) * .55, -4.92 + (i * .71 + t * .64) % 4.82, -2 + Math.cos(i * 2.4) * .58);
      instance.updateMatrix();
      bubbles.setMatrixAt(i, instance.matrix);
    }
    plants.instanceMatrix.needsUpdate = bubbles.instanceMatrix.needsUpdate = true;
  };
  updateEffects(false);
  return {
    id: 'swim', scene, environment, spawn, targetSpawn: { x: 1.5, z: 5.2 }, cityFeatures: false,
    controls: sceneControlPolicy('underwater', {
      autoRun: true,
      staticFraming: {
        overview: { position: [13, 11, 14], target: [0, -1, 0] },
        street: { position: [6, 3, 8], target: [0, -1, 0] },
        overhead: { position: [0, 21, .01], target: [0, 0, 0] },
      },
    }),
    walkableWorld: { bounds, query, obstacles: [], groundHeight: (x, z) => {
      const surface = query.surfaceSample({ x, y: 0, z });
      return surface.ok ? surface.value.height : -5;
    } },
    swim: {
      water, exit: { surfaceId: deck.id },
      nearBodyCollision({ x, y, z }, reach) {
        return x - reach < bounds.minX || x + reach > bounds.maxX ||
          z - reach < bounds.minZ || z + reach > bounds.maxZ ||
          y - reach < bounds.minY || y + reach > bounds.maxY ||
          solids.some(box => x + reach > box.minX && x - reach < box.maxX &&
            y + reach > box.minY && y - reach < box.maxY && z + reach > box.minZ && z - reach < box.maxZ);
      },
      fitBody(body, position, capsule, holdDepth) {
        const skin = .001;
        const { min, max } = body;
        if (body.isEmpty()) return;
        const intersects = (box: SolidBox, x: number, y: number, z: number): boolean =>
          min.x + x < box.maxX - skin && max.x + x > box.minX + skin &&
          min.y + y < box.maxY - skin && max.y + y > box.minY + skin &&
          min.z + z < box.maxZ - skin && max.z + z > box.minZ + skin;
        const inside = (x: number, y: number, z: number): boolean =>
          min.x + x >= bounds.minX - skin && max.x + x <= bounds.maxX + skin &&
          min.y + y >= bounds.minY - skin && max.y + y <= bounds.maxY + skin &&
          min.z + z >= bounds.minZ - skin && max.z + z <= bounds.maxZ + skin;
        if (inside(0, 0, 0) && !solids.some(box => intersects(box, 0, 0, 0))) return;

        // Face offsets let the body slide out along a wall or around a corner.
        const offsets = (axis: 'x' | 'y' | 'z', low: number, high: number, faces: [number, number][]): number[] => [
          0, low - min[axis] + skin, high - max[axis] - skin,
          ...faces.flatMap(([a, b]) => [a - max[axis] - skin, b - min[axis] + skin]),
        ];
        const xs = offsets('x', bounds.minX, bounds.maxX, solids.map(box => [box.minX, box.maxX]));
        const ys = holdDepth ? [0] : offsets('y', bounds.minY, bounds.maxY, solids.map(box => [box.minY, box.maxY]));
        const zs = offsets('z', bounds.minZ, bounds.maxZ, solids.map(box => [box.minZ, box.maxZ]));
        let distance = Infinity;
        let fit;
        for (const x of xs) for (const y of ys) for (const z of zs) {
          const squared = x * x + y * y + z * z;
          if (squared >= distance || !inside(x, y, z) || solids.some(box => intersects(box, x, y, z))) continue;
          const next = { x: position.x + x, y: position.y + y, z: position.z + z };
          if (capsule) {
            const hit = query.sweep(position, { x, y, z }, capsule);
            if (!hit.ok || (hit.value && hit.value.fraction < 1 - 1e-8)) continue;
          }
          distance = squared;
          fit = next;
        }
        return fit;
      },
      constrainCamera(position, clearance) {
        position.y = Math.max(position.y, water.bottom + clearance);
        const { x, y, z } = position;
        if (!cameraPositionIsBlocked(x, y, z, clearance)) return;
        let bestDistance = Infinity;
        for (const bounds of cameraSolids) {
          if (x <= bounds.minX - clearance || x >= bounds.maxX + clearance ||
              y >= bounds.maxY + clearance || z <= bounds.minZ - clearance || z >= bounds.maxZ + clearance) continue;
          const faces = [
            { axis: 'x', value: bounds.minX - clearance },
            { axis: 'x', value: bounds.maxX + clearance },
            { axis: 'z', value: bounds.minZ - clearance },
            { axis: 'z', value: bounds.maxZ + clearance },
            { axis: 'y', value: bounds.maxY + clearance },
          ] as const;
          for (const { axis, value } of faces) {
            const distance = Math.abs((axis === 'x' ? x : axis === 'y' ? y : z) - value);
            if (distance >= bestDistance || cameraPositionIsBlocked(
              axis === 'x' ? value : x, axis === 'y' ? value : y, axis === 'z' ? value : z, clearance,
            )) continue;
            position.set(x, y, z);
            position[axis] = value;
            bestDistance = distance;
          }
        }
      },
      updateCamera(position) {
        submerged = water.submerged(position, submerged);
        scene.fog = submerged ? underwaterFog : null;
        scene.background = submerged ? waterColor : sky;
        return submerged;
      },
    },
    update(delta, reduced) {
      shader.update(delta);
      updateEffects(reduced);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      plants.dispose();
      bubbles.dispose();
      shader.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      sun.dispose();
      scene.clear();
    },
  };
}
