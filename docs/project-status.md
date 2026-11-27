# 專案現況與團隊接手

2026-11-27 main 收斂：最新工作起點與範圍見 [交接清單](handoff-2026-11-27.md)。共七場景，保留潮汐泳池及有限水池、跨場景 Y、完整 Viewer 與 Release 更新器。系統匣與 Narrator 沿用已有使用者驗收；相容性、手機正式效能及新機驗收維持各自範圍。下方為較早狀態，不代表目前仍使用舊交接分支。

目前交付分支為 `codex/bounded-swim`，含六個場景及水域攀爬。完整進度、驗收清單與新機導入見 [2026-11-23 跨機交接清單](handoff-2026-11-23.md)。下方取得指令對應歷史交接分支。

2026-11-22 交接更新：下方為 11-21 歷史盤點。最新 `room` 入口已改為莊園，含 B1／多樓層、庭院與分層導航；原客廳模組及 GLB 保留。環境掃描已涵蓋 Target／交通動態物件與亮刃／餘光。水域由 `codex/bounded-swim` 重新開發，以 Tidal Pool 作為第六個場景。最新範圍、資產、起點與限制見[團隊交接清單](team-handoff.md#2026-11-22-水域重新開發)及[水域驗證](../.kiro/specs/bounded-swim/validation.md)。

盤點日期為 2026-11-21。原工作區已納入交接版 `9c475ed` 的獨立審查修正，並保留既有未提交的客廳場景。整合範圍見[團隊交接清單](team-handoff.md)，跨環境證據見[剩餘驗收](remaining-acceptance.md)。

## 六個交付里程碑

| 里程碑 | 實作與工程驗證紀錄 |
|---|---|
| M1 專案骨架 | Vite、TypeScript、Three.js 與 Git 基礎已建立。[開發計畫](development-plan.md#delivery-milestones) |
| M2 城市場景 | 城市街道、光影、resize、Orbit 與 WebGL2 狀態已交付。Pan、context loss／restore 和初始化失敗另有本機工程證據。[場景紀錄](stage-1.2.md) · [驗收盤點](remaining-acceptance.md) |
| M3 角色移動 | 男／女／小孩原型、走跑跳、停止、碰撞和跟隨已交付，之後接入正式角色資產。[驗證](../.kiro/specs/character-movement/validation.md) |
| M4 鏡頭 | 前視、角色頂視、低視角、160° 魚眼、平滑切換與獨立 Follow 已交付，後續加入觸控及遮擋模式。[驗證](../.kiro/specs/camera-modes/validation.md) |
| M5 表情與 UI | 表情、對話泡泡、載入回饋與可存取性支援已實作。IME 與 Narrator 依使用者實測結案。[驗證](../.kiro/specs/character-expressions-ui/validation.md) |
| M6 骨架角色 | 三款骨架 GLB、動畫轉換、fallback 與操作文件已交付。跨環境相容與正式效能待驗。[驗證](../.kiro/specs/rigged-character-assets/validation.md) |

## 後續已實作範圍

| 範圍 | 現況與來源 |
|---|---|
| 互動與場景效果 | 手機點地導航、遮擋處理與 X-ray、Caster／Target 粒子、功能樹、街道水景與瀑布濕鏡、物件檢視、夜間燈影、24 小時與季節太陽控制。另補遮擋下地面點選與洞穴局部光源。[Roadmap](../.kiro/steering/roadmap.md) · [功能規格](../.kiro/specs/) |
| LATER-01 巡迴 | Waypoint、loop、pause 與速度控制已實作。[驗證](../.kiro/specs/path-navigation/validation.md) |
| LATER-02 城市資產與編輯 | 八棟 Blender 建築 GLB 搭配程序式道路與人行道，含載入回退、主角 XYZ／貼地及手動走速。[驗證](../.kiro/specs/city-assets-editor/validation.md) |
| LATER-03 交通模擬 | 現有街道的 NavMesh、有限 NPC、雙向車流、號誌協調與兩級 LOD 已實作。[驗證](../.kiro/specs/city-traffic-simulation/validation.md) |
| RENDER-01 渲染評估 | WebGPU 與 WebGL fallback 評估完成，現有 GLSL 水景與後製有移植成本，正式執行維持 WebGL2。[評估](webgpu-assessment.md) |
| 多場景與控制 | Needle 預設與 legacy 回退，城市、洞穴、自然地形與飛行共用 Viewer；另有頭燈、自動奔跑、鏡頭與手勢，以及瀏覽器本機面板 profiles。最新手機手勢有桌面模擬證據，原生 pointer lock 在 headless 環境遭拒。[多場景](../.kiro/specs/multi-scene-foundation/validation.md) · [相機輸入](../.kiro/specs/auto-run-camera-controls/validation.md) · [Profiles](../.kiro/specs/panel-settings-profiles/validation.md) |
| 地形與世界查詢 | 自然地形驗證區、跨度／坡度及碰撞測試，地面體積與查詢範圍政策整合，城市、洞穴及地形的行走、導航與相機共用查詢契約。[地形](../.kiro/specs/natural-terrain-validation/validation.md) · [地面體積](../.kiro/specs/ground-volume-world-query/validation.md) · [範圍政策](../.kiro/specs/world-query-range-policy/validation.md) |
| 有界飛行 | 有限空域、直立膠囊掃掠、禁入盒、合法起降與 WebGL context 恢復。前次交付記錄 224 項測試、建置與 Needle／legacy Release smoke，交付結束確認待回覆。[驗證](../.kiro/specs/bounded-flight/validation.md) |
| 客廳場景 | 本機第五個環境，包含 Blender GLB、家具碰撞、環境出生點與 Profiles。[驗證](../.kiro/specs/furnished-room-environment/validation.md) |

28 份 spec 的實作階段均已記錄完成。自動奔跑、面板 profiles 與多場景原先的階段欄位落後於勾選任務和實作驗證，本次依這些紀錄補登。多場景的歷史核准欄位保留原值，早期實作與後續補錄的時序見該 spec 的驗證紀錄。

## 剩餘驗收與待決範圍

| 項目／建議標籤 | 分類與狀態 | 完成條件及依賴 |
|---|---|---|
| SCENE-04 | 人工／外部環境，PARTIAL | 交接版已補 GTX 1650／Chrome 與 Edge 操作證據。尚待該環境的固定 X-ray 遮擋與魚眼濕鏡像素對照，以及原生缺少 half-float 時的 fallback。[矩陣](remaining-acceptance.md#待補驗收矩陣) |
| ACCEPT-01 | 人工／外部決策，PARTIAL | 已有 GTX 1060 本機工程樣本。待確認目標裝置、瀏覽器、正式門檻；用指定版本重測前景完整 UI 與跨裝置效能。[效能紀錄](performance-acceptance.md) |
| M5／M6 讀屏 | USER_REPORTED_PASS | Narrator 正常流程整體通過，載入失敗提示與 Reload page 名稱逐項通過。[剩餘驗收](remaining-acceptance.md) |
| SCENE-05 手機、IME、FOLD | 手機操作及 IME 依使用者回報結案，摺疊專項取消 | 既有裁定涵蓋當時操作。後續自動奔跑／鏡頭手勢、飛行、手機 LAN 與特效效能依各次驗證範圍確認。[剩餘驗收](remaining-acceptance.md) |
| 水域／太空 | 待另行規劃與核准 | 共用 Viewer、`main` 與 WorldQuery。若啟動須依序修改，不可平行。[能力與碰撞規格](scene-runtime-collision-mask-spec.md) |

## 取得與執行

遠端分支含對應版本後，新成員可用下列指令取得。已有 checkout 時，先在乾淨工作目錄執行 `git fetch origin`，再 `git switch codex/v02-particle-system` 和 `git pull --ff-only origin codex/v02-particle-system`；首次切換可用 `git switch --track origin/codex/v02-particle-system`。交接時以團隊收到的完整 commit SHA 固定版本。[交接清單](team-handoff.md)

```powershell
git clone --branch codex/v02-particle-system --single-branch https://github.com/goofyliutw03/3D-Character-Walking.git
cd 3D-Character-Walking
./scripts/onboarding.ps1 -Json
```

依預檢結果選用 Git、PowerShell 7、Node.js 22.12+（建議 24 LTS）、pnpm 11.25.0 與 WebGL2 瀏覽器，再執行下列指令。開啟終端顯示的本機網址，預設為 `http://127.0.0.1:5173`。[Onboarding](onboarding.md)

```powershell
./scripts/onboarding.ps1 -InstallViewer
./scripts/project.ps1 test
./scripts/project.ps1 build
./scripts/project.ps1 dev
```

Git 交接包含程式、測試、鎖檔、必要 GLB 與來源／授權、規劃及驗證摘要。套件、dist、忽略的本機測試原始資料、瀏覽器 profiles、RAG 索引，以及原工作站的 Release 與系統匣環境須在各自環境處理。[可移轉檔案與環境限制](team-handoff.md)
