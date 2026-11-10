# Implementation Plan
依使用者1Y-14授權依序單項執行、inline review，不委派、不commit。

- [x] 1. 建立有限三維膠囊及地面查詢
  - 先加入有限高度、圓弧拐角、切線／離開、高速／非法資料、多層ID與同源地形射線測試，記錄RED。
  - 完成時查詢回正確最早接觸／法線與支撐表面，城市capability保持原值。
  - _Boundary: WorldQuery, CapsuleBox, GroundWorldQuery, HeightField_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 4.1_
- [x] 2. 完成地面移動與原子尺寸驗證
  - 先寫低洞頂、斜向滑動、階梯、陡坡、落下及三尺寸測試再實作。
  - 完成時四接觸上限、.25m步高／45°坡角有證據，頭頂接觸可恢復落地，非法傳送／尺寸不改狀態。
  - _Boundary: CharacterController, motion_
  - _Requirements: 1.3, 2.1, 2.2, 2.3, 4.1_
- [x] 3. 保留目的地高度與地面路段判定
  - 點選帶回高度、依目前尺寸驗證上下層端點及路段，平面呼叫維持相容。
  - 完成時上下層同XZ不會誤判到達，無合法連線顯示blocked；城市tour回歸通過。
  - _Boundary: DestinationNavigation, GroundPicker_
  - _Requirements: 3.1, 3.2, 4.1_
- [x] 4. 整合地表／洞穴與角色尺寸
  - 真實場景使用同源有限盒／地表，洞穴含可見階梯岩台與保守鐘乳石代理；Viewer綁定目前variant尺寸。
  - 完成時兩場景query有效、上下層可辨、低淨空不接受較高角色、城市與Profiles保留。
  - _Depends: 1, 2, 3_
  - _Boundary: CaveScene, TerrainScene, Viewer integration, main feedback_
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_
- [x] 5. 驗證完整產品與審閱
  - 完整tests、tsc／build、Needle／legacy production多場景、三角色、編輯與洞頂／階梯、相機／Profiles操作。
  - 完成時11項條件映射、boundary audit與runtime證據完整，無必要程式阻擋。
  - _Boundary: Feature validation_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2_

## 收尾
適當驗證後依序release與hash／preview，codebase_update/status；記錄真機／效能限制、token可核算區間。非新增實作任務。

## Task Plan Review
inline PASS：11/11 covered，1→2→3→4→5，跨界明列task4，無平行標記／隱藏前提；依授權自動審閱。
