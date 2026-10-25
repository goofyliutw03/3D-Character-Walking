# 結構與責任邊界

更新日期：2026-10-24。狀態：使用者已核准 steering 內容；cc-sdd 規劃對應見 [roadmap](roadmap.md)。

## 組織原則

採用依責任拆分的 TypeScript 類別與組合。`src/main.ts` 組裝 DOM 與 UI 事件，透過應用程式公開方法驅動場景；避免 UI 直接操作 geometry、animation 或相機內部狀態。

## 現有模式

- `src/engine/` 管理應用生命週期與渲染。ViewerApp 組合 SceneRenderer、CityScene 與 OrbitControls，管理更新迴圈與鏡頭轉場。
- `src/scene/` 管理靜態環境、光照與可重用 geometry／material；場景負責釋放自己持有的資源。
- 類別檔案使用 PascalCase（例如 ViewerApp.ts），方法與變數使用 camelCase；既有匯入使用相對路徑與 Three.js addon 路徑，尚未設定專案路徑別名。

## 後續邊界（規劃，非既有實作）

人物外觀與 transform、移動／跳躍物理、動畫狀態、鏡頭策略與追蹤、表情 overlay 分別由各自模組負責。輸入與 UI 傳遞意圖，不直接驅動骨架或 renderer。詳細設計須按 [開發計畫](../../docs/development-plan.md) 與 spec 階段另行審核。

現有 `src/scene/` 是實際場景位置，歷史目錄提案不得作為搬移既有檔案的授權。人物、輸入、導航及 UI 預留目錄不代表對應功能已完成。

## 資產、文件與協作

`public/assets/` 預留執行時資產，`blender/` 預留來源檔；引入資產前記錄授權，來源與匯出物用途分明。`docs/development-plan.md` 維護里程碑，`docs/imported/` 保存歷史背景；不要重抄歷史清單作為現況。

協作與 session 命名依 [AGENTS.md](../../AGENTS.md)。spec 細項在 `.kiro/specs/<feature>/tasks.md` 維護；同批共用檔案必須依序進行，不可平行修改。同一 checkout 的既有未提交內容須保留，只提交已核准範圍，不 push。
