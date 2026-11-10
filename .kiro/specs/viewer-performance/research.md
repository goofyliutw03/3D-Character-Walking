# 研究紀錄

2026-11-10：原工作樹 main / 47f5e68，初始乾淨。所有 refs（含 checkpoint）、stash、另一 worktree 及可用 chat 查核未找回原 viewer-performance。保留分支 codex/v02-particle-system 不合併。使用者明確選擇「依 main 重建規格並續作」。

輕量 brownfield discovery：SceneObjectInspector 每 250ms 由 ViewerApp 呼叫 sync；SceneObjectIndex 每次配置 442 個 ObjectRow、比較陣列及 JSON 字串。初探七輪（100次暖機、各500次同步）為 0.1948–0.2129ms/次。其他每幀配置雖可疑，但此次只處理已量測的單一責任邊界。

決策：保留真實遍歷，重用未變列並直接比較快照。拒絕只檢查根物件或 child count 的捷徑，因深層改名／同長度排序／重新掛載會漏更新。configure、setChecked 改 active，但同步快照必須獨立，否則變化通知語意回歸。

工具基準：直接 Node full suite 112/112、tsc exit0；Vite sandbox spawn EPERM，宿主執行 exit0。project.ps1 test 因 pnpm 自動依賴檢查試圖 install 而中止，未接受清理／安裝。後續需限定程序環境停用該檢查；不修改專案套件版本或全域 pnpm 設定。

用量：前 chat 缺起點，跨 chat 全階段無法取得精確值。本 chat 可讀官方 session JSONL token_count，於續作中途取得 input1040542／output3350／total1043892；此基準只適合往後子區間，不能冒稱整個 M6 的用量。cached/reasoning 已含上層，不重加。

2026-11-10 PC小樣本：Chrome156，ANGLE／GTX1060 6GB D3D11，driver32.0.15.8278；stage與drawingBuffer均800×500，DPR1，陰影開、水standard、document visible。無virtual-time；真實RAF1秒75frames，74.9625FPS，中位13.3／P9513.5ms，walk與run都有，GLerror0。這只是工具確認，正式樣本獨立三輪。忽略pc-pilot.json保留原始資料。基於現有runtime private欄位僅測試host讀取，非產品API。

更正後方法：匯入dist後先等500ms，再dispatch非persisted pagehide，走正式main dispose釋放隱藏Viewer及控制面板。每段GLB ready後assert全頁canvas數為1，完整update loop只留測試實例。隱藏主頁DOM保留但無活動renderer／UI事件；測量資料不含其啟動階段。最終單實例矩陣覆蓋原pc-chrome.json／pc-edge.json，無效資料僅保存為dual-invalid。此工具修正無產品變更；之前小樣本只作初探，不作最終效能結論。
