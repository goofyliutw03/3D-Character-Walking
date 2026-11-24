export const swimPoses = ['breaststroke', 'dive', 'jellyfish'] as const;
export type SwimPose = typeof swimPoses[number];
export const swimOutfits = ['swimwear', 'scuba'] as const;
export type SwimOutfit = typeof swimOutfits[number];

export interface SwimAppearance { pose: SwimPose; outfit: SwimOutfit }
export const defaultSwimAppearance: Readonly<SwimAppearance> = { pose: 'breaststroke', outfit: 'swimwear' };
export const swimPoseLabels: Record<SwimPose, string> = { breaststroke: '蛙式', dive: '一般潛水', jellyfish: '水母漂浮' };
export function validSwimAppearance(value: unknown): value is SwimAppearance {
  if (!value || typeof value !== 'object') return false;
  const { pose, outfit } = value as SwimAppearance;
  return swimPoses.includes(pose) && swimOutfits.includes(outfit);
}

type Direction = [number, number, number];
export interface StrokeFrame {
  pitch: number;
  upperArm: Direction;
  lowerArm: Direction;
  thigh: Direction;
  shin: Direction;
}

const breaststroke: readonly StrokeFrame[] = [
  { pitch: 1.32, upperArm: [.10, 1, .04], lowerArm: [-.16, 1, 0], thigh: [.06, -1, 0], shin: [-.05, -1, 0] },
  { pitch: 1.22, upperArm: [1, .24, .16], lowerArm: [.57, .82, .28], thigh: [.14, -1, .14], shin: [0, -1, -.13] },
  { pitch: 1.04, upperArm: [.62, .40, .40], lowerArm: [-.87, .70, .10], thigh: [.54, -.56, .66], shin: [.18, .18, -.97] },
  { pitch: 1.24, upperArm: [.17, 1, .16], lowerArm: [-.20, 1, -.10], thigh: [.72, -.8, .06], shin: [.75, -.82, -.16] },
  { pitch: 1.32, upperArm: [.10, 1, .04], lowerArm: [-.16, 1, 0], thigh: [.06, -1, 0], shin: [-.05, -1, 0] },
];
const strokeKeys = [0, .25, .48, .68, 1];

export function sampleSwimPose(pose: SwimPose | 'tread', time: number, side: -1 | 1, speed: number): StrokeFrame {
  const phase = ((time % 1) + 1) % 1;
  const wave = Math.sin(2 * Math.PI * phase);
  const mirror = ([x, y, z]: Direction): Direction => [x * side, y, z];
  if (pose === 'tread') {
    const kick = wave * side;
    return { pitch: 0,
      upperArm: mirror([.72, -.45, .16]), lowerArm: mirror([.58, -.06, .63 + kick * .26]),
      thigh: mirror([.22, -1, kick * .26]), shin: mirror([.09, -1, -.23 + kick * .18]) };
  }
  if (pose === 'dive') {
    const kick = wave * side * (.17 + Math.min(speed * .035, .17));
    return { pitch: 1.48,
      upperArm: mirror([.24, -.25, .81]), lowerArm: mirror([-.33, .82, .53]),
      thigh: mirror([.09, -1, kick]), shin: mirror([.05, -1, kick - .18]) };
  }
  if (pose === 'jellyfish') {
    return { pitch: .98 + wave * .05,
      upperArm: mirror([.21, -.55, .88]), lowerArm: mirror([-.07, -.52, .90]),
      thigh: mirror([.22, -.49, .89]), shin: mirror([.13, -.86, .64 + wave * .06]) };
  }
  const index = strokeKeys.findIndex(key => key > phase) - 1;
  const from = breaststroke[index]!, to = breaststroke[index + 1]!;
  const t = (phase - strokeKeys[index]!) / (strokeKeys[index + 1]! - strokeKeys[index]!);
  const weight = t * t * (3 - 2 * t);
  const blend = (a: Direction, b: Direction): Direction => mirror([
    a[0] + (b[0] - a[0]) * weight, a[1] + (b[1] - a[1]) * weight, a[2] + (b[2] - a[2]) * weight,
  ]);
  return { pitch: from.pitch + (to.pitch - from.pitch) * weight,
    upperArm: blend(from.upperArm, to.upperArm), lowerArm: blend(from.lowerArm, to.lowerArm),
    thigh: blend(from.thigh, to.thigh), shin: blend(from.shin, to.shin) };
}
