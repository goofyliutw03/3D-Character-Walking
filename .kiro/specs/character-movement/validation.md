# Validation evidence — character-movement

審閱模式：主 agent inline；依使用者授權自動審閱，非獨立 reviewer，非逐份人工核准。未 stage／commit／push。

## 規劃審閱
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
