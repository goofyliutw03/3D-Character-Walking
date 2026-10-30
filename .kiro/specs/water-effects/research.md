# Research & Design Decisions

## Summary
- Feature：water-effects；Extension，獨立入口整合既有 Vite／Three.js 基線。
- 既有 SceneRenderer 具有 ACES exposure 1.3、PCF shadows、DPR cap 2 與 renderer.info。原型採相同設定但獨立擁有 renderer，避免街道共用修改。
- 既有 Vite 無 config；需明列雙 HTML input 才能進 production，不能僅靠 dev URL。

## Research Log
2026-10-30 查本機 package／Three.js ShaderChunk 與官方文件：
- [Vite multi-page](https://vite.dev/guide/build#multi-page-app)：採 build.rolldownOptions.input，保留 index.html 並新增 water.html。
- [Three.js disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html)：移除 scene 不會釋放 GPU buffer；geometry／material 逐一 dispose，renderer.info 用於重複循環觀察。
- [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer)：info 提供 calls／triangles／memory；shader compile errors 必須在實際 renderer 檢查。
- 使用技能：kiro spec-init／requirements／design／tasks／impl／validate-impl／verify-completion；保留 requirements → design → tasks 順序及 gates，依授權 inline 審閱，不委派、不 commit。

## Architecture Pattern Evaluation
| 方案 | 收益 | 限制／決策 |
|---|---|---|
| 現有 Water addon + 反射 RTT | 場景反射 | 額外 pass、非核准需求；不採 |
| 程序 ShaderMaterial | 無素材依賴、可控單 pass 成本 | 自訂光照及近遠角需驗；採用 |
| 真流體／粒子瀑布 | 體積感 | 超出範圍與成本；不採 |

## Design Decisions
### 單一效果時間與設定
水面、瀑布共用動畫時間和流速；暫停及關閉時不累積時間。波浪強度只影響池面，流速影響水流與環形波頻率。不增加通用框架。
### 透明邊界
不透明池面以幾何波及解析法線模擬反光；瀑布為雙面單層透明片，depthWrite=false，固定晚於池面繪製。泡沫與環形紋理直接在池面 shader 合成，消除共面泡沫接縫。
### 品質
標準 96×72 池面網格與完整雜訊；低 32×24、較少雜訊。DPR cap 標準 2／低 1.25。切換 geometry 後立即釋放舊 buffer；正式 A/B 同一品質不改 DPR。
### 測量
requestAnimationFrame 間隔為瀏覽器呈現節奏代理，非 GPU timestamp。暖機每段 5 秒，各 60 秒，off/on 三輪。整組鎖控制與 Orbit，尺寸／visibility 改變即中止。統計含所有 sample，不隱藏慢幀；記錄 renderer.info 及環境。目標不能代替實測。

## Risks & Mitigations
低視角仍可能看到平面瀑布；本原型不以體積流體承諾。近／遠／斜角及資源釋放採實際 WebGL 驗證；手機無真機記未驗。既有 Release script index.html 最後更新，新增 water.html 必須同樣在 hashed 資產之後更新；必要修改僅發佈順序，不改目的地或刪除政策。
