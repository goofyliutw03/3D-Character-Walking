# 設計與 inline 審閱

1Y-8 手機追加設計。沿用 CameraInputManager 的 pointer capture，觸控單指與雙指有獨立基準，雙指以距離變化及中心位移分類並鎖定此段意圖。32ms 合併兩指的分開 pointermove，同時支援固定單指的 pinch。標準模式先讓既有單指序列處理，第二指進入時以 pointercancel 結束既有 Orbit／Tap 後接管。第三指加入後封鎖整段直到全部離開。外部 reset/dispose 清除追蹤與計時器，內部 gesture 通知以 localReset 隔離，避免管理層回呼遞迴清除正在追蹤的 fingers。按鈕重用 ViewerApp 公開操作。COMPLEX，沿用既有模型，不平行。

COMPLEX，GPT-6.1 Sol／high，沿用現有模型。目標為可逆、有限狀態與單一相機輸出。使用者已核准完整範圍。

AutoRunControls 負責跑／停／失焦與滾輪進出、相對角度、手勢累計，不依賴 DOM 或 Three。AutoRunGesture 封裝畫布事件與移交。CameraController 以可選構圖 callback 沿用既有插值與第一人稱轉場，避免另一個寫入相機的迴圈。ViewerApp 組裝運動意圖、鏡頭與頭燈。UI 分開模式及暫停狀態。

驗證以純狀態回歸測試、既有相機／頭燈測試、瀏覽器操作及 production release 為主。共用 checkout 依序修改，保留既有差異。Rollback 移除此規格、兩個新增模組與本次接線差異。

審閱已核對需求 1–7、遮擋與使用者 zoom 分離、失焦禁止復活、手動模式切換與頭燈時序。依使用者授權自動審閱通過，非逐份人工審閱。

## 1Y-5 管理分工

ARCHITECTURE，依使用者核准自動inline審閱。CameraController維持唯一相機構圖與插值輸出。CameraModeManager協調AutoRunControls與CameraController，按全部CameraView提供輸入策略，統一select、wheel、reset及Follow恢復。CameraInputManager接管原AutoRunGesture的DOM事件、焦點、快捷鍵與生命週期，切換時由manager呼叫reset清除滑鼠基準。AutoRunControls保留唯一移動／回復狀態，不複製到manager。ViewerApp仍組裝運動及角色可見性。觸控與原MouseOrbitGesture沿用。

審閱確認沒有新增產品控制模式、光源面板或設定格式，既有公開操作保持。風險為切換時序與第一人稱回復權限，使用既有測試及新增切換回歸測試驗證。Rollback僅撤回1Y-5新增模組、接線與spec追加。

## 相機／輸入交互審查與場景政策

依使用者追加授權執行 ARCHITECTURE 審查。CameraInputManager 僅解析 DOM 意圖，CameraModeManager 協調模式與場景能力，AutoRunControls 保留移動與檢視回復狀態，CameraController 保留唯一姿態與動畫輸出，CameraObstruction 處理最終渲染構圖。ViewerApp 負責生命週期、世界碰撞及頭燈使用最終視線的時序。

SceneControlPolicy 定義六種 SpaceKind，以及可獨立覆寫的 framing、constrainCamera、groundNavigation、autoRun。半封閉／封閉預設室內構圖及邊界，過渡區與半開放預設開放構圖，可由環境覆寫。水下預設停用地面導航與自動奔跑，待後續水中移動能力接入。分類本身不限制可組合的能力。城市／洞穴明確提供政策，既有未提供政策的 Environment 由 ceiling 推導相容預設。相機邊界仍需場景提供 ceiling，地面碰撞仍由 WalkableWorld 負責。既有 headlamp 選用能力與遮擋物標記沿用，政策不複製光源資源。

configureScene 統一清除 inspection、zoom、角度與手勢，避免城市與洞穴間殘留第一人稱回復權限。Ctrl 變化、離開畫布與 pointercancel 清理位移基準。瀏覽器縮放等修飾滾輪不交由相機消費。畫布焦點是滑鼠觀看的必要條件。

依授權 inline 審閱需求10–11，允許局部能力擴充與舊 Environment 相容。Rollback 撤回本節對應的政策、clear/focus 修正、接線與測試差異，保留前階段成果。

## 1Y-10 extension
CameraInputManager管理Pointer Lock request/change/error/exit生命週期，使用movementX/Y且避免pointermove重複，使用者手勢才request，失敗不假稱成功。ViewerApp在開始時request、stop時exit、模式不適用時exit並暫停，切場景stop，卸載清理。鎖定相對位移傳入AutoRunControls取消每段上限，四倍率按view選擇，俯仰限制不變。main顯示狀態／重試及四inputs，Profile保存設定不保存鎖定。檔案：src/input/CameraInputManager.ts、AutoRunControls.ts、src/engine/ViewerApp.ts、src/main.ts、src/ui/controlPanelContent.ts、tests。鎖定pending後stop的晚到成功必須立即退出。req12.1–12.5以合成生命週期＋原生browser能力分別驗證。2026-11-09依授權requirements/design/tasks inline審閱通過，無委派。
