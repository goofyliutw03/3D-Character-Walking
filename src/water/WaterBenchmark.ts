export interface WaterStats { calls: number; triangles: number; geometries: number; textures: number; programs: number }
export interface BenchmarkResult {
  round: number; enabled: boolean; frames: number; seconds: number; fps: number;
  medianMs: number; p95Ms: number; resources: { min: WaterStats; max: WaterStats };
}
export function summarizeFrames(frames: number[]): {fps:number; medianMs:number; p95Ms:number} {
  if (!frames.length || frames.some(v=>!Number.isFinite(v) || v <= 0)) throw new Error('Invalid frame samples');
  const sorted=[...frames].sort((a,b)=>a-b), n=sorted.length;
  return {
    fps:n*1000/frames.reduce((sum,v)=>sum+v,0),
    medianMs:n%2 ? sorted[(n-1)/2] : (sorted[n/2-1]+sorted[n/2])/2,
    p95Ms:sorted[Math.ceil(n*.95)-1],
  };
}

/** Pure sampler. The host locks the environment and applies enabled between segments. */
export class WaterBenchmark {
  readonly results: BenchmarkResult[] = [];
  private stage = -1;
  private started = 0;
  private previous = 0;
  private frames: number[] = [];
  private minimum: WaterStats | undefined;
  private maximum: WaterStats | undefined;
  private sampling = false;
  private reason = '';
  constructor(private readonly warmupMs=5000, private readonly sampleMs=60000) {}
  get running(): boolean { return this.stage >= 0 && this.stage < 6; }
  get enabled(): boolean { return this.stage % 2 === 1; }
  get status(): string {
    if (this.reason) return `已取消：${this.reason}`;
    if (!this.running) return this.results.length === 6 ? '完成三輪比較' : '尚未開始';
    return `第 ${Math.floor(this.stage/2)+1}/3 輪 · 效果${this.enabled?'開啟':'關閉'} · ${this.sampling?'採樣 60 秒':'暖機 5 秒'}`;
  }
  start(now: number): void {
    this.results.length=0; this.reason=''; this.stage=0; this.resetSegment(now);
  }
  cancel(reason: string): void {
    if (!this.running) return;
    this.reason=reason; this.stage=-1; this.frames=[];
  }
  sample(now: number, stats: WaterStats): void {
    if (!this.running) return;
    if (!this.sampling) {
      if (now-this.started >= this.warmupMs) {
        this.sampling=true; this.started=now; this.previous=now;
      }
      return;
    }
    const delta=now-this.previous;
    if (delta <= 0 || !Number.isFinite(delta)) return;
    this.previous=now; this.frames.push(delta);
    if (!this.minimum || !this.maximum) { this.minimum={...stats}; this.maximum={...stats}; }
    else for (const key of Object.keys(stats) as (keyof WaterStats)[]) {
      this.minimum[key]=Math.min(this.minimum[key],stats[key]);
      this.maximum[key]=Math.max(this.maximum[key],stats[key]);
    }
    if (now-this.started >= this.sampleMs) {
      this.results.push({round:Math.floor(this.stage/2)+1,enabled:this.enabled,frames:this.frames.length,
        seconds:(now-this.started)/1000,...summarizeFrames(this.frames),
        resources:{min:{...this.minimum!},max:{...this.maximum!}}});
      this.stage++; this.resetSegment(now);
    }
  }
  private resetSegment(now: number): void {
    this.started=now; this.previous=now; this.frames=[]; this.minimum=undefined; this.maximum=undefined; this.sampling=false;
  }
}
