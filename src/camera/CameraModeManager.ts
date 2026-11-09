import type { CameraController, CameraSubject, CameraView } from './CameraController';
import type { AutoRunControls } from '../input/AutoRunControls';
import type { PerspectiveCamera } from 'three';
import { sceneControlPolicy, type SceneControlPolicy } from '../scene/SceneControlPolicy.ts';

export type CameraInputMode = 'standard' | 'running-orbit' | 'inspection';
const externalViews: ReadonlySet<CameraView> = new Set(['third-person', 'fisheye']);

/** Coordinates camera transitions without owning another copy of the movement state. */
export class CameraModeManager {
  private policy = sceneControlPolicy('open');
  constructor(
    private readonly camera: CameraController,
    private readonly run: AutoRunControls,
    private readonly subject: () => CameraSubject,
    private readonly immediate: () => boolean,
    private readonly rendered: PerspectiveCamera,
    private readonly resetInput: () => void,
  ) {}

  get inputMode(): CameraInputMode {
    if (this.camera.view === 'first-person' && this.run.inspecting) return 'inspection';
    return this.policy.autoRun && this.run.enabled && externalViews.has(this.camera.view) ? 'running-orbit' : 'standard';
  }
  get wheelEnabled(): boolean { return externalViews.has(this.camera.view) || this.inputMode === 'inspection'; }
  get followingLocked(): boolean { return this.inputMode === 'running-orbit'; }
  get groundTapEnabled(): boolean { return this.policy.groundNavigation && this.inputMode === 'standard'; }
  get autoRunEnabled(): boolean { return this.policy.autoRun; }

  configureScene(policy: SceneControlPolicy): void {
    this.policy = { ...policy };
    this.run.clear();
    this.resetInput();
    this.camera.setIndoor(policy.framing === 'indoor');
  }

  beginDestination(): void {
    this.resetGestures();
    this.run.stop();
  }

  resetGestures(): void {
    this.run.resetGestures();
    this.resetInput();
  }
  select(view: CameraView): void {
    this.resetGestures();
    this.run.select(view);
    this.camera.select(view, this.subject(), this.immediate(), this.rendered);
  }
  resetLook(): void {
    this.resetGestures();
    this.run.resetLook();
    this.camera.select(this.camera.view, this.subject(), this.immediate(), this.rendered);
  }
  wheel(delta: number): CameraView | undefined {
    const result = this.run.wheel(delta, this.camera.view);
    if (result) return result === 'enter' ? 'first-person' : result;
    if (externalViews.has(this.camera.view)) this.follow();
  }
  follow(): void {
    if (!this.camera.following) this.camera.setFollowing(true, this.subject(), this.immediate());
  }
}
