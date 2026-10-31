# 實作計畫（依序，不平行）

- [x] 1. 建立場景索引與標籤選擇／篩選資料契約
  - 穩定正整數ID、動態階層、未命名fallback、WeakMap及active回收。
  - 以測試確認交集／ancestor closure、區間邊界、原子拒絕錯誤與不改場景。
  - _Boundary: SceneObjectIndex、tests/scene-object-inspector.test.mjs_
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 4.1_

- [x] 2. 建立可操作物件樹及世界編號overlay
  - keyed DOM保留focus／展開、checkbox、總開關、Apply／Clear及錯誤提示。
  - 以公開投影函數驗證各視角、祖先隱藏及dispose；可捲動完整樹。
  - _Depends: 1_
  - _Boundary: SceneObjectInspector、style.css、inspector tests_
  - _Requirements: 1.3, 2.1, 2.2, 2.3, 3.3, 3.4, 4.1, 4.2_

- [x] 3. 接入場景更新及面板並驗證production整合
  - ViewerApp集中mount／250ms sync／rendered camera／context／dispose，main掛載。
  - 全套tests／build與production真入口，角色替換、粒子、夜景／水景及所有鏡頭可用。
  - _Depends: 2_
  - _Boundary: ViewerApp、main、controlPanelContent、inspector integration tests_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

## Task Plan Review
inline PASS（使用者明確禁止平行委派）；依1→2→3，無隱藏前置依賴，所有12條件、檔案與整合均覆蓋。依使用者授權自動審閱，不冒稱人工逐份核准。未commit／push。

## Implementation Notes
task3：最終release canonical112/112、tsc／Vite exit0、production22/22與真入口Enter／Space／錯誤操作通過。inline檢查共享diff與新增模組，保留既有水霧／夜景。過濾下手動收合跨結構更新已補修正與production斷言，無blocking findings。VERDICT: APPROVED；STATUS: VERIFIED。
task2：RED缺少SceneObjectInspector模組exit1；GREEN112/112、tsc exit0（先修正一個unused type import）。inline檢查發現per-node listener閉包會保留row，已改樹容器事件委派，避免AbortSignal持有移除節點；投影／effective visibility通過。VERDICT: APPROVED；STATUS: VERIFIED（DOM真瀏覽器操作於task3整合驗證）。
task1：RED缺少SceneObjectIndex模組exit1；GREEN canonical111/111 exit0。直接讀新增模組及tests並檢查diff；ID／reparent／remove／safe integer／交集／祖先／原子錯誤覆蓋，未改scene。VERDICT: APPROVED；STATUS: VERIFIED。無placeholder／secret／boundary finding。
開始task前先讀對應需求／design boundary，RED→GREEN→inline review／verify後才勾選。發佈／索引依AGENTS收尾，不列為額外里程碑。

