# 團隊交接與環境入口

更新：2026-11-10（Asia/Taipei）。

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
- 2026-11-10 本機另有 viewer-performance 工作進行中，目標為量測、狀態發布去重及偏好查詢重用；該工作當時尚未提交，不包含於本交接文件的提交。新接手者須先取得該工作負責人的正式提交與驗證紀錄，再確認 spec／task 狀態，不從歷史文件推定完成。
- 同一 checkout 的共用檔案須依序交接，避免與現行效能工作同時修改。本機 `.codex/config.toml` 修改亦未納入本次交接提交。
- 新工作先規劃並依專案授權規則確認；交接不新增功能或關閉未驗收項目。金鑰、憑證、個人設定與本機測量資料不得加入版本控制。

## 資產

角色來源為 Quaternius，CC0 1.0；小孩比例與 Jump 為專案衍生。已納入 `public/assets/characters/`，原始選用 GLB 保存在 `tools/assets/source/`。來源、授權、雜湊及重建方式見 [ATTRIBUTION](../public/assets/characters/ATTRIBUTION.md)、[manifest](../public/assets/characters/asset-manifest.json) 與 [asset-pipeline.md](asset-pipeline.md)。一般建置不需外部下載或 Blender；未列其他額外必需資產。
