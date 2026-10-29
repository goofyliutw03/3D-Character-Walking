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
  private centering: { elapsed: number; held: boolean } | undefined;
  private previousPosition = new Vector3();
  private readonly startDirection = new Vector3();
  private readonly endDirection = new Vector3();
  private readonly rotation = new Quaternion();
  private readonly arc = new Quaternion();
  private readonly frontProbe = new PerspectiveCamera();
  get view(): CameraView { return this.selected; }
  get following(): boolean { return this.tracking; }
  get characterVisible(): boolean { return this.selected !== 'first-person'; }
  get fisheye(): boolean { return this.selected === 'fisheye'; }
  get transitioning(): boolean { return this.transition !== undefined; }
  constructor(private readonly camera: PerspectiveCamera, private readonly orbit: Orbit, private readonly obstruction: Pick<FollowCamera, 'constrain'>, private readonly first: FirstPersonCamera) {}

  select(view: CameraView, subject: CameraSubject, immediate: boolean): void {
    this.centering = undefined;
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
    this.centering = undefined;
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
  beginCharacterOrbit(): void {
    if (!this.orbit.enabled || this.selected === 'first-person') return;
    this.transition = undefined;
    this.centering = { elapsed: 0, held: true };
  }
  endCharacterOrbit(cancelled: boolean): void {
    if (cancelled) this.centering = undefined;
    else if (this.centering) this.centering.held = false;
  }
  update(subject: CameraSubject, delta: number, immediate: boolean): void {
    const dt = Math.min(Math.max(delta, 0), 0.05);
    if (this.selected === 'first-person') {
      this.first.update(this.camera, this.orbit.target, subject, subject.eyeHeight, subject.eyeForward);
    } else if (this.centering) {
      const state = this.centering;
      const previous = Math.min(state.elapsed / 0.8, 1);
      state.elapsed += dt;
      const t = immediate ? 1 : Math.min(state.elapsed / 0.8, 1);
      const ease = (value: number): number => value * value * (3 - 2 * value);
      const amount = previous === 1 ? 1 : (ease(t) - ease(previous)) / (1 - ease(previous));
      // Translate the live orbit frame, preserving user rotation, zoom and damping.
      const shift = new Vector3(subject.x, subject.y + subject.height * 0.65, subject.z).sub(this.orbit.target).multiplyScalar(amount);
      this.camera.position.add(shift); this.orbit.target.add(shift);
      this.orbit.update();
      this.finishFrame();
      if (t === 1 && !state.held) this.centering = undefined;
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
    if (view === 'front') this.resolveFront(position, target, subject);
    return { position, target };
  }
  private resolveFront(position: Vector3, target: Vector3, subject: CameraSubject): void {
    // Keep the body readable when collision protection compresses the front frame.
    const minimum = subject.height * 0.75 / Math.tan(this.camera.fov * Math.PI / 360);
    const available = (candidate: Vector3): number => {
      this.frontProbe.position.copy(candidate);
      this.obstruction.constrain(this.frontProbe, target);
      const safe = this.frontProbe.position.clone();
      const anchor = target.clone();
      for (const height of [0, subject.height]) {
        anchor.y = subject.y + height;
        this.frontProbe.position.copy(safe);
        this.obstruction.constrain(this.frontProbe, anchor);
        if (this.frontProbe.position.distanceToSquared(safe) > 1e-8) return 0;
      }
      return safe.distanceTo(target);
    };
    let bestDistance = available(position);
    if (bestDistance >= minimum) return;
    const candidate = position.clone();
    for (const degrees of [30, -30, 60, -60, 85, -85]) {
      const heading = subject.heading + degrees * Math.PI / 180;
      candidate.set(subject.x + Math.sin(heading) * 6, position.y, subject.z + Math.cos(heading) * 6);
      const distance = available(candidate);
      if (distance > bestDistance) {
        bestDistance = distance;
        position.copy(candidate);
      }
      if (bestDistance >= minimum) break;
    }
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
