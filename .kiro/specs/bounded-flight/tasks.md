# Implementation Plan
依序明確選項，inline review／verify後才勾選；無平行或commit。

- [x] 1.1 建立飛行範圍、禁入盒與警戒查詢
  - 先RED高速／上下界／禁入／非法資料，再實作連續膠囊與完整尺寸。
  - _Boundary: WorldQuery, FlightWorldQuery, tests/flight_
  - _Requirements: 3.1, 3.2, 3.4_
- [x] 2.1 建立單一權威飛行策略與合法著陸
  - 加減速／固定步進／丟棄、四接觸滑動／速度投影、原子傳送尺寸、ground交接與Stop。
  - _Depends: 1.1_
  - _Boundary: FlightController, motion, tests/flight_
  - _Requirements: 2.1, 2.2, 3.1, 3.3, 3.4_
- [x] 3.1 建立程序天空、雲與同源驗證場景
  - 可見盒與query同源、禁入標記、非實體雲、能力與dispose。
  - _Depends: 1.1, 2.1_
  - _Boundary: FlightScene, SceneSwitch, tests/flight_
  - _Requirements: 1.1, 1.3, 3.2, 3.4_
- [x] 4.1 整合正常入口、桌面手機控制與Profiles
  - Viewer策略權威、升降／boost／起飛著陸、導航能力、暫態清除、scene驗證／context與v1相容。
  - _Depends: 3.1_
  - _Boundary: ViewerApp, InputManager, main, controlPanelContent, settings, SceneSwitch, integration tests_
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.3, 3.4, 4.1_
- [x] 5.1 完整審閱、兩runtime正式操作與發佈
  - 完整tests／typecheck／build、Needle／legacy、低幀／尺寸／切換／context、Release/hash／索引，記錄限制與token。
  - _Depends: 4.1_
  - _Boundary: Feature validation and delivery documentation_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

Task gate inline PASS：12/12覆蓋，依賴順序與整合邊界明列。依已授權自動審閱。
