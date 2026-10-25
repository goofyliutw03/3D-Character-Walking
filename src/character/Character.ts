import { BoxGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import type { CharacterVariant, MotionSnapshot } from './motion';

const variants = {
  man: { height: 1.8, width: 1, shirt: '#4c7183', trousers: '#35484d', hair: '#493b30' },
  woman: { height: 1.68, width: 0.91, shirt: '#a65e4c', trousers: '#46564b', hair: '#4b332b' },
  child: { height: 1.15, width: 1.05, shirt: '#ce9b3e', trousers: '#526e7a', hair: '#795638' },
};

export class Character {
  readonly root = new Group();
  private readonly model = new Group();
  private readonly boxGeometry = new BoxGeometry(1, 1, 1);
  private readonly sphereGeometry = new SphereGeometry(1, 16, 12);
  private readonly skin = new MeshStandardMaterial({ color: '#d8ad87', roughness: 0.8 });
  private readonly shirt = new MeshStandardMaterial({ roughness: 0.9 });
  private readonly trousers = new MeshStandardMaterial({ roughness: 0.9 });
  private readonly hairMaterial = new MeshStandardMaterial({ roughness: 0.95 });
  private readonly dark = new MeshStandardMaterial({ color: '#293b35', roughness: 0.85 });
  private readonly leftLeg = new Group();
  private readonly rightLeg = new Group();
  private readonly leftArm = new Group();
  private readonly rightArm = new Group();
  private readonly hair: Mesh;
  private phase = 0;
  private variant: CharacterVariant = 'man';
  private disposed = false;
  get height(): number { return variants[this.variant].height; }
  constructor() {
    this.root.name = 'procedural-character';
    this.root.add(this.model);
    this.box(this.model, 0, 1.1, 0, 0.5, 0.48, 0.28, this.shirt);
    this.box(this.model, 0, 0.85, 0, 0.43, 0.16, 0.27, this.trousers);
    this.box(this.model, 0, 1.39, 0, 0.13, 0.13, 0.13, this.skin);
    this.sphere(this.model, 0, 1.56, 0, 0.18, 0.19, 0.17, this.skin);
    this.hair = this.sphere(this.model, 0, 1.64, -0.025, 0.185, 0.16, 0.175, this.hairMaterial);
    for (const side of [-1, 1]) {
      this.sphere(this.model, side * 0.065, 1.58, 0.158, 0.018, 0.022, 0.012, this.dark);
      const leg = side < 0 ? this.leftLeg : this.rightLeg;
      leg.name = side < 0 ? 'left-leg' : 'right-leg';
      leg.position.set(side * 0.135, 0.84, 0);
      this.model.add(leg);
      this.box(leg, 0, -0.32, 0, 0.18, 0.64, 0.21, this.trousers);
      this.box(leg, 0, -0.76, 0.045, 0.2, 0.16, 0.32, this.dark);
      const arm = side < 0 ? this.leftArm : this.rightArm;
      arm.name = side < 0 ? 'left-arm' : 'right-arm';
      arm.position.set(side * 0.32, 1.28, 0);
      this.model.add(arm);
      this.box(arm, 0, -0.16, 0, 0.16, 0.32, 0.18, this.shirt);
      this.box(arm, 0, -0.42, 0, 0.125, 0.23, 0.14, this.skin);
    }
    this.setVariant('man');
  }
  private box(parent: Group, x: number, y: number, z: number, w: number, h: number, d: number, material: MeshStandardMaterial): Mesh {
    const mesh = new Mesh(this.boxGeometry, material);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  private sphere(parent: Group, x: number, y: number, z: number, w: number, h: number, d: number, material: MeshStandardMaterial): Mesh {
    const mesh = new Mesh(this.sphereGeometry, material);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  setVariant(variant: CharacterVariant): void {
    this.variant = variant;
    const config = variants[variant];
    const scale = config.height / 1.8;
    this.model.scale.set(scale * config.width, scale, scale);
    this.shirt.color.set(config.shirt);
    this.trousers.color.set(config.trousers);
    this.hairMaterial.color.set(config.hair);
    this.hair.position.y = variant === 'woman' ? 1.55 : 1.64;
    this.hair.scale.y = variant === 'woman' ? 0.25 : 0.16;
  }
  update(state: Readonly<MotionSnapshot>, delta: number): void {
    this.root.position.set(state.x, state.y, state.z);
    this.root.rotation.y = state.heading;
    this.phase += state.speed * Math.min(delta, 0.05) * 5;
    const walking = state.action === 'walk' || state.action === 'run';
    const swing = walking ? Math.sin(this.phase) * (state.action === 'run' ? 0.85 : 0.5) : 0;
    this.leftLeg.rotation.x = state.action === 'jump' ? -0.6 : swing;
    this.rightLeg.rotation.x = state.action === 'jump' ? -0.25 : -swing;
    this.leftArm.rotation.x = state.action === 'jump' ? -1.5 : -swing;
    this.rightArm.rotation.x = state.action === 'jump' ? -1.5 : swing;
  }
  setShadows(enabled: boolean): void {
    this.root.traverse(object => { if (object instanceof Mesh) object.castShadow = enabled; });
    [this.skin, this.shirt, this.trousers, this.hairMaterial, this.dark].forEach(material => { material.needsUpdate = true; });
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.boxGeometry.dispose(); this.sphereGeometry.dispose();
    [this.skin, this.shirt, this.trousers, this.hairMaterial, this.dark].forEach(material => material.dispose());
    this.root.removeFromParent();
  }
}
