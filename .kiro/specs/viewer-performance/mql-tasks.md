# Implementation Plan

依2026-11-10已核准方案自動依序推進；review mode inline，無委派／commit／push。同一共用checkout不得平行修改。

- [x] 1. 建立基準與跨平台驗證方案
  - 完成基準腳本並記錄Chrome四場景各三輪renderer、CPU／RAF與DOM重建；文件含全部指定瀏覽器及能力／建置下限。
  - 完成狀態：有可重跑命令、JSON實測與平台矩陣；未得真機明列限制。
  - _Boundary: scripts/viewer-benchmark.mjs、docs/viewer-performance.md_
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_
- [x] 2. 依量測重用偏好查詢，保留既有狀態去重
  - 先確認原每幀matchMedia次數／耗時，重用即時MediaQueryList；不另加狀態比較或新型別模組，不改畫質。
  - 完成狀態：真main每幀查詢物件建立歸零，reduced-motion執行中切換仍生效，原狀態轉換正常。
  - _Depends: 1_
  - _Boundary: src/engine/ViewerApp.ts、scripts/viewer-smoke.mjs_
  - _Requirements: 2.1, 2.2, 2.3_
- [x] 3. 整合回歸、比較與交付
  - 同條件Chrome／Edge四場景比較，production互動／resize／context smoke；全套tests與build後依序Release、preview及索引status。
  - 完成狀態：validation能區分已驗、未驗與阻擋，未量得增幅不宣稱FPS提升，Release與索引有完成證據。
  - _Depends: 2_
  - _Boundary: docs、.kiro/specs/viewer-performance、Release流程_
  - _Requirements: 1.1, 1.2, 1.3, 2.3, 2.4, 3.3, 3.4_

## Implementation Notes
- Requirements review：inline PASS；11條criteria可測、無實機支援冒稱、不擴張既有人工驗收。
- Design review：inline PASS；11條criteria映射、既有型別維持相容、單向依賴及檔案責任明確，無新runtime依賴。
- Task graph sanity：inline PASS；1→2→3，量測先於產品修改；Release與索引晚於效能比較。使用者未授權委派，依AGENTS主context審閱，未冒稱獨立審查。
- 基準修正：main已有狀態key去重，實測guideChanges=0，取消原重複比較設計。此為方案內依量測縮減，非擴張範圍；重新審閱需求／設計／任務一致性inline PASS。
- Task1／2／3皆inline APPROVED，完成證據及限制見validation.md；手機真機與Intel／前景環境不是本機測試的完成宣稱。
