# Requirements Document

## Project Description (Input)
使用者需要觀察城市中的自主活動；目前只有操作主角及獨立粒子Target，街道沒有交通模擬。本次明確授權LATER-03：NavMesh、NPC AI、車輛、紅綠燈行為、LOD、多角色模擬。

## Introduction
在現有程序街道觀察有限數量的自主行人與雙向車輛，並可控制及檢查交通狀態。數量、速度、週期為本次可逆設計預設，不構成真實交通工程模型。

## Boundary Context
- In scope：凸多邊形可走表面導航、NPC目的地／避障／等燈、車距／停等、可視號誌、距離LOD、同時多角色及控制。
- Out of scope：WebGPU、外部資產／依賴、Blender城市、主角自動巡迴、戰鬥、物理車禍、真實交通法規、任意GLB自動烘焙NavMesh。
- Adjacent expectations：主角既有導航、鏡頭、Caster／Target及陰影控制維持；舊人工驗收不由本功能概括通過。

## Requirements

### Requirement 1: 可走表面與路徑
**Objective:** As a 觀察者, I want 行人沿可走表面移動, so that 不穿越障礙與任意車道。
#### Acceptance Criteria
1.1 The simulation shall 提供由人行道與斑馬線表面構成的凸多邊形NavMesh，扣除角色半徑擴張的靜態障礙，並以共享邊入口連通。
1.2 When 請求合法起終點, the simulation shall 搜尋連通表面路徑；If 起終點非法或不連通, the simulation shall 回傳無路徑，且不傳送角色。

### Requirement 2: NPC AI與多角色
**Objective:** As a 觀察者, I want 多名自主行人, so that 街道有可重現的活動。
#### Acceptance Criteria
2.1 When 啟用模擬, the simulation shall 同時顯示獨立男／女／小孩程序角色，沿路徑前往目的地，抵達後短暫停留再選下一目的地。
2.2 While 遇到其他行人或主角／Target, the simulation shall 避讓停等，且不替使用者移動主角或Target。
2.3 While 過街不允許新進入, the simulation shall 讓尚未進入的NPC在人行道等候；已進入者繼續清空路口。

### Requirement 3: 車輛與號誌
**Objective:** As a 觀察者, I want 雙向車流遵循號誌, so that 可以觀察行人與車流協調。
#### Acceptance Criteria
3.1 The simulation shall 顯示雙向程序車輛、停止線及車輛紅黃綠／行人允許與等候燈。
3.2 While 車輛未獲放行或前方路口仍有行人, the simulation shall 在停止線前停等；已進入車輛須先清空，再開放行人。
3.3 While 前方有同車道車輛或主角／Target, the simulation shall 保留車距或停等；路段端點回收重用車輛，且不在占用位置重生。

### Requirement 4: 控制與生命週期
**Objective:** As a 使用者, I want 有界且可停下的模擬, so that 可以依裝置負擔調整。
#### Acceptance Criteria
4.1 The simulation shall 預設關閉，提供啟用、暫停、重置、NPC數量0–24、車輛數量0–8及LOD開關，顯示號誌與活動數量。
4.2 When 暫停或頁面隱藏／context遺失, the simulation shall 凍結模擬時間；When 重置, the simulation shall 以目前數量回復相同初始狀態。
4.3 If 設定非法, the simulation shall 保留前一合法設定；When 關閉／釋放, the simulation shall 隱藏／釋放自己持有的資源，且不處置主角與Target。

### Requirement 5: LOD與驗證
**Objective:** As a 使用者, I want 遠處角色減少繪製成本, so that 多角色有可控資源上限。
#### Acceptance Criteria
5.1 While LOD啟用且角色／車輛遠離鏡頭, the simulation shall 使用較少幾何與draw calls的遠距模型，並以遲滯避免臨界反覆切換；邏輯與過街安全不得因LOD改變。
5.2 The simulation shall 在有界時間步內更新最多24行人與8車輛，提供可重現路徑、號誌互斥、清空、車距、暫停／重置與資源釋放測試；裝置FPS驗收仍獨立保留。
