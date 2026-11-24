import { AdditiveBlending, BoxGeometry, BufferGeometry, Color, ConeGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, OctahedronGeometry, PointLight, Points, ShaderMaterial, SpotLight } from 'three';
import { environmentLight, type EnvironmentLight } from './EnvironmentLights.ts';
import type { Environment } from './SceneSwitch';
import { solarPosition, validSolar, type SolarSettings } from './SolarPosition.ts';
import type { TimeOfDay } from './CityScene';

export function createSkylight(ceiling: number, halfOpening: number) {
  const group = new Group();
  group.name = 'Skylight';
  const sun = new SpotLight('#fff2d4', 140, 24, .27, .75);
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new ShaderMaterial({
    uniforms: { strength: { value: 0 }, tint: { value: new Color() } },
    vertexShader: `
      varying vec3 local;
      void main() {
        local = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 local;
      uniform float strength;
      uniform vec3 tint;
      void main() {
        float grain = 0.8 + 0.2 * sin(28.0 * (local.x + local.z));
        gl_FragColor = vec4(tint, strength * grain * smoothstep(-0.5, 0.45, local.y));
      }`,
    side: DoubleSide, transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const beam = new Mesh(geometry, material);
  beam.name = 'Sun shaft';
  beam.userData.cameraObstruction = false;
  beam.userData.preserveLightMaterial = true;
  beam.matrixAutoUpdate = false;
  beam.frustumCulled = false;
  group.add(sun, sun.target, beam);
  let settings: SolarSettings = { enabled: true, hour: 12, season: 'spring', latitude: 25 };
  let preset: TimeOfDay = 'day';
  let lightSettings = { enabled: true, intensity: 1, color: '#fff2d4', effects: true };
  const control = environmentLight('sun', 'Skylight', 'sun', 2, lightSettings, state => {
    lightSettings = { ...state };
    sync();
  });

  function sync(): void {
    const hour = settings.enabled ? settings.hour : { day: 12, evening: 17, night: 0 }[preset];
    const direction = solarPosition(hour, settings.season, settings.latitude);
    const dx = direction.x / Math.max(direction.y, .001);
    const dz = direction.z / Math.max(direction.y, .001);
    // Intersect the top opening projected through the one-meter roof with the lower opening.
    const spanX = 2 * halfOpening - Math.abs(dx);
    const spanZ = 2 * halfOpening - Math.abs(dz);
    const visible = direction.y > 0 && spanX > 0 && spanZ > 0;
    sun.visible = visible && lightSettings.enabled;
    beam.visible = sun.visible && lightSettings.effects && lightSettings.intensity > 0;
    sun.color.set(lightSettings.color);
    material.uniforms.tint!.value.set(lightSettings.color);
    if (!visible) return;
    const x = -dx / 2, z = -dz / 2;
    sun.position.set(x, ceiling - .01, z);
    sun.target.position.set(x - dx * ceiling, 0, z - dz * ceiling);
    sun.intensity = lightSettings.intensity * 210 * direction.y * (spanX * spanZ) / (4 * halfOpening ** 2);
    material.uniforms.strength!.value = lightSettings.intensity * .09 * Math.sqrt(direction.y);
    beam.matrix.set(
      spanX, dx * ceiling, 0, x - dx * ceiling / 2,
      0, ceiling, 0, ceiling / 2,
      0, dz * ceiling, spanZ, z - dz * ceiling / 2,
      0, 0, 0, 1,
    );
    beam.matrixWorldNeedsUpdate = true;
  }
  const solar: NonNullable<Environment['solar']> = {
    getSettings: () => ({ ...settings }),
    configure(patch) {
      const next = { ...settings, ...patch };
      if (!validSolar(next)) return false;
      settings = next;
      sync();
      return true;
    },
    getTime: () => preset,
    setTime(time) {
      if (time !== 'day' && time !== 'evening' && time !== 'night') return false;
      preset = time;
      return solar.configure({ enabled: false });
    },
  };
  sync();
  return { group, solar, control, dispose() { geometry.dispose(); material.dispose(); sun.dispose(); } };
}

export function createCaveFixtures() {
  const group = new Group();
  group.name = 'Cave fixtures';
  const handle = new BoxGeometry(.11, .7, .11);
  const flame = new ConeGeometry(.17, .53, 6);
  const crystal = new OctahedronGeometry(.32);
  const wood = new MeshStandardMaterial({ color: '#594033', roughness: .95 });
  const ore = new MeshStandardMaterial({ color: '#26505b', roughness: .62 });
  const clock = { value: 0 };
  const resources: Array<BufferGeometry | ShaderMaterial> = [];
  const controls: EnvironmentLight[] = [];
  const updates: Array<(reducedMotion: boolean) => void> = [];

  for (const kind of ['torch', 'crystal'] as const) {
    const torch = kind === 'torch';
    const sites = torch
      ? [[-10.5, 12], [-10.5, 6], [-10.5, 0], [-10.5, -6], [-10.5, -12],
        [10.5, 12], [10.5, 6], [10.5, 0], [10.5, -6], [10.5, -12]]
      : [[-8, 13], [-4, 14], [3, 13], [8, 12], [-8, 8], [7, 8], [-9, 4], [-5, 2], [6, 4], [9, 1],
        [-8, -3], [-2, -3], [5, -3], [8, -6], [-8, -8], [-4, -9], [2, -8], [-7, -13], [1, -13], [7, -13]];
    const minimum = torch ? 5 : 13;
    const order = sites.map((_, index) => index);
    for (let i = 0; i < minimum; i++) {
      const pick = i + Math.floor(Math.random() * (order.length - i));
      [order[i], order[pick]] = [order[pick]!, order[i]!];
    }
    const guaranteed = new Set(order.slice(0, minimum));
    const color = new Color(torch ? '#ff8732' : '#45e7ff');
    for (const [index, [x, z]] of sites.entries()) {
      const phase = Math.random() * 6.28;
      const lit = guaranteed.has(index) || Math.random() < .5;
      const fixture = new Group();
      fixture.name = torch ? 'Torch' : 'Crystal cluster';
      fixture.position.set(x!, torch ? 2.1 : .38, z!);
      const base = new Mesh(torch ? handle : crystal, torch ? wood : ore);
      base.position.y = torch ? -.32 : -.11;
      if (!torch) base.scale.set(1.3, 1.55, .95);
      fixture.add(base);
      group.add(fixture);
      const tint = color.clone();
      const fixtureClock = { value: 0 };

      const glow = new ShaderMaterial({
        uniforms: { clock: fixtureClock, phase: { value: phase }, tint: { value: tint } },
        vertexShader: `
          varying vec3 local;
          void main() {
            local = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 local;
          uniform float clock, phase;
          uniform vec3 tint;
          void main() {
            float pulse = 0.76 + 0.22 * sin(clock * 5.0 + phase + local.y * 10.0);
            gl_FragColor = vec4(mix(tint, vec3(1.0), pulse * (0.4 - local.y)), 1.0);
            #include <colorspace_fragment>
          }`,
      });
      const core = new Mesh(torch ? flame : crystal, glow);
      core.position.y = torch ? .15 : .09;
      core.userData.cameraObstruction = false;
      core.userData.preserveLightMaterial = true;
      fixture.add(core);
      const particles = new BufferGeometry();
      const seeds = Array.from({ length: 54 }, () => Math.random());
      particles.setAttribute('position', new Float32BufferAttribute(seeds, 3));
      const spark = new ShaderMaterial({
        uniforms: { clock: fixtureClock, tint: { value: tint }, rise: { value: torch ? 1 : .55 } },
        transparent: true, depthWrite: false, blending: AdditiveBlending,
        vertexShader: `
          uniform float clock, rise;
          varying float fade;
          void main() {
            float age = fract(position.y + clock * (0.4 + position.z * 0.3));
            float angle = position.x * 6.283 + age * 2.0;
            float radius = 0.08 + 0.32 * age * position.z;
            vec3 offset = vec3(cos(angle) * radius, age * rise, sin(angle) * radius);
            vec4 view = modelViewMatrix * vec4(offset, 1.0);
            gl_Position = projectionMatrix * view;
            gl_PointSize = clamp(24.0 / -view.z, 1.0, 6.0);
            fade = sin(age * 3.14159);
          }`,
        fragmentShader: `
          uniform vec3 tint;
          varying float fade;
          void main() {
            float alpha = 1.0 - smoothstep(0.05, 0.5, length(gl_PointCoord - 0.5));
            gl_FragColor = vec4(tint, alpha * fade);
          }`,
      });
      const motes = new Points(particles, spark);
      motes.frustumCulled = false;
      const light = new PointLight(color, torch ? 24 : 15, 8);
      light.position.y = .25;
      fixture.add(motes, light);
      let state = { enabled: lit, intensity: 1, color: torch ? '#ff8732' : '#45e7ff', effects: true };
      let reduced = false;
      const apply = () => {
        tint.set(state.color);
        light.color.copy(tint);
        light.visible = state.enabled;
        core.visible = state.enabled && state.intensity > 0;
        motes.visible = core.visible && state.effects && !reduced;
        fixtureClock.value = state.effects && !reduced ? clock.value : 0;
        light.intensity = (torch ? 24 : 15) * state.intensity
          * (state.effects && !reduced ? 1 + .14 * Math.sin(clock.value * 9 + phase) : 1);
      };
      controls.push(environmentLight(kind + '-' + (index + 1), (torch ? 'Torch ' : 'Crystal ') + (index + 1),
        kind, 3, state, next => { state = { ...next }; apply(); }));
      updates.push(value => { reduced = value; apply(); });
      resources.push(glow, particles, spark);
    }
  }
  return {
    group, controls,
    update(delta: number, reducedMotion: boolean) {
      if (!reducedMotion) clock.value += delta;
      for (const update of updates) update(reducedMotion);
    },
    dispose() {
      for (const resource of [handle, flame, crystal, wood, ore, ...resources]) resource.dispose();
    },
  };
}
