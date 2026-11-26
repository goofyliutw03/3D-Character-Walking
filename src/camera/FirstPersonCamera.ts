import { PerspectiveCamera, Vector3 } from 'three';
import type { MotionSnapshot } from '../character/motion';

export class FirstPersonCamera {
  update(camera: PerspectiveCamera, target: Vector3, state: Readonly<MotionSnapshot>, eyeHeight: number, eyeForward: number): void {
    if (camera.fov !== 70 || camera.near !== 0.04) {
      camera.fov = 70; camera.near = 0.04;
      camera.updateProjectionMatrix();
    }
    const forwardX = Math.sin(state.heading);
    const forwardZ = Math.cos(state.heading);
    camera.position.set(state.x + forwardX * eyeForward, state.y + eyeHeight, state.z + forwardZ * eyeForward);
    target.set(camera.position.x + forwardX * 10, camera.position.y, camera.position.z + forwardZ * 10);
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
  }
  restoreProjection(camera: PerspectiveCamera): void {
    camera.fov = 43; camera.near = 0.1;
    camera.updateProjectionMatrix();
  }
}
