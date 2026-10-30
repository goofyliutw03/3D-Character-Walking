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

## 2026-10-26 Front 近距修正（1G-0）
- [x] 3.1 重現近牆／樹旁構圖，修正 Front 避障壓縮造成的人物裁切
  - 使用真實 CityScene、固定座標重現 0.4m／0.75m 距離與頭腳裁切。
  - 僅在 Front 尋找前半圓斜前方候選；保留避障、頭腳視線、原方向優先及既有轉場。
  - _Boundary: CameraController, tests/front-obstruction.test.mjs_
  - _Requirements: 1.1, 1.4, 2.1, 2.3, 2.5, 4.1, 4.3_
- [x] 3.2 完成 inline 整合審閱、全套 tests／build 與瀏覽器回歸，更新索引
  - _Depends: 3.1_
  - _Boundary: camera-modes validation；不變更里程碑6人工驗收或引入新里程碑_

追加任務依使用者「OK go on please」授權自動推進；不 commit／push、不切換模型、不平行委派。

## 2026-10-29 角色中心 Orbit（1L-0）
依使用者「ok please go on」核准，按4.1→4.2→4.3依序執行；不委派／commit／push。
- [x] 4.1 角色中心平滑平移與模式閘門（requirements 5.1–5.3）
  - Boundary: CameraController、tests/mouse-orbit.test.mjs；真正OrbitControls測試通過。
- [x] 4.2 滑鼠hold／drag分流與ViewerApp生命週期（requirements 5.1、5.3）
  - Depends: 4.1；Boundary: MouseOrbitGesture、ViewerApp、tests/mouse-orbit.test.mjs。
- [x] 4.3 全套測試／build／Release、production smoke及整合審閱與索引
  - Depends: 4.2；Boundary: camera-modes文件、development-plan、roadmap。
任務計畫inline PASS：逐項測試已執行，57/57通過，4.3待後續證據；共用檔案必須依序進行，不可平行。

## 2026-10-31 Mobile Orbit（1L-1）
依使用者「Continue, 請加上支持 mobile browser 的對應支持」核准，依序執行，不commit／push／委派。
- [x] 5.1 擴充單指hold／drag與多指取消狀態（6.1–6.3）
  - Boundary: MouseOrbitGesture、mouse-orbit tests；保留既有CameraController／ViewerApp接線。
- [x] 5.2 整合審閱與瀏覽器接線驗證（6.1–6.4）
  - Depends: 5.1；Boundary: camera-modes validation；手機實機仍待使用者驗收。
- [x] 5.3 全套tests／build／Release與增量索引
  - Depends: 5.2；Boundary: 本spec、README／roadmap；不更改M6／SCENE-05。
計畫inline審閱PASS：6.1–6.4全映射，共用檔案必須依序進行，不可平行。

2026-10-31：使用者已確認iOS／Android Mobile Orbit操作OK，忽略機型，5.2的本次手機實機待驗已完成；不概括關閉M6／SCENE-05其他項目。
