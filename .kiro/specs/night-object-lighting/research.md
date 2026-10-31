# Research & Design Decisions
## Summary
- Feature: night-object-lighting；Extension，整合與效能重點檢查。
- 已讀 kiro init/requirements/design/tasks/impl/review/verify/validate-impl、相關規則與模板；依AGENTS較新授權連續推進及inline審閱，不委派、不commit。
## Research Log
### 既有整合
- CityScene擁有sun/ambient與共用材質；路燈共六個，使用獨立燈具材質避免共用米色物件發亮。
- ParticleInteraction以Flight快照、掃掠命中、group.clear與8碎片運作；光源必須在clear後重新掛載，碎片移動僅處理Mesh。
- ViewerApp/main/UI維持既有所有權；water Shader有自訂顏色，不接場景點光，保留且明示。
### Three.js契約
- 官方 https://threejs.org/docs/pages/PointLight.html 與已安裝node_modules/three/src/lights/PointLight.js：intensity為cd，distance非零為截止半徑，decay預設2；Light.dispose及PointLight.shadow.dispose需回收。
- WebGLLights取matrixWorld，利用Object3D子節點掛載可隨動；無需每幀配置世界位置。
- 點光無陰影會穿牆，沒有bloom，這是本次取捨；不承諾物理完整照明。
## Architecture Pattern Evaluation
| 選項 | 結果 |
|---|---|
| 每顆粒子一燈 | 拒絕：128燈成本與shader變體不可控 |
| 全域特效框架 | 拒絕：超出本次需求 |
| 通用有限掛載池＋每群組租用一槽 | 採用：Three原生光源、單一生命週期、可重用API |
## Design Decisions
- 通用ObjectLightPool只負責掛載／更新／移除，不認識粒子或日夜。粒子池8槽，路燈池6槽；每池預建PointLight，空槽以零強度留在停放root，維持renderer燈數以避免連發shader變體。
- opaque handle不暴露PointLight；移除使舊handle失效，重用槽不讓舊handle修改新租用者。
- 滿額仍保留效果，釋出後按既有Flight順序補槽。無無限排程或額外loop。
- 設定數值：intensity 0–200cd、radius .1–30m、decay 0–4；預設20cd/5m/2。路燈120cd/12m/2。
## Risks & Mitigations
GPU成本以14盞無陰影點光上限及production樣本揭露；角色可讀性以夜間基礎光及實際畫面檢查。池dispose需先解除所有租用再dispose燈，避免group.clear漏釋放。
## Review
requirements gate PASS：15條件具數字ID、EARS及可驗行為，範圍無矛盾。依使用者授權自動inline審閱通過，非逐份人工核准。
## Token基準
2026-10-31T10:23:38.781Z本機rollout token_count：input509398/output2020/total511418，cached421632已含input，reasoning43已含output。本chat開頭及原規劃chat無基準，完整範圍無法取得精確值；此點後差額可獨立報告，不修改設定或DB。
