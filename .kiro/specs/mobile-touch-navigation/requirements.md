# Requirements Document

## Project Description (Input)
iPhone Safari／Chrome／Edge 使用者目前須捲動至側欄才可操作方向與 Run／Jump／Stop，無法同時看見場景。使用者要求將控制放在場景鄰近下方，並能輕點路面讓人物自動跑到目的地。2026-10-26 使用者核准 1J-0 七項規劃；包含有效地面拾取、靜態避障、抵達停止、取消、魚眼與手機尺寸驗證，不包含巡迴／NPC／NavMesh，不新增第七里程碑。

## Introduction
讓手機使用者看著場景完成移動操作，並以單次輕點指定跑步目的地。

## Boundary Context
包含既有城市靜態障礙的單次目的地導航、各鏡頭地面點選及手機控制布局。巡迴、持久路徑、NPC、NavMesh、新資產與第三方依賴不在範圍。原六里程碑及人工環境驗收編號保留。

## Requirements

### Requirement 1: 場景鄰近控制
**Objective:** As a 手機使用者, I want 同時看見場景與控制, so that 我能觀察操作結果。
#### Acceptance Criteria
1. When 使用者以手機開啟頁面, the Viewer shall 在場景正下方顯示方向與 Run／Jump／Stop，無須捲動穿過角色／表情設定。
2. When 可視區域為直向、橫向或短高度, the Viewer shall 調整場景與控制高度，使場景與完整操作列能同時出現在可視區域，並避開安全區。
3. The Viewer shall 保留至少 44 CSS px 的操作按鈕、可讀標籤、鍵盤焦點及唯一一組控制。

### Requirement 2: 輕點與有效地面
**Objective:** As a 使用者, I want 指定我看見的地面, so that 人物跑到正確位置。
#### Acceptance Criteria
1. When 使用者在場景完成單指輕點或滑鼠主鍵點擊, the Viewer shall 以當時畫面對應的位置作為目的地。
2. If 操作包含拖曳、長按、雙指、取消或離開場景, then the Viewer shall 不將操作視為目的地點擊，並保留原有 Orbit／縮放操作。
3. If 點擊未命中可走路面／人行道、命中被物件遮擋的表面或超出可走範圍, then the Viewer shall 拒絕目的地並顯示可理解的提示。
4. While 魚眼鏡頭啟用, the Viewer shall 使點選位置與顯示的 160° 圓形畫面一致，並拒絕圓外點擊。

### Requirement 3: 跑步與避障
**Objective:** As a 使用者, I want 人物連續跑向目的地, so that 我能觀察動畫與路徑。
#### Acceptance Criteria
1. When 有效且可達的目的地被選定, the Viewer shall 以既有跑速與跑步動畫連續移動，不瞬移。
2. While 前往目的地, the Viewer shall 沿既有可走範圍避開靜態障礙，保持既有碰撞限制。
3. When 人物抵達目的地 0.08 公尺內, the Viewer shall 停止並顯示抵達狀態，不反覆超越目的地。
4. If 目的地不可達或人物無法繼續前進, then the Viewer shall 停止導航並顯示不可達提示，不無限貼牆跑步。
5. When 使用者選定另一目的地, the Viewer shall 用新目的地取代既有導航。

### Requirement 4: 操作優先與生命週期
**Objective:** As a 使用者, I want 隨時中止導航, so that 自動移動不干擾手動操作。
#### Acceptance Criteria
1. When 使用者操作手動方向、Jump 或 Stop, the Viewer shall 取消導航，並執行該手動操作。
2. When 視窗失焦、頁面隱藏、進入文字編輯、切換角色或圖形連線中斷, the Viewer shall 取消導航，恢復後不自動續跑。
3. The Viewer shall 在導航期間呈現目的地與狀態，並保留原有鏡頭、Follow、表情與資產載入功能。
4. When 應用程式釋放, the Viewer shall 清除本功能事件與視覺標記，不留下持續移動。

### Requirement 5: 驗證與交付界線
**Objective:** As a 維護者, I want 可重現的驗證, so that 本機證據與實機結果清楚區分。
#### Acceptance Criteria
1. The Viewer shall 通過導航／手勢／投影測試、既有回歸測試及正式建置，並能從正式產物啟動。
2. The delivery shall 分列本機手機尺寸驗證與 iPhone Safari／Chrome／Edge 實機待驗項，不以模擬事件代替實機通過。

## Requirements Review
2026-10-26 inline PASS：5 組、18 條驗收條件，numeric IDs／EARS／可測性與範圍檢查通過。依使用者 1J-0 範圍核准自動審閱通過，非逐份人工核准。
