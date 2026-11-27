import {
  BoxGeometry, Color, DirectionalLight, DoubleSide, Fog, Group, HemisphereLight,
  Mesh, MeshStandardMaterial, PlaneGeometry, Scene, ShaderMaterial,
} from 'three';
import { PoolWorldQuery, pool, poolGeometry } from '../world/PoolWorldQuery.ts';
import type { Environment } from './SceneSwitch.ts';
import { sceneControlPolicy } from './SceneControlPolicy.ts';
import { solarPosition, validSolar, type SolarSettings } from './SolarPosition.ts';
import type { TimeOfDay } from './CityScene.ts';

export function createPool(): Environment {
  const scene = new Scene();
  const environment = new Group();
  environment.name = 'Bounded pool';
  scene.add(environment);
  const sky = new Color('#b6dcea');
  const underwater = new Color('#267f91');
  const haze = new Fog(sky, 28, 75);
  scene.background = sky;
  scene.fog = haze;
  const hemisphere = new HemisphereLight('#e0f7ff', '#5b887f', 2);
  const sun = new DirectionalLight('#fff0cb', 2.4);
  scene.add(hemisphere, sun);

  const query = new PoolWorldQuery();
  const deck = new MeshStandardMaterial({ color: '#cfccb9', roughness: .85 });
  const floor = new MeshStandardMaterial({ color: '#52a0ab', roughness: .73 });
  const solids = poolGeometry.solids.map(box => {
    const geometry = new BoxGeometry(box.maxX - box.minX, box.maxY - box.minY, box.maxZ - box.minZ);
    const mesh = new Mesh(geometry, box.id === 'pool-floor' ? floor : deck);
    mesh.name = box.id;
    mesh.position.set((box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2, (box.minZ + box.maxZ) / 2);
    environment.add(mesh);
    return mesh;
  });
  const marker = new Mesh(new PlaneGeometry(pool.exitHalfWidth * 2, 1.2),
    new MeshStandardMaterial({ color: '#ce7c33' }));
  marker.name = 'Climb-out zone';
  marker.rotation.x = -Math.PI / 2;
  marker.position.set(0, pool.deck + .005, pool.maxZ + .6);
  marker.userData.cameraObstruction = false;
  marker.raycast = () => {};
  environment.add(marker);

  const clock = { value: query.time };
  const water = new Mesh(new PlaneGeometry(pool.maxX - pool.minX, pool.maxZ - pool.minZ),
    new ShaderMaterial({
      side: DoubleSide, transparent: true, depthWrite: false,
      uniforms: { clock },
      vertexShader: `
        varying vec2 local;
        void main() {
          local = position.xy;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float clock;
        varying vec2 local;
        void main() {
          float ripples = sin(local.x * 7.0 + local.y * 3.0 + clock * 2.0)
            * sin(local.y * 5.0 - local.x * 2.0 - clock * 1.3);
          gl_FragColor = vec4(mix(vec3(.09, .52, .64), vec3(.42, .82, .87),
            smoothstep(.55, 1.0, ripples)), .42);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }));
  water.name = 'Pool water surface';
  water.rotation.x = -Math.PI / 2;
  water.position.y = query.waterAt({ x: 0, y: 0, z: 0 })!.height;
  water.userData.cameraObstruction = false;
  water.userData.preserveLightMaterial = true;
  water.raycast = () => {};
  environment.add(water);

  let solar: SolarSettings = { enabled: false, hour: 12, season: 'spring', latitude: 25 };
  let time: TimeOfDay = 'day';
  const light = (): void => {
    const direction = solarPosition(solar.enabled ? solar.hour : { day: 12, evening: 17, night: 0 }[time],
      solar.season, solar.latitude);
    sun.position.set(direction.x * 20, direction.y * 20, direction.z * 20);
    sun.intensity = Math.max(0, direction.y) * 2.4;
    hemisphere.intensity = .65 + Math.max(0, direction.y) * 1.35;
    sky.set(direction.y > .15 ? '#b6dcea' : direction.y > 0 ? '#d9a889' : '#253754');
  };
  light();

  return {
    id: 'pool', scene, environment, spawn: { x: 0, y: pool.deck, z: pool.exitZ }, cityFeatures: false,
    controls: sceneControlPolicy('open', { groundNavigation: false }),
    walkableWorld: {
      bounds: poolGeometry.bounds, obstacles: [], query,
      groundHeight: (x, z) => {
        const surface = query.surfaceSample({ x, y: pool.deck, z });
        return surface.ok ? surface.value.height : pool.bottom;
      },
    },
    solar: {
      getSettings: () => ({ ...solar }),
      configure(patch) {
        const next = { ...solar, ...patch };
        if (!validSolar(next)) return false;
        solar = next;
        light();
        return true;
      },
      getTime: () => time,
      setTime(next) {
        if (!['day', 'evening', 'night'].includes(next)) return false;
        time = next;
        solar.enabled = false;
        light();
        return true;
      },
    },
    update(delta, reducedMotion) {
      if (!reducedMotion) query.advance(delta);
      clock.value = query.time;
    },
    updateCamera(position) {
      const wet = query.waterAt(position)?.submerged ?? false;
      scene.background = wet ? underwater : sky;
      haze.color.copy(scene.background);
      haze.near = wet ? .45 : 28;
      haze.far = wet ? 12 : 75;
    },
    dispose() {
      for (const mesh of solids) mesh.geometry.dispose();
      for (const mesh of [marker, water]) { mesh.geometry.dispose(); mesh.material.dispose(); }
      deck.dispose();
      floor.dispose();
      sun.dispose();
      scene.clear();
    },
  };
}
