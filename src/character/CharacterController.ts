import type { MovementIntent, MotionSnapshot, WalkableWorld } from './motion';

const RADIUS = 0.28;
const GRAVITY = 18;

export class CharacterController {
  private readonly state: MotionSnapshot;
  private velocityY = 0;
  private jumpHeld = false;
  constructor(private readonly world: WalkableWorld) {
    this.state = { x: 0, y: world.groundHeight(0, 5), z: 5, heading: Math.PI, speed: 0, grounded: true, action: 'idle' };
  }
  update(delta: number, intent: MovementIntent): Readonly<MotionSnapshot> {
    const dt = Math.min(Math.max(Number.isFinite(delta) ? delta : 0, 0), 0.05);
    const magnitude = Math.hypot(intent.x, intent.z);
    const scale = (intent.run ? 4 : 1.8) / Math.max(1, magnitude);
    const vx = intent.x * scale;
    const vz = intent.z * scale;
    if (magnitude > 0) this.state.heading = Math.atan2(intent.x, intent.z);
    if (intent.jump && !this.jumpHeld && this.state.grounded) {
      this.velocityY = 6;
      this.state.grounded = false;
    }
    this.jumpHeld = intent.jump;
    const startX = this.state.x;
    const startZ = this.state.z;
    const steps = Math.max(1, Math.ceil(dt * 120));
    const step = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.state.x = this.moveAxis('x', vx * step);
      this.state.z = this.moveAxis('z', vz * step);
      const ground = this.world.groundHeight(this.state.x, this.state.z);
      if (this.state.grounded) this.state.y = ground;
      else {
        this.state.y += this.velocityY * step - GRAVITY * step * step / 2;
        this.velocityY -= GRAVITY * step;
        if (this.state.y <= ground) {
          this.state.y = ground;
          this.velocityY = 0;
          this.state.grounded = true;
        }
      }
    }
    this.state.speed = dt > 0 ? Math.hypot(this.state.x - startX, this.state.z - startZ) / dt : 0;
    this.state.action = !this.state.grounded ? 'jump' : this.state.speed < 0.00001 ? 'idle' : intent.run ? 'run' : 'walk';
    return { ...this.state };
  }
  private moveAxis(axis: 'x' | 'z', distance: number): number {
    const xAxis = axis === 'x';
    const minKey = xAxis ? 'minX' : 'minZ';
    const maxKey = xAxis ? 'maxX' : 'maxZ';
    const other = xAxis ? this.state.z : this.state.x;
    const start = this.state[axis];
    let next = Math.max(this.world.bounds[minKey] + RADIUS, Math.min(this.world.bounds[maxKey] - RADIUS, start + distance));
    for (const obstacle of this.world.obstacles) {
      const otherMin = (xAxis ? obstacle.minZ : obstacle.minX) - RADIUS;
      const otherMax = (xAxis ? obstacle.maxZ : obstacle.maxX) + RADIUS;
      if (other <= otherMin || other >= otherMax) continue;
      const min = obstacle[minKey] - RADIUS;
      const max = obstacle[maxKey] + RADIUS;
      if (distance > 0 && start <= min && next > min) next = min;
      if (distance < 0 && start >= max && next < max) next = max;
    }
    return next;
  }
}
