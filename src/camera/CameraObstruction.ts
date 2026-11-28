import { Box3, Mesh, PerspectiveCamera, Raycaster, Sphere, Vector3, type Group, type Material, type Object3D } from 'three';
import type { CameraSubject } from './CameraController';
import { FollowCamera } from './FollowCamera.ts';
import { SceneAppearance } from '../scene/SceneAppearance.ts';

export type ObstructionMode = 'zoom' | 'transparent' | 'wireframe' | 'xray';

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
  private readonly sightlineBounds = new Box3();
  private readonly meshSphere = new Sphere();
  private readonly blockersFound = new Set<Object3D>();
  private readonly hits: ReturnType<Raycaster['intersectObjects']> = [];
  get mode(): ObstructionMode { return this.selected; }
  constructor(private readonly environment: Group, prepareMaterial?: (material: Material) => void) {
    this.appearance = new SceneAppearance(environment, prepareMaterial, environment.userData.reuseCameraFadeMaterials === true);
  }

  setMode(mode: ObstructionMode): void {
    if (this.selected === mode) return;
    this.appearance.apply('normal');
    this.selected = mode;
  }
  update(desired: PerspectiveCamera, rendered: PerspectiveCamera, target: Vector3, subject: CameraSubject, delta: number, immediate: boolean, external = true, indoorBounds?: Box3, allowZoom = true): void {
    // Controls own desired; obstruction must never feed its compressed pose back.
    rendered.copy(desired, false);
    this.focus.set(subject.x, subject.y + subject.height * 0.65, subject.z);
    if (this.selected === 'zoom' && indoorBounds) {
      indoorBounds.clampPoint(rendered.position, rendered.position);
      if (external && !rendered.position.equals(desired.position)) rendered.lookAt(target);
    }
    const zoom = external && allowZoom && this.selected === 'zoom';
    const transparent = external && this.selected === 'transparent';
    if (zoom || transparent) {
      this.environment.updateWorldMatrix(true, true);
      this.visibleMeshes.length = 0;
      if (transparent) this.setSightlineBounds(rendered.position, subject);
      this.environment.traverseVisible(object => {
        if (!(object instanceof Mesh) || object.userData.cameraObstruction === false) return;
        if (!transparent || this.inSightlineBounds(object)) this.visibleMeshes.push(object);
      });
    }
    if (zoom) {
      this.probe.position.copy(rendered.position);
      this.constraint.constrain(this.probe, this.focus);
      const distance = rendered.position.distanceTo(this.focus);
      const destination = distance > 0 ? Math.min(1, this.probe.position.distanceTo(this.focus) / distance) : 1;
      const amount = immediate ? 1 : 1 - Math.exp(-8 * Math.min(Math.max(delta, 0), 0.05));
      // Apply tighter limits before rendering and smooth the return to the desired pose.
      this.fraction = Math.min(destination, this.fraction + (destination - this.fraction) * amount);
      if (Math.abs(destination - this.fraction) < 1e-8) this.fraction = destination;
      if (this.fraction < 1) {
        rendered.position.lerp(this.focus, 1 - this.fraction);
        this.aim.copy(target).lerp(this.focus, 1 - this.fraction);
        rendered.lookAt(this.aim);
      }
    } else this.fraction = 1;

    if (this.selected === 'wireframe') this.appearance.apply('wireframe');
    else if (transparent) this.appearance.apply('transparent', this.blockers(rendered.position, subject));
    else this.appearance.apply('normal');
    rendered.updateMatrixWorld(true);
  }
  private setSightlineBounds(camera: Vector3, subject: CameraSubject): void {
    // Enclose all five segments, including both shoulder offsets.
    const shoulder = subject.height * 0.18;
    this.sightlineBounds.min.set(subject.x - shoulder, subject.y + subject.height * 0.05, subject.z - shoulder);
    this.sightlineBounds.max.set(subject.x + shoulder, subject.y + subject.height * 0.98, subject.z + shoulder);
    this.sightlineBounds.expandByPoint(camera);
  }
  private inSightlineBounds(mesh: Mesh): boolean {
    // Custom raycasts and deformable meshes own their own intersection bounds.
    if (mesh.constructor !== Mesh || mesh.raycast !== Mesh.prototype.raycast || mesh.geometry.morphAttributes.position?.length)
      return true;
    if (mesh.geometry.boundingSphere === null) mesh.geometry.computeBoundingSphere();
    this.meshSphere.copy(mesh.geometry.boundingSphere!).applyMatrix4(mesh.matrixWorld);
    return this.sightlineBounds.intersectsSphere(this.meshSphere);
  }
  private blockers(camera: Vector3, subject: CameraSubject): Set<Object3D> {
    const result = this.blockersFound;
    result.clear();
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
      this.hits.length = 0;
      for (const hit of this.ray.intersectObjects(this.visibleMeshes, false, this.hits)) {
        let root = hit.object;
        while (root.parent && root.parent !== this.environment && !root.parent.userData.independentCameraBlockers)
          root = root.parent;
        result.add(root);
      }
    }
    this.hits.length = 0;
    return result;
  }
  dispose(): void { this.appearance.dispose(); this.fraction = 1; }
}
