import { BoxGeometry, FrontSide, Matrix3, Matrix4, Mesh, PerspectiveCamera, Ray, Raycaster, Vector3 } from 'three';
import type { Object3D } from 'three';
import type { ScreenPoint } from '../camera/AnchorProjection';
import type { WalkableWorld } from '../character/motion';
import type { PointXZ } from './DestinationNavigation';
import { isWalkable } from './DestinationNavigation.ts';
import { screenRay } from '../camera/ScreenRay.ts';

const declaredBoxes = new WeakSet<Mesh>();
/** Declare an undeformed box's finite top as walkable. Rebuild the picker after geometry changes. */
export function declareGroundBox(mesh: Mesh): void {
  mesh.userData.walkable = true;
  if (mesh.geometry instanceof BoxGeometry) declaredBoxes.add(mesh);
}

function visible(object: Object3D): boolean {
  for (let current: Object3D | null = object; current; current = current.parent) {
    if (!current.visible) return false;
  }
  return true;
}

function materialVisible(mesh: Mesh, index = 0): boolean {
  return (Array.isArray(mesh.material) ? mesh.material[index] : mesh.material)?.visible === true;
}

/** Static surface candidates belong to one scene. Dynamic actor roots are supplied per pick. */
export class GroundPicker {
  private readonly surfaces: Mesh[] = [];
  private readonly blockers: Object3D[] = [];
  private readonly caster = new Raycaster();
  private readonly localRay = new Ray();
  private readonly inverse = new Matrix4();
  private readonly normalMatrix = new Matrix3();

  constructor(private readonly objects: readonly Object3D[], private readonly strategy: 'auto' | 'raycast' = 'auto') {
    const seen = new Set<Object3D>();
    for (const root of objects) root.traverse(object => {
      if (seen.has(object)) return;
      seen.add(object);
      if (object.userData.groundPickBlocker === true) this.blockers.push(object);
      if (object instanceof Mesh && object.userData.walkable === true) this.surfaces.push(object);
    });
    const triangles = this.surfaces.reduce((sum, mesh) => sum +
      (mesh.geometry.index?.count ?? mesh.geometry.getAttribute('position')?.count ?? 0) / 3, 0);
    if (strategy === 'auto' && (this.surfaces.length >= 16 || triangles >= 2048)) {
      for (const mesh of this.surfaces) if (!declaredBoxes.has(mesh)) mesh.geometry.computeBoundingBox();
    }
  }

  pick(point: ScreenPoint, camera: PerspectiveCamera, width: number, height: number,
    fisheye: boolean, world: WalkableWorld, blockers: readonly Object3D[] = [], penetrateEnvironment = true): PointXZ | null {
    const ray = screenRay(point, camera, width, height, fisheye);
    if (!ray) return null;
    this.caster.ray.copy(ray);
    let nearest = Infinity;
    let result: PointXZ | null = null;
    const accept = (position: Vector3, normal: Vector3): void => {
      const distance = ray.origin.distanceTo(position);
      const depth = -position.clone().applyMatrix4(camera.matrixWorldInverse).z;
      if (distance >= nearest || depth <= camera.near || depth >= camera.far
        || normal.y < .9 || !isWalkable(position, world)) return;
      nearest = distance;
      result = { x: position.x, z: position.z };
    };
    if (!penetrateEnvironment) {
      // Restore the original first-environment-hit rule when penetration is disabled.
      for (const object of this.objects) object.updateWorldMatrix(true, true);
      const hit = this.caster.intersectObjects([...this.objects], true)[0];
      if (!hit?.face || hit.object.userData.walkable !== true) return null;
      accept(hit.point, hit.face.normal.clone().applyNormalMatrix(this.normalMatrix.getNormalMatrix(hit.object.matrixWorld)));
    }
    for (const mesh of penetrateEnvironment ? this.surfaces : []) {
      if (!visible(mesh)) continue;
      mesh.updateWorldMatrix(true, false);
      if (Math.abs(mesh.matrixWorld.determinant()) < 1e-12) continue;
      const topNormal = new Vector3(0, 1, 0).applyNormalMatrix(this.normalMatrix.getNormalMatrix(mesh.matrixWorld));
      if (this.strategy === 'auto' && declaredBoxes.has(mesh) && mesh.geometry instanceof BoxGeometry
        && topNormal.y >= .9 && !Array.isArray(mesh.material) && mesh.material.side === FrontSide && mesh.material.visible) {
        const { width: w, height: h, depth: d } = mesh.geometry.parameters;
        this.inverse.copy(mesh.matrixWorld).invert();
        this.localRay.copy(ray).applyMatrix4(this.inverse);
        if (ray.direction.dot(topNormal) >= -1e-10) continue;
        const t = (h / 2 - this.localRay.origin.y) / this.localRay.direction.y;
        if (!Number.isFinite(t) || t < 0) continue;
        const hit = this.localRay.at(t, new Vector3());
        if (Math.abs(hit.x) > w / 2 || Math.abs(hit.z) > d / 2) continue;
        accept(hit.applyMatrix4(mesh.matrixWorld), topNormal);
      } else {
        for (const hit of this.caster.intersectObject(mesh, false)) {
          if (!hit.face || !materialVisible(mesh, hit.face.materialIndex)) continue;
          const normal = hit.face.normal.clone().applyNormalMatrix(this.normalMatrix.getNormalMatrix(mesh.matrixWorld));
          accept(hit.point, normal);
        }
      }
    }
    if (!result) return null;
    this.caster.far = nearest + 1e-6;
    const seen = new Set<Object3D>();
    try {
      for (const root of [...this.blockers, ...blockers]) {
        if (!visible(root)) continue;
        root.updateWorldMatrix(true, false);
        // updateMatrixWorld also refreshes SkinnedMesh.bindMatrixInverse.
        root.updateMatrixWorld(true);
        const meshes: Mesh[] = [];
        root.traverseVisible(object => {
          if (object instanceof Mesh && !seen.has(object)) { seen.add(object); meshes.push(object); }
        });
        for (const mesh of meshes) {
          // Animated meshes can outgrow a previously cached bound.
          if ('isSkinnedMesh' in mesh && mesh.isSkinnedMesh) {
            const skinned = mesh as import('three').SkinnedMesh;
            skinned.skeleton.update(); skinned.computeBoundingSphere(); skinned.computeBoundingBox();
          }
          for (const hit of this.caster.intersectObject(mesh, false)) {
            if (!materialVisible(mesh, hit.face?.materialIndex)) continue;
            const depth = -hit.point.clone().applyMatrix4(camera.matrixWorldInverse).z;
            if (depth > camera.near && depth < camera.far) return null;
          }
        }
      }
    } finally { this.caster.far = Infinity; }
    return result;
  }
}

export function pickGround(point: ScreenPoint, camera: PerspectiveCamera, width: number, height: number,
  fisheye: boolean, objects: readonly Object3D[], world: WalkableWorld): PointXZ | null {
  return new GroundPicker(objects).pick(point, camera, width, height, fisheye, world);
}
