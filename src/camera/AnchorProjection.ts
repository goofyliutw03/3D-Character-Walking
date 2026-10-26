import { PerspectiveCamera, Vector3 } from 'three';

export interface ScreenPoint { x: number; y: number }
const local = new Vector3();
const halfFov = 80 * Math.PI / 180;

export function projectAnchor(point: Vector3, camera: PerspectiveCamera, width: number, height: number, fisheye: boolean): ScreenPoint | null {
  if (!Number.isFinite(width + height) || width <= 0 || height <= 0) return null;
  camera.updateMatrixWorld();
  local.copy(point).applyMatrix4(camera.matrixWorldInverse);
  const depth = -local.z;
  if (!Number.isFinite(local.x + local.y + depth) || depth <= camera.near || depth >= camera.far) return null;
  if (fisheye) {
    const radial = Math.hypot(local.x, local.y);
    const r = Math.atan2(radial, depth) / halfFov;
    if (r > 1) return null;
    const scale = radial > 0 ? r * Math.min(width, height) / 2 / radial : 0;
    return { x: width / 2 + local.x * scale, y: height / 2 - local.y * scale };
  }
  local.applyMatrix4(camera.projectionMatrix);
  if (Math.abs(local.x) > 1 || Math.abs(local.y) > 1) return null;
  return { x: (local.x + 1) * width / 2, y: (1 - local.y) * height / 2 };
}
