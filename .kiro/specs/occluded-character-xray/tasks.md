# Implementation Plan

2026-10-31使用者核准，依序一次一項；自動inline審閱，非逐份人工核准，不委派、不commit／push。

- [x] 1. 建立遮擋遮罩與材質排除
  - 不透明環境與主角最前層深度分離，按材質區段排除，暫態及資源可還原。
  - _Boundary: CharacterXrayPass、tests/character-xray.test.mjs_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.2_
- [x] 2. 接入普通／魚眼及模式UI
  - 同投影合成，第四選項與說明，First person停用，換角色與Follow保留。
  - _Boundary: SceneRenderer、FisheyePass、ViewerApp、CameraObstruction、main、controlPanelContent_
  - _Requirements: 2.2, 2.3, 3.1, 3.2_
- [x] 3. GPU與整合驗證及修正
  - 全套tests／build、實際GPU遮擋與排除、動畫／魚眼／resize、資源及效能；validate-impl，Release及增量索引。
  - _Boundary: 本feature模組、測試及規格／文件_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

## Task-local Review
- Task 1 RED：canonical node --experimental-transform-types --test --test-isolation=none tests/character-xray.test.mjs，ERR_MODULE_NOT_FOUND exit1。GREEN：4/4測試exit0、typecheck exit0。檢查材質array、祖先排除、原材質還原、例外及cache pruning；自有資源dispose冪等。VERDICT APPROVED inline，依使用者授權；GPU遮罩／GLB初測通過，最終整合仍在task3。
- Task 2 GREEN：全套91/91（後補2條測試待最終全套）、production build exit0。sandbox Vite spawn EPERM屬環境問題，經宿主升權build通過，未改設定繞過。檢查ViewerApp只傳當前操作主角、First person門控、魚眼同capture camera、模式切換先normal還原，無新增依賴。VERDICT APPROVED inline。
- Task 3 VERDICT APPROVED inline，Verification VERIFIED（本機FEATURE_GO）：93/93 tests、build／Release exit0，GPU15 checks全通過；正式Release具選項、近牆幽靈輪廓、四模式／Follow／First person／魚眼／resize成功，console空。9/9條件均有對應、無blocked task、無架構漂移。證據與限制見validation；未commit／push。
