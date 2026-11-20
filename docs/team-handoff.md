# 跨環境團隊交接清單

交接日期：2026-11-20。此文件描述本次交接範圍；精確交接 commit 與遠端核對結果見交付回覆。檔案內不填自己的 commit hash，避免自我引用。

## 交接卡

- 儲存庫：https://github.com/goofyliutw03/3D-Character-Walking.git
- 工作起點：`codex/v02-particle-system`；使用交付回覆中的完整 commit SHA 固定版本。
- 整合方式：目前交接分支為 `codex/v02-particle-system`；後續 PR 目標分支與審閱者待團隊指定，不預設合併至 main。
- 環境入口：[onboarding.md](onboarding.md)。團隊 AI 開發環境 PDF：[team-ai-development-environment.pdf](team-ai-development-environment.pdf)。PDF 為 2026-11-10 快照，最新規則與套件版本以本 checkout 文件為準。
- 需求來源：[development-plan.md](development-plan.md)、[roadmap](../.kiro/steering/roadmap.md)。歷史記錄不可當作新增授權。
- 目前任務：獨立審查修正已驗證；剩餘相容性、開發計畫及交接順序見下方。
- 額外資產：Viewer 必要 GLB、manifest、attribution、重建腳本與建築 `.blend` 已納入 Git；不需另下載模型。角色原作 Quaternius CC0，child／Jump 為專案衍生；城市建築為專案原創 CC0。來源與路徑見下文。

## 2026-11-20 交接進度與獨立審查

- 基準：`efe553308a624d9a442f54612968ce0013aff92e`。隔離 worktree 重現原版 224/224 測試與正式建置。獨立 AI agent 審查 164/164（100%）Git 追蹤程式檔及另外 5/5 份執行／部署設定。覆蓋率按檔案計算，文件、鎖檔與資產不納入。
- 修正版：Node 22.12.0 與 24.22.3 各通過 225/225 測試，TypeScript／Vite 正式建置通過。Chrome 和 Edge 預設 dev 各完成 19 個檢查點，顯示 `Needle Engine · WebGL2 ready`，未觀察到 WebGL 錯誤。涵蓋主頁、水景、三角色四動作、四場景、Profiles、相機、飛行起降、夜間、resize。正式 preview 另驗證兩瀏覽器的 Needle 啟動、水景濕鏡及 BFCache。固定 Release／系統匣部署另行安排。
- 環境：Windows x64 build 26100、i7-8700、RAM 15.8 GiB、預檢時磁碟可用 441.1 GiB、PowerShell 7.6.9、pnpm 11.25.0。Chrome 157.0.8103.80、Edge 157.0.4341.60，實際雙入口為 GTX 1650／ANGLE D3D11、NVIDIA 560.94、WebGL2、原生支援 `EXT_color_buffer_float`。Intel UHD 630（30.0.101.1339）已偵測，未取得該 GPU 的瀏覽器取樣。

| 優先級／狀態 | 審查發現與處理 |
| --- | --- |
| P1／已修正 | Node 22.12.0 的測試隔離參數仍帶 experimental 前綴。測試啟動器依 runtime 選旗標，最低版本與 Node 24 都已實測。 |
| P2／已修正 | Dev 中 Needle 的備援相機環境曾將其私有 Three.js 網格交給 Viewer renderer，拋出 `object.intersectsFrustum is not a function`。初始化略過該備援環境，沿用 Viewer 的光照。兩瀏覽器 dev 和正式 preview 均重驗。 |
| P2／已修正 | 關閉地面穿透後，隱藏的程序建築替代品曾攔截路面選取。射線現在略過不可見物件／材質及相機裁切範圍外的命中。 |
| P2／已修正 | 飛行場景 14 朵同名雲的 Inspector 儲存鍵碰撞。重複分支各有獨立鍵，一般路徑仍沿用既有鍵。 |
| P2／已修正 | 合法著陸曾將角色朝向重設為出生方向。地面策略接收飛行朝向，回歸測試覆蓋。 |
| P3／已修正 | 濕鏡曾把獨立水景統計覆蓋成 1 call／2 triangles。現在計入整個畫格。兩瀏覽器噴濺取樣均為 44 calls／15,130 triangles。 |
| 已修正 | 水景離頁時依 `pagehide.persisted` 保留 BFCache 頁面的資源。Chrome／Edge 實際返回同一 document，`pageshow.persisted` 為 true 且畫面繼續更新。 |
| 觀察 | favicon 404、多份 Three.js 載入警告及 dev 空場景相機構圖警告仍可見。Legacy 基準首次在 Profiles 後切洞穴逾時，等待套用完成後重跑通過。 |

### 接續項目與里程碑

| 項目 | 狀態與後續 |
| --- | --- |
| SCENE-04／COMPAT-03 | PARTIAL。GTX 1650 已補實體 GPU 與 Chrome／Edge 操作證據；下一步對固定遮擋及乾濕魚眼影格讀回像素，對照 GTX 1060 歷史結果。 |
| COMPAT-04 | 待原生缺少 `EXT_color_buffer_float` 的實體環境。驗證魚眼／X-ray 的 UnsignedByte framebuffer 與畫面。 |
| 正式效能、手機 LAN、讀屏 | 各自依剩餘驗收矩陣處理。新機的固定 Release、系統匣部署與重啟驗收另行安排。 |
| bounded-swim | 隔離 worktree 曾記錄 230 項測試及本地建置、雙 runtime 驗證，待驗收與整合。本次交接分支未包含其程式；整合前先比較該 worktree 與新基準的共用檔案，不同步修改。 |
| 太空 | 尚未開始。水域整合後再提有限零重力活動範圍、慣性／煞車與高速掃掠的規劃，等核准。 |
| 交付里程碑 | 延續既有六個里程碑。此次為回歸修正與交接更新；後續新增工作或里程碑須在開始前補登此清單並連回開發計畫和 roadmap。 |

瀏覽器原始 JSON 與截圖留在本機驗證 worktree 的忽略目錄 `.local/`。相容性結論依 [剩餘驗收最上方複驗紀錄](remaining-acceptance.md)。

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

## 接手提示詞

> 請接手 3D Character Walk Viewer。從 GitHub 的 `codex/v02-particle-system` 取得交付訊息提供的完整 SHA。既有 checkout 先檢查並保留修改，再 fetch、核對 HEAD 及工作目錄；若要修改，先依團隊指定建立工作分支。讀 AGENTS.md、docs/onboarding.md、docs/team-handoff.md、docs/project-status.md、docs/remaining-acceptance.md。
>
> 執行 `./scripts/onboarding.ps1 -Json`。依文件選用 Viewer 安裝，再跑 `./scripts/project.ps1 test`、`build` 與 `dev`。預期 225 項測試全通過、預設 Needle 顯示 WebGL2 ready。核對主頁、水景、四場景、三角色動畫、Profiles、相機與飛行。記錄自己的 OS、瀏覽器版本、GPU／驅動、WebGL renderer 與原生擴充支援。
>
> 先補 COMPAT-03 固定 X-ray 遮擋與魚眼濕鏡像素證據；只有原生缺少 EXT_color_buffer_float 時補 COMPAT-04。SCENE-04 仍為 PARTIAL。發現問題先附重現步驟與擬修範圍。水域整合、太空、固定 Release／系統匣部署各自等核准。不要假定 PR 目標是 main。
