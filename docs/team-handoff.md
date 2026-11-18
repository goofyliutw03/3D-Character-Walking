# 跨環境團隊交接清單

交接日期：2026-11-18。此文件描述本次交接範圍；精確交接 commit 與遠端核對結果見交付回覆。檔案內不填自己的 commit hash，避免自我引用。

## 交接卡

- 儲存庫：https://github.com/goofyliutw03/3D-Character-Walking.git
- 工作起點：`codex/v02-particle-system`；使用交付回覆中的完整 commit SHA 固定版本。
- 整合方式：目前交接分支為 `codex/v02-particle-system`；後續 PR 目標分支與審閱者待團隊指定，不預設合併至 main。
- 環境入口：[onboarding.md](onboarding.md)。團隊 AI 開發環境 PDF：[team-ai-development-environment.pdf](team-ai-development-environment.pdf)。PDF 為 2026-11-10 快照，最新規則與套件版本以本 checkout 文件為準。
- 需求來源：[development-plan.md](development-plan.md)、[roadmap](../.kiro/steering/roadmap.md)。歷史記錄不可當作新增授權。
- 目前任務：`bounded-flight` tasks 1.1、2.1、3.1、4.1、5.1 已完成工程驗證，等待交付結束確認；必要 context 恢復修正記於 `multi-scene-foundation`。系統匣 v1.1.0 的人工回報另見 [tray-upgrade-validation.md](tray-upgrade-validation.md)。水域／太空尚未開始，先規劃，等核准。
- 額外資產：Viewer 必要 GLB、manifest、attribution、重建腳本與建築 `.blend` 已納入 Git；不需另下載模型。角色原作 Quaternius CC0，child／Jump 為專案衍生；城市建築為專案原創 CC0。來源與路徑見下文。

## 在另一台電腦取得相同工作起點

```powershell
git clone --branch codex/v02-particle-system --single-branch https://github.com/goofyliutw03/3D-Character-Walking.git
cd 3D-Character-Walking
git switch --detach <交付回覆中的完整 commit SHA>
git rev-parse HEAD
git status --short
```

確認 HEAD 與交付 SHA 一致、工作目錄乾淨，再依團隊指示建立工作分支；不要直接在 detached HEAD 長期開發。需要 repo 存取權時由管理者授權個人帳號，不共享憑證。

1. 在根目錄讀 `AGENTS.md`、`CLAUDE.md`、`docs/onboarding.md`。
2. 用 PowerShell 執行 `./scripts/onboarding.ps1 -Json` 唯讀預檢；顯示硬體、工具、unknown 與分級建議，不自動安裝。
3. 明確選用後依 onboarding 補必要工具：Git、PowerShell 7、Node >=22.12.0、根專案 pnpm@11.25.0、WebGL2 瀏覽器。
4. 執行 `./scripts/onboarding.ps1 -InstallViewer`，保留 lockfile；再執行 `./scripts/project.ps1 test`、`./scripts/project.ps1 build`、`./scripts/project.ps1 dev`。
5. 開啟終端顯示的本機網址，驗證三角色、四場景、相機、面板 profiles 與飛行操作。以當地實測結果記錄驗收，不能複製原機 PASS 當作新機已驗。

## 必須能從 Git 取得的關鍵資料

| 類別 | 路徑／說明 |
|---|---|
| 重建依賴 | `package.json`、`pnpm-lock.yaml`、`tsconfig.json`、`vite.config.ts`、兩個 HTML 入口 |
| 程式與回歸 | `src/`、`tests/`；本次含 FlightController、FlightWorldQuery、FlightScene、ContextResources |
| 環境與服務腳本 | `scripts/onboarding.ps1`、`project.ps1`、`viewer-desktop.ps1`、`release-version.ps1` 及對應測試 |
| AI 規則／規格 | `AGENTS.md`、`CLAUDE.md`、`.agents/skills/`、`.kiro/settings/`、`.kiro/steering/`、`.kiro/specs/` |
| 最新驗證 | `.kiro/specs/bounded-flight/validation.md`、`multi-scene-foundation/validation.md`、`docs/tray-upgrade-validation.md` |
| 角色 | `public/assets/characters/{man,woman,child}.glb`、`asset-manifest.json`、`ATTRIBUTION.md` |
| 建築 | `public/assets/city/buildings.glb`、manifest、attribution、`blender/city-block.blend` |
| 資產重建 | `tools/assets/prepare_characters.py`、`prepare_city.py`、`tools/assets/source/`；一般 Viewer 不需 Blender |
| 選用 RAG | `tools/rag/` 的腳本、package、獨立 lockfile／pnpm@10.32.1、`scripts/rag.ps1`、`docs/local-rag.md` |

推送後須以 `git ls-remote origin refs/heads/codex/v02-particle-system` 確認遠端 SHA 與交接 HEAD 相同；再確認關鍵路徑存在於該 commit。已追蹤或本機 commit 成功不等於 push 成功。

## 不隨 Git 移轉的資料及環境限制

- `node_modules/`、`dist/`、`.local/`、套件快取、外部 Release、系統匣程序／Startup 捷徑不隨 Git 交接，各自在本機重建。歷史 `.local` 截圖、browser harness、效能原始樣本未推送；可讀驗證摘要在版本控制內，若需原始樣本須另行安全交付。
- 瀏覽器 OPFS／IndexedDB profiles 與個人設定不在 repo；換 origin／port／瀏覽器亦不會自動帶入，不承諾 profile 備份或跨機同步。
- RAG 的 Ollama 模型、Qdrant 資料與索引是原機本機服務，不會因 push 而在新機存在。新成員明確選用、完成工具／模型／服務配置後建立自己的索引；不要照抄資料目錄或連到原機 localhost。
- `.codex/config.toml` 是原工作站絕對路徑參考，須依新 checkout／runtime 調整；`.vscode/settings.json` 的 ESP-IDF 設定不相關。不得複製金鑰、登入資料或私人服務網址。
- **新機不要執行 `project.ps1 release`、`preview-release` 或直接 install 系統匣。** 這些腳本指向原機固定 `D:\Work_Mine\Testing\3D Character Walk Viewer\Release`／Debug 與 localhost:4174；移植部署須另行規劃。不要混用 origin/main 的 release-tray／4175 路線。
- 本分支飛行使用有限盒／直立膠囊與既有 Jump fallback，不包含任意 mesh 物理、水域、太空或新飛行動畫。手機 LAN、跨 GPU／瀏覽器、正式效能門檻及讀屏未概括驗收，依 `docs/remaining-acceptance.md` 與各 validation 保留。

## 接手授權與交接責任

同一批共用 Viewer／main／WorldQuery 檔案必須依序交接，不可平行修改。交接不增加實作、模型切換、安裝或後續 commit／push 授權。開新工作階段依專案規則處理，先規劃，等核准；來源 chat 交接後停止修改同批檔案。只 stage 相關檔案，不用 `git add -A`，不提交機密。

Token 用量：無法取得精確值。本次交接操作無可取得的官方起訖計數；其他 validation 內的已知子區間屬其來源階段，不重複合計為本次用量。
