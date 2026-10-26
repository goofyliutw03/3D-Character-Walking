# Requirements Document

## Introduction
里程碑 5：讓使用者在既有城市人物檢視器表達情緒、編輯對話並使用可存取控制。2026-10-26 使用者核准開始，採同一里程碑內自動審閱，commit 另行核准。

## Boundary Context
- In scope：目前所選程序化角色的情緒圖示、對話泡泡、控制、載入狀態呈現與無障礙改善。
- Out of scope：臉部骨架／morph 動畫、GLB loader、資產下載、多人對話、持久化、WebGPU。
- Adjacent expectations：移動與鏡頭沿用既有權威；真實載入及最終載入驗收留里程碑 6。本階段以契約測試驗證回饋狀態，不提供假載入百分比。

## Requirements

### Requirement 1: 情緒表達
**Objective:** As a 使用者, I want 選取情緒圖示, so that 人物能表達情緒。
#### Acceptance Criteria
1. When 使用者選取無、開心、難過、生氣或驚訝，the Viewer shall 同步選取狀態及人物上方對應圖示。
2. When 使用者切換男、女或小孩，the Viewer shall 保留情緒與對話，並更新人物上方位置。
3. The Viewer shall 預設無情緒及空白對話，僅在本次頁面生命週期保留內容。

### Requirement 2: 可編輯對話
**Objective:** As a 使用者, I want 編輯與清除對話, so that 人物能顯示我的文字。
#### Acceptance Criteria
1. When 使用者編輯對話，the Viewer shall 更新泡泡並顯示字數，最多容納 160 個 Unicode code points。
2. When 對話為空白或使用者清除對話，the Viewer shall 隱藏文字泡泡且保留所選情緒。
3. The Viewer shall 將對話作為純文字呈現，保留換行、折行長字串，不將輸入解讀成標記或程式。
4. While 使用者編輯對話或組合輸入文字，the Viewer shall 不因 WASD、方向鍵、Shift、空白鍵或既有鎖定移動意圖而驅動人物，並保留文字編輯按鍵行為。

### Requirement 3: 人物上方定位
**Objective:** As a 使用者, I want 表達內容跟著人物, so that 能辨識內容屬於誰。
#### Acceptance Criteria
1. While 人物移動、跳躍、切換高度、鏡頭轉場或尺寸改變，the Viewer shall 使圖示與泡泡對齊人物頭頂上方。
2. While 使用普通視角或 160°圓形魚眼，the Viewer shall 依實際畫面投影定位內容，避免位置錯置或圓形拉伸。
3. If anchor 位於鏡頭背後、近遠裁切之外、畫面之外或魚眼圓外，the Viewer shall 隱藏人物 overlay。
4. While 使用第一人稱，the Viewer shall 隱藏自身 overlay，保留側欄編輯控制及內容。
5. The Viewer shall 使 overlay 不攔截場景拖曳、縮放及點擊；此階段不承諾建築物遮擋判定。

### Requirement 4: 載入回饋
**Objective:** As a 使用者, I want 辨識載入狀態, so that 知道正在等待什麼或如何處理失敗。
#### Acceptance Criteria
1. While 場景初始化或收到資產載入中狀態，the Viewer shall 顯示明確文字回饋並對輔助技術標示忙碌。
2. When 場景或資產就緒，the Viewer shall 清除忙碌狀態，目前版本明示程序化原型及正式角色資產尚未整合。
3. If 初始化失敗或收到資產錯誤狀態，the Viewer shall 呈現可讀錯誤與對應復原說明，不顯示成功或捏造進度。

### Requirement 5: 可存取控制與回歸
**Objective:** As a 鍵盤或輔助技術使用者, I want 操作所有新增功能, so that 不需僅依賴滑鼠或圖示。
#### Acceptance Criteria
1. The Viewer shall 為情緒、文字與清除控制提供文字標籤、鍵盤操作及可見焦點，情緒不僅以顏色區分。
2. When 情緒、對話或載入狀態改變，the Viewer shall 提供可讀狀態，避免依每幀位置重複播報或在組合輸入中播報未完成內容。
3. While 使用 390×844 或桌面視窗，the Viewer shall 使控制、文字及泡泡無水平頁面溢出，泡泡文字不超過場景容器。
4. While 使用偏好減少動態效果，the Viewer shall 不新增表情／泡泡動畫，保留既有鏡頭偏好行為。
5. The Viewer shall 保留角色、移動跑跳、Follow、所有鏡頭、光影及既有生命週期清理。
