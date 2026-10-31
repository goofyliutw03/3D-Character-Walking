import { Matrix4, Mesh, Raycaster, Vector3, type Object3D, type PerspectiveCamera } from 'three';

/** Local spray volume and its host transform; callers may reuse the snapshot. */
export interface SpraySource {
  matrixWorld: Matrix4;
  center: Vector3;
  halfSize: Vector3;
}
export function createSpraySource(): SpraySource {
  return { matrixWorld:new Matrix4(), center:new Vector3(0,1.1,-.85), halfSize:new Vector3(.65,.9,.35) };
}

/** Reuses scratch vectors; physical barriers remain barriers in display override modes. */
export class SprayExposure {
  private readonly inverse=new Matrix4();
  private readonly cameraPosition=new Vector3();
  private readonly local=new Vector3();
  private readonly closest=new Vector3();
  private readonly minimum=new Vector3();
  private readonly origin=new Vector3();
  private readonly direction=new Vector3();
  private readonly ray=new Raycaster();
  sample(camera: PerspectiveCamera, source: SpraySource, environment: Object3D, near=1, far=3): number {
    camera.updateWorldMatrix(true,false);
    this.cameraPosition.setFromMatrixPosition(camera.matrixWorld);
    this.inverse.copy(source.matrixWorld).invert();
    this.local.copy(this.cameraPosition).applyMatrix4(this.inverse);
    // Only the front hemisphere of the cascade emits; a turned camera can still get wet.
    const front=Math.min(1,Math.max(0,(this.local.z-(source.center.z-.35))/.5));
    if(front===0) return 0;
    this.minimum.copy(source.halfSize).negate();
    this.closest.copy(this.local).sub(source.center).clamp(this.minimum,source.halfSize).add(source.center);
    this.closest.applyMatrix4(source.matrixWorld);
    const distance=this.closest.distanceTo(this.cameraPosition);
    if(distance>=far) return 0;
    const t=Math.min(1,Math.max(0,(distance-near)/(far-near)));
    const strength=(1-t*t*(3-2*t))*front;
    this.origin.copy(source.center).applyMatrix4(source.matrixWorld);
    this.direction.subVectors(this.cameraPosition,this.origin);
    const length=this.direction.length();
    if(length<.01) return strength;
    this.direction.divideScalar(length);this.ray.set(this.origin,this.direction);this.ray.far=Math.max(0,length-.05);
    environment.updateWorldMatrix(true,true);
    // Raycast meshes only: Points raycasting is unnecessary and allocates many hits.
    let blocked=false;
    environment.traverseVisible(object=>{
      if(blocked || !(object instanceof Mesh)) return;
      for(let parent:Object3D|null=object;parent;parent=parent.parent) {
        if(!parent.visible || parent.userData.cameraObstruction===false) return;
      }
      if(this.ray.intersectObject(object,false).length) blocked=true;
    });
    return blocked?0:strength;
  }
}
