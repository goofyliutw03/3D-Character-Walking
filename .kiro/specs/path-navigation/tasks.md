# Implementation Plan

依使用者授權自動inline審閱；一次一項，無委派、commit／push。

- [x] 1.1 實作巡迴狀態機、速度契約及真移動測試
  - 真控制器依序繞障抵達；pause/resume、loop、錯誤、速度與卡住有可重現測試。
  - _Boundary: PathTour, DestinationNavigation, tests/path-tour.test.mjs_
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_
- [x] 2.1 整合控制權、UI、狀態及marker
  - 可從Character分支編輯route／播放；手動、Stop、失焦與編輯取消，預設關閉。
  - _Boundary: ViewerApp, TourControls, controlPanelContent, main_
  - _Depends: 1.1_
  - _Requirements: 1.3, 2.4, 3.1, 3.2, 3.3_
- [x] 3.1 回歸驗證、操作文件、Release及索引
  - 完整測試與build／release實際結果、inline審閱及限制已記錄；索引status確認。
  - _Boundary: tests, docs, spec, roadmap_
  - _Depends: 2.1_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

## Review
task graph 1.1→2.1→3.1，inline sanity PASS。所有需求與檔案均覆蓋、無新增前置、無平行任務。依本次授權自動核准，非人工逐份核准。
