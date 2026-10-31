# 3D Character Walk Viewer

2026-10-31：**Scene display → Lighting & shadows → Night** 新增夜晚，六盞路燈會發亮並照亮街道。**Particle interaction → Light** 可設定隨行光源開關、獨立顏色、強度cd、照射半徑m與衰減，再按Apply settings；只影響新發射。最多8個效果同時照明，額外效果仍可發射；無點光陰影／bloom。既有水Shader不接場景點光。[可重用物件光源API](docs/lighting-api.md)・[規格與驗證](.kiro/specs/night-object-lighting/validation.md)。

2026-10-31：瀑布新增落水／飛濺粒子；鏡頭靠近時出現薄霧及少量水滴，離開後水滴下滑淡出、霧氣消退。**Scene display → Water feature → Camera mist & droplets** 可關閉鏡頭效果；`water.html` 的「噴濺 · 鏡頭沾水」可直接觀察。沿用暫停／品質及 reduced-motion。[規格與驗證](.kiro/specs/waterfall-spray/validation.md)・[可重用 API](docs/water-api.md)。

2026-10-31：Camera → Objects block mode 新增 **4 · X-ray character · 50%**，僅以半透明反相／高對比效果顯示主角被不透明環境擋住的部分。水、粒子、原始透明／半透明材質不列入判定；可見部分正常，First person 暫停效果。[規格與驗證](.kiro/specs/occluded-character-xray/validation.md)。

2026-10-31：街尾植栽島改為程序水池／小瀑布；由 **Scene display → Water feature** 調整效果、暫停、品質、波浪與流速。池岸不可通行，可從兩側繞行；低品質僅調整水景，不改整個場景的 DPR。獨立原型仍可於 `water.html` 開啟。[Shader Module／API 使用說明](docs/water-api.md)・[街道整合規格](.kiro/specs/street-water-integration/)。手機與跨 GPU 效能仍待實機驗證。

正式操作副本：修改仍在本專案進行，驗證後執行 `./scripts/project.ps1 release`，依序 tests／build／SHA256 增量同步至 `D:\Work_Mine\Testing\3D Character Walk Viewer\Release`。使用 `./scripts/project.ps1 preview-release`，開啟 http://127.0.0.1:4174 。[發佈流程、限制與驗證](docs/release.md)。

2026-10-29：手機操作列已移至場景正下方；輕點可走地面會跑向目的地，支援靜態避障、普通／160°魚眼拾取及手動取消。54項測試與本機正式預覽通過，iPhone Safari／Chrome／Edge真機驗收仍待完成。[規格與驗證](.kiro/specs/mobile-touch-navigation/validation.md)。

2026-10-26：里程碑 6 已整合本機 **男／女／小孩 skinned GLB**、Idle／Walk／Run／Jump 骨架動畫、轉場、真實載入與 Retry／fallback，待結束確認。成人來源為 Quaternius CC0；小孩比例與 Jump 為明確標示的專案衍生資產。無新 npm 依賴，使用既有 Blender 5.2.2 LTS 離線重建；正常瀏覽不需要 Blender。[資產來源](public/assets/characters/ATTRIBUTION.md)・[操作／重建](docs/asset-pipeline.md)・[驗證與限制](.kiro/specs/rigged-character-assets/validation.md)。下方原型／資產尚未整合的敘述為歷史時點。

2026-10-26：里程碑 5 已完成實作與驗證，待結束確認。**Expression** 提供 None／Happy／Sad／Angry／Surprised，以及最多 160 個 Unicode code points 的純文字多行對話、字數與 Clear speech。內容僅留在本次頁面，切換角色會保留；進入編輯會停止移動。泡泡依普通／160°魚眼投影定位，第一人稱隱藏自身泡泡。載入回饋明示目前為程序化原型；正式 GLB loader 留里程碑 6。下方 Stage 1.2「人物尚未實作」等為歷史時點。[驗證與限制](.kiro/specs/character-expressions-ui/validation.md)

GitHub: [goofyliutw03/3D-Character-Walking](https://github.com/goofyliutw03/3D-Character-Walking)

Local AI code search: [RAG setup and commands](docs/local-rag.md) (SocratiCode, native Qdrant, Ollama; no Docker required).

目前需求與下一階段設計：[開發計畫（2026-10-19）](docs/development-plan.md)。包含男／女／小孩、城市街景、停止／走／跑／跳、多種電影鏡頭、表情與對話泡泡，以及免費工具與 TypeScript OOP 架構。

城市街道環境中的 3D 人物行走／奔跑檢視工具。

2026-10-14 已匯入「建立 Three.js 城市角色檢視器」及其引用的 Web 3D 規畫聊天內容，並建立階段 1.1 的 Vite + TypeScript + Three.js 專案骨架。

## 安裝與啟動

Camera 追加 **Objects block mode**：預設 **Auto zoom** 遇遮擋平滑拉近，解除後回到操作中的原構圖；**Transparent blockers** 將遮擋主角的環境物件顯示為75%透明（opacity0.25）；**Wireframe scene** 將全場景顯示為三角網格線框，主角保持正常。切換／解除會恢復材質，模式跨鏡頭、Follow與角色保留。First person維持眼位、不縮距或透明化，線框仍適用。目前沒有NPC。有限射線與封閉空間不保證全身可見，突發遮擋可在平滑拉近期間短暫遮住主角。[規格與驗證](.kiro/specs/camera-obstruction-modes/validation.md)

里程碑4完成：Camera 新增 **Front、Character overhead、Low angle、Fisheye**，保留第一／第三人稱與原有靜態預設。外部視角平滑切換，Follow 可暫停／恢復而不改所選構圖；暫停後可拖曳觀察。First person 固定眼位。Fisheye 是 **160°圓形等距投影**，不是180°，會額外使用離屏渲染資源。[驗證紀錄](.kiro/specs/camera-modes/validation.md)

Camera 同時提供 **First person**（角色眼位，垂直 FOV 70°）與 **Third person**（人物後方跟隨，垂直 FOV 43°）。Third person 與 Follow character 開關同步，可看見人物；兩種視角互斥。

里程碑 3 更新（2026-10-25）：可選男／女／小孩程序化原型，以 WASD／方向鍵或畫面控制移動，Shift／Run 加速，Space／Jump 起跳，Stop 停止。Camera 新增 **First person**，使用角色實際眼高及面向，隨跳躍移動；自身隱藏，切回 Follow／靜態鏡頭恢復顯示。此版第一人稱視線隨人物面向，垂直 FOV 為 70°，不包含滑鼠自由看向或 pointer lock。正式 GLB／骨架動畫仍待後續。證據與限制見 [character-movement validation](.kiro/specs/character-movement/validation.md)。

需要 Node.js 22.12+（建議 24 LTS）與 pnpm 11.25.0。一般環境可先使用 Node.js 附帶的 npm 執行 `npm install --global pnpm@11.25.0`。此電腦也可直接使用腳本自動找到 Codex 附帶的 pnpm。

在專案根目錄執行：

```powershell
./scripts/project.ps1 install
./scripts/project.ps1 dev
```

開啟終端顯示的本機網址（預設 http://127.0.0.1:5173）。按 Ctrl+C 停止。腳本不會修改全域 PATH 或 PowerShell execution policy。

```powershell
./scripts/project.ps1 typecheck
./scripts/project.ps1 build
./scripts/project.ps1 preview
```

也可直接使用 `pnpm install --frozen-lockfile`、`pnpm dev`、`pnpm build`。正式建置輸出為 `dist/`；安裝版本以 `pnpm-lock.yaml` 為準。

目前已完成 Stage 1.2 城市街景基礎：道路、人行道、建築、樹木、路燈、長椅、Orbit 鏡頭、Overview／Street level／From above 預設、日光／黃昏與陰影切換。使用 TypeScript OOP，並顯示 WebGL2 與 FPS。人物、GLB 與動畫尚未實作。資產預留於 `public/assets/`，Blender 原始檔預留於 `blender/`。

- [初版設計計畫](docs/initial-design-plan.md)
- [原始 Viewer session](docs/imported/viewer-session.md)
- [原始 Web 3D 規畫 session](docs/imported/web-3d-planning-session.md)

操作：拖曳旋轉鏡頭、滾輪縮放、右鍵拖曳平移；Reset view 回到 Overview。下個階段為人物原型、移動與動畫；詳見 [Stage 1.2 完成紀錄與下一階段設計](docs/stage-1.2.md)。

## Particle interaction · Plan v02

The selected player is **Caster**; an independent **Target** uses the existing local CC0-derived woman rig and stays idle. Blue and amber markers indicate the emission and reception anchors. Target has its own loading/fallback status and Retry target control; changing Caster does not replace Target.

Use **Fire particle** below the scene (click, touch, or keyboard activation). Each shot travels toward Target's position at launch without homing. A simple sphere hit creates a brief particle flash once; misses expire. **Reset target** restores its default position and clears effects and counters. There is no damage, health, combat or NPC AI. First person keeps the existing Caster hiding behavior.

The Particle interaction panel sets color, speed (0.5–30 m/s), radius (0.03–0.5 m), lifetime (0.1–10 s), and maximum effects (1–128, including hit bursts). Apply settings affects new shots; reducing the limit removes the oldest excess effects. Full capacity rejects new shots. Settings remain on this page only. [Specification and validation](.kiro/specs/particle-interaction/validation.md).

## Function panel

- 左側 Function panel 按鈕可展開／收合整個面板；五大分類及子群組可各自展開。設定、文字與節點狀態保留於目前頁面，重新整理回到預設。
- 桌面拖曳面板右側邊界調寬（260–520px，並為場景保留至少360px）。Tab到邊界後，用Left／Right調整16px，Shift調整32px，Home／End移至最小／最大寬度。
- 窄版／觸控排列將面板放在場景與移動控制下方，使用全寬並隱藏調寬把手。下方移動與粒子按鈕維持原位。
- 規格與本機驗證：[left-control-panel-tree](.kiro/specs/left-control-panel-tree/validation.md)。本機模擬窄版不等於手機LAN／真機驗收。

Mobile Orbit：在允許自由 Orbit 的鏡頭中，單指按住超過350ms或拖曳超過8px會平滑對準目前角色；雙指維持縮放／平移並取消置中，全部放開後可開始新手勢。短點地仍可跑向目的地。手機端請重新整理既有 LAN 預覽；iOS／Android及摺疊裝置的實機相容／效能仍待驗收。

使用者驗收更新（2026-10-31）：iOS／Android的Mobile Orbit操作皆確認OK，依要求略過機型；本次Mobile Orbit已結案。此確認不代表所有瀏覽器／摺疊形態或效能測試通過。
# 場景物件編號檢視

Control Panel → Scene display → Scene objects 可展開實際父子物件樹。Show object numbers 預設關閉；每個 checkbox 只控制該物件的世界原點編號標籤，不會隱藏物件。編號在本次頁面載入中穩定，重新載入可能不同。標籤會重疊，可用篩選縮小觀察範圍。

Name / path regex 接受區分大小寫的 JavaScript 裸 pattern（例如 `rigged-character$`，不含 `/` 分隔符）；Number ranges 接受 `10-30,45,70-80`。兩者取交集，空白不限制，Apply filters 或 Enter 套用；錯誤保留前一次有效篩選，Clear filters 清空篩選但保留 checkbox。樹保留必要祖先，`ancestor only` 不代表其標籤通過篩選。驗證與限制見 `.kiro/specs/scene-object-inspector/validation.md`。
