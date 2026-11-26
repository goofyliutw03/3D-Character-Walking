import { DestinationNavigation, isWalkable, type PointXZ } from './DestinationNavigation.ts';
import type { MovementIntent, WalkableWorld } from '../character/motion';
export type TourStatus = 'idle' | 'running' | 'paused' | 'completed' | 'blocked';
export interface TourSnapshot { status: TourStatus; index: number; count: number; loop: boolean; speed: number }
const stopped = (): MovementIntent => ({x:0,z:0,run:false,jump:false});
export function parseWaypoints(text: string): PointXZ[] | undefined {
  const lines = text.trim().split(/\r?\n/);
  if (!text.trim() || lines.length > 32) return undefined;
  const route: PointXZ[] = [];
  for (const line of lines) {
    const values = line.split(',').map(value => value.trim());
    if (values.length !== 2 || values.some(value => !value || !Number.isFinite(Number(value)))) return undefined;
    route.push({x:Number(values[0]),z:Number(values[1])});
  }
  return route;
}
export class PathTour {
  private readonly navigation: DestinationNavigation;
  private route: PointXZ[] = [];
  private state: TourStatus = 'idle';
  private index = 0;
  private loop = false;
  private speed = 1.8;
  constructor(private readonly world: WalkableWorld) { this.navigation = new DestinationNavigation(world); }
  get snapshot(): TourSnapshot { return {status:this.state,index:this.index,count:this.route.length,loop:this.loop,speed:this.speed}; }
  get target(): Readonly<PointXZ> | undefined { return this.navigation.target; }
  configure(loop: boolean, speed: number): boolean {
    if (!Number.isFinite(speed) || speed < .5 || speed > 4) return false;
    this.loop = loop; this.speed = speed; return true;
  }
  start(position: PointXZ, route: readonly PointXZ[], loop: boolean, speed: number): boolean {
    this.cancel();
    if (!this.configure(loop,speed) || route.length < 1 || route.length > 32 || route.some(p => !isWalkable(p,this.world))) {
      this.state = 'blocked'; return false;
    }
    this.route = route.map(p => ({...p})); this.index = 0;
    return this.select(position);
  }
  private select(position: PointXZ): boolean {
    if (!this.navigation.select(position,this.route[this.index]!)) { this.state = 'blocked'; return false; }
    this.state = 'running'; return true;
  }
  pause(): void {
    if (this.state !== 'running') return;
    this.navigation.cancel(); this.state = 'paused';
  }
  resume(position: PointXZ): boolean { return this.state === 'paused' && this.select(position); }
  cancel(): void { this.navigation.cancel(); this.state = 'idle'; this.route = []; this.index = 0; }
  sample(position: PointXZ, delta: number): MovementIntent {
    if (this.state !== 'running') return stopped();
    const intent = this.navigation.sample(position,delta,this.speed);
    if (this.navigation.status === 'blocked') { this.state = 'blocked'; return stopped(); }
    if (this.navigation.status === 'arrived') {
      if (this.index + 1 < this.route.length) this.index++;
      else if (this.loop) this.index = 0;
      else { this.state = 'completed'; return stopped(); }
      this.select(position); return stopped();
    }
    const run = this.speed > 1.8, ratio = this.speed / (run ? 4 : 1.8);
    return {...intent,x:intent.x*ratio,z:intent.z*ratio,run};
  }
}
