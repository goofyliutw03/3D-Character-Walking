# Requirements Document

## Project Description (Input)
城市街道與 water.html 的使用者目前只能看到連續瀑布薄片；希望以粒子增加落水滴及飛濺，實際相機靠近瀑布時有薄霧與少量鏡頭水滴，離開後殘滴緩緩下滑消失、霧氣淡出。

## Boundary Context
包含街道及獨立原型的瀑布落水／落點飛濺與鏡頭濕潤；沿用既有相機、角色、碰撞及水體。排除真流體、涉水、NPC、外部素材與新依賴。M6／SCENE-05 人工驗收維持。

## Requirements
### Requirement 1: 瀑布粒子
**Objective:** As a 觀察者, I want 落水滴與飛濺, so that 瀑布有立體流動感。
1. While 動態水景啟用, the 水景系統 shall 顯示向下落水滴與落點向外飛濺，保留原有瀑布及池面。
2. While 長時間運作或反覆切換品質, the 水景系統 shall 維持有界粒子數及資源，不持續累積。
3. When 切換 low／standard、暫停或關閉水景, the 水景系統 shall 同步調整粒子密度、凍結動畫或隱藏粒子，恢復時不補算背景時間。

### Requirement 2: 接近與離開鏡頭
**Objective:** As a 觀察者, I want 接近瀑布感受到薄霧與稀疏水滴, so that 場景仍清楚可操作。
1. When 實際相機接近可到達的噴濺區, the 鏡頭效果 shall 平滑增加薄霧及少量水滴，依噴濺方向與實體遮擋抑制隔牆觸發，與主角位置獨立。
2. When 相機離開噴濺區, the 鏡頭效果 shall 停止生成新水滴，殘滴向下滑動並於 2–4 秒淡出，霧氣約 2.5 秒消退。
3. When 反覆進出區域, the 鏡頭效果 shall 從現有強度連續過渡，且水滴數不超出上限。
4. The 鏡頭效果 shall 以約 3m 開始、1m 內較強及約 0.8 秒進入作為預設，並提供程式設定以便調整。

### Requirement 3: 入口、操作及相容
**Objective:** As a 使用者, I want 可控制且一致的水景, so that 不影響既有操作。
1. Where 街道或 water.html 入口, the 水景系統 shall 提供共用效果與鏡頭濕潤開關，關閉立即清除鏡頭效果，暫停凍結；重新啟用不帶回舊水滴。
2. While reduced-motion 啟用, the 鏡頭效果 shall 保留靜態薄霧回饋並停用滑動水滴。
3. While 普通／魚眼、First person／Orbit、Xray／透明／線框或 resize／DPR 改變, the 效果系統 shall 保持對齊、保留既有模式且不覆蓋魚眼外黑邊，不攔截 UI 或移動操作。
4. When 背景返回、context loss 或 dispose, the 效果系統 shall 避免時間補算或殘留資源，沿用各入口既有故障處理。

### Requirement 4: 驗證與交付
**Objective:** As a 維護者, I want 可重現驗證, so that 能判斷新增效果與成本。
1. The 專案 shall 提供接近／離開／遮擋／重複進出、生命週期與兩入口的自動測試及本機 production GPU 證據。
2. The 專案 shall 記錄固定條件下新增效果開／關的 low／standard 效能樣本及資源數，明示實機與跨 GPU 限制。
3. When 驗證通過, the 專案 shall 依既有流程發佈 Release、更新索引並確認完成，記錄實際可取得的 token 統計與缺漏。

## Requirements Review Gate
PASS inline：14 個條件，數字編號／EARS、可驗證性、邊界及近遠核心流程均覆蓋。2026-10-31 依使用者整體方案授權自動審閱通過，非逐份人工核准。
