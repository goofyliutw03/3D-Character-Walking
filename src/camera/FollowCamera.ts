import { PerspectiveCamera, Raycaster, Vector3, type Object3D } from 'three';
import type { MotionSnapshot } from '../character/motion';

export class FollowCamera {
  private readonly destination = new Vector3();
  private readonly focus = new Vector3();
  private readonly ray = new Raycaster();
  private readonly direction = new Vector3();
  constructor(private readonly obstructions: Object3D[] = []) {}
  update(camera: PerspectiveCamera, target: Vector3, state: Readonly<MotionSnapshot>, height: number, delta: number, immediate: boolean): void {
    this.focus.set(state.x, state.y + height * 0.65, state.z);
    this.destination.set(state.x - Math.sin(state.heading) * 6, state.y + height + 3, state.z - Math.cos(state.heading) * 6);
    const amount = immediate ? 1 : 1 - Math.exp(-6 * Math.min(Math.max(delta, 0), 0.05));
    target.lerp(this.focus, amount);
    camera.position.lerp(this.destination, amount);
    this.constrain(camera, target);
    camera.lookAt(target);
  }
  constrain(camera: PerspectiveCamera, target: Vector3): void {
    this.direction.subVectors(camera.position, target);
    const distance = this.direction.length();
    if (distance > 0) {
      this.direction.normalize();
      this.ray.set(target, this.direction);
      this.ray.far = distance;
      const hit = this.ray.intersectObjects(this.obstructions, true).find(hit => hit.object.userData.cameraObstruction !== false);
      if (hit) camera.position.copy(target).addScaledVector(this.direction, Math.max(0.4, hit.distance - 0.25));
    }
  }
}
