# 技術基線

## 目前有效補充

updated_at：2026-11-19（Asia/Taipei）。依使用者核准的 Sync 補充建置、生命週期與驗證原則；下方原始紀錄保留，限制與授權以 [AGENTS.md](../../AGENTS.md) 最新政策為準。

- Vite 以 `index.html` 與 `water.html` 雙入口建置，共用水景公開 API；仍為 WebGL2，未採用 WebGPU。魚眼／X-ray離屏效果由 renderer 管理按需建立、尺寸更新及釋放，鏡頭沾水效果沿用渲染生命週期。
- ViewerApp 統一處理 context loss／restore、停止導航與清理暫態效果；背景返回重設時間基準。這些程式路徑與本機故障注入不等於真機、跨 GPU或鎖屏恢復驗收。
- 效能變更須保留畫質／互動，分清 CPU 微量測、瀏覽器工程樣本與正式效能驗收。既有 reduced-motion MediaQueryList 重用與 Inspector 未變快照重用是兩組獨立證據；不能將 Node 同步成本下降換算成 FPS 提升，亦不混用不同硬體／版本／harness 數字。見 [MQL驗證](../specs/viewer-performance/mql-validation.md) 與 [Inspector／PC驗證](../specs/viewer-performance/validation.md)。
- 修改並驗證後依序執行 `./scripts/project.ps1 release`（tests → build → sync）；只同步 dist，SHA256 相同略過、資產先於 index.html、保留陌生檔與舊 hashed 資產。手動預覽為 localhost:4174，系統匣自有服務為 localhost:4175；兩者不互相接管，不代表 LAN／手機驗收。見 [Release](../../docs/release.md) 與 [系統匣](../../docs/release-tray.md)。
- 收尾索引依 AGENTS.md 已授權增量更新及 status 確認，必要時可由既有 helper 啟動本機 RAG；不安裝工具、下載模型、重建／刪除索引或使用雲端。此限定授權優先於下方舊的 RAG 禁止敘述；commit仍另需核准，不 push。

## 原始基線與歷史驗證

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
