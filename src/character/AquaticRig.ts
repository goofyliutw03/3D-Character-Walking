import {
  Box3, BoxGeometry, CapsuleGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, Quaternion, SphereGeometry, Vector3,
  type Material, type Object3D,
} from 'three';
import { sampleSwimPose, type StrokeFrame, type SwimAppearance, type SwimOutfit, type SwimPose } from './SwimAppearance.ts';

interface Joint { object: Object3D; rest: Quaternion }
interface Foot {
  object: Object3D;
  end: Object3D;
  fromEnd: Matrix4;
  restPosition: Vector3;
  restRotation: Quaternion;
  forwardAxis: Vector3;
}
interface Garment {
  mesh: Mesh;
  original: Material | Material[];
  swimwear: Material;
  scuba: Material;
}
interface OutfitPiece { joint: Object3D; mount: Group; mesh: Mesh }
interface ClimbPose { pitch: number; rotations: Quaternion[]; feet: Vector3[] }

const climbFrames: ReadonlyArray<readonly [number, StrokeFrame, StrokeFrame]> = [
  [.24, { pitch: .21, upperArm: [.15, .32, 1], lowerArm: [-.07, .68, 1], thigh: [.04, -1, .10], shin: [.02, -1, -.20] },
    { pitch: .21, upperArm: [-.15, .32, 1], lowerArm: [.07, .68, 1], thigh: [-.04, -1, .10], shin: [-.02, -1, -.20] }],
  [.54, { pitch: .88, upperArm: [.13, -.76, .46], lowerArm: [-.06, -.90, .50], thigh: [.13, .84, .56], shin: [.03, -.48, -.31] },
    { pitch: .88, upperArm: [-.13, -.76, .46], lowerArm: [.06, -.90, .50], thigh: [-.09, -.73, .69], shin: [-.03, -.9, .53] }],
  [.80, { pitch: .26, upperArm: [.16, -.74, .65], lowerArm: [-.12, -.92, .28], thigh: [.09, -.76, .58], shin: [.03, -1, -.15] },
    { pitch: .26, upperArm: [-.20, -.87, -.33], lowerArm: [.03, -.78, .34], thigh: [-.11, -.64, -.59], shin: [-.03, -.93, .37] }],
];

export class AquaticRig {
  private readonly joints = new Map<string, Joint>();
  private readonly feet: Foot[] = [];
  private readonly garments: Garment[] = [];
  private readonly swimwear: OutfitPiece[] = [];
  private readonly scuba: OutfitPiece[] = [];
  private readonly box = new BoxGeometry();
  private readonly sphere = new SphereGeometry(1, 16, 10);
  private readonly tank = new CapsuleGeometry(.5, 1, 4, 12);
  private readonly materials: MeshStandardMaterial[];
  private outfit: SwimOutfit | undefined;
  private pose: SwimPose | 'tread' | undefined;
  private phase = 0;
  private readonly origin = new Vector3();
  private readonly direction = new Vector3();
  private readonly target = new Vector3();
  private readonly basis = new Quaternion();
  private readonly turn = new Quaternion();
  private readonly rotation = new Quaternion();
  private readonly matrix = new Matrix4();
  private readonly scale = new Vector3();
  private readonly climbBones: Object3D[];
  private readonly climbKeys: ReadonlyArray<readonly [number, ClimbPose]>;
  private climbSource?: ClimbPose;
  get pitch(): number { return this.pivot.rotation.x; }

  constructor(private readonly pivot: Group, scene: Object3D, height: number) {
    const bone = (name: string): Object3D => {
      const object = scene.getObjectByName(name.replace('.', '')) ?? scene.getObjectByName(name);
      if (!object) throw new Error('Missing aquatic rig joint ' + name);
      return object;
    };
    for (const suffix of ['.L', '.R']) {
      for (const name of ['UpperArm', 'LowerArm', 'Wrist', 'UpperLeg', 'LowerLeg']) {
        const id = name + suffix;
        const object = bone(id);
        this.joints.set(id, { object, rest: object.quaternion.clone() });
      }
      const object = bone('Foot' + suffix);
      const end = bone('LowerLeg' + suffix + '_end');
      this.feet.push({
        object, end, fromEnd: end.matrixWorld.clone().invert().multiply(object.matrixWorld),
        restPosition: object.position.clone(), restRotation: object.quaternion.clone(),
        forwardAxis: new Vector3(0, 0, 1).applyQuaternion(object.getWorldQuaternion(new Quaternion()).invert()),
      });
    }
    const color = height < 1.4 ? '#ff934a' : height < 1.75 ? '#a468dc' : '#20c5ba';
    const sportsTop = new MeshStandardMaterial({ color, roughness: .75 });
    const sportsBottom = new MeshStandardMaterial({ color: '#1a304a', roughness: .82 });
    const neoprene = new MeshStandardMaterial({ color: '#172630', roughness: .86 });
    const trim = new MeshStandardMaterial({ color: '#ffb941', roughness: .55 });
    const metal = new MeshStandardMaterial({ color: '#aebdc3', metalness: .55, roughness: .37 });
    const lens = new MeshStandardMaterial({ color: '#68dce9', metalness: .25, roughness: .21 });
    this.materials = [sportsTop, sportsBottom, neoprene, trim, metal, lens];
    const face = new Box3(), eyes = new Box3();
    scene.traverse(object => {
      if (!(object instanceof Mesh) || Array.isArray(object.material)) return;
      let part: Object3D | null = object;
      while (part && !/_(Body|Legs|Feet|Head)$/.test(part.name)) part = part.parent;
      if (!part) return;
      const skin = object.material.name === 'Skin';
      if (part.name.endsWith('_Head')) {
        if (skin) face.expandByObject(object, true);
        if (['Eye', 'Brown'].includes(object.material.name)) eyes.expandByObject(object, true);
        return;
      }
      const swimwear = skin ? object.material : part.name.endsWith('_Body') ? sportsTop : sportsBottom;
      this.garments.push({ mesh: object, original: object.material, swimwear, scuba: neoprene });
    });
    const head = bone('Head');
    const chest = bone('Chest');
    const add = (outfit: OutfitPiece[], joint: Object3D, name: string, geometry: 'box' | 'sphere' | 'tank',
      material: MeshStandardMaterial, offset: [number, number, number], dimensions: [number, number, number]): void => {
      const mount = new Group();
      const mesh = new Mesh(geometry === 'box' ? this.box : geometry === 'sphere' ? this.sphere : this.tank, material);
      joint.getWorldPosition(this.origin);
      pivot.worldToLocal(this.origin);
      mount.position.copy(this.origin).addScaledVector(this.target.fromArray(offset), height);
      mesh.scale.fromArray(dimensions).multiplyScalar(height);
      mesh.name = name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mount.add(mesh);
      pivot.add(mount);
      joint.attach(mount);
      mount.removeFromParent();
      outfit.push({ joint, mount, mesh });
    };
    const headPosition = head.getWorldPosition(new Vector3());
    const eyeCenter = eyes.getCenter(new Vector3()).sub(headPosition).divideScalar(height);
    eyeCenter.z = (face.max.z - headPosition.z + .006) / height;
    const halfEyeSpacing = eyes.getSize(new Vector3()).x * .29 / height;
    const faceSize = face.getSize(new Vector3());
    const capRadius = faceSize.multiply(new Vector3(.61, .25, .63));
    const capCenter = face.getCenter(new Vector3());
    capCenter.y = face.max.y - capRadius.y * .80;
    capCenter.z -= .016;
    add(this.swimwear, head, 'Swim cap', 'sphere', sportsTop, capCenter.sub(headPosition).divideScalar(height).toArray(),
      capRadius.divideScalar(height).toArray());
    for (const side of [-1, 1]) {
      const x = eyeCenter.x + side * halfEyeSpacing;
      add(this.swimwear, head, 'Swim goggles frame', 'sphere', sportsBottom, [x, eyeCenter.y, eyeCenter.z],
        [.036 / height, .026 / height, .016 / height]);
      add(this.swimwear, head, 'Swim goggles lens', 'sphere', lens, [x, eyeCenter.y, eyeCenter.z + .013 / height],
        [.029 / height, .020 / height, .009 / height]);
      add(this.scuba, chest, 'BCD shoulder strap', 'box', neoprene, [side * .066, -.005, .078], [.024, .20, .026]);
    }
    add(this.scuba, head, 'Dive mask frame', 'sphere', neoprene, eyeCenter.toArray(), [.082 / height, .037 / height, .027 / height]);
    add(this.scuba, head, 'Dive mask lens', 'sphere', lens, [eyeCenter.x, eyeCenter.y, eyeCenter.z + .022 / height],
      [.071 / height, .029 / height, .014 / height]);
    add(this.scuba, head, 'Regulator', 'sphere', trim, [eyeCenter.x, eyeCenter.y - .070 / height, eyeCenter.z],
      [.042 / height, .027 / height, .024 / height]);
    add(this.scuba, chest, 'Air cylinder', 'tank', metal, [0, -.075, -.117], [.112, .193, .112]);
    add(this.scuba, chest, 'Cylinder strap', 'box', trim, [0, -.072, -.153], [.125, .027, .080]);
    add(this.scuba, chest, 'Tank valve', 'sphere', trim, [0, .119, -.116], [.026, .025, .026]);
    for (const foot of this.feet) {
      add(this.scuba, foot.object, 'Fin blade', 'box', trim, [0, -.027, .109], [.094, .024, .20]);
      add(this.scuba, foot.object, 'Fin foot pocket', 'sphere', neoprene, [0, -.008, .062], [.046, .033, .078]);
    }
    this.climbBones = [...Array.from(this.joints.values(), joint => joint.object), ...this.feet.map(foot => foot.object)];
    const standing = this.captureClimbPose();
    this.climbKeys = [
      ...climbFrames.map(([time, left, right]) => {
        this.applyFrames(left, right);
        return [time, this.captureClimbPose()] as const;
      }),
      [1, standing],
    ];
    this.blendClimbPose(standing, standing, 0);
  }

  private setPieces(outfit: OutfitPiece[], enabled: boolean): void {
    for (const { mount, joint } of outfit) {
      if (enabled) joint.add(mount);
      else mount.removeFromParent();
    }
  }

  setShadows(enabled: boolean): void {
    for (const { mesh } of [...this.swimwear, ...this.scuba]) mesh.castShadow = enabled;
  }

  setOutfit(outfit: SwimOutfit | undefined): void {
    if (this.outfit === outfit) return;
    this.outfit = outfit;
    for (const garment of this.garments) garment.mesh.material = outfit ? garment[outfit] : garment.original;
    this.setPieces(this.swimwear, outfit === 'swimwear');
    this.setPieces(this.scuba, outfit === 'scuba');
  }

  update(appearance: SwimAppearance | undefined, swimming: boolean, speed: number, delta: number, reduced: boolean,
    climb?: number): void {
    this.setOutfit(appearance?.outfit);
    if (climb !== undefined) {
      this.climbSource ??= this.captureClimbPose();
      let previousTime = 0, previous = this.climbSource;
      for (const [time, pose] of this.climbKeys) {
        if (climb <= time) {
          const t = (climb - previousTime) / (time - previousTime);
          this.blendClimbPose(previous, pose, t * t * (3 - 2 * t));
          break;
        }
        previousTime = time;
        previous = pose;
      }
      return;
    }
    if (this.climbSource) {
      const standing = this.climbKeys[this.climbKeys.length - 1]![1];
      this.blendClimbPose(standing, standing, 0);
      this.climbSource = undefined;
    }
    const pose = swimming && appearance ? speed < 1e-6 ? 'tread' : appearance.pose : undefined;
    if (!pose) {
      if (this.pose) {
        for (const joint of this.joints.values()) joint.object.quaternion.copy(joint.rest);
        for (const foot of this.feet) {
          foot.object.position.copy(foot.restPosition);
          foot.object.quaternion.copy(foot.restRotation);
        }
      }
      this.pivot.rotation.x = 0;
      this.pose = undefined;
      return;
    }
    if (this.pose !== pose) this.phase = pose === 'breaststroke' ? .08 : 0;
    this.pose = pose;
    this.phase += delta * (pose === 'jellyfish' ? .27 : .60 + Math.min(speed * .13, .47));
    const time = reduced ? (pose === 'breaststroke' ? .12 : 0) : this.phase;
    this.applyFrames(sampleSwimPose(pose, time, 1, speed), sampleSwimPose(pose, time, -1, speed));
  }

  private captureClimbPose(): ClimbPose {
    return { pitch: this.pitch, rotations: this.climbBones.map(object => object.quaternion.clone()),
      feet: this.feet.map(({ object }) => object.position.clone()) };
  }

  private blendClimbPose(from: ClimbPose, to: ClimbPose, weight: number): void {
    this.pivot.rotation.x = from.pitch + (to.pitch - from.pitch) * weight;
    for (const [i, object] of this.climbBones.entries()) {
      object.quaternion.slerpQuaternions(from.rotations[i]!, to.rotations[i]!, weight);
    }
    for (const [i, { object }] of this.feet.entries()) object.position.lerpVectors(from.feet[i]!, to.feet[i]!, weight);
  }

  private applyFrames(left: StrokeFrame, right: StrokeFrame): void {
    for (const joint of this.joints.values()) joint.object.quaternion.copy(joint.rest);
    this.pivot.rotation.x = left.pitch;
    this.pivot.getWorldQuaternion(this.basis);
    for (const [index, [suffix, frame]] of ([['.L', left], ['.R', right]] as const).entries()) {
      this.aim('UpperArm' + suffix, 'LowerArm' + suffix, frame.upperArm);
      this.aim('LowerArm' + suffix, 'Wrist' + suffix, frame.lowerArm);
      this.aim('UpperLeg' + suffix, 'LowerLeg' + suffix, frame.thigh);
      const foot = this.feet[index]!;
      this.aimAt(this.joints.get('LowerLeg' + suffix)!.object, foot.end, frame.shin);
      foot.end.updateWorldMatrix(true, false);
      foot.object.parent!.updateWorldMatrix(true, false);
      this.matrix.copy(foot.object.parent!.matrixWorld).invert().multiply(foot.end.matrixWorld).multiply(foot.fromEnd);
      this.matrix.decompose(foot.object.position, foot.object.quaternion, this.scale);
      foot.object.getWorldQuaternion(this.rotation);
      this.direction.copy(foot.forwardAxis).applyQuaternion(this.rotation);
      this.target.fromArray(frame.shin).normalize().applyQuaternion(this.basis);
      this.rotateTowards(foot.object);
    }
  }

  private aim(name: string, child: string, vector: [number, number, number]): void {
    this.aimAt(this.joints.get(name)!.object, this.joints.get(child)!.object, vector);
  }

  private aimAt(joint: Object3D, child: Object3D, vector: [number, number, number]): void {
    joint.getWorldPosition(this.origin);
    child.getWorldPosition(this.direction).sub(this.origin).normalize();
    this.target.fromArray(vector).normalize().applyQuaternion(this.basis);
    this.rotateTowards(joint);
  }

  private rotateTowards(joint: Object3D): void {
    this.turn.setFromUnitVectors(this.direction, this.target);
    joint.getWorldQuaternion(this.rotation).premultiply(this.turn);
    joint.parent!.getWorldQuaternion(this.turn).invert();
    joint.quaternion.copy(this.rotation.premultiply(this.turn));
  }

  dispose(): void {
    this.setOutfit(undefined);
    for (const resource of [this.box, this.sphere, this.tank, ...this.materials]) resource.dispose();
  }
}
