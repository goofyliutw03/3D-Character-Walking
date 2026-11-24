import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Group, Points, ShaderMaterial, SpotLight, type Camera } from 'three';
import { defaultHeadlamp, headlampRanges, validHeadlamp, type HeadlampSettings } from './HeadlampSettings.ts';

interface HeadlampPose { x: number; y: number; z: number; heading: number; height: number }

export class Headlamp {
  readonly group = new Group();
  private readonly light = new SpotLight();
  private readonly geometry = new BufferGeometry();
  private readonly material = new ShaderMaterial({
    uniforms: {
      clock: { value: 0 },
      range: { value: 0 },
      spread: { value: 0 },
      tint: { value: this.light.color },
      brightness: { value: 0 },
    },
    vertexShader: `
      uniform float clock, range, spread;
      varying float fade;
      void main() {
        float age = fract(position.x + clock * (0.22 + position.y * 0.3));
        float angle = position.z * 6.28318 + age * (position.y - 0.5) * 1.6;
        float slope = spread * (0.75 * sqrt(position.x) + 0.15 * sin(age * 3.14159));
        float depth = range * (0.16 + 0.65 * position.y + 0.13 * age) * inversesqrt(1.0 + slope * slope);
        float radius = depth * slope;
        vec4 view = modelViewMatrix * vec4(cos(angle) * radius, sin(angle) * radius, depth, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(14.0 / max(-view.z, 0.1), 1.0, 4.0);
        fade = sin(age * 3.14159);
      }`,
    fragmentShader: `
      uniform vec3 tint;
      uniform float brightness;
      varying float fade;
      void main() {
        float dotMask = 1.0 - smoothstep(0.05, 0.5, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(tint, dotMask * fade * brightness);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  private readonly dust = new Points(this.geometry, this.material);
  private settings = { ...defaultHeadlamp };
  private reducedMotion = false;

  constructor() {
    this.group.name = 'Character headlamp';
    this.group.userData.cameraObstruction = false;
    this.light.target.position.z = 1;
    this.dust.name = 'Headlamp dust';
    this.dust.frustumCulled = false;
    this.geometry.setAttribute('position', new Float32BufferAttribute(
      Array.from({ length: headlampRanges.density.max * 3 }, () => Math.random()), 3,
    ));
    this.group.add(this.light, this.light.target, this.dust);
    this.configure({});
  }

  getSettings(): HeadlampSettings { return { ...this.settings }; }

  configure(patch: Partial<HeadlampSettings>): boolean {
    const next = { ...this.settings, ...patch };
    if (!validHeadlamp(next)) return false;
    this.settings = next;
    this.group.visible = next.enabled && next.intensity > 0;
    this.light.color.set(next.color);
    this.light.intensity = next.intensity;
    this.light.distance = next.distance;
    this.light.angle = next.fov * Math.PI / 360;
    this.light.penumbra = next.softness;
    this.material.uniforms.range!.value = next.distance;
    this.material.uniforms.spread!.value = Math.tan(this.light.angle);
    this.material.uniforms.brightness!.value = Math.min(1, next.intensity / 100) * .65;
    this.geometry.setDrawRange(0, next.density);
    this.syncDust();
    return true;
  }

  update(pose: HeadlampPose, delta: number, reducedMotion: boolean, camera?: Camera): void {
    this.group.position.set(
      pose.x + Math.sin(pose.heading) * .25,
      pose.y + pose.height * .9,
      pose.z + Math.cos(pose.heading) * .25,
    );
    this.group.rotation.y = pose.heading;
    this.group.rotation.x = 0;
    this.group.rotation.z = 0;
    if (camera) {
      this.group.position.copy(camera.position);
      this.group.quaternion.copy(camera.quaternion);
      // SpotLight and dust use local +Z; camera forward is local -Z.
      this.group.rotateY(Math.PI);
    }
    this.reducedMotion = reducedMotion;
    this.syncDust();
    if (this.dust.visible) this.material.uniforms.clock!.value += delta * this.settings.speed;
  }

  private syncDust(): void {
    this.dust.visible = this.group.visible && this.settings.dust && this.settings.density > 0 && !this.reducedMotion;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.group.clear();
    this.geometry.dispose();
    this.material.dispose();
    this.light.dispose();
  }
}
