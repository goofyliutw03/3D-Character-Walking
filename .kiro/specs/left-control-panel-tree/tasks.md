# Implementation Plan

依本次核准範圍，按1→2→3依序執行，無平行委派、commit或push。

- [x] 1. 建立可重用功能樹與既有控制分類
  - 五大分類與子群組由節點資料呈現，保留控制ID及表單內容。
  - 原生節點可獨立展開並保存輸入；唯一ID與標題escaping測試通過。
  - _Boundary: FunctionTree, PanelContent_
  - _Requirements: 1.1, 1.2, 1.3, 4.1_

- [x] 2. 實作面板收合與可存取寬度調整
  - 桌面pointer拖曳與鍵盤調寬、clamp、取消及dispose有明確生命週期。
  - 收合／窄版隱藏把手，隱藏內容不取得焦點；寬度偏好只留本頁。
  - 寬度邊界與pointer／鍵盤／清理測試通過。
  - _Boundary: ControlPanel_
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

- [x] 3. 整合版面並驗證既有功能
  - 接上main、CSS與dispose，初始化失敗仍能操作layout；下方移動控制不搬移。
  - production桌面及窄版可操作，canvas依容器resize；角色／表情／粒子／相機／場景回歸通過。
  - canonical tests／build及實際瀏覽器smoke通過，限制如實記錄。
  - _Boundary: Integration_
  - _Depends: 1, 2_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

## Task Plan Review
inline PASS。14/14條件覆蓋；既有Node test／Vite／DOM為已確認前提，無隱藏安裝需求。1和2各有責任邊界；3明確整合，無共用檔案平行寫入。Task-graph sanity PASS（inline，依AGENTS不委派）。依使用者範圍授權自動審閱核准；Release／索引另依AGENTS已授權收尾執行，不當成新功能task。

## Implementation Notes
Task 1：RED canonical test exit1，ERR_MODULE_NOT_FOUND（FunctionTree未存在）；GREEN 74/74 tests、typecheck exit0。讀取新檔及diff，控制ID與既有模板保留，無新依賴／placeholder／機密。inline VERDICT: APPROVED；STATUS: VERIFIED（元件／模板範圍，production整合由task3驗證）。依任務順序繼續2，未commit。
Task 2：RED canonical test exit1，ControlPanel未存在；GREEN 77/77 tests、typecheck exit0。實際讀取新類別及測試，pointer ownership／cancel／lost capture／responsive／dispose、寬度限制及鍵盤／收合焦點通過。inline VERDICT: APPROVED；STATUS: VERIFIED（事件／規則範圍，實際layout由task3驗證）。無placeholder／機密／邊界擴張，未commit。
Task 3：整合前production #panel-resize count0，整合後真實drag 292→432、keyboard／collapse／草稿保存、851px保留360px場景、390×844與844×390無橫向溢出通過。77/77 tests與build exit0；本機production啟動、角色／表情／粒子／相機／場景回歸通過，console error空。審閱修正面板按鍵傳到全域角色快捷鍵，以及收合Appearance中的非法size欄位不能直接看見：現會展開並focus非法欄位，實測9拒絕、修正0.14可套用。與本次前main備份逐段比較確認保留粒子工作；git diff --no-index exit1表示有差異，非build失敗。inline VERDICT: APPROVED；STATUS: VERIFIED（本機範圍）；未跑完整feature-flag OFF protocol，依核心RED／production前後證據記錄，不冒稱完整流程。未commit。
