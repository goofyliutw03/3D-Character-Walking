# Validation evidence — character-movement

下游里程碑4回歸註記：CameraController接手相機協調，Follow開關現可保留所選構圖，First person固定眼位時checked/disabled；這取代早期「關Follow回Orbit／清卡片」UI契約。原角色／輸入／運動／FirstPerson／Follow測試持續通過，新增鏡頭驗證見[下游紀錄](../camera-modes/validation.md)。

## Third person 增補（2026-10-25）
- 依使用者要求新增獨立 Third person 卡片，沿用 FollowCamera；First person 保留。POV 指觀察視角，FOV 為視野角，兩者不混用。
- 5.7 已補 requirements／design／tasks，26/26 條件有對應；主 agent inline review APPROVED，無新依賴、無額外鏡頭控制器。
- 全套測試 17/17 PASS、exit 0；`./scripts/project.ps1 build` PASS、exit 0（JS 583.67 kB／gzip 147.35 kB，保留 >500 kB advisory）。
- Production browser PASS：First person → Third person 人物恢復顯示；反向切換隱藏自身。Follow checkbox、Third person 卡片、模式標籤及 footer 同步；取消 Follow 後清除卡片選取並回 Orbit。console error／warn 為空。
- 既有驗收環境限制不變；本次未 commit／push。DECISION: GO，里程碑 4 仍未開始。

目前結論（2026-10-25）：GO，里程碑 3 含追加第一人稱完成，等待使用者結束確認。下方早期紀錄保留原時點；續作確認 HEAD 已由其他操作更新為 af73f11，本次以此為基準，未自行 stage／commit／push。

審閱模式：主 agent inline；依使用者授權自動審閱，非獨立 reviewer，非逐份人工核准。未 stage／commit／push。

## 規劃審閱

2026-10-25 增補：First person 5.4–5.6、設計、任務 3.2 自動 inline 審閱 PASS；全體為 25 個驗收條件。
Requirements／design／task-plan PASS，22 個驗收條件全對應；spec.json approvals 代表授權自動審閱通過。

## Tasks 1.1 / 1.2
- RED：原生 Node test runner 預設子程序被環境 EPERM 阻擋，改用 `--test-isolation=none`；接著缺少 controller 的 ERR_MODULE_NOT_FOUND 證明入口可抓到缺少實作。
- Behavioral RED：暫時 MOVEMENT_ENABLED=false，6 tests 中 5 個行為斷言失敗（速度、跳躍、空中狀態、滑動、地面）。實作啟用後移除暫時 flag。
- GREEN：`node --experimental-transform-types --test --test-isolation=none tests/character-movement.test.mjs` exit 0，6/6 PASS；`./scripts/project.ps1 typecheck` exit 0。
- Review Verdict: APPROVED（1.1、1.2）。controller 不依賴 DOM／Three，逐軸 swept 邊界、子步與地面解算符合設計；沒有新依賴／殘留 flag／secret。
- Verification Result: VERIFIED（TASK），範圍僅純運動與測試入口，尚未宣稱瀏覽器功能完成。

## Tasks 2.1 / 2.2 / 2.3
- RED：先建立各自測試，Character、InputManager、FollowCamera 尚不存在時皆報 ERR_MODULE_NOT_FOUND（exit 1）。
- GREEN：完整原生 Node 測試 12/12 PASS；typecheck exit 0。涵蓋人物高度／pose／切換保留 transform／dispose、input blur／hidden／repeat／editing／pointer cancel／lostcapture，以及 Follow immediate／平滑／heading。
- Review Verdict: APPROVED（各任務，inline）。直接閱讀新檔，無 placeholder 或 secret；外觀不擁有運動控制，input 不匯入相機／場景，Follow 不操作 UI。無新增依賴。未使用獨立 reviewer。
- Verification Result: VERIFIED（TASK）。尚未宣稱 ViewerApp／瀏覽器整合完成。

## Tasks 3.1 / 3.2 / 3.3（2026-10-25）
- 城市整合 RED：city-movement 因缺少 walkableWorld 先失敗；加入設施碰撞 metadata 後通過。
- Follow 審閱發現街尾轉向進入樹冠，新增遮擋測試先失敗，raycast 距離修正後通過並實際重驗。
- First person RED：測試先因 FirstPersonCamera 不存在報 ERR_MODULE_NOT_FOUND（exit 1）；實作後實際眼位／heading／跳躍／角色高度／near 與 FOV 還原測試通過。
- 完整測試：`node --experimental-transform-types --test --test-isolation=none tests/*.test.mjs`，17/17 PASS、exit 0。
- Build：`./scripts/project.ps1 build`，TypeScript／Vite PASS、exit 0。JS 583.20 kB／gzip 147.28 kB；保留既有 >500 kB advisory，未擴大拆包範圍。
- Runtime：`./scripts/project.ps1 preview`，http://127.0.0.1:4173/ 的 production dist 到達 WebGL2 ready；console error／warn 為空。
- Browser：男／女／小孩、Walk／Run／Jump／Stop、方向鍵盤、中央設施阻擋、Follow／Orbit／三種靜態預設／Reset、日光／黃昏及陰影關閉／重開已檢查。第一人稱水平視線、自身隱藏、小孩較低眼高、移動／跳躍與切回 Follow／Overview 恢復人物及 UI 已檢查。
- Responsive：390×844，四個鏡頭卡片各 160px，scrollWidth 375≤innerWidth 390、無水平溢出；canvas resize 已檢查，測試後清除 viewport override。

## Review Verdict
- VERDICT: APPROVED
- TASK: 3.1, 3.2, 3.3
- MECHANICAL_RESULTS: tests／build PASS；新實作無 placeholder／secret；boundary WITHIN，無新依賴。
- FINDINGS: Follow 遮擋已修正；第一人稱／Follow／Orbit 互斥，退出恢復模型與透視，沒有未解阻擋缺陷。
- SUMMARY: 主 agent inline 審閱確認整合及第一人稱可用，非獨立 reviewer。

## Validation Report
- DECISION: GO
- MECHANICAL_RESULTS: Tests PASS（17/17、exit 0）；Build PASS（exit 0）；Smoke boot PASS（production artifact、WebGL2 ready、console 無 error／warn）；placeholder／secret CLEAN。
- INTEGRATION: Input → controller → Character → camera → renderer 契約一致；單一人物／相機／loop，場景發布碰撞，UI 不操作 scene objects。
- COVERAGE: 6/6 sections、25/25 criteria 已對應；運動、碰撞、輸入取消、生命週期由行為測試覆蓋，呈現與控制由實際瀏覽器補足。
- DESIGN: 檔案與依賴方向一致；Follow 遮擋與使用者追加第一人稱 FOV 已同步設計。下游 camera-modes 輸入仍未展開，須沿用既有 Follow 與 First person，避免重做。
- OWNERSHIP: LOCAL
- UPSTREAM_SPEC: N/A
- BLOCKED_TASKS: 無。

## Verification Result
- STATUS: VERIFIED
- CLAIM_TYPE: FEATURE_GO
- CLAIM: 里程碑 3 程序化人物、移動／跑跳、碰撞、Follow／Orbit 與 First person 可供使用者確認。
- EVIDENCE: 全套測試、production build、實際 runtime、25 項需求覆蓋與 inline boundary review。
- GAPS: 未驗證實體觸控效能、多瀏覽器／不支援 GPU、故意 context loss。blur／hidden 邏輯經 EventTarget 測試；IAB 切頁未改變 document.hidden，不冒稱真實 OS 失焦驗收。reduced-motion immediate 由測試覆蓋，未改使用者 OS 偏好。
- NOTES: 環境驗收限制留 roadmap；程序化人物不替代最終 GLB／骨架動畫驗收。里程碑 4 未開始，等待使用者確認。
