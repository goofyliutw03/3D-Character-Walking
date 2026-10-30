# Requirements Document

## Project Description
使用者目前只能觀察一名可控制角色，需要在既有城市中以主玩家 Caster 向獨立站立的 Target 發射可設定粒子，觀察飛行與命中回饋。使用者於前 chat 確認 Plan v02，授權本 chat 依序規劃、實作、inline 審閱與驗證。

## 範圍
追加一名 Target 與單一效果，不包含 NPC AI、NavMesh、傷害、生命值或戰鬥；不變更既有 M6／SCENE-05 人工驗收。既有授權本機角色資產可重用，不新增資產或依賴。

## Requirements

### 1. 雙角色
1.1 The Viewer shall 同時呈現 Caster 與一名可識別的獨立 Target，以及發射與接收位置標示。
1.2 While Caster 移動、跳躍或切換角色, the Viewer shall 保持 Target 的位置與站立狀態獨立。
1.3 When 使用者重設 Target, the Viewer shall 將其放回預設位置並清除現有發射效果。
1.4 If Target 資產載入失敗, the Viewer shall 顯示明確 fallback 狀態與重試控制，不影響 Caster 操作。

### 2. 發射與命中
2.1 When 使用者啟動發射, the Viewer shall 從 Caster 發射位置朝 Target 當下接收位置直線飛行，不追蹤後續位置。
2.2 When 飛行效果與 Target 碰撞體相交, the Viewer shall 每次發射最多計算一次命中並顯示短暫回饋。
2.3 If 效果未命中且到達生命週期, the Viewer shall 清除該效果並呈現逾時狀態。
2.4 When 使用者重複或連續發射, the Viewer shall 支援多個獨立效果且不超過設定上限。

### 3. 設定與既有互動
3.1 When 使用者修改顏色、速度、大小、生命週期與數量上限, the Viewer shall 將合法設定套用至後續發射並拒絕非法數值。
3.2 While 粒子互動啟用, the Viewer shall 保留城市、移動、導航、角色切換、表情、相機與遮擋控制。
3.3 When 使用者以鍵盤或觸控操作發射控制, the Viewer shall 提供明確狀態且不觸發地面導航或移動快捷鍵衝突。
3.4 When Viewer 關閉或重設效果, the Viewer shall 停止相應效果並釋放其資源，不影響另一角色資源。

## Requirements Review Gate
2026-10-30 inline PASS：12 條件具數字 ID、EARS、可驗證行為；涵蓋成功／失敗／逾時／上限／重試、既有互動及排除範圍。依使用者授權自動審閱通過，非使用者逐份人工核准。
