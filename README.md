# 3D Character Walk Viewer

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
