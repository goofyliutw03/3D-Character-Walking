# Tasks

- [x] 1.1 建立歷史、temp 與版本驗證
  - 十筆淘汰、99循環、乾淨載入不覆寫temp可測。
  - _Boundary: ProfileHistory_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.2_
- [x] 1.2 建立本機 JSON 儲存與 fallback
  - 成功、拒寫、損壞可區分，讀寫依序。
  - _Boundary: ProfileStorage_
  - _Requirements: 3.1, 3.2, 3.3, 3.4_
- [x] 2.1 建立完整 runtime 快照及跨場景套用
  - 設定恢復，不恢復位置／奔跑暫態。
  - _Boundary: ViewerApp, SceneObjectInspector_
  - _Requirements: 1.1, 1.2, 1.3_
- [x] 2.2 整合 UI 草稿、layout、Save／Reset／選擇及 reload
  - runtime與面板一致，修改同步temp，儲存方式與錯誤可見。
  - _Boundary: UI integration, ControlPanel, main_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_
- [x] 3.1 完成整合回歸與 browser 驗證
  - fresh tests/build/browser及inline審閱紀錄可核對。
  - _Boundary: validation_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

## Task Review
2026-11-09 依序1.1→1.2→2.1→2.2，main inline審閱，非獨立審閱。
- 1.1 RED：新模組不存在，ERR_MODULE_NOT_FOUND；GREEN：歷史／temp／循環測試pass。
- 1.2：fallback／拒寫／串行及較新fallback選擇測試pass；真實非安全HTTP IndexedDB＋reload＋transaction abort錯誤顯示pass。
- 2.1：OPFS browser已驗洞穴32光源／頭燈跨場景及reload；修正光源編號驗證範圍。
- 2.2：browser 16 checks pass、zero exceptions；temp優先、乾淨profile保留temp、Reset、損壞保護／明確復原。新增autosave非exclusive路徑避免打斷輸入焦點，收尾再驗。
- VERDICT: APPROVED（1.1、1.2、2.1、2.2）；邊界／輸入驗證／機密／placeholder及diff檢查完成。全套最後一次173 pass，後增2項控制測試局部通過；正式release重新跑全套。

3.1 VERDICT: APPROVED（inline），Release browser22checks／zero exceptions，混合runtime、草稿、暫態排除、焦點與收合reload通過；非安全HTTP另3checks通過。原生headless鎖定denied屬已揭露人工限制。
