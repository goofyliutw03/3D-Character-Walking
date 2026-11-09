import { Behaviour, Context, GameObject } from '@needle-tools/engine';
import { Scene, type Camera, type WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { Pass } from 'three/addons/postprocessing/Pass.js';

class ViewerEffectsPass extends Pass {
  constructor(private readonly draw: () => void) {
    super();
    this.needsSwap = false;
  }

  override render(): void { this.draw(); }
}

class ViewerFrame extends Behaviour {
  timestamp = 0;

  constructor(private readonly tick: (timestamp: number) => void) { super(); }

  update(): void { this.tick(this.timestamp); }
}

/** Runs viewer simulation and custom render passes through the Needle context. */
export class NeedleRuntime {
  private readonly context: Context;
  private readonly frame: ViewerFrame;
  private readonly lifetime = new AbortController();
  private composer?: EffectComposer;
  private drawFrame?: () => void;

  constructor(private readonly renderer: WebGLRenderer, tick: (timestamp: number) => void) {
    this.context = new Context({ renderer, domElement: renderer.domElement, runInBackground: true });
    this.frame = new ViewerFrame(tick);
  }

  async start(scene: Scene, camera: Camera): Promise<void> {
    const ready = await this.context.create({ files: [], abortSignal: this.lifetime.signal });
    if (this.lifetime.signal.aborted) return;
    if (!ready) throw new Error('Needle context creation did not complete');
    this.context.scene = scene;
    this.context.mainCamera = camera;
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new ViewerEffectsPass(() => this.drawFrame?.()));
    this.context.composer = this.composer;
    this.frame.context = this.context;
    GameObject.addComponent(scene, this.frame);
    this.renderer.setAnimationLoop(timestamp => {
      this.frame.timestamp = timestamp;
      this.context.update(timestamp);
    });
  }

  render(draw: () => void): void {
    this.drawFrame = draw;
    try {
      this.context.renderNow();
    } finally {
      this.drawFrame = undefined;
    }
  }

  dispose(keepCanvas = false): void {
    if (this.lifetime.signal.aborted) return;
    this.lifetime.abort();
    this.frame.destroy();
    this.context.composer = null;
    this.composer?.dispose();
    // The viewer disposes the shared city and camera resources.
    this.context.scene = new Scene();
    const canvas = this.renderer.domElement;
    const parent = canvas.parentNode;
    const next = canvas.nextSibling;
    try {
      this.context.dispose();
    } finally {
      if (keepCanvas && parent && canvas.parentNode !== parent) parent.insertBefore(canvas, next);
    }
  }
}
