# Requirements Document

## Project Description (Input)
城市街道人物檢視器的使用者目前需捲動直列左側控制尋找功能。使用者核准以階層式功能樹整理既有角色、表情、粒子、鏡頭與場景功能，提供整體面板及各節點展開／收合，並在本次加入拖曳調整寬度；保留下方移動控制。

## Introduction
讓使用者從可展開的功能分類找到既有設定，同時能收合面板或調整寬度以觀看場景。

## Boundary Context
- In scope：既有設定的階層整理、面板與節點展開／收合、桌面拖曳寬度及鍵盤替代操作。
- Out of scope：新增場景功能、角色／粒子／鏡頭行為變更、跨重新載入的偏好儲存。
- Adjacent expectations：下方移動控制保留；沿用既有載入、錯誤與設定契約；M6／SCENE-05人工驗收不變。

## Requirements

### Requirement 1: 功能分類與狀態
**Objective:** As a 使用者, I want 依功能階層尋找設定, so that 不必捲動全部控制。
#### Acceptance Criteria
1. The control panel shall 顯示角色、表情、粒子互動、鏡頭、場景顯示五個可展開分類，並依既有功能提供子群組。
2. When 使用者切換任一節點, the control panel shall 獨立展開或收合該節點，保留其他節點狀態。
3. When 節點收合再展開, the control panel shall 保留既有設定、輸入文字與即時功能狀態。

### Requirement 2: 整體面板
**Objective:** As a 使用者, I want 收合面板, so that 場景有更多空間。
#### Acceptance Criteria
1. When 使用者啟動面板切換, the control panel shall 收合或展開功能內容，且始終提供可辨識的展開按鈕。
2. While 面板收合, the control panel shall 將隱藏內容排除於鍵盤焦點順序，且不隱藏場景下方移動與粒子操作。
3. When 面板重新展開, the control panel shall 還原本頁面已選寬度與節點狀態。

### Requirement 3: 調整寬度
**Objective:** As a 桌面使用者, I want 拖曳面板邊界, so that 在設定閱讀與場景空間間調整。
#### Acceptance Criteria
1. While 桌面面板展開, when 使用者拖曳邊界, the control panel shall 即時調整寬度且保留可用場景空間。
2. If 拖曳超出邊界或視窗縮小, then the control panel shall 限制有效寬度，避免面板或場景溢出可用版面。
3. When 拖曳結束或被取消, the control panel shall 結束拖曳狀態且允許繼續操作場景與控制。
4. When 調整把手有焦點且使用者按左右鍵或Home／End, the control panel shall 提供縮窄、加寬、最小及最大寬度操作，並呈現目前可存取寬度資訊。

### Requirement 4: 相容與可及性
**Objective:** As a 鍵盤或窄版使用者, I want 控制保持可操作, so that 調整面板不阻礙使用。
#### Acceptance Criteria
1. When 使用者以鍵盤操作分類, the control panel shall 提供可辨識標題、展開狀態與可見焦點，且讓隱藏子項離開Tab順序。
2. While 窄版或觸控排列啟用, the control panel shall 在場景及移動區下方呈現全寬面板，保留展開功能並隱藏寬度把手。
3. When 面板尺寸改變, the viewer shall 依實際場景容器維持正確畫面比例。
4. The viewer shall 保留既有角色、表情、粒子、鏡頭、光照及陰影控制與載入失敗回復行為。

## Requirements Review
2026-10-30：inline PASS。14項條件採數字ID及EARS、涵蓋正常／收合／取消／窄版／焦點邊界，未加入資產或場景功能。依使用者本次範圍授權自動審閱通過，非逐份人工核准。
