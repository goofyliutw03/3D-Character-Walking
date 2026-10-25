# 3D Character Walk Viewer

GitHub: [goofyliutw03/3D-Character-Walking](https://github.com/goofyliutw03/3D-Character-Walking)

Local AI code search: [RAG setup and commands](docs/local-rag.md) (SocratiCode, native Qdrant, Ollama; no Docker required).

目前需求與下一階段設計：[開發計畫（2026-10-19）](docs/development-plan.md)。包含男／女／小孩、城市街景、停止／走／跑／跳、多種電影鏡頭、表情與對話泡泡，以及免費工具與 TypeScript OOP 架構。

城市街道環境中的 3D 人物行走／奔跑檢視工具。

2026-10-14 已匯入「建立 Three.js 城市角色檢視器」及其引用的 Web 3D 規畫聊天內容，並建立階段 1.1 的 Vite + TypeScript + Three.js 專案骨架。

## 安裝與啟動

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
