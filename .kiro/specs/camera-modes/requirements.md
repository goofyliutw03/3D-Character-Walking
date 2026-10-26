# Requirements Document

## Project Description (Input)
使用者需要從多種構圖觀察移動人物；目前僅有靜態 overview／street／overhead 預設。依 docs/development-plan.md 里程碑 4，加入前方、俯視、低街角與魚眼鏡頭、平滑切換及獨立 Follow 開關，保留自由 Orbit。依賴 character-movement 的角色 transform 與基本 Follow 邊界；不得將既有靜態預設視為人物跟隨功能已完成。不擁有角色移動物理或表情。共用 ViewerApp.ts、main.ts 必須依序修改，不可平行。

## Boundary Context
2026-10-25 使用者確認開始里程碑 4，同一里程碑內自動審閱。上游已完成 First person／Third person；本 spec 保留並整合，新增構圖及魚眼，不修改移動、角色外觀、表情或資產。

## Requirements
### Requirement 1: 人物構圖
**Objective:** 使用者能從前方、上方及低處觀察人物。
#### Acceptance Criteria
1. When 選擇 Front, the Viewer shall 從人物面向前方看向人物，清楚看見正面。（1.1）
2. When 選擇 Character overhead, the Viewer shall 從人物上方俯視，與既有全街區 From above 預設可區別。（1.2）
3. When 選擇 Low angle, the Viewer shall 從接近地面高度向上看人物。（1.3）
4. When 切換男／女／小孩或起跳, the Viewer shall 以所選人物當前位置及高度更新跟隨中的構圖。（1.4）

### Requirement 2: 跟隨與切換
**Objective:** 使用者能暫停追蹤並控制構圖。
#### Acceptance Criteria
1. When 使用者開關 Follow, the Viewer shall 保留所選構圖；關閉時停留當前觀察位置，開啟後重新追蹤人物。（2.1）
2. While 跟隨人物構圖, the Viewer shall 使自由 Orbit 不與追蹤爭奪鏡頭；暫停跟隨後允許自由觀察。（2.2）
3. When 切換外部鏡頭, the Viewer shall 平滑調整位置及注視點且避免穿過人物中心；偏好減少動態效果時直接到位。（2.3）
4. The Viewer shall 同步鏡頭卡片、Follow 開關、模式標籤及 footer；第一人稱保持固定眼位並明示其跟隨不可暫停。（2.4）
5. While 人物附近有場景遮擋, the Viewer shall 在外部跟隨鏡頭維持既有遮擋距離保護。（2.5）

### Requirement 3: 魚眼視野
**Objective:** 使用者能看到明確的魚眼投影。
#### Acceptance Criteria
1. When 選擇 Fisheye, the Viewer shall 呈現 160° 圓形等距魚眼視野，周邊直線有可觀察彎曲，不僅改變透視 FOV。（3.1）
2. When 容器尺寸改變, the Viewer shall 保持魚眼圓形比例，不隨寬／高畫面拉伸。（3.2）
3. When 離開 Fisheye, the Viewer shall 恢復對應普通透視視角且無殘留魚眼效果。（3.3）

### Requirement 4: 回歸與資源
**Objective:** 新鏡頭不破壞原本的操作。
#### Acceptance Criteria
1. The Viewer shall 保留第一人稱眼位／自身隱藏、第三人稱人物顯示、三種靜態預設、跑跳、光影及初始化提示。（4.1）
2. When 檢視器釋放, the Viewer shall 釋放新增 render target、shader 與全螢幕幾何資源。（4.2）
3. The Viewer shall 通過全套測試、production build 及實際魚眼與鏡頭切換瀏覽器驗證。（4.3）

## 自動審閱
inline PASS：15 個數字驗收條件具可觀察結果；魚眼角度與投影明確，區分世界俯視與人物俯視。First person 固定眼位是既有需求，跟隨暫停適用其他構圖，UI 明確解釋。依使用者授權自動審閱，非人工逐份核准。



