import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type { MotionSnapshot } from '../character/motion';
import type { FollowCamera } from './FollowCamera';
import type { FirstPersonCamera } from './FirstPersonCamera';

export type CameraView = 'overview' | 'street' | 'overhead' | 'first-person' | 'third-person' | 'front' | 'character-overhead' | 'low-angle' | 'fisheye';
export interface CameraSubject extends Readonly<MotionSnapshot> { height: number; eyeHeight: number; eyeForward: number }
interface Orbit {
  target: Vector3; enabled: boolean; enableDamping: boolean;
  maxPolarAngle?: number;
  update(): void;
}
interface Frame { position: Vector3; target: Vector3 }
interface Transition { start: Frame; elapsed: number }
const staticPresets = {
  overview: { position: [38, 46, 48], target: [0, 1, 0] },
  street: { position: [0, 3, 23], target: [0, 2, -8] },
  overhead: { position: [0, 55, 0.01], target: [0, 0, 0] },
} satisfies Record<string, { position: [number, number, number]; target: [number, number, number] }>;
const isStatic = (view: CameraView): view is keyof typeof staticPresets => view === 'overview' || view === 'street' || view === 'overhead';

export class CameraController {
  private selected: CameraView = 'overview';
  private tracking = false;
  private transition: Transition | undefined;
  private previousPosition = new Vector3();
  private readonly startDirection = new Vector3();
  private readonly endDirection = new Vector3();
  private readonly rotation = new Quaternion();
  private readonly arc = new Quaternion();
  get view(): CameraView { return this.selected; }
  get following(): boolean { return this.tracking; }
  get characterVisible(): boolean { return this.selected !== 'first-person'; }
  get fisheye(): boolean { return this.selected === 'fisheye'; }
  get transitioning(): boolean { return this.transition !== undefined; }
  constructor(private readonly camera: PerspectiveCamera, private readonly orbit: Orbit, private readonly obstruction: Pick<FollowCamera, 'constrain'>, private readonly first: FirstPersonCamera) {}

  select(view: CameraView, subject: CameraSubject, immediate: boolean): void {
    if (this.selected === 'first-person' && view !== 'first-person') this.apply(this.frame('third-person', subject));
    this.selected = view;
    this.tracking = !isStatic(view);
    this.previousPosition.set(subject.x, subject.y, subject.z);
    this.orbit.enabled = isStatic(view);
    this.orbit.maxPolarAngle = view === 'low-angle' ? Math.PI - 0.05 : Math.PI / 2 - 0.04;
    this.camera.up.set(0, 1, 0);
    this.first.restoreProjection(this.camera);
    if (view === 'fisheye') { this.camera.fov = 160; this.camera.updateProjectionMatrix(); }
    this.transition = undefined;
    if (view === 'first-person') {
      this.first.update(this.camera, this.orbit.target, subject, subject.eyeHeight, subject.eyeForward);
    } else if (immediate) this.apply(this.frame(view, subject));
    else this.transition = { start: this.currentFrame(), elapsed: 0 };
  }
  setFollowing(enabled: boolean, subject: CameraSubject, immediate: boolean): void {
    if (this.selected === 'first-person') return;
    this.tracking = enabled;
    this.previousPosition.set(subject.x, subject.y, subject.z);
    this.transition = undefined;
    this.orbit.enabled = !enabled || isStatic(this.selected);
    if (enabled && !isStatic(this.selected)) {
      if (immediate) this.apply(this.frame(this.selected, subject));
      else this.transition = { start: this.currentFrame(), elapsed: 0 };
    } else {
      // Flush residual orbit damping without moving a newly frozen frame later.
      this.orbit.enableDamping = false; this.orbit.update(); this.orbit.enableDamping = true;
    }
  }
  interrupt(): void { if (this.orbit.enabled) this.transition = undefined; }
  update(subject: CameraSubject, delta: number, immediate: boolean): void {
    const dt = Math.min(Math.max(delta, 0), 0.05);
    if (this.selected === 'first-person') {
      this.first.update(this.camera, this.orbit.target, subject, subject.eyeHeight, subject.eyeForward);
    } else if (this.transition) {
      this.transition.elapsed += dt;
      const t = immediate ? 1 : Math.min(this.transition.elapsed / 0.8, 1);
      this.interpolate(this.transition.start, this.frame(this.selected, subject), t * t * (3 - 2 * t));
      if (t === 1) this.transition = undefined;
    } else if (isStatic(this.selected)) {
      if (this.tracking) {
        const shift = new Vector3(subject.x, subject.y, subject.z).sub(this.previousPosition);
        this.camera.position.add(shift); this.orbit.target.add(shift);
      }
      this.orbit.update();
    } else if (this.tracking) {
      this.interpolate(this.currentFrame(), this.frame(this.selected, subject), immediate ? 1 : 1 - Math.exp(-6 * dt));
    } else this.orbit.update();
    this.previousPosition.set(subject.x, subject.y, subject.z);
  }
  private currentFrame(): Frame { return { position: this.camera.position.clone(), target: this.orbit.target.clone() }; }
  private frame(view: Exclude<CameraView, 'first-person'>, subject: CameraSubject): Frame {
    if (isStatic(view)) return { position: new Vector3(...staticPresets[view].position), target: new Vector3(...staticPresets[view].target) };
    const target = new Vector3(subject.x, subject.y + subject.height * 0.65, subject.z);
    const sin = Math.sin(subject.heading);
    const cos = Math.cos(subject.heading);
    const position = new Vector3();
    if (view === 'character-overhead') position.set(subject.x, subject.y + 12, subject.z + 0.02);
    else if (view === 'front') position.set(subject.x + sin * 6, subject.y + subject.height + 0.7, subject.z + cos * 6);
    else if (view === 'low-angle') position.set(subject.x + sin * 5, subject.y + 0.35, subject.z + cos * 5);
    else if (view === 'fisheye') position.set(subject.x - sin * 3.5, subject.y + subject.height + 0.6, subject.z - cos * 3.5);
    else position.set(subject.x - sin * 6, subject.y + subject.height + 3, subject.z - cos * 6);
    return { position, target };
  }
  private interpolate(start: Frame, end: Frame, amount: number): void {
    this.startDirection.subVectors(start.position, start.target);
    this.endDirection.subVectors(end.position, end.target);
    const startRadius = Math.max(this.startDirection.length(), 0.4);
    const endRadius = Math.max(this.endDirection.length(), 0.4);
    this.startDirection.normalize(); this.endDirection.normalize();
    this.rotation.setFromUnitVectors(this.startDirection, this.endDirection);
    this.arc.identity().slerp(this.rotation, amount);
    this.startDirection.applyQuaternion(this.arc);
    this.orbit.target.lerpVectors(start.target, end.target, amount);
    this.camera.position.copy(this.orbit.target).addScaledVector(this.startDirection, startRadius + (endRadius - startRadius) * amount);
    this.finishFrame();
  }
  private apply(frame: Frame): void {
    this.camera.position.copy(frame.position); this.orbit.target.copy(frame.target);
    this.finishFrame();
  }
  private finishFrame(): void {
    if (!isStatic(this.selected)) this.obstruction.constrain(this.camera, this.orbit.target);
    this.camera.lookAt(this.orbit.target);
  }
}
