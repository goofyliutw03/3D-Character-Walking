# Implementation Plan
依使用者確認自動審閱，依序進行、不自動 commit。

- [x] 1. 鏡頭狀態與構圖
- [x] 1.1 建立鏡頭控制器及獨立跟隨
  - 新增前方、人物俯視、低角度、魚眼構圖，保留原有模式。
  - 完成時單元測試證明 Follow 不改 mode、暫停／重啟、球面轉場與減少動態效果；First person 眼位不退化。
  - _Boundary: CameraController, FollowCamera constrain_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.5, 4.1_
- [x] 1.2 實作魚眼投影與資源管理
  - 使用既有Three render target／shader，明確160°等距圓形視野。
  - 完成時測試證明正方形capture、resize、render target還原與dispose，無新依賴。
  - _Boundary: FisheyePass_
  - _Requirements: 3.1, 3.2, 3.3, 4.2_

- [x] 2. 整合與驗證
- [x] 2.1 整合鏡頭UI與渲染
  - ViewerApp委派控制器，renderer按需開關魚眼，卡片／開關／footer一致。
  - 完成時新構圖可選、跟隨暫停不跳模式，第一人稱固定眼位提示清楚，build通過。
  - _Boundary: ViewerApp, SceneRenderer, main UI_
  - _Depends: 1.1, 1.2_
  - _Requirements: 2.1, 2.2, 2.4, 3.2, 3.3, 4.1, 4.2_
- [x] 2.2 驗證整個里程碑
  - 執行全套tests／build、production browser檢查所有構圖、shader、resize與回歸。
  - 完成時有實際魚眼彎曲、普通透視恢復、角色與光影控制證據，限制明列。
  - _Boundary: feature validation_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

## Task-plan review
inline PASS：4個子任務，依賴順序明確，全15條件對應（以實際條件清單核對）；共用檔案必須依序進行，不可平行。驗證紀錄見validation.md。
