# RENDER-01：WebGPU 與 fallback 評估

2026-11-06，1X-0。評估結論為維持正式版的 WebGL2 `WebGLRenderer`。Three.js 0.186.1 的新 renderer 可在此機運行標準材質，但兩種 backend 都無法呈現專案依賴的 GLSL `ShaderMaterial`。

## 實測

Windows Chrome 156 headless，安全 localhost，使用現有套件 `node_modules/three/build`。Chrome 加上 `--enable-unsafe-webgpu`，本機成功取得 adapter 並完成原生 WebGPU 渲染。各模式以新 canvas 畫同一個平面，在 64×64 離屏目標讀回中心 RGBA。標準材質為綠色 `MeshBasicMaterial`，GLSL fragment 明確輸出不透明紅色。

| 路徑 | 實際 renderer／backend | 標準材質 | GLSL |
|---|---|---|---|
| 現行 WebGL2 | WebGLRenderer | 1, 102, 8, 255 | 255, 0, 0, 255 |
| 原生 WebGPU | WebGPUBackend | 1, 102, 8, 255 | 0, 0, 0, 255 |
| `forceWebGL: true` | WebGLBackend | 1, 102, 8, 255 | 0, 0, 0, 255 |
| 注入 `requestAdapter() → null` | WebGLBackend | 1, 102, 8, 255 | 0, 0, 0, 255 |

後三組均回報 `THREE.NodeBuilder: Material "ShaderMaterial" is not compatible.`。注入組另外回報 WebGPU 不可用，已選 WebGL2 backend。探針及 JSON 保存在本機忽略目錄 `.local/render-01/`。從 repo 根目錄執行 `node .local/render-01/probe.mjs`，使用既有 Chrome 與 4190／9241 兩個 localhost port。前幾輪修正 CDP 頁面匯入時序及舊 renderer 讀回目標型別。表格來自完整 exit 0 的重跑。此測試量測像素與初始化行為，裝置效能和跨瀏覽器驗收仍依既有流程。

## 專案相容性

| 路徑 | 程式證據 | 移植前置 |
|---|---|---|
| 街景水／獨立水入口 | [WaterShaderModule](../src/water/WaterShaderModule.ts) 使用 GLSL surface、fall 及材質複製契約。[WaterPrototype](../src/water/WaterPrototype.ts) 自有 WebGLRenderer。 | 以節點材質重建外觀、時間與透明度契約，在街景及獨立入口重驗。 |
| 瀑布噴霧 | [WaterfallSpray](../src/water/WaterfallSpray.ts) 使用 GLSL points，且透過 WebGL context 查點大小範圍。 | 以跨 backend 的粒子繪製路徑重驗尺寸、遮擋、混色。 |
| 魚眼 | [FisheyePass](../src/engine/FisheyePass.ts) 用 WebGLRenderTarget 和 GLSL 等距投影。[SceneRenderer](../src/engine/SceneRenderer.ts) 以 WebGL extension 選擇 half-float。 | 移植投影及離屏目標，重驗直橫向、濾色、尺寸與 [DOM anchor 投影](../src/camera/AnchorProjection.ts) 一致。 |
| Xray | [CharacterXrayPass](../src/engine/CharacterXrayPass.ts) 用三個目標、深度編碼與 GLSL 合成，再由魚眼擷取。 | 移植並核對深度與合成順序、透明遮擋篩選、資源和 renderer 狀態復原。 |
| WetLens | [WetLensEffect](../src/water/WetLensEffect.ts) 在輸出末端以 GLSL 疊加，含魚眼分支。 | 重驗 final target、混色、乾鏡不繪製和渲染狀態。 |
| 光影與 UI | SceneRenderer 設定 ACES 曝光、PCF 陰影、WebGL 統計。[ViewerApp](../src/engine/ViewerApp.ts) 組裝多光源陰影、鏡頭和 DOM overlay。 | 以既有 WebGL2 為基準重驗陰影、色調、統計和 overlay，基本綠色像素只能證明最小場景能畫。 |

版本依據為安裝套件的 `ShaderMaterial.js`、`WebGPURenderer.js`、`Renderer.js` 與 `WebGPUBackend.js`。新 renderer 只在 backend 初始化失敗時呼叫 fallback。正常執行時的 device loss 走另一條事件路徑，預設處理會標記裝置遺失。探針主動呼叫 `device.destroy()` 得到 `destroyed`，該版本刻意略過 renderer 回呼，backend 保留原值。真實非預期 device loss 復原仍待驗。ViewerApp 的現有復原由 WebGL canvas 事件驅動。若未來採用雙 renderer，需要在應用層重建 canvas、資源、動畫迴圈和事件繫結，並用實際 backend 回報狀態。

採用前的門檻是上述效果在原生 WebGPU 與選定 fallback 都通過等效驗證，且初始化或裝置故障時能恢復到可操作畫面。此次交付為相容性評估，正式入口沿用既有 renderer。
