import {
  BufferGeometry, Color, DataTexture, DirectionalLight, Float32BufferAttribute, Fog,
  Group, HemisphereLight, Mesh, MeshStandardMaterial, MeshDepthMaterial, NearestFilter, RedFormat, Scene,
  CylinderGeometry, ConeGeometry, DoubleSide, RGBADepthPacking,
} from 'three';
import { HeightField } from './HeightField.ts';
import type { Environment, TerrainSettings } from './SceneSwitch';
import { sceneControlPolicy } from './SceneControlPolicy.ts';
import { solarPosition, validSolar, type SolarSettings } from './SolarPosition.ts';
import type { TimeOfDay } from './CityScene';
import { GroundWorldQuery } from '../world/GroundWorldQuery.ts';

export function createTerrain(): Environment {
  const field = new HeightField();
  const scene = new Scene();
  scene.background = new Color('#accbd8');
  scene.fog = new Fog('#accbd8', 24, 65);
  const environment = new Group();
  environment.name = 'Natural terrain';
  const sky = new HemisphereLight('#e0f2ff', '#56633b', 2);
  scene.add(environment, sky);
  const sun = new DirectionalLight('#fff1d2', 3);
  sun.position.set(10, 18, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: .1, far: 70 });
  sun.shadow.bias = -.0003;
  scene.add(sun);
  let solarSettings: SolarSettings = { enabled: false, hour: 12, season: 'spring', latitude: 25 };
  let preset: TimeOfDay = 'day';
  const syncSun = (): void => {
    const direction = solarPosition(solarSettings.enabled ? solarSettings.hour : { day: 12, evening: 17, night: 0 }[preset], solarSettings.season, solarSettings.latitude);
    sun.position.set(direction.x * 30, direction.y * 30, direction.z * 30);
    sun.visible = direction.y > 0;
    sun.intensity = 3 * Math.max(0, direction.y);
    sky.intensity = .25 + 1.75 * Math.max(0, direction.y);
    const color = direction.y > .1 ? '#accbd8' : direction.y > 0 ? '#c59b80' : '#172738';
    (scene.background as Color).set(color); (scene.fog as Fog).color.set(color);
  };
  syncSun();
  const positions: number[] = [], uv: number[] = [], normals: number[] = [], indices: number[] = [];
  const count = field.segments + 1;
  for (let j = 0; j < count; j++) for (let i = 0; i < count; i++) {
    positions.push(i * .5 - 16, 0, j * .5 - 16);
    // UVs target texel centres, including both outermost rows.
    uv.push((i + .5) / count, (j + .5) / count);
    normals.push(0, 1, 0);
    if (i < field.segments && j < field.segments) {
      const a = j * count + i;
      indices.push(a, a + count, a + 1, a + 1, a + count, a + count + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  const proxyGeometry = geometry.clone();
  const displaced = proxyGeometry.getAttribute('position');
  for (let i = 0; i < displaced.count; i++) displaced.setY(i, field.vertexHeight(i));
  proxyGeometry.computeBoundingBox(); proxyGeometry.computeBoundingSphere(); proxyGeometry.computeVertexNormals();
  geometry.boundingBox = proxyGeometry.boundingBox!.clone();
  geometry.boundingSphere = proxyGeometry.boundingSphere!.clone();
  const texture = new DataTexture(field.samples, count, count, RedFormat);
  texture.minFilter = texture.magFilter = NearestFilter;
  texture.generateMipmaps = false; texture.needsUpdate = true;
  const material = new MeshStandardMaterial({ color: '#718345', roughness: 1, flatShading: true,
    displacementMap: texture, displacementScale: field.amplitude });
  const surface = new Mesh(geometry, material);
  surface.name = 'Displaced terrain'; surface.userData.walkable = true;
  surface.receiveShadow = true; surface.castShadow = true;
  const proxy = new Mesh(proxyGeometry, material);
  surface.raycast = function(raycaster, hits) {
    proxy.matrixWorld.copy(this.matrixWorld);
    const start = hits.length;
    proxy.raycast(raycaster, hits);
    for (let i = start; i < hits.length; i++) hits[i]!.object = this;
  };
  environment.add(surface);
  const geometries: BufferGeometry[] = [geometry, proxyGeometry];
  const materials: (MeshStandardMaterial | MeshDepthMaterial)[] = [material];
  const obstacles = [-1, 1, 2, 3, 4].map((seed, i) => {
    const x = [-8, 9, -10, 8, 0][i]!, z = [-6, -7, 7, 9, -11][i]!;
    const y = field.heightAt(x, z);
    const trunkGeometry = new CylinderGeometry(.25, .32, 2.8, 7);
    const crownGeometry = new ConeGeometry(1.4, 3.8, 8);
    const trunkMaterial = new MeshStandardMaterial({ color: '#69523b', roughness: 1 });
    const crownMaterial = new MeshStandardMaterial({ color: seed % 2 ? '#38583b' : '#49643a', roughness: 1, flatShading: true });
    const trunk = new Mesh(trunkGeometry, trunkMaterial), crown = new Mesh(crownGeometry, crownMaterial);
    trunk.name = 'Solid tree trunk'; crown.name = 'Tree canopy';
    trunk.position.set(x, y + 1.35, z); crown.position.set(x, y + 3.7, z);
    for (const mesh of [trunk, crown]) { mesh.castShadow = true; mesh.receiveShadow = true; environment.add(mesh); }
    geometries.push(trunkGeometry, crownGeometry); materials.push(trunkMaterial, crownMaterial);
    return { minX: x - .32, maxX: x + .32, minZ: z - .32, maxZ: z + .32 };
  });
  const grassPositions: number[] = [], weights: number[] = [], phases: number[] = [];
  for (let i = 0; i < 384; i++) {
    const x = Math.sin(i * 12.9898 + 1) * 14.8, z = Math.sin(i * 7.233 + 4) * 14.8;
    const y = field.heightAt(x, z) - .025, h = .25 + .2 * (Math.sin(i * 3.7) * .5 + .5);
    for (let plane = 0; plane < 2; plane++) {
      const dx = plane === 0 ? .07 : 0, dz = plane === 1 ? .07 : 0;
      for (const [side, top] of [[-1,0],[1,0],[-1,1],[-1,1],[1,0],[1,1]]) {
        grassPositions.push(x + side! * dx, y + top! * h, z + side! * dz);
        weights.push(top!); phases.push(i * 2.37);
      }
    }
  }
  const grassGeometry = new BufferGeometry();
  grassGeometry.setAttribute('position', new Float32BufferAttribute(grassPositions, 3));
  grassGeometry.setAttribute('windWeight', new Float32BufferAttribute(weights, 1));
  grassGeometry.setAttribute('windPhase', new Float32BufferAttribute(phases, 1));
  grassGeometry.computeVertexNormals(); grassGeometry.computeBoundingBox(); grassGeometry.computeBoundingSphere();
  grassGeometry.boundingBox!.expandByScalar(.2); grassGeometry.boundingSphere!.radius += .2;
  const grassMaterial = new MeshStandardMaterial({ color: '#648044', roughness: 1, side: DoubleSide });
  const grassDepth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, side: DoubleSide });
  const windTime = { value: 0 };
  for (const m of [grassMaterial, grassDepth]) {
    m.userData.windTime = windTime;
    m.onBeforeCompile = shader => {
      shader.uniforms.windTime = windTime;
      shader.vertexShader = shader.vertexShader.replace('#include <common>',
        '#include <common>\nuniform float windTime;\nattribute float windWeight;\nattribute float windPhase;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.x += sin(windTime * 1.7 + windPhase) * .12 * windWeight;');
    };
    m.customProgramCacheKey = () => 'terrain-wind-v1';
  }
  const grass = new Mesh(grassGeometry, grassMaterial);
  grass.name = 'Wind grass'; grass.castShadow = true; grass.receiveShadow = true;
  grass.customDepthMaterial = grassDepth;
  // Decorative wind materials keep their compile hook during environment appearance overrides.
  grass.userData.preserveLightMaterial = true;
  grass.userData.cameraObstruction = false;
  grass.raycast = () => {};
  environment.add(grass);
  geometries.push(grassGeometry); materials.push(grassMaterial, grassDepth);
  let settings: TerrainSettings = { quality: 'standard', wind: true };
  let disposed = false;
  return {
    id: 'terrain', scene, environment, spawn: { x: 0, z: 5 }, cityFeatures: false,
    controls: sceneControlPolicy('open'),
    solar: {
      getSettings: () => ({ ...solarSettings }),
      configure(patch) {
        const next = { ...solarSettings, ...patch };
        if (disposed || !validSolar(next)) return false;
        solarSettings = next; syncSun(); return true;
      },
      getTime: () => preset,
      setTime(time) {
        if (disposed || !['day', 'evening', 'night'].includes(time)) return false;
        preset = time; solarSettings.enabled = false; syncSun(); return true;
      },
    },
    walkableWorld: { bounds: field.bounds, obstacles, groundHeight: (x, z) => field.heightAt(x, z),
      query: new GroundWorldQuery({bounds:{...field.bounds,minY:-2,maxY:14}, surfaces:[],terrain:field,
        solids:obstacles.map((o,i)=>({...o,id:`tree-trunk-${i}`,
          minY:field.heightAt((o.minX+o.maxX)/2,(o.minZ+o.maxZ)/2)-.05,
          maxY:field.heightAt((o.minX+o.maxX)/2,(o.minZ+o.maxZ)/2)+2.75}))}) },
    terrain: {
      getSettings: () => ({ ...settings }),
      configure(patch) {
        if (disposed || Object.keys(patch).some(key => !['quality', 'wind'].includes(key))) return false;
        const next = { ...settings, ...patch };
        if (!['standard', 'low'].includes(next.quality) || typeof next.wind !== 'boolean') return false;
        settings = next;
        grassGeometry.setDrawRange(0, (settings.quality === 'standard' ? 384 : 96) * 12);
        return true;
      },
    },
    update(delta, reducedMotion) {
      if (!disposed && settings.wind && !reducedMotion && Number.isFinite(delta)) windTime.value = (windTime.value + Math.max(0, Math.min(delta, .05))) % 10000;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      texture.dispose(); sun.dispose(); scene.clear();
    },
  };
}
