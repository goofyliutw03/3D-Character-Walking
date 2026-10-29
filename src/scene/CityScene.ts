import { BoxGeometry, Color, CylinderGeometry, DirectionalLight, DodecahedronGeometry, Fog, Group, HemisphereLight, Mesh, MeshStandardMaterial, Scene } from 'three';
import type { WalkableBounds, WalkableWorld } from '../character/motion';

export class CityScene {
  readonly scene = new Scene();
  readonly environment = new Group();
  private readonly obstacles: WalkableBounds[] = [];
  readonly walkableWorld: WalkableWorld = {
    bounds: { minX: -8.3, maxX: 8.3, minZ: -26.5, maxZ: 26.5 },
    obstacles: this.obstacles,
    groundHeight: (x: number): number => Math.abs(x) >= 4.5 ? 0.32 : 0.075,
  };
  private readonly boxes = new BoxGeometry(1, 1, 1);
  private readonly canopy = new DodecahedronGeometry(1, 1);
  private readonly pole = new CylinderGeometry(1, 1, 1, 10);
  private readonly materials = new Map<string, MeshStandardMaterial>();
  private readonly sun = new DirectionalLight(0xfff2dc, 3.2);
  private readonly ambient = new HemisphereLight(0xdbeafa, 0xb3a88b, 2.3);
  constructor() {
    this.scene.background = new Color('#e3e9df');
    this.scene.fog = new Fog('#e3e9df', 75, 160);
    this.scene.add(this.ambient);
    this.sun.position.set(-18, 32, 20);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 100 });
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun);
    this.scene.add(this.environment);
    this.buildStreet();
  }
  private material(color: string): MeshStandardMaterial {
    let material = this.materials.get(color);
    if (!material) {
      material = new MeshStandardMaterial({ color, roughness: 0.86 });
      this.materials.set(color, material);
    }
    return material;
  }
  private box(parent: Group | Scene, x: number, y: number, z: number, width: number, height: number, depth: number, color: string): Mesh {
    const mesh = new Mesh(this.boxes, this.material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    mesh.castShadow = height > 0.2;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  private buildStreet(): void {
    const ground = (x: number, y: number, z: number, width: number, height: number, depth: number, color: string): void => {
      this.box(this.environment, x, y, z, width, height, depth, color).userData.walkable = true;
    };
    this.box(this.environment, 0, -0.4, 0, 45, 0.8, 54, '#bfccac');
    ground(0, 0.025, 0, 9, 0.05, 54, '#697272');
    for (const side of [-1, 1]) {
      ground(side * 6.4, 0.15, 0, 3.8, 0.3, 54, '#ded9ca');
      ground(side * 4.65, 0.22, 0, 0.16, 0.18, 54, '#f4eee0');
      ground(side * 4.05, 0.065, 0, 0.07, 0.025, 52, '#e4d7ad');
      for (let z = -25; z < 27; z += 2) ground(side * 6.4, 0.306, z, 3.6, 0.01, 0.025, '#c9c4b8');
      const colors = side < 0 ? ['#c9aa8b', '#b7c7b3', '#d2ba9d', '#a4b9b8'] : ['#b8c4cb', '#d2ad94', '#d6c9af', '#b8bea1'];
      [-20, -7, 7, 20].forEach((z, index) => this.building(side * 12.1, z, 6 + (index % 3) * 1.9, colors[index]!, side));
      for (const z of [-24, -13, 1, 13, 25]) this.tree(side * 7.2, z);
      for (const z of [-17, 3, 20]) this.streetlight(side * 5.2, z, side);
      for (const z of [-10, 11]) this.bench(side * 6.4, z, side);
    }
    for (let z = -25; z < 26; z += 5) if (Math.abs(z) > 3) ground(0, 0.06, z, 0.12, 0.02, 2.5, '#f2dfac');
    for (let x = -3.6; x <= 3.6; x += 1.2) ground(x, 0.065, 0, 0.65, 0.02, 3.2, '#eee9dc');
    this.box(this.environment, 0, 0.18, -25.4, 2.1, 0.35, 2.4, '#e2d9c5');
    this.obstacle(0, -25.4, 2.1, 2.4);
    this.tree(0, -25.4);
  }
  private building(x: number, z: number, height: number, color: string, side: number): void {
    const group = new Group();
    group.position.set(x, 0.3, z);
    this.environment.add(group);
    this.box(group, 0, height / 2, 0, 7.2, height, 9.8, color);
    this.box(group, 0, height + 0.18, 0, 7.6, 0.36, 10.2, '#eee7d7');
    this.box(group, 0, height + 0.48, 0, 6.6, 0.28, 9.2, '#b5b6a9');
    const front = -side * 3.64;
    for (let y = 3.4; y < height - 0.5; y += 2.1) {
      for (const windowZ of [-3.2, -1.05, 1.05, 3.2]) {
        this.box(group, front, y, windowZ, 0.12, 1.42, 1.25, '#eae2d0');
        this.box(group, front - side * 0.08, y, windowZ, 0.04, 1.15, 1.02, '#526e73');
        this.box(group, front - side * 0.1, y, windowZ, 0.04, 0.06, 1.02, '#eae2d0');
      }
    }
    for (const windowZ of [-2.9, 2.9]) this.box(group, front - side * 0.02, 1.25, windowZ, 0.16, 2.1, 2.6, '#466566');
    this.box(group, front - side * 0.03, 1.15, 0, 0.2, 2.3, 1.1, '#344b4d');
    this.box(group, front - side * 0.6, 2.5, 0, 1.5, 0.18, 8.6, side < 0 ? '#687e68' : '#a36d55');
    this.box(group, front - side * 1.2, 2.32, 0, 0.16, 0.4, 8.6, side < 0 ? '#586d58' : '#8e5c47');
    this.box(group, front - side * 0.12, 2.94, 0, 0.12, 0.38, 4.6, '#f2e7cc');
  }
  private tree(x: number, z: number): void {
    const group = new Group();
    this.environment.add(group);
    this.obstacle(x, z, 1.5, 1.5);
    this.box(group, x, 0.35, z, 1.5, 0.4, 1.5, '#b3b3a0');
    this.box(group, x, 0.57, z, 1.3, 0.05, 1.3, '#7d8463');
    const trunk = new Mesh(this.pole, this.material('#85745b'));
    trunk.position.set(x, 1.8, z);
    trunk.scale.set(0.13, 2.8, 0.13);
    trunk.castShadow = true;
    group.add(trunk);
    const crown = new Mesh(this.canopy, this.material('#739065'));
    crown.position.set(x, 3.5, z);
    crown.scale.set(1.1, 1.6, 1.1);
    crown.castShadow = true;
    crown.receiveShadow = true;
    group.add(crown);
  }
  private streetlight(x: number, z: number, side: number): void {
    const group = new Group();
    this.environment.add(group);
    this.obstacle(x, z, 0.2, 0.2);
    this.box(group, x, 2.4, z, 0.12, 4.2, 0.12, '#4b605a');
    this.box(group, x - side * 0.4, 4.5, z, 0.9, 0.12, 0.12, '#4b605a');
    this.box(group, x - side * 0.8, 4.43, z, 0.55, 0.13, 0.35, '#eee1b7');
  }
  private bench(x: number, z: number, side: number): void {
    const group = new Group();
    this.environment.add(group);
    this.obstacle(x, z, 0.85, 2.1);
    this.box(group, x, 0.85, z, 0.75, 0.15, 2, '#a38360');
    this.box(group, x + side * 0.34, 1.18, z, 0.1, 0.6, 2, '#a38360');
    for (const offset of [-0.72, 0.72]) this.box(group, x, 0.55, z + offset, 0.6, 0.5, 0.1, '#4b605a');
  }
  private obstacle(x: number, z: number, width: number, depth: number): void {
    this.obstacles.push({ minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2 });
  }
  setEvening(evening: boolean): void {
    const background = evening ? '#d4b9a5' : '#e3e9df';
    this.scene.background = new Color(background);
    (this.scene.fog as Fog).color.set(background);
    this.sun.color.set(evening ? '#ffb776' : '#fff2dc');
    this.sun.intensity = evening ? 2.4 : 3.2;
    this.sun.position.set(-18, evening ? 12 : 32, 20);
    this.ambient.intensity = evening ? 1.6 : 2.3;
  }
  setShadows(enabled: boolean): void {
    this.sun.castShadow = enabled;
    this.materials.forEach(material => { material.needsUpdate = true; });
  }
  dispose(): void {
    this.boxes.dispose(); this.canopy.dispose(); this.pole.dispose();
    this.materials.forEach(material => material.dispose());
    this.sun.shadow.map?.dispose();
    this.scene.clear();
  }
}
