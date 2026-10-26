# Requirements Document

## Project Description (Input)
使用本機城市街道人物檢視器的使用者目前只有靜態街景，尚無可操作人物。建立明確標示為原型的男／女／小孩程序化角色，分離 Character、InputManager 與 CharacterController，提供停止、走、跑、跳、鍵盤與可見控制、移動狀態、可走區／碰撞限制及基本 Follow／Orbit。依 docs/development-plan.md 里程碑 3 與 docs/stage-1.2.md 下一階段提案；詳細需求待審閱。前方／魚眼等延伸鏡頭、表情與最終 rigged GLB 由其他 spec 負責。共用 ViewerApp.ts、CityScene.ts、main.ts 必須依序修改，不可平行。

## Boundary Context
2026-10-25 使用者追加 First person view with proper FOV（使用者已更正術語），納入本里程碑；5.4–5.6 依授權自動審閱通過。
本里程碑一次顯示一位程序化原型，包含三種外觀、基本關節擺動、移動、跑跳、靜態碰撞與 Follow。既有街景、光影、三種靜態鏡頭保留。真實 rigged GLB、clip 動畫、魚眼、表情、NavMesh 與 NPC 不在範圍。

## Requirements

### Requirement 1: 可選人物原型
**Objective:** 使用者能切換並觀察不同人物與動作。
#### Acceptance Criteria
1. The Viewer shall 顯示一位人物並以可見文字標示程序化原型。（1.1）
2. When 使用者選擇男、女或小孩, the Viewer shall 更新外觀與選取狀態，保留位置與朝向且不累積人物。（1.2）
3. While 人物停止、行走、奔跑或跳躍, the Viewer shall 顯示對應狀態與可區分的中立／踏步擺臂／空中姿態。（1.3）

### Requirement 2: 移動與跑跳
**Objective:** 使用者能控制人物移動、跑跳與停止。
#### Acceptance Criteria
1. While 使用者按住 WASD 或方向鍵, the Viewer shall 沿固定地面方向移動，斜向與直向速度一致。（2.1）
2. While 有方向輸入且按住 Shift 或開啟 Run 控制, the Viewer shall 以高於步行的速度移動。（2.2）
3. When 方向輸入結束或按 Stop, the Viewer shall 停止水平移動並顯示 Idle；空中仍為 Jump 直到落地。（2.3）
4. When 已落地人物收到一次 Jump, the Viewer shall 起跳並受重力影響落回有效地面。（2.4）
5. While 人物在空中或跳躍鍵持續按住, the Viewer shall 不重複起跳，需放開並重新觸發。（2.5）
6. If 長時間暫停後恢復更新, the Viewer shall 限制本次位移而不因累積時間瞬間穿越街區。（2.6）

### Requirement 3: 可走區與碰撞
**Objective:** 人物不穿過場景設施或持續陷入地面。
#### Acceptance Criteria
1. While 人物移動或跳躍, the Viewer shall 將人物限制在道路與人行道內，防止穿過樹槽、長椅、路燈與街尾中央設施。（3.1）
2. When 撞到障礙或邊界, the Viewer shall 保持有效位置、允許未被阻擋方向的沿邊移動，並按實際位移決定 Idle／Walk／Run。（3.2）
3. When 人物跨越道路／人行道或落地, the Viewer shall 讓腳底對應當地地面高度。（3.3）

### Requirement 4: 可見控制與輸入安全
**Objective:** 滑鼠、觸控或鍵盤皆可操作，且不會卡鍵。
#### Acceptance Criteria
1. The Viewer shall 提供有名稱且可鍵盤操作的四方向、Run、Jump、Stop 與角色選擇控制。（4.1）
2. When 指標放開、取消或失去擷取, the Viewer shall 清除該指標方向輸入。（4.2）
3. When 視窗失焦或頁面隱藏, the Viewer shall 清除持續輸入，恢復後不自動走跑。（4.3）
4. While 使用者操作文字欄位、選單或其他表單控制, the Viewer shall 不把其鍵盤操作轉成人物移動或跳躍。（4.4）

### Requirement 5: 基本 Follow／Orbit
**Objective:** 使用者能跟隨人物或自由觀察。
#### Acceptance Criteria
1. When 使用者開啟 Follow, the Viewer shall 依人物位置及朝向更新鏡頭，讓移動人物保持可見。（5.1）
2. When 切回 Orbit 或選取既有靜態鏡頭, the Viewer shall 結束 Follow 並恢復自由觀察；Follow 期間不得與自由操作爭奪鏡頭。（5.2）
3. While 系統偏好減少動態效果, the Viewer shall 避免額外鏡頭插值且維持追蹤。（5.3）
4. When 使用者選擇 First person, the Viewer shall 將鏡頭置於所選角色眼位，以水平視線朝人物面向觀看，並隨移動、跳躍及角色身高切換即時更新。（5.4）
5. While First person 啟用, the Viewer shall 隱藏自身人物、使用適合近距離觀看的透視，且不接受 Orbit 操作或加入額外頭部晃動。（5.5）
6. When 從 First person 切回 Follow、Orbit 或靜態預設, the Viewer shall 恢復人物顯示及外部鏡頭透視設定，並同步介面選取狀態。（5.6）
7. When 使用者選擇 Third person, the Viewer shall 從人物後方跟隨並顯示人物，與 First person 互斥，且與 Follow 開關及鏡頭卡片選取狀態同步。（5.7）

### Requirement 6: 整合與生命週期
**Objective:** 維護者能驗證新功能並保留既有行為。
#### Acceptance Criteria
1. The Viewer shall 保留既有靜態鏡頭、日光／黃昏、陰影、resize、後端狀態及初始化失敗提示。（6.1）
2. When 檢視器釋放, the Viewer shall 停止更新、移除新增輸入事件並釋放人物繪圖資源。（6.2）
3. The Viewer shall 通過型別檢查、production build、動作邏輯測試及實際瀏覽器可操作狀態檢查。（6.3）

## 自動審閱
2026-10-24 inline PASS：22 個條件具數字 ID、EARS 與可觀察結果，覆蓋切換、輸入取消／編輯、跳躍、碰撞與相機互斥。具體速度、形狀與距離屬 design。依使用者授權自動審閱，非逐份人工核准。




