# Implementation Plan

依序 1→2→3→4，一次一項；inline 審閱，沒有委派、commit 或 push。既有 runtime／tests 已可用，無安裝前置。

- [x] 1. 提供可重用的水景 Shader 模組與公開 API
  - 分離材質／設定／時間與預設網格，兩入口共用 API，補上使用及所有權範例。
  - 可觀察完成：獨立實例、無效輸入、暫停／關閉、材質複製的動畫同步及透明／線框還原、品質替換與冪等釋放測試通過。
  - _Boundary: WaterShaderModule, WaterFeature, Public API_
  - _Requirements: 2.2, 2.3, 3.1, 3.2, 3.3_

- [x] 2. 建立街尾水景與通行／相機整合
  - 替換街尾島，接入完整靜態障礙與環境；薄片不推近，固體仍遮擋。
  - 可觀察完成：位置、手動走／跑／跳、繞行、點池拒絕及相機過濾測試通過。
  - _Boundary: StreetWaterFeature, CityScene, Camera integration_
  - _Requirements: 1.1, 1.2, 1.3, 2.3_

- [x] 3. 接入既有更新迴圈與功能樹操作
  - 水景與主迴圈共用時間／釋放，加入效果／暫停／品質／波浪／流速與狀態。
  - 可觀察完成：typecheck／全套測試與 build 通過，production 可操作；背景／恢復不補算，面板及既有 renderer 職責保留。
  - _Boundary: ViewerApp, UI integration_
  - _Requirements: 2.1, 2.2, 2.4, 3.1_

- [x] 4. 驗證整合與兩入口回歸
  - 檢查相機三模式、所有 presets、日夜／陰影、窄版、近遠側角、選地／碰撞、shader 與資源循環。
  - 固定街道條件兩品質各 off/on 60s×3 輪，5s 暖機，保存新證據與限制。
  - 可觀察完成：完整測試／build、production boot、測量與跨任務契約審閱有新證據，兩入口維持可用，未驗真機明列。
  - _Boundary: Integration validation_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

## Task Plan Review
inline PASS；13/13 criteria、全部設計元件與 API／world／UI 接縫均覆蓋。Sanity PASS：先 module 再 street 再 app/UI 再完整 GPU 驗證，無隱藏套件／外部前置；Release／索引是已授權收尾，不額外新增里程碑。依使用者授權自動審閱通過，非逐項人工核准。

## Implementation Notes
Task 4：GREEN 最終89/89 tests；22/22實際Release交互檢查、兩入口boot／資源循環、正式UI與390px窄版、近遠側角均通過。標準／低各6段共12個60秒街道採樣完成，ShaderErrors0；原始報告及限制見validation。依kiro-validate-impl完成跨任務契約／coverage／design／boundary審閱，inline VERDICT: APPROVED；STATUS: VERIFIED；DECISION: GO（本機整合）。手機／LAN／其他GPU與真實背景降頻仍未驗，M6／SCENE-05不勾完；Release／索引依授權收尾另記。
Task 3：RED 新水景功能樹節點缺席 assertion，GREEN 89/89 tests、typecheck／build exit0。Release 2026-10-31T00:04:05+08:00 Added5/Updated2/Skipped10；首次 sandbox spawn EPERM 已停止，宿主核准 escalation 重跑成功。實際 Release root Ready，Scene display 的 controls 正確，console warn/error 空。與本 chat 開始的 ViewerApp／main 備份逐段 diff，確認僅插入水景設定／時間／UI，保留既有粒子與面板修改。inline VERDICT: APPROVED；STATUS: VERIFIED（主迴圈／控制接線，完整 GPU 交互及測量 task4）。
Task 2：RED 缺 StreetWaterFeature 模組，GREEN 88/88 tests、typecheck exit0。直接檢查 city/camera diff 與新增檔，scan 無 placeholder／secret。池中心、完整障礙、點池拒絕、雙側導航及走／跑／跳阻擋、薄片過濾及 solid constraint 都有行為測試。原 navigation fixture z=-23 現位於池內，移至池前 z=-22；新增池內拒絕測試防止假回歸。inline VERDICT: APPROVED；STATUS: VERIFIED（world／ray／資源，實際 GPU 待 task4）。
Task 1：RED 使用 no-isolation runner 得 ERR_MODULE_NOT_FOUND（公開 index 尚未存在）；初次預設隔離 runner 的 spawn EPERM 為環境失敗，不當 RED。GREEN 全套 84/84 tests、typecheck exit0。直接讀新增模組與 shaders、API／clone 行為測試、placeholder／secret scan 無命中，原有 water tests 全通過。inline VERDICT: APPROVED；STATUS: VERIFIED（API／狀態／材質 clone，GPU 視覺由 task4）。未使用 feature flag 的完整 OFF protocol，採實際模組缺席 RED→GREEN，不假稱完成該 protocol。無委派／commit。
