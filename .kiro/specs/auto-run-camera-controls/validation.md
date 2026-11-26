# 1Y-4 驗證與限制

## 1Y-8 手機手勢（2026-11-08）

沿用既有相機模式、input ownership與場景政策，擴充CameraInputManager觸控；未平行修改。需求、設計、tasks已記錄。單指轉向／俯仰，雙指中心平移環繞、距離變化縮放；32ms合併移動事件並鎖定意圖，一指固定也可pinch。標準模式保留單指既有操作，第二指加入時取消原Orbit／Tap後接管；抬指重新建立基準，第三指封鎖到全部離開。外部reset、失焦、hidden、cancel與dispose清理本地追蹤、計時器及capture，內部通知避免管理層reset遞迴。視窗blur需target為window，避免點手機按鈕因canvas失焦暫停奔跑。

158 tests、TypeScript與正式build通過，針對touch ownership、固定單指pinch、多指取消、跨模式reset、失焦與卸載新增3項測試，並補canvas blur不觸發視窗暫停回歸。2026-11-08 21:18:37 +08 Release Added8／Updated1／Skipped21。先前僅自動奔跑觸控與未做手機模擬的缺口已由本輪補齊。

Chrome headless＋SwiftShader，430×932 mobile viewport、touch emulation與Input.dispatchTouchEvent，Needle及legacy兩路均通過以下流程。

- 靜止第三人稱／魚眼以雙指張開進第一人稱，捏合退出後維持靜止。
- 自動奔跑單指、雙指同向拖曳、抬一指後繼續移動，張開進第一人稱並暫停；單指觀看期間XYZ不變，捏合退出到來源模式並恢復跑步。
- 三指移動後touchCancel，沒有誤選點地導航；兩路無Runtime exception／WebGL錯誤且getError=0。
- 手機場景下方自動奔跑／反向／鏡頭歸位按鈕，以觸控實際點按通過，按鈕高度至少44px。停止操作有效，coarse pointer顯示繁中手勢提示。

原始腳本、結果與截圖位於忽略的 .local/mobile-camera-smoke.mjs、.local/mobile-camera-validation/、.local/mobile-camera-ui-final.mjs與.local/mobile-camera-ui-final/。已檢視第一人稱洞穴與按鈕版面截圖。這是桌面Chrome行動尺寸模擬，iPhone／Android真機手感與Safari／其他瀏覽器尚未驗收。其他視角的原有單指、縮放與導航仍由既有路徑處理。

手機規則已寫入面板與場景提示。自動奔跑可用下方按鈕，反向180°只在正在自動奔跑時有效，鏡頭歸位不更改角色方向。第一人稱頭部角度限制、頭燈跟視線及原跑停還原沿用既有行為。收尾執行增量索引並查status，結果以本chat工具輸出為準。Token用量無法取得精確值，缺少官方本階段起終用量。

2026-11-07 使用者核准三份控制規劃，追加 F5 開關亦已授權。requirements → design → tasks 於實作前產生，依完整範圍授權自動 inline 審閱。沒有平行委派、commit 或 push，保留共用 checkout 既有修改。

## 實作與審閱

AutoRunControls 管移動所有權、暫停與第一人稱回復權限，AutoRunGesture 管畫布鼠控／F1／F5。CameraController 沿用球面與 eye quaternion 轉場，套用相對 yaw／pitch／zoom。碰撞仍由 CharacterController 與相機遮擋模組處理。Headlamp 在最後相機更新後，第一人稱使用相機位置與朝向。面板與 F5 共用 setAutoRun。

手勢半畫布寬為180°、200ms分段。第三人稱／魚眼最近使用者距離為各模式預設焦點距離的25%，額外一次向內輸入才進第一人稱；向外累計120 CSS pixel等效滾輪量退出。F1只重設水平／俯仰，保留zoom。反向與退出第一人稱重設完整構圖。數值使用既核准方案的預設，無額外設定面板。

審閱核對 Ctrl 基準、轉向上限、投影模式、失焦／Stop 禁止舊奔跑復活、手動視角切換、原有 touch 事件及資源釋放。手動 WASD／方向／Jump 輸入會接管自動奔跑；由滾輪進入的第一人稱期間維持位移暫停。回到畫布後以 Resume 或 F5 關閉再開啟恢復失焦暫停。

## 自動與瀏覽器證據

- 148 tests、TypeScript 與正式 Vite build PASS。既有 chunk size advisory 保留。
- 2026-11-07 21:45:55 +08 更新產品 Release，Added8／Updated1／Skipped21；最後新增 F5 測試後 21:48:24 再執行 release，Added0／Updated0／Skipped30。入口及產品產物相同。
- 獨立 Chrome headless／SwiftShader，localhost:4174，Needle 與 legacy 均通過自動奔跑、鼠控輸入、中鍵、F1、第三人稱與魚眼滾輪進出、第一人稱位移暫停、回復來源視角與奔跑、原靜止維持停止、F5切換／repeat／Ctrl排除、失焦暫停與明確恢復、Front視角繼續奔跑。
- 兩條渲染路徑無 Runtime exception／WebGL console error，getError=0。腳本與結果／截圖在忽略的 .local/auto-run-smoke.mjs、.local/auto-run-validation/。已目視 Needle 第一人稱洞穴截圖。固定短等待在軟體渲染下曾取得過期UI，驗證改為等目標狀態完成。
- 純測試確認轉向累計邊界、Ctrl分離、跑停回復／失焦禁止復活、相機offset／eye轉場、頭燈對準，以及F5焦點／repeat／修飾鍵／組字和preventDefault。

瀏覽器操作以自動化派送事件驗證；真實滑鼠手感、GPU／手機、長時間效能及跨瀏覽器仍待人工驗收。沒有將軟體WebGL樣本當作實機FPS結論。reduced motion沿用原相機立即定位與頭燈光塵停用邏輯，既有測試通過。

收尾執行 SocratiCode 增量更新與 status 確認，具體結果見本 chat 工具輸出。Token 用量：無法取得精確值，缺少可取得的官方階段起點與結束用量，不用估算或累計chat數代替。

## 1Y-5 相機／輸入管理

2026-11-07 使用者核准結構調整。requirements9 → design管理分工 → tasks4–5依序追加，依授權inline審閱，沒有獨立委派。CameraController維持構圖與平滑轉場，CameraModeManager集中視角分類、Follow限制、select/wheel/F1與手勢清除，CameraInputManager取代AutoRunGesture，集中DOM輸入與生命週期。AutoRunControls仍持有唯一跑停及第一人稱回復權限，ViewerApp組裝可見性與運動輸出。

需求1–8由原有auto-run、camera、headlamp與輸入測試回歸；需求9新增所有視角分類、部分wheel退出重設、模式還原及滑鼠/Ctrl重設與dispose測試。150 tests、TypeScript、Vite build通過。git diff --check無空白錯誤，既有CRLF提示保留。22:00:17 +08 Release Added8／Updated1／Skipped21，chunk size advisory保留。

inline邊界審閱確認輸入管理透過actions傳遞意圖，不直接寫相機；模式管理呼叫既有CameraController及AutoRunControls，不新增動畫迴圈或狀態副本；運動、碰撞、頭燈時序與觸控沿用。移除原AutoRunGesture引用，正常setCamera、F1、wheel、setAutoRun及Stop均接入清除流程。Ctrl keydown/keyup清掉舊位移，下一pointer以ctrlKey實況建立基準。

Chrome headless／SwiftShader的localhost:4174正式Release回歸，Needle及legacy均PASS，腳本exit0，兩條路徑getError=0、無Runtime exception／WebGL錯誤。涵蓋第三人稱/魚眼鼠控、中鍵、F1、F5、wheel進出與靜止還原、失焦與Resume、Front奔跑。結果與截圖沿用忽略的.local/auto-run-validation/。第一次Chrome啟動受執行環境限制，升權後成功；首次完整檢查關閉Browser時因CDP回覆斷線造成exit1，修正忽略的harness關閉流程後重跑exit0。真實滑鼠手感、實機GPU／手機與長時間效能仍待人工驗收。

本階段token用量：無法取得精確值。無可取得的官方階段起點／結束用量，未以共享chat累計或估算替代。索引採SocratiCode增量更新及status確認，完成範圍與時間以工具輸出為準。

## 1Y-5 快捷鍵追加修正

使用者要求將自動奔跑由F5改成Y。CameraInputManager改用KeyY，保留焦點、repeat、修飾鍵及組字條件，操作面板及底部提示同步。回歸測試新增F5不攔截，歷史F5驗證文字保留為當時證據。
150 tests、型別檢查及Vite build通過。2026-11-07 22:08:24 +08增量Release完成，Added8／Updated1／Skipped21。本次快捷鍵DOM測試通過，未重跑完整瀏覽器情境。Token用量無法取得精確值，缺少官方起訖基準。

## 1Y-5 點地導航回歸修正
使用者回報第三人稱切回其他一般視角後點地失效。根因為ViewerApp仍以autoRun.active全域攔截，與CameraModeManager的standard輸入策略不一致。改用groundTapEnabled，合法目的地經beginDestination解除auto-run後開始導航；setCamera清除舊tap候選。新增模式／接管測試，150 tests與正式build通過，22:15:14 +08 Release Added8／Updated1／Skipped21。Chrome headless Needle及legacy均確認third-person+auto-run切street後有效點地，UI轉為Running to destination且auto-run Off，getError=0且無Runtime錯誤。忽略的.local/ground-tap-smoke.mjs使用畫布相對座標，exit0。測試腳本前兩次使用視窗座標越出畫布，不能視為產品失敗證據。實體滑鼠／手機仍待驗。Token用量無法取得精確值，缺少官方起訖用量。
## 相機／輸入交互審查及六類空間契約

2026-11-07 使用者核准全面檢查與可維護模組化，requirements10–11 → design → tasks6–8 依序 inline 審閱及實作。保留 Y 切換的最新操作規則。沒有進行 commit／push。

發現並修正下列邊界問題。
- 換場景與圖形連線遺失時，舊 inspection 回復記錄可能持續鎖住運動。新增 AutoRunControls.clear，換場景由 CameraModeManager.configureScene 統一清理，context lost 同步清理。
- 特殊滑鼠觀看未檢查畫布焦點。現在編輯 UI 時移動滑鼠不再改角色／相機方向，離開畫布及取消指標清掉連續手勢。
- F1 repeat 原本未攔截瀏覽器預設。現在維持攔截且不重啟動畫。帶修飾鍵滾輪保留瀏覽器行為。

模組分工保持 DOM 輸入 → 切換協調 → 相機姿態 → 最終遮擋流程。SceneControlPolicy 單獨宣告六種空間分類與可覆寫能力，城市及洞穴接入。舊 Environment 仍可由 ceiling 推導預設，既有使用者輸入／相機程式不依 city/cave ID 分支。Headlamp 繼續以選用能力掛載且在最終相機後更新。水下預設禁用地面導航及自動奔跑，未建立水中移動。

| 驗證層 | 範圍與結果 |
|---|---|
| 有向切換矩陣 | 9×9 視角，off/running/paused，Follow on/off，一般/reduced-motion，4 obstruction，共3888組，檢查每幀有效姿態、轉場完成與跑停一致。遮擋矩陣使用空環境，實際幾何／透明材質／X-ray深度由既有相機測試覆蓋。 |
| 狀態與生命週期 | 所有6類空間政策清除檢視、能力覆寫；DOM焦點、Ctrl左右鍵重設、F1 repeat、修飾滾輪、中鍵、blur/hidden與dispose。既有測試回歸wheel門檻、Stop/disable/suspend、headlamp視線、觸控與碰撞。 |
| 完整自動測試 | 153/153 PASS，TypeScript與Vite production build PASS，git diff --check無空白錯誤，既有CRLF與chunk-size advisory保留。 |
| Release | 2026-11-07 22:25:55 +08，Added8、Updated1、Skipped21，指定Release目錄增量發佈成功。 |
| Chrome正式Release | 忽略的.local/camera-interactions-smoke.mjs與camera-scene-smoke.mjs各exit0，Needle及legacy均PASS。涵蓋第三人稱/魚眼觀看、中鍵、F1、Y、wheel門檻與跑停還原、失焦/恢復、Front跑動及inspection跨城市/洞穴清理後重啟奔跑。兩路徑getError=0，無Runtime/WebGL錯誤。 |

瀏覽器使用headless Chrome／SwiftShader與合成事件。未驗證無限事件排列、真實滑鼠手感、實機GPU/手機/讀屏、所有空間真實場景或長時間效能。矩陣檢查狀態及姿態有效性，不代表每種遮擋的像素結果已人工驗收。半開放、半封閉、過渡區、水下僅驗證契約fixture。Rollback僅撤回本輪政策、clear/focus/F1修正、接線與測試／文件差異，保留既有dirty。

Token用量：無法取得精確值，缺少可取得的官方階段起始與結束基準。索引採SocratiCode增量更新並查status，最終範圍與完成時間以本chat工具結果為準。

## 1Y-10 Pointer Lock／四靈敏度與Profiles（2026-11-09）
控制task11.1／11.2完成並依授權inline審閱通過，無獨立委派。四倍率0.1–5即時套用，鎖定相對位移連續轉向；未鎖定保留預設180度分段上限。Y／Stop、Esc／失焦／hidden、模式與場景、manual接管、pending晚到與dispose清理測試涵蓋。與全部panel profiles整合，具體fresh tests／Release／browser證據、原生headless拒絕及人工限制見[本輪驗證](../panel-settings-profiles/validation.md)。全套175pass；未commit／push，既有手機／GPU人工驗收不變。Token用量無法取得精確值，缺少可取得官方起訖基準。
