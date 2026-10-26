# Implementation Plan
依2026-10-26使用者授權，從規格至驗證依序執行，inline審閱，不委派／自動commit。

- [x] 1. 擴充真實階段與下載事件
  - 提供選填階段／下載量，維持既有loading呼叫相容。
  - 下載100%仍維持loading，準備／建立成功後才ready。
  - 完成時測試證明無效總量為indeterminate、過時／settled／dispose事件不覆寫新狀態，Retry重新開始。
  - _Boundary: LoadingFeedback, CharacterAssets_
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.2, 2.3, 3.2_

- [x] 2. 建立立體載入呈現
  - 以原生progress、階段文字與有厚度旋轉文字呈現，ready隱藏，error停動畫。
  - 完成時DOM測試證明已知／未知值切換、錯誤／Retry及首次完成後compact正確，下載數字不進入live公告。
  - 支援reduced-motion與390px寬畫面，無新字型／依賴。
  - _Boundary: LoadingPanel, style.css_
  - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.4, 3.1, 3.2, 3.3, 3.4_

- [x] 3. 整合啟動與真實loader
  - 先呈現DOM再準備引擎，串接真實下載資訊與角色準備事件。
  - 明確區分fatal reload與角色Retry，避免恢復按鈕被停用。
  - 完成時production build及全套測試通過，原有角色切換契約維持。
  - _Boundary: main, ViewerApp integration_
  - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.4, 3.4_

- [x] 4. 驗證初始化與回歸
  - 真實production browser驗已知／未知下載、失敗／Retry、完成隱藏、旋轉厚度及reduced-motion。
  - 完成時記錄全套tests／build／runtime與需求對照，390px無水平溢出、可用鍵盤恢復。
  - _Boundary: feature validation_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

## Task-plan review
inline PASS：4項依序任務，13條件完整對應；contract先於presentation／integration，所有共用檔案依序執行。獨立sanity review因無委派授權採inline，未宣稱獨立審查。
