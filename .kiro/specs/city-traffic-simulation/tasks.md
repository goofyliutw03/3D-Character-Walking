# Implementation Plan

依序執行，無平行委派、commit或push。各階段依使用者執行授權自動inline審閱，不代表逐份人工核准。

- [x] 1.1 建立凸表面NavMesh與路徑測試
  - 邊界座標切分、障礙膨脹、共享portal及合法／不連通路徑可驗證。
  - _Boundary: SurfaceNavMesh, streetLayout_
  - _Requirements: 1.1, 1.2_
- [x] 2.1 建立行人／車流／號誌協調器
  - 可重現目的地、等燈清空、車距、端點重生、避讓與設定測試通過。
  - _Boundary: TrafficSimulation_
  - _Depends: 1.1_
  - _Requirements: 2.1, 2.2, 2.3, 3.2, 3.3, 4.1, 4.2, 4.3, 5.2_
- [x] 3.1 建立模型、可視號誌與LOD
  - 近遠mesh／geometry確實不同、遲滯及釋放通過測試。
  - _Boundary: TrafficView_
  - _Depends: 2.1_
  - _Requirements: 3.1, 4.3, 5.1_
- [x] 4.1 整合ViewerApp與控制面板
  - 啟用／暫停／數量／重置／LOD及狀態可操作；主角Target接線、隱藏context凍結及dispose均審閱。
  - _Boundary: integration, ViewerApp, main, controlPanelContent_
  - _Depends: 3.1_
  - _Requirements: 2.2, 3.1, 4.1, 4.2, 4.3, 5.1_
- [x] 5.1 整合驗證與發佈索引
  - 完整tests／build／Release及可用畫面檢查，操作文件與inline審閱記錄，索引status與限制如實記錄。
  - _Boundary: integration validation, docs_
  - _Depends: 4.1_
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2_

## Review
需求EARS／邊界review PASS；設計coverage／依賴／生命週期review PASS；task graph inline sanity PASS：1.1→2.1→3.1→4.1→5.1，無新增runtime前置、無孤立任務，全部需求有對應。首輪設計將NPC交通與號誌統一權威，避免互相放行狀態不一致。
