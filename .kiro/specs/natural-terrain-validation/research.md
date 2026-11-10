# 地表整合調查

## Summary
沿用既有 Environment／SceneSwitch 與 GroundPicker，無新依賴。讀取本機鎖定 Three.js 的 displacementmap_vertex 與 WebGLShadowMap：置換沿 objectNormal，陰影材質會複製 displacementMap／scale／bias。因此基底 normal 固定朝上，照明採 flatShading 的置換後片段導數法線，避免把斜面 normal 當置換方向而造成水平偏移。

## Research Log
- `src/scene/SceneSwitch.ts`：非同步準備與過期釋放既有；新增 terrain id 即可沿用。
- `src/navigation/GroundPicker.ts`：普通與魚眼 screen ray 最後進入 Mesh.raycast，可由同源已置換 proxy 供應，不改選點政策。
- `src/character/motion.ts`、`CharacterController.ts`：groundHeight 提供貼地與落地；導航在 XZ 平面進行，坡度需保持低於現有 normal.y >= .9 接受門檻。
- `src/scene/SceneAppearance.ts`：透明／線框會 clone 材質。採內建 displacementMap 可以保留 clone 行為，避免 onBeforeCompile 遺失地表形狀。
- Profiles 為 version 1，接受額外 terrain id 與 optional terrain scene settings，可保留舊 JSON。
- 技能：kiro-spec-init、requirements、design、tasks；依 AGENTS 及本次授權採 sequential／inline，無委派。

## Design Decisions
共用 HeightField 格網而不建立通用動態地形系統。採內建 displacementMap 而非自訂完整光照 Shader；CPU 代理幾何提供所有射線，不維護第二套求交算法。高度存 Uint8 程序紋理，GPU 與 CPU 先量化再使用，同一三角拓撲，標準／低品質只改裝飾數量。風動有獨立時間，reduced-motion 不推進。草木不成為可通行表面，樹幹有固定障礙。

## Risks
格網邊緣 UV、量化高度、三角剖分與 bounding volumes 必須測試。陰影接縫、Shader compile、context restore 仍需真正瀏覽器驗證；本機軟體 GPU 不能當手機／硬體效能驗收。
