# Research and Design Decisions

## Summary
2026-10-31：套用 kiro-spec-init／requirements／design／tasks；擴充既有模組，無新套件。使用者已核准整體方案；依 AGENTS 採依序實作與 inline 審閱，不委派。

## Research Log
- WaterFeature owns geometry，ShaderModule owns materials/time；新增粒子不改既有 material-only API。
- StreetWaterFeature private water，CityScene 公開 settings；新增 world source API，主程式不寫死街尾座標。
- SceneRenderer 普通分支有 early return，魚眼在 FisheyePass 最後合成；鏡頭層必須在兩分支結尾呼叫。黑邊用相同圓形比例遮罩。
- SceneAppearance 僅處理 Mesh；Points 不加入遮擋／Xray mask，維持深度測試，物理遮擋偵測不受透明模式外觀影響。
- WaterPrototype 自有 renderer／loop／benchmark／資源循環；共用 WetLensEffect，不新建 loop。既有 A/B 測的是完整水景，另留新增效果的隔離開關樣本。
- 官方 [Points](https://threejs.org/docs/pages/Points.html) 與 [ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html) 確認 BufferGeometry、uniform 與 WebGLRenderer 用法；實際相容性以本機 0.186.1 原碼／types 及 GPU 驗證為準。

## Design Decisions
- Generalization：只公開變換後噴濺源及獨立 WetLensEffect，沒有建立通用 emitter／特效框架。
- Build vs adopt：使用既有 Three.js Points／ShaderMaterial，固定 attributes 在 GPU 依有界循環時間算軌跡。無新增依賴或素材。
- Simplification：鏡頭層採解析透明薄霧與水滴邊緣／高光，不複製完整場景貼圖、不做折射／全畫面模糊；降低額外 render target 成本。水滴 UV 維持鏡片空間，不跟著魚眼變形。
- Boundary Candidates：粒子資源、噴濺源、濕潤狀態與最終合成；角色／導航／Caster→Target 排除。
- Risks：透明排序、點大小硬體上限、高 DPR fill rate、側背及障礙誤觸；固定容量、point size cap、低品質較低密度、raycast 僅近距執行、離開後停 draw。
