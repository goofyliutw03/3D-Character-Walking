import {
  ACESFilmicToneMapping, BoxGeometry, Color, CylinderGeometry, DirectionalLight, Group,
  HemisphereLight, Mesh, MeshStandardMaterial, PCFShadowMap, PerspectiveCamera, Scene, Vector3, WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { WaterFeature, WetLensEffect, createSpraySource, type WaterSettings } from './index.ts';
import { WaterBenchmark } from './WaterBenchmark.ts';
import type { WaterStats } from './WaterBenchmark.ts';

export class WaterPrototype {
  private readonly scene=new Scene();
  private readonly camera=new PerspectiveCamera(42,1,.05,80);
  private readonly renderer: WebGLRenderer;
  private readonly controls: OrbitControls;
  private water=new WaterFeature();
  private readonly lens=new WetLensEffect();
  private readonly spraySource=createSpraySource();
  private readonly environment=new Group();
  private readonly benchmark=new WaterBenchmark();
  private readonly observer: ResizeObserver;
  private readonly listeners=new AbortController();
  private readonly viewport: HTMLElement;
  private readonly status: HTMLElement;
  private readonly report: HTMLElement;
  private readonly statsLabel: HTMLElement;
  private last=0;
  private lastText=0;
  private saved: WaterSettings | undefined;
  private fixedViewport: {width:number;height:number;dpr:number} | undefined;
  private environmentReport: object = {};
  private reportTime='';
  private shaderErrors=0;
  private disposed=false;

  constructor(private readonly container: HTMLElement) {
    container.innerHTML=`
      <header><a class="brand" href="./">CITY / LAB</a><span class="study">WATER STUDY <b>01</b></span><span class="prototype">獨立水景原型</span></header>
      <main>
        <section class="stage" aria-label="水景觀察區">
          <div class="scene-title"><p>PROCEDURAL LANDSCAPES</p><h1>一方水景<span>A quiet cascade.</span></h1></div>
          <div id="water-viewport"></div>
          <div class="scene-caption"><span>01 / 青綠池面與小瀑布</span><span>4 × 3 m POOL · 2 m FALL</span></div>
        </section>
        <aside aria-label="水景控制">
          <div class="panel-heading"><span>EXPERIMENT CONTROLS</span><h2>觀察水的節奏</h2><p>拖曳旋轉 · 滾輪縮放<br>程序化水景，無外部素材。</p></div>
          <fieldset id="water-settings"><legend>水景設定</legend>
            <label class="toggle">動態效果<input id="enabled" type="checkbox" checked></label>
            <label class="toggle">暫停動畫<input id="paused" type="checkbox"></label>
            <label class="toggle" for="lens">鏡頭薄霧與水滴<input id="lens" type="checkbox" checked></label>
            <label for="wave">波浪強度 <output id="wave-value">1.0</output></label><input id="wave" type="range" min="0" max="2" step="0.1" value="1">
            <label for="flow">水流速度 <output id="flow-value">1.0</output></label><input id="flow" type="range" min="0" max="3" step="0.1" value="1">
            <label for="quality">渲染品質</label><select id="quality"><option value="standard">標準 · 細緻波面</option><option value="low">低 · 輕量波面</option></select>
            <label for="view">觀察鏡頭</label><select id="view"><option value="overview">全景 · 斜角</option><option value="near">近看 · 落水處</option><option value="spray">噴濺 · 鏡頭沾水</option><option value="far">遠看 · 整體輪廓</option><option value="side">側面 · 接合</option></select>
          </fieldset>
          <section class="measurement"><h3>效能比較</h3><p>固定 960×600 / DPR 1 / 陰影開<br>每段暖機 5 秒，關／開各 60 秒 × 3 輪。</p>
            <button id="benchmark" type="button">開始三輪比較 <span>約 6 分半</span></button>
            <button id="cancel" type="button" disabled>取消比較</button>
            <button id="resources" type="button">檢查 10 次建立／釋放</button>
          </section>
          <p id="water-status" role="status">初始化水景…</p><p id="water-stats" class="mono"></p>
          <p class="limits">獨立水景研究；街道入口共用水景 API。<br>手機與跨 GPU 效能尚待實機驗證。</p>
        </aside>
      </main>
      <details class="results"><summary>測量與資源檢查報告</summary><pre id="water-report">尚無報告</pre></details>`;
    this.viewport=this.element('water-viewport'); this.status=this.element('water-status');
    this.report=this.element('water-report'); this.statsLabel=this.element('water-stats');
    this.renderer=new WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.renderer.toneMapping=ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.3;
    this.renderer.shadowMap.enabled=true; this.renderer.shadowMap.type=PCFShadowMap;
    this.renderer.debug.onShaderError=()=>{
      this.shaderErrors++; this.status.textContent='Shader 編譯失敗，請查看主控台並重新整理。';
      this.cancel('Shader 編譯失敗');
    };
    this.renderer.domElement.setAttribute('aria-label','青綠水池與兩公尺瀑布，可拖曳旋轉與縮放');
    this.renderer.domElement.setAttribute('role','img');
    this.viewport.append(this.renderer.domElement);
    this.scene.background=new Color('#d0ddd3');
    this.buildEnvironment(); this.scene.add(this.water.root,this.environment);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true; this.controls.minDistance=1.2; this.controls.maxDistance=20;
    this.controls.minPolarAngle=.12; this.controls.maxPolarAngle=Math.PI*.49;
    this.controls.target.set(0,.65,0); this.setView('overview');
    this.bindUI();
    this.observer=new ResizeObserver(()=>this.resize()); this.observer.observe(this.viewport);
    this.resize();
    this.renderer.domElement.addEventListener('webglcontextlost',event=>{
      event.preventDefault(); this.cancel('WebGL context lost');
      this.lens.clear();
      this.status.textContent='WebGL 連線中斷，請重新整理頁面。'; this.renderer.setAnimationLoop(null);
    },{signal:this.listeners.signal});
    document.addEventListener('visibilitychange',()=>{
      this.last=0;
      if(document.hidden) this.cancel('分頁已進入背景');
    },{signal:this.listeners.signal});
    window.addEventListener('pagehide',()=>this.dispose(),{once:true,signal:this.listeners.signal});
    this.status.textContent='水景就緒 · WebGL2';
    this.renderer.setAnimationLoop(now=>this.frame(now));
  }

  dispose(): void {
    if(this.disposed) return; this.disposed=true;
    this.renderer.setAnimationLoop(null); this.listeners.abort(); this.observer.disconnect(); this.controls.dispose();
    this.water.dispose();this.lens.dispose();
    const geometries=new Set<BoxGeometry|CylinderGeometry>(),materials=new Set<MeshStandardMaterial>();
    this.environment.traverse(o=>{if(o instanceof Mesh){geometries.add(o.geometry);materials.add(o.material);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    this.scene.traverse(o=>{if(o instanceof DirectionalLight) o.shadow.dispose();});
    this.scene.clear(); this.renderer.dispose(); this.renderer.domElement.remove();
  }
  private element(id: string): HTMLElement { return this.container.querySelector<HTMLElement>(`#${id}`)!; }
  private input(id: string): HTMLInputElement { return this.element(id) as HTMLInputElement; }
  private bindUI(): void {
    const on=(id:string,event:string,fn:()=>void)=>this.element(id).addEventListener(event,fn,{signal:this.listeners.signal});
    on('enabled','change',()=>{this.water.configure({enabled:this.input('enabled').checked});if(!this.water.settings.enabled)this.lens.clear();});
    on('lens','change',()=>{this.lens.enabled=this.input('lens').checked;});
    on('paused','change',()=>this.water.configure({paused:this.input('paused').checked}));
    on('wave','input',()=>{
      const value=Number(this.input('wave').value); this.water.configure({waveStrength:value});
      this.element('wave-value').textContent=value.toFixed(1);
    });
    on('flow','input',()=>{
      const value=Number(this.input('flow').value); this.water.configure({flowSpeed:value});
      this.element('flow-value').textContent=value.toFixed(1);
    });
    on('quality','change',()=>{this.water.configure({quality:this.input('quality').value as WaterSettings['quality']});this.resize();});
    on('view','change',()=>this.setView(this.input('view').value));
    on('benchmark','click',()=>this.startBenchmark()); on('cancel','click',()=>this.cancel('使用者取消'));
    on('resources','click',()=>this.checkResources());
  }
  private setView(view:string): void {
    const views:Record<string,[number,number,number]>={overview:[6.7,5.3,7.4],near:[2.6,1.7,2.8],spray:[.7,1.3,.9],far:[10,8,12],side:[6,1.1,-.2]};
    this.controls.target.set(0,view==='near'?.55:.65,view==='near'?-.55:0);
    if(view==='spray')this.controls.target.set(0,1,-.9);
    this.camera.position.copy(new Vector3(...(views[view]??views.overview))); this.controls.update();
  }
  private resize(): void {
    if(this.disposed) return;
    if(this.benchmark.running) {
      const fixed=this.fixedViewport;
      if(fixed && (window.innerWidth!==fixed.width || window.innerHeight!==fixed.height || window.devicePixelRatio!==fixed.dpr)) this.cancel('視窗尺寸或 DPR 改變');
      return;
    }
    const width=Math.max(1,this.viewport.clientWidth),height=Math.max(1,this.viewport.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,this.water.settings.quality==='low'?1.25:2));
    this.renderer.setSize(width,height); this.camera.aspect=width/height;this.camera.updateProjectionMatrix();
  }
  private stats(): WaterStats {
    const i=this.renderer.info;
    return {calls:i.render.calls,triangles:i.render.triangles,geometries:i.memory.geometries,textures:i.memory.textures,programs:i.programs?.length??0};
  }
  private frame(now:number): void {
    if(this.disposed) return;
    const delta=this.last && !document.hidden ? (now-this.last)/1000 : 0;this.last=now;
    if(this.benchmark.running && this.fixedViewport) {
      const f=this.fixedViewport;
      if(window.innerWidth!==f.width || window.innerHeight!==f.height || window.devicePixelRatio!==f.dpr) this.cancel('視窗尺寸或 DPR 改變');
    }
    if(this.benchmark.running && this.water.settings.enabled!==this.benchmark.enabled) this.water.configure({enabled:this.benchmark.enabled});
    this.water.update(delta);
    if(!this.benchmark.running) this.controls.update();
    this.lens.update(delta,this.camera,this.water.getSpraySource(this.spraySource)?this.spraySource:undefined,
      this.environment,this.water.settings,window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.renderer.render(this.scene,this.camera);
    this.lens.render(this.renderer);
    if(this.benchmark.running) {
      this.benchmark.sample(now,this.stats());
      if(!this.benchmark.running) {
        this.reportTime=new Date().toISOString(); this.writeBenchmarkReport(); this.finishBenchmark();
      }
    }
    if(now-this.lastText>500) {
      const s=this.stats();
      this.statsLabel.textContent=`${s.calls} calls · ${s.triangles.toLocaleString()} triangles\n${s.geometries} geometries · ${s.textures} textures\nt = ${this.water.elapsed.toFixed(2)} s · ${this.water.settings.quality}`;
      if(this.benchmark.running) {this.status.textContent=this.benchmark.status; this.writeBenchmarkReport();}
      this.lastText=now;
    }
  }
  private startBenchmark(): void {
    if(this.benchmark.running || this.shaderErrors) return;
    if(document.hidden) {this.status.textContent='請在前景分頁開始比較。';return;}
    if(this.viewport.clientWidth<960 || this.viewport.clientHeight<600) {
      this.status.textContent='比較需要觀察區至少 960×600；請放大視窗後重試。';return;
    }
    this.saved=this.water.settings; this.setView('overview');
    this.input('view').value='overview';
    this.camera.position.set(6.7,5.3,7.4);this.controls.target.set(0,.65,0);this.camera.lookAt(this.controls.target);
    this.controls.enabled=false; this.water.configure({enabled:false,paused:false});
    this.renderer.setPixelRatio(1);this.renderer.setSize(960,600,false);
    this.renderer.domElement.style.width='960px';this.renderer.domElement.style.height='600px';
    this.camera.aspect=960/600;this.camera.updateProjectionMatrix();
    this.fixedViewport={width:window.innerWidth,height:window.innerHeight,dpr:window.devicePixelRatio};
    const gl=this.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    this.environmentReport={userAgent:navigator.userAgent,platform:navigator.platform,
      renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
      canvas:[960,600],dpr:1,shadow:'PCF 1024 enabled',camera:[6.7,5.3,7.4],target:[0,.65,0],
      quality:this.saved.quality,waveStrength:this.saved.waveStrength,flowSpeed:this.saved.flowSpeed,
      warmupSeconds:5,sampleSeconds:60,rounds:3,clock:'requestAnimationFrame; not GPU timestamp'};
    this.reportTime='';this.benchmark.start(performance.now());this.lockUI(true);this.status.textContent=this.benchmark.status;
  }
  private finishBenchmark(): void {
    if(this.saved) this.water.configure(this.saved);
    this.saved=undefined;this.fixedViewport=undefined;this.controls.enabled=true;
    this.lockUI(false);this.resize();this.status.textContent=this.benchmark.status;
  }
  private cancel(reason:string): void {
    if(!this.benchmark.running) return;
    this.benchmark.cancel(reason); this.writeBenchmarkReport();this.finishBenchmark();
  }
  private lockUI(locked:boolean): void {
    (this.element('water-settings') as HTMLFieldSetElement).disabled=locked;
    (this.element('benchmark') as HTMLButtonElement).disabled=locked;
    (this.element('resources') as HTMLButtonElement).disabled=locked;
    (this.element('cancel') as HTMLButtonElement).disabled=!locked;
  }
  private writeBenchmarkReport(): void {
    this.report.textContent=JSON.stringify({status:this.benchmark.status,completedAt:this.reportTime,
      environment:this.environmentReport,shaderErrors:this.shaderErrors,results:this.benchmark.results},null,2);
  }
  private checkResources(): void {
    const settings=this.water.settings,cycles:WaterStats[]=[];
    this.water.dispose();this.renderer.render(this.scene,this.camera);
    const baseline=this.stats();
    for(let i=0;i<10;i++) {
      const test=new WaterFeature();test.configure(settings);this.scene.add(test.root);
      this.renderer.render(this.scene,this.camera);test.configure({quality:settings.quality==='low'?'standard':'low'});
      this.renderer.render(this.scene,this.camera);test.dispose();this.renderer.render(this.scene,this.camera);
      cycles.push(this.stats());
    }
    this.water=new WaterFeature();this.water.configure(settings);this.scene.add(this.water.root);
    const stable=cycles.every(s=>s.geometries===baseline.geometries&&s.textures===baseline.textures&&s.programs===baseline.programs);
    this.report.textContent=JSON.stringify({resourceCheck:stable?'PASS':'FAIL',baseline,cycles,shaderErrors:this.shaderErrors},null,2);
    this.status.textContent=stable?'10 次建立／品質切換／釋放：資源穩定':'資源檢查發現差異，請查看報告';
    this.container.querySelector('details')!.open=true;
  }
  private buildEnvironment(): void {
    const stone=new MeshStandardMaterial({color:'#7c9181',roughness:.95});
    const rim=new MeshStandardMaterial({color:'#c4c8ad',roughness:.85});
    const earth=new MeshStandardMaterial({color:'#a8b6a2',roughness:1});
    const dark=new MeshStandardMaterial({color:'#526f60',roughness:1});
    const leaf=new MeshStandardMaterial({color:'#597e63',roughness:1});
    const box=(w:number,h:number,d:number,x:number,y:number,z:number,material:MeshStandardMaterial)=>{
      const mesh=new Mesh(new BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;
      this.environment.add(mesh);return mesh;
    };
    box(8,.18,6,0,-.24,0,earth);box(4.5,.35,3.5,0,-.01,0,stone);
    box(4.36,.2,.18,0,.26,1.6,rim);box(4.36,.2,.18,0,.26,-1.6,rim);
    box(.18,.2,3.38,-2.1,.26,0,rim);box(.18,.2,3.38,2.1,.26,0,rim);
    box(1.6,2.35,.56,0,1.05,-1.48,stone);
    box(1.85,.16,.9,0,2.28,-1.43,rim);
    box(1.18,.035,.34,0,2.37,-1.17,dark);
    for(let i=0;i<7;i++) {
      const x=(i%2===0?-1:1)*(1.1+(i%3)*.19), z=-1.05+(i%3)*.22;
      const rock=new Mesh(new CylinderGeometry(.20,.28,.28,5),stone);
      rock.position.set(x,.35,z);rock.rotation.set(.2,i*.7,.15);rock.castShadow=true;this.environment.add(rock);
    }
    for(const [x,z] of [[-2.8,-1.8],[2.8,-1.2],[-2.7,.9],[2.65,1.8]]) {
      for(let i=0;i<3;i++) {
        const plant=new Mesh(new CylinderGeometry(0,.2+i*.04,.55+i*.13,5),leaf);
        plant.position.set(x+Math.sin(i*4)*.15,.18+i*.07,z+Math.cos(i*4)*.12);plant.castShadow=true;this.environment.add(plant);
      }
    }
    this.scene.add(new HemisphereLight('#f1f7e4','#647a70',2.4));
    const sun=new DirectionalLight('#fff3d6',3);sun.position.set(-3,7,4);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-6;sun.shadow.camera.right=6;
    sun.shadow.camera.top=6;sun.shadow.camera.bottom=-6;sun.shadow.normalBias=.035;
    this.scene.add(sun);
  }
}
