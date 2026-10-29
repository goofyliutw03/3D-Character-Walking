import { Mesh, PerspectiveCamera, Raycaster, Vector3, type Group, type Object3D } from 'three';
import type { CameraSubject } from './CameraController';
import { FollowCamera } from './FollowCamera.ts';
import { SceneAppearance } from '../scene/SceneAppearance.ts';

export type ObstructionMode = 'zoom' | 'transparent' | 'wireframe';

export class CameraObstruction {
  private selected: ObstructionMode = 'zoom';
  private fraction = 1;
  private readonly appearance: SceneAppearance;
  private readonly visibleMeshes: Object3D[] = [];
  private readonly constraint = new FollowCamera(this.visibleMeshes);
  private readonly probe = new PerspectiveCamera();
  private readonly focus = new Vector3();
  private readonly aim = new Vector3();
  private readonly origin = new Vector3();
  private readonly direction = new Vector3();
  private readonly ray = new Raycaster();
  get mode(): ObstructionMode { return this.selected; }
  constructor(private readonly environment: Group) { this.appearance = new SceneAppearance(environment); }

  setMode(mode: ObstructionMode): void {
    if (this.selected === mode) return;
    this.appearance.apply('normal');
    this.selected = mode;
  }
  update(desired: PerspectiveCamera, rendered: PerspectiveCamera, target: Vector3, subject: CameraSubject, delta: number, immediate: boolean, external = true): void {
    // Controls own desired; obstruction must never feed its compressed pose back.
    rendered.copy(desired, false);
    this.focus.set(subject.x, subject.y + subject.height * 0.65, subject.z);
    let destination = 1;
    if (external) {
      this.environment.updateWorldMatrix(true, true);
      this.visibleMeshes.length = 0;
      this.environment.traverseVisible(object => { if (object instanceof Mesh) this.visibleMeshes.push(object); });
      if (this.selected === 'zoom') {
        this.probe.position.copy(desired.position);
        this.constraint.constrain(this.probe, this.focus);
        const distance = desired.position.distanceTo(this.focus);
        if (distance > 0) destination = Math.min(1, this.probe.position.distanceTo(this.focus) / distance);
      }
      const amount = immediate ? 1 : 1 - Math.exp(-8 * Math.min(Math.max(delta, 0), 0.05));
      this.fraction += (destination - this.fraction) * amount;
      if (Math.abs(destination - this.fraction) < 1e-8) this.fraction = destination;
      if (this.fraction < 1) {
        rendered.position.lerpVectors(this.focus, desired.position, this.fraction);
        this.aim.copy(target).lerp(this.focus, 1 - this.fraction);
        rendered.lookAt(this.aim);
      }
    } else this.fraction = 1;

    if (this.selected === 'wireframe') this.appearance.apply('wireframe');
    else if (external && this.selected === 'transparent') this.appearance.apply('transparent', this.blockers(rendered.position, subject));
    else this.appearance.apply('normal');
    rendered.updateMatrixWorld(true);
  }
  private blockers(camera: Vector3, subject: CameraSubject): Set<Object3D> {
    const result = new Set<Object3D>();
    const dx = camera.x - subject.x, dz = camera.z - subject.z;
    const horizontal = Math.hypot(dx, dz) || 1;
    const shoulder = subject.height * 0.18;
    for (const [height, side] of [[0.05, 0], [0.65, 0], [0.98, 0], [0.65, -1], [0.65, 1]] as const) {
      this.origin.set(subject.x + dz / horizontal * shoulder * side, subject.y + subject.height * height, subject.z - dx / horizontal * shoulder * side);
      this.direction.subVectors(camera, this.origin);
      const distance = this.direction.length();
      if (distance < 0.02) continue;
      this.ray.set(this.origin, this.direction.divideScalar(distance));
      this.ray.near = 0.01; this.ray.far = distance;
      for (const hit of this.ray.intersectObjects(this.visibleMeshes, false)) {
        let root = hit.object;
        while (root.parent && root.parent !== this.environment) root = root.parent;
        if (root.parent === this.environment) result.add(root);
      }
    }
    return result;
  }
  dispose(): void { this.appearance.dispose(); this.fraction = 1; }
}
