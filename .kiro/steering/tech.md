# 技術基線

更新日期：2026-10-24。狀態：使用者已核准 steering 內容；cc-sdd 規劃對應見 [roadmap](roadmap.md)。

## 執行平台與工具

- 產品為瀏覽器 Web 3D 應用，目前 renderer 使用 WebGL2；WebGPU 與 fallback 為待獨立評估項目，不宣稱已支援。相容瀏覽器與效能驗收門檻尚待決定。
- 開發環境使用 Windows／PowerShell；Node.js 最低 22.12，專案指定 pnpm 11.25.0。版本依 package.json 與 pnpm-lock.yaml，不因本流程自動升級。
- Vite 建置 TypeScript ES modules；TypeScript 採 strict、noUnusedLocals、noUnusedParameters、noEmit，目標 ES2022。
- Three.js 為核心 3D 函式庫，採 OOP 與組合分離場景、renderer、輸入、人物、動畫、鏡頭及表情責任。

## 圖形與生命週期

依 [目前設計](../../docs/development-plan.md)，場景以公尺為單位、Y-up。現有 renderer 限制 pixel ratio，隨容器調整相機比例，透過顯示實際後端及初始化失敗訊息呈現能力限制。

由應用程式集中管理 animation loop；持有資源的模組提供 dispose，釋放 observer、事件、controls、geometry、material 與 renderer。新增行為遵循生命週期，不從 UI 任意修改底層 scene objects。

## 驗證與限制

使用 `./scripts/project.ps1 typecheck`、`./scripts/project.ps1 build`；開發與預覽使用同腳本的 dev／preview。build 包含 TypeScript 檢查，但不等於瀏覽器呈現、互動或 GPU 相容性驗收。package.json 的 test 使用 Node 原生 runner，命令為 `node --experimental-transform-types --test --test-isolation=none tests/*.test.mjs`，不新增測試依賴。

本次導入驗證的 production build 通過，出現壓縮後 chunk 大於 500 KB 的提示；是否拆包須另行評估，不在 steering 階段處理。

免費工具、資產授權與機密資料規則依 [AGENTS.md](../../AGENTS.md)。不擅自安裝 Blender、操作硬體、啟動 RAG 服務或採用外部／付費服務；金鑰、憑證與機密資料不得進入文件或版本控制。commit 等待使用者核准，不 push。
