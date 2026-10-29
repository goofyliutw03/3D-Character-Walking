import { PerspectiveCamera, Quaternion, Ray, Raycaster, Vector2, Vector3 } from 'three';
import type { ScreenPoint } from './AnchorProjection';

export function screenRay(point: ScreenPoint, camera: PerspectiveCamera, width: number, height: number, fisheye: boolean): Ray | null {
  if (!Number.isFinite(point.x + point.y + width + height) || width <= 0 || height <= 0
    || point.x < 0 || point.x > width || point.y < 0 || point.y > height) return null;
  camera.updateMatrixWorld();
  if (!fisheye) {
    const raycaster = new Raycaster();
    raycaster.setFromCamera(new Vector2(point.x / width * 2 - 1, 1 - point.y / height * 2), camera);
    return raycaster.ray.clone();
  }
  const radius = Math.min(width, height) / 2;
  const x = (point.x - width / 2) / radius, y = (height / 2 - point.y) / radius;
  const r = Math.hypot(x, y);
  if (r > 1) return null;
  const theta = r * 80 * Math.PI / 180;
  const scale = r > 0 ? Math.sin(theta) / r : 0;
  const direction = new Vector3(x * scale, y * scale, -Math.cos(theta));
  direction.applyQuaternion(camera.getWorldQuaternion(new Quaternion())).normalize();
  return new Ray(camera.getWorldPosition(new Vector3()), direction);
}
