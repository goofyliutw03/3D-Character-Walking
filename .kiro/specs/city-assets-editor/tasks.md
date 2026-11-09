# Implementation Plan
依序單項執行，inline審閱，無委派／commit／push。
- [x] 1.1 建立權威位置與手動速度契約
  - 非法位置原子拒絕、地表／高處落地、walk／run／override測試通過。
  - _Boundary: CharacterController, tests/city-assets-editor.test.mjs_
  - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2_
- [x] 2.1 生成並驗證原創Blender建築
  - 使用已核對的既有Blender；輸出八棟GLB及.blend、manifest與attribution，實際bounds／hash測試通過。
  - _Boundary: tools/assets/prepare_city.py, blender, public/assets/city, tests_
  - _Depends: 1.1_
  - _Requirements: 1.1, 1.3_
- [x] 3.1 整合資產生命週期與場景
  - 成功／失敗重試／pending／dispose晚到測試通過；fallback僅成功後隱藏。
  - _Boundary: CityBuildings, CityScene, ViewerApp, tests_
  - _Depends: 2.1_
  - _Requirements: 1.1, 1.2_
- [x] 4.1 整合主角編輯介面及控制權
  - XYZ即時讀數、草稿、snap／Apply／Read current、walk速度操作；導航與錯誤狀態清楚。
  - _Boundary: integration, ViewerApp, CharacterEditor, main, controlPanelContent_
  - _Depends: 3.1_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3_
- [x] 5.1 整合驗證、文件及正式發佈索引
  - 全tests／build／正式UI、需求coverage與實際diff inline審閱；release與索引status證據完整。
  - _Boundary: integration validation, docs_
  - _Depends: 4.1_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3_

## Review
Task plan coverage PASS；task graph sanity inline PASS：1.1→2.1→3.1→4.1→5.1，已實查Blender/runtime，無安裝前置。每項有可驗證交付、全部需求覆蓋；共用檔明確integration項，無平行標記。依使用者自動續作授權審閱核准，非逐份人工核准。
