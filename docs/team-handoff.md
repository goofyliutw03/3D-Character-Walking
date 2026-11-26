# 跨環境團隊交接清單

目前接手入口為 [2026-11-26 統一分支交接清單](handoff-2026-11-26.md)。下方保留各來源版本的交付證據。

## 2026-11-22 水域重新開發

`codex/bounded-swim` 由原 checkout 的 `efe5533` 建立，並保留既有未提交內容。依使用者指示在同一 checkout 重新開發 [bounded-swim](../.kiro/specs/bounded-swim/) 以取代遺失來源工作樹依賴。實作、驗證及 Release 以[本批紀錄](../.kiro/specs/bounded-swim/validation.md)為準，下文隔離工作樹敘述為歷史交接。共用程式及 Release 依序接手；太空維持候選，外部裝置及效能門檻依剩餘驗收紀錄。

後續同一分支補上[三種游泳姿態與兩套水域服裝](../.kiro/specs/bounded-swim/appearance-validation.md)。成年男性、成年女性和孩童沿用各自蒙皮及比例，服裝在泳池載入並隨角色骨架移動。

[1Y-20] 新增深度保持、立游、水面靠平台自動上岸、池底站立與第三人稱／魚眼的 Y／I／O 深度控制。Needle 與 legacy 通過正式入口實測。其後重匯出莊園資產，修正床頭板碰撞並以實際 GLB 加入二樓助跑跳躍回歸。[水域驗證](../.kiro/specs/bounded-swim/validation.md#1y-20-深度控制與自動移動) · [莊園驗證](../.kiro/specs/manor-estate/validation.md#床頭板碰撞回歸)

岸邊攀爬續作依三份正式 GLB 的頸胸中點校正 O 停點。出口由膠囊接觸的岸緣決定，游姿、扶邊、抬腿與站姿連續播放。碰撞、跨角色與 Release 證據見[頸胸水線與岸邊攀爬](../.kiro/specs/bounded-swim/validation.md#頸胸水線與岸邊攀爬)。

## 2026-11-22 自動續作檢查點

依 [既有任務自動續作與審閱政策](../AGENTS.md#既有任務自動續作與審閱2026-11-22-使用者授權) 順序處理。共用分支為 `codex/v02-particle-system`，交接起點 `efe5533`，保留工作樹內既有修改。

| 順序 | 項目與來源 | 責任與依賴 |
| --- | --- | --- |
| 1 | Panel Profiles 補 Release 操作驗收，來源「完整保存與載入 panel profiles」、[規格驗證](../.kiro/specs/panel-settings-profiles/validation.md) | [1Z-3] 完成。Chrome SwiftShader 的 Needle 預設入口通過 27 項，涵蓋 Save、修改、選載、Reload、v1、鏡頭姿態、實際套用值與表單草稿。 |
| 2 | 屋頂樓梯遮擋，來源「修正屋頂樓梯閃爍延遲」 | [1Z-3] 核對獨立遮擋網格、複合場景及樓梯回歸測試。沿用來源往返實測，回程曾短降至約 39 FPS。 |
| 3 | [1Y-19] [環境雷達掃描](../.kiro/specs/environment-scan/validation.md) | [1Z-3] 核對 8 項任務均完成及正式驗證。掃描材質、動態物件與帶陰影點光的迴歸測試通過。 |
| 4 | [1Y-18] 莊園及 [1Y-17] 交接整合 | 已有交付驗證，後續整包測試覆蓋回歸 |

跨 GPU、原生 fallback、讀屏、手機 LAN、正式效能門檻及隔離工作樹依 [剩餘驗收紀錄](remaining-acceptance.md) 追蹤，待對應裝置、門檻或工作樹可取得。

本輪 inline review 核對 v1 驗證、草稿與 runtime 回填、鏡頭位置與目標還原、莊園遮擋單位及掃描規格的完成證據。上述範圍無未解可操作發現。243 項測試與 production build 通過，正式入口、JS 與 CSS 的 SHA256 和 dist 相符。Chrome 測試未捕獲頁面錯誤，Pointer Lock 在隔離 headless 環境回報拒絕。角色 XYZ 驗證涵蓋編輯欄位草稿。既有實機數據保留原來源範圍。

### 六個里程碑續作順序

以 [開發計畫](development-plan.md#delivery-milestones)、[現況](project-status.md#六個交付里程碑)、[roadmap](../.kiro/steering/roadmap.md) 及各 spec 驗證為準。工作樹有 31 份 spec 標示實作完成，tasks.md 未找到未勾項目。人工及外部驗收依下表另行核對。

| 順序 | 里程碑與狀態 | 證據、依賴／下一個 chat |
| --- | --- | --- |
| M1 | 骨架，已交付 | 既有 Git 歷史，正式測試與 TypeScript／Vite 建置。 |
| M2 | 城市場景，已交付；跨環境驗收待補 | [場景驗證](stage-1.2.md) 含 WebGL2／相機基礎。SCENE-04 與 M6 共用相容性驗收。 |
| M3 | 角色移動，已交付 | [走跑跳、碰撞及跟隨](../.kiro/specs/character-movement/validation.md)。 |
| M4 | 鏡頭，已交付 | [鏡頭與手機手勢](../.kiro/specs/camera-modes/validation.md)。iOS／Galaxy 既有操作依使用者回報結案；後續手機 LAN 待裝置，雙摺／三摺專項已取消。 |
| M5 | UI 與表情，已交付 | [1Z-4] Chrome 鍵盤與可存取性補驗通過，Narrator 與 IME 依使用者實測結案。[補驗](remaining-acceptance.md) |
| M6 | 骨架角色，實作完成，人工驗收部分完成 | [1Z-4] 共用載入播報已修正，Narrator 故障提示與復原按鈕由使用者逐項確認。GTX 1650 固定場景像素與原生浮點降級需對應環境，ACCEPT-01 需目標裝置、瀏覽器及正式門檻。Chrome、Edge 注入降級各 14 個取樣通過。[剩餘驗收](remaining-acceptance.md) |

後續已交付功能沿用各 spec 證據。bounded-swim 需取得來源工作樹；太空維持候選。涉及 Viewer、`main`、WorldQuery 或 Release 的改動共用同一 checkout，按順序交接。

## 2026-11-22 最新交接

本段取代下方歷史快照的接手預期，歷史測試與 GPU 紀錄保留原時點。

- 儲存庫：`https://github.com/goofyliutw03/3D-Character-Walking.git`。
- 工作起點：`codex/v02-particle-system`，以本次交付回覆的完整 commit SHA 固定；不將本文件自身的 commit 寫回檔案。
- 整合方式：後續 PR 目標分支與審閱者待指定，不預設 main。
- 環境入口：`docs/onboarding.md`；需求來源：`docs/development-plan.md`、各功能 spec 與最新 `docs/project-status.md`。
- 目前任務：本次交接包含莊園／分層尋路、環境掃描與動態 Target／交通掃描，以及來源交接版回歸修正。`room` 入口目前載入 **ManorScene 莊園**，不是歷史客廳；原 FurnishedRoomScene 及 GLB 保留供程式回復，沒有新增第六個選單入口。共五個環境 ID：city、cave、terrain、flight、room。
- 額外資產：`public/assets/environments/{manor,furnished-room}.glb`、`tools/assets/{manor,furnished-room}/` 的可編輯 `.blend`、兩支生成腳本與 `3DScenen/Scene.LivingRoom.blend` 一起交接。來源／授權狀態及 SHA256 見該資產目錄的 `ATTRIBUTION.md` 與 `asset-manifest.json`。`.blend1` 為本機自動備份，保留但忽略，不是必要執行依賴。
- 功能規格與驗證：`.kiro/specs/manor-estate/`、`environment-scan/`、`furnished-room-environment/`；其原始 `.local` 截圖／harness 不隨 Git 交接，已追蹤的驗證摘要保留。首次環境掃描的 shader 編譯停頓仍需注意，不把暖機後樣本當作首掃無停頓。
- 新機使用 checkout 自帶的 `scripts/run-tests.mjs`（已配合 Node 的 test-isolation 旗標差異），不要複製其他版本的啟動器。先唯讀 onboarding、明確選用安裝，再 test/build/dev；測試項數以本次交付結果為準，非歷史 225。
- 水域 bounded-swim 在別的隔離工作樹，不在本分支交接，不宣稱已 push。太空、跨 GPU／原生 fallback、正式性能門檻、讀屏及手機 LAN 依最新驗收紀錄保留，接手先規劃，等核准。
- 原機 RAG 索引、模型、瀏覽器 profiles、套件、dist、外部 Release 與 Startup 入口不隨 Git 移轉；新機不要照跑固定原機路徑的 release／系統匣安裝。`.codex/config.toml` 絕對路徑須自行調整。

推送後以遠端 SHA 與獨立 clone 的 Git tree、關鍵資產／來源及 lockfile 核對成功才宣稱可取得；交付回覆記錄實際結果。新機安裝與真機驗收仍需接手人各自執行。

## 2026-11-21 原工作區整合

- 已將 [交接版 `9c475ed`](https://github.com/goofyliutw03/3D-Character-Walking/commit/9c475ed6ee0aaea1b3a4c97c8910982fce2acabf) 的回歸修正、測試及驗收進度套用至 `efe5533` 工作樹，保留本機尚未提交的客廳場景與 onboarding 更新。角色控制器同時保留客廳自訂出生點與著陸朝向。
- 整合工作樹包含城市、洞穴、自然地形、飛行及客廳五個環境。下方四場景操作、雙 Node runtime 與 GTX 1650 紀錄均來自 11-20 的來源版本。客廳的獨立驗證見 [客廳驗證](../.kiro/specs/furnished-room-environment/validation.md)。
- 本機 Node 24.22.1 通過 226／226 測試與 TypeScript／Vite 正式建置。Release 於台灣時間 21:40 完成增量發佈，新增 12、更新 2、略過 21。正式目錄與 `dist/index.html` 的 SHA256 相符。
- `127.0.0.1:4174` 回傳的主頁、水景入口與客廳 GLB 均與 Release 檔案 SHA256 相符。Chrome headless／SwiftShader 在 Needle 與 legacy 路徑均通過客廳載入、出生位置、碰撞、點地、Profiles 與返回城市，WebGL 與啟動例外均為 0。刻意阻擋客廳 GLB 時，Needle 保留城市並可重試成功。水景濕鏡與 BFCache 的互動驗證沿用下方來源工作站紀錄。
- `bounded-swim` 仍在隔離工作樹，太空仍待規劃。SCENE-04／COMPAT-03 維持 PARTIAL，COMPAT-04、正式效能、手機 LAN 與讀屏仍待驗。

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
> 執行 `./scripts/onboarding.ps1 -Json`。依文件選用 Viewer 安裝，再跑 `./scripts/project.ps1 test`、`build` 與 `dev`。測試項數依最新交付回覆，預設 Needle 顯示 WebGL2 ready。核對主頁、水景、五個環境（room 為莊園）、三角色動畫、Profiles、相機、飛行、樓梯點地及環境掃描。記錄自己的 OS、瀏覽器版本、GPU／驅動、WebGL renderer 與原生擴充支援。
>
> 先補 COMPAT-03 固定 X-ray 遮擋與魚眼濕鏡像素證據；只有原生缺少 EXT_color_buffer_float 時補 COMPAT-04。SCENE-04 仍為 PARTIAL。發現問題先附重現步驟與擬修範圍。水域整合、太空、固定 Release／系統匣部署各自等核准。不要假定 PR 目標是 main。
