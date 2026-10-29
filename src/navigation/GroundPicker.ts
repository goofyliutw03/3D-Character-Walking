import { PerspectiveCamera, Raycaster, Vector3 } from 'three';
import type { Object3D } from 'three';
import type { ScreenPoint } from '../camera/AnchorProjection';
import type { WalkableWorld } from '../character/motion';
import type { PointXZ } from './DestinationNavigation';
import { isWalkable } from './DestinationNavigation.ts';
import { screenRay } from '../camera/ScreenRay.ts';

export function pickGround(point: ScreenPoint, camera: PerspectiveCamera, width: number, height: number,
  fisheye: boolean, objects: readonly Object3D[], world: WalkableWorld): PointXZ | null {
  const ray = screenRay(point, camera, width, height, fisheye);
  if (!ray) return null;
  for (const object of objects) object.updateWorldMatrix(true, true);
  const caster = new Raycaster();
  caster.ray.copy(ray);
  const hit = caster.intersectObjects([...objects], true)[0];
  if (!hit || hit.object.userData.walkable !== true || !hit.face) return null;
  const depth = -hit.point.clone().applyMatrix4(camera.matrixWorldInverse).z;
  if (depth <= camera.near || depth >= camera.far) return null;
  const normal = new Vector3().copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
  if (normal.y < 0.9 || !isWalkable(hit.point, world)) return null;
  return { x: hit.point.x, z: hit.point.z };
}
