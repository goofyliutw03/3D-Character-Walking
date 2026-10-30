# Water Shader API v1

公開入口：`src/water/index.ts`。Three.js／WebGL2 的程序水景，無 texture、DOM、renderer 或外部素材依賴。`WATER_API_VERSION = 1` 為目前介面版本，尚未獨立發佈 npm package。

## 完整水景
```typescript
import { WaterFeature } from './water/index';
const water = new WaterFeature();
water.root.position.set(0, 0, -24.6);
scene.add(water.root);
water.configure({quality:'low', waveStrength:0.8, flowSpeed:1});
// 在宿主既有迴圈呼叫；隱藏／恢復首幀以 0 更新，不補算背景時間。
water.update(deltaSeconds);
// 先還原外觀覆寫，再由 owner 釋放。
water.dispose();
```
內建 4×3m 池面（local y=.32）、約 2m 瀑布（local z=-1.1，朝 +Z）。root 可平移／繞 Y 旋轉；非等比縮放／任意水面尺寸會拉伸既定泡沫與波形，不保證視覺一致。

## 只使用材質模組
```typescript
import { Mesh, PlaneGeometry } from 'three';
import { WaterShaderModule } from './water/index';
const shader = new WaterShaderModule();
const geometry = new PlaneGeometry(4, 3, 32, 24).rotateX(-Math.PI / 2);
const mesh = new Mesh(geometry, shader.surfaceMaterial);
mesh.position.y = .32;
scene.add(mesh);
shader.configure({flowSpeed:1.5});
shader.update(deltaSeconds);
// host 自行管理 fallMaterial 的 mesh.visible = shader.settings.enabled。
mesh.removeFromParent(); geometry.dispose(); shader.dispose();
```
`surfaceMaterial` 用 local XZ 波面；`fallMaterial` 用 UV 向下流，預設以 local XY 平面使用。材質模組不修改 geometry、可見性、陰影、DPR 或相機。品質會改 shader 雜訊細節；自有網格的細分密度由 host 決定。完整 WaterFeature 會連同 quality 替換 geometry。

## 設定與時間
`configure(Partial<WaterSettings>): boolean` 原子驗證並回傳成功／失敗；失敗保留狀態。

| 欄位 | 預設 | 範圍／行為 |
|---|---|---|
| enabled | true | false 為靜態池色；完整 Feature 同時隱藏瀑布 |
| paused | false | true 凍結全部 shader 動畫，不影響 host 相機／角色 |
| waveStrength | 1 | finite，0–2 |
| flowSpeed | 1 | finite，0–3 |
| quality | standard | standard／low；Feature 的池面細分為 96×72／32×24 |

`settings` 回傳複本；`elapsed` 為模組累積的秒數。`update` 忽略負值／非 finite delta，單次最多 .1 秒；off／paused／disposed 不前進。模組不監聽 visibilitychange，host 必須避免把背景時間傳入。configure 在 dispose 後回 false。

## 外觀覆寫與所有權
材質支援 `opacity`（搭配 transparent／depthWrite）、`wireframe`。`clone()`／`copy()` **刻意共享來源的動畫 uniforms**，所以暫時透明或線框的副本會同步所屬模組時間；各自 `uOpacity` 由材質 `onBeforeRender` 同步。不要覆蓋此 callback。若需要獨立動畫，建立另一個 WaterShaderModule，不用 clone。

每個 module 擁有兩個原材質；Feature 額外擁有自己的 geometry。host 擁有 clones、自建 geometry、scene、lights、renderer、loop；clone 不可比 module 活得更久。還原並 dispose clones 後才 dispose module／Feature，避免仍附著已釋放材質。dispose 冪等，無 texture 或 render target。

程序光照提供固定風格反光，水面不接收真實場景陰影，也沒有即時反射。瀑布是雙面薄片，側面會變薄。這不是流體／游泳／物理 API。街道品質設定僅影響水景，renderer DPR 與陰影仍由主應用管理。
