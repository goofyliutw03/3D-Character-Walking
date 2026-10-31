import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { WaterFeature, type WaterSettings, type SpraySource } from '../water/index.ts';
import type { WalkableBounds } from '../character/motion';

export const streetWaterBounds: Readonly<WalkableBounds> = Object.freeze({
  minX:-2.25, maxX:2.25, minZ:-26.35, maxZ:-22.85,
});

/** Street-specific stonework and placement; shaders remain independent of the city. */
export class StreetWaterFeature {
  readonly root = new Group();
  private readonly water = new WaterFeature();
  private readonly box = new BoxGeometry(1,1,1);
  private readonly stone = new MeshStandardMaterial({color:'#7c9181',roughness:.95});
  private readonly rim = new MeshStandardMaterial({color:'#c4c8ad',roughness:.85});
  private disposed = false;
  constructor() {
    this.root.name = 'Street water';
    this.root.position.set(0,0,-24.6);
    const box = (x:number,y:number,z:number,w:number,h:number,d:number,material:MeshStandardMaterial):void => {
      const mesh = new Mesh(this.box,material);
      mesh.position.set(x,y,z); mesh.scale.set(w,h,d);
      mesh.castShadow = h > .2; mesh.receiveShadow = true;
      this.root.add(mesh);
    };
    box(0,.12,0,4.5,.24,3.5,this.stone);
    box(0,.31,1.64,4.5,.22,.22,this.rim);
    box(0,.31,-1.64,4.5,.22,.22,this.rim);
    for(const x of [-2.14,2.14]) box(x,.31,0,.22,.22,3.5,this.rim);
    box(0,1.18,-1.44,1.6,2.36,.56,this.stone);
    box(0,2.36,-1.39,1.75,.12,.66,this.rim);
    this.root.add(this.water.root);
  }
  get settings(): WaterSettings { return this.water.settings; }
  get elapsed(): number { return this.water.elapsed; }
  getSpraySource(target: SpraySource): boolean { return this.water.getSpraySource(target); }
  configure(patch: Partial<WaterSettings>): boolean { return this.water.configure(patch); }
  update(delta: number): void { this.water.update(delta); }
  dispose(): void {
    if(this.disposed) return; this.disposed = true;
    this.water.dispose(); this.box.dispose(); this.stone.dispose(); this.rim.dispose();
    this.root.removeFromParent(); this.root.clear();
  }
}
