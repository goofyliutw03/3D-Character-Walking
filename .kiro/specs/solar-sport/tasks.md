# Tasks
依使用者開始授權自動依序執行；inline審閱，無commit/push。
- [x] 1. 太陽位置與場景光照（需求1/3/4；design2/3）
  - _Boundary:_ SolarPosition.ts、CityScene.ts、tests/solar-sport.test.mjs；先驗證拒絕與季節方向，再整合既有光照。
- [x] 2. 轉盤、指北針及應用程式整合（需求1–4；design3/4）
  - _Boundary:_ SolarControls.ts、ViewerApp.ts、main.ts、controlPanelContent.ts、style.css；沿用生命週期，保留共用既有變更。
- [x] 3. 全套驗證、文件、Release與索引（需求1–4；design5）
  - _Boundary:_ 本spec、docs/development-plan.md、roadmap、README、docs/lighting-api.md；測試/build、runtime及發佈依序執行；索引查status。
## Implementation Notes
規格階段requirements→design→tasks依序inline自動審閱APPROVED，非逐份人工核准。此為有限追加功能，非第七里程碑。

Task1 STATUS: READY_FOR_REVIEW；RED：未實作模組ERR_MODULE_NOT_FOUND（首次隔離runner遭EPERM後改用專案指定none）；GREEN：6/6 solar+night測試PASS。修正測試誤用05:00（25N夏至日出約05:14），改05:30。VERDICT: APPROVED；VERIFY: VERIFIED。未新增功能旗標，實際產品Solar開關預設off。

Task2 STATUS: READY_FOR_REVIEW；VERDICT: APPROVED；VERIFY: VERIFIED。typecheck及122/122全套PASS；production實際拖曳、鍵盤Home/午夜循環、季節、夜燈、第一人稱/俯視/魚眼PASS。修復讀數對比與緯度input立即套用；4/4 solar測試涵蓋pointer capture/cancel/lostcapture、鍵盤、dispose及DOM刻度數。整合前只有Task1 API而無UI，未另造暫時旗標；產品enabled預設false。

Task3：完整123/123 tests、build及最終Release PASS，真實production啟動／互動與logs PASS；VERDICT: APPROVED；VERIFY: VERIFIED。索引狀態見validation收尾記錄；無commit/push。
