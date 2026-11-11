# 團隊交接與環境入口

更新：2026-11-11（Asia/Taipei）。

## 取得工作版本

儲存庫：https://github.com/goofyliutw03/3D-Character-Walking.git

交接清單提供當次 branch／commit；請以指定 commit 重現版本，不以持續變動的 main 代替。整合目標為 main，PR 審閱者由團隊指定，目前尚未提供人選。

## 環境與操作

需要 Node.js 22.12+（建議 24 LTS）及 pnpm 11.25.0；依 pnpm-lock.yaml 安裝，不任意升級依賴。在專案根目錄執行：

```powershell
./scripts/project.ps1 install
./scripts/project.ps1 dev
# 驗證
./scripts/project.ps1 test
./scripts/project.ps1 build
./scripts/project.ps1 preview
```

執行前先閱讀 [專案規則](../AGENTS.md)、[README](../README.md) 與 [需求來源](development-plan.md)。正式操作副本的增量發佈與 localhost:4174 預覽依 [release.md](release.md)；localhost 不代表手機 LAN 驗收。

## 當前工作與限制

- 既有六里程碑功能及追加功能的證據，以各 spec validation 為準；M6 結束確認、跨 GPU／瀏覽器、手機與摺疊裝置等剩餘驗收見 [remaining-acceptance.md](remaining-acceptance.md) 及 [roadmap](../.kiro/steering/roadmap.md)。
- viewer-performance 包含兩份來源不同的已交付工作：a0579d2 的 MediaQueryList 重用（原 tasks 1–3），及遠端 209f9ca 的 Inspector 快照重用與 PC 工程量測（重建 tasks 1–6）。後者維持標準 spec 檔名；前者完整保存為同目錄 `mql-*` 歷史文件，task 編號不可混用。見 [PC／Inspector 驗證](../.kiro/specs/viewer-performance/validation.md) 與 [MQL 驗證](../.kiro/specs/viewer-performance/mql-validation.md)。兩者原始量測均為各自版本，不代表合併後 FPS 增幅；手機、跨 GPU、完整 main 前景與正式效能門檻仍待驗。
- release-system-tray 已完成 tasks 1–4、6 並納入 a0579d2；task 5（人物圖示、Browsing／Restart／Exit、重新登入／重開機）待人工驗收。最新補充紀錄見 [系統匣驗證](../.kiro/specs/release-system-tray/validation.md)，操作見 [release-tray.md](release-tray.md)。本機 Startup 捷徑不會隨 clone 自動安裝。
- a0579d2 包含先前工作站 `.codex/config.toml` 調整；其路徑與本機服務設定不可直接假設適用另一台電腦。同一 checkout 的共用檔案須依序交接，不可同時修改。
- 新工作先規劃並依專案授權規則確認；交接不新增功能或關閉未驗收項目。金鑰、憑證、個人設定與本機測量資料不得加入版本控制。

## 資產

角色來源為 Quaternius，CC0 1.0；小孩比例與 Jump 為專案衍生。已納入 `public/assets/characters/`，原始選用 GLB 保存在 `tools/assets/source/`。來源、授權、雜湊及重建方式見 [ATTRIBUTION](../public/assets/characters/ATTRIBUTION.md)、[manifest](../public/assets/characters/asset-manifest.json) 與 [asset-pipeline.md](asset-pipeline.md)。一般建置不需外部下載或 Blender；未列其他額外必需資產。

## 2026-11-11 合併交接驗證

本機 7f156a7 與遠端 209f9ca 整合，保留雙方程式與歷史證據。完整 tests、TypeScript／Vite build 及 Release 增量發佈成功（18:36:47 +08:00，新增2／更新1／略過14）。初次 sandbox 執行兩項 HTTP 測試因 localhost EACCES 失敗，宿主授權執行後完整通過。Chrome／Edge 各七組 production smoke 通過、errors 為空，涵蓋 MQL 即時偏好、三角色、鏡頭／遮擋／移動、夜晚／魚眼 Xray／resize 與原生 context 恢復；結果存於本機忽略的 `.local/handoff-merge-{chrome,edge}.json`。本次未重跑效能 A/B，未代替手機或系統匣人工驗收。
