# Implementation Plan

模式：sequential，依使用者里程碑授權自動 inline 審閱；一次一項，不 commit。無環境或套件新增需求。共用檔案必須依序進行，不可平行。

- [x] 1. 表達狀態與投影基礎
- [x] 1.1 完成情緒與純文字對話狀態
  - 五種選項、預設、快照隔離與160 Unicode code-point上限可由行為測試驗證。
  - 空白可隱藏，多行與標記保持純文字；內容不因角色切換重置。
  - _Boundary: ExpressionManager_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_
- [x] 1.2 完成人物上方座標的普通及魚眼映射
  - camera-space 到 CSS pixels 與現有shader一致；中心、離軸、不同aspect與裁切測試通過。
  - 背面、圓外及無效尺寸返回不可見，不改鏡頭控制。
  - _Boundary: AnchorProjection_
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. 呈現與輸入隔離
- [x] 2.1 完成泡泡與載入回饋呈現
  - overlay 以純文字呈現，空白／null隱藏、邊緣clamp、不攔截場景、dispose可重複。
  - loading／ready／error可由契約測試驗證，包含busy及復原文字，無假的loader。
  - _Boundary: ExpressionOverlay, LoadingFeedback presentation_
  - _Depends: 1.1, 1.2_
  - _Requirements: 2.2, 2.3, 3.4, 3.5, 4.1, 4.2, 4.3, 5.2, 5.3, 5.4_
- [x] 2.2 完成進入編輯時的移動隔離
  - focusin清除鍵盤與鎖定方向／run，IME及表單按鍵不被攔截。
  - blur／hidden／pointer cancel／dispose原行為回歸通過。
  - _Boundary: InputManager_
  - _Requirements: 2.4, 5.5_

- [x] 3. 系統整合與驗證
- [x] 3.1 整合表達控制、每幀定位及載入呈現
  - 可選情緒、輸入／清除、字數與可見焦點；IME結束才正規化與播報。
  - camera更新後定位、First person隱藏、角色切換保留內容、dispose清理。
  - 初始忙碌及原型ready／初始化失敗呈現可讀且與renderer狀態分離。
  - _Boundary: Integration — ViewerApp, main, CSS, expression presentation_
  - _Depends: 2.1, 2.2_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5_
- [x] 3.2 完成行為回歸與production runtime驗證
  - 全套測試及production build通過，真實browser到達可操作狀態。
  - 桌面／390×844、多種鏡頭／魚眼、跑跳、角色切換與輸入隔離驗收留證。
  - 逐條對照20項條件，區分契約／browser證據與未驗收限制。
  - _Boundary: Integration validation_
  - _Depends: 3.1_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5_

## Implementation Notes
- 沿用 Node 原生 runner 與 --test-isolation=none；無新套件。
- 真實 GLB 載入與實機／跨 GPU 驗收仍在後續，不以 fixture 冒稱完成。
