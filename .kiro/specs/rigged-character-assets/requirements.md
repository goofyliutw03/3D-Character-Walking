# Requirements Document

## Introduction
里程碑6整合真正skinned GLB與骨架動畫，保留既有運動、相機、表情與可存取控制。使用者已確認5並要求繼續，2026-10-26允許下載、優先找專用資產，無合適者可製作明確標示的骨架衍生角色／動畫，允許使用現有Blender5.2，不安裝。

## Boundary Context
- In scope：免費授權資產、男女與小孩、骨架Idle／Walk／Run／Jump、真實載入／錯誤／重試、比例與eye／head anchor、釋放、效能／本機說明。
- Out of scope：臉部morph、多人、NavMesh、WebGPU、模型或工具安裝、外部付費服務；既有Front遮擋問題另列上游，不藉此擴張。
- Adjacent expectations：MotionSnapshot為位置／動作權威；CameraController為相機權威；LoadingFeedback呈現真實狀態。允許程序化fallback但須明確標示，不能冒稱GLB完成。

## Requirements
### Requirement 1: 授權與可辨識資產
**Objective:** As a 使用者, I want 來源與修改清楚, so that 能合法重建與辨識角色。
#### Acceptance Criteria
1. The Viewer shall 為每個納入資產記錄作者、來源、授權、修改及SHA256。
2. The Viewer shall 提供男、女與頭身比例不同的小孩骨架角色，並明示衍生角色／專案製作動畫。
3. The Viewer shall 在本機提供資產，正常操作不依賴遠端模型服務。

### Requirement 2: 真實載入與生命週期
**Objective:** As a 使用者, I want 得知載入結果, so that 可處理資產失敗。
#### Acceptance Criteria
1. When 使用者選取角色，the Viewer shall 呈現真實載入中及最終就緒狀態，保留運動位置與表達內容。
2. If 載入失敗、無效骨架或缺少必要動畫，the Viewer shall 呈現錯誤與重試控制，保留可操作且明確標示的程序化fallback。
3. When 快速切換角色或離開頁面，the Viewer shall 僅採用最新選擇，忽略並釋放過時結果。
4. When 切換或dispose，the Viewer shall 釋放持有模型、材質、紋理、動畫綁定及事件，避免累積多個角色。

### Requirement 3: 骨架動作
**Objective:** As a 使用者, I want 真實骨架動作配合移動, so that 人物行為連續且不漂移。
#### Acceptance Criteria
1. While 動作為停止、走或跑，the Viewer shall 播放對應循環骨架動畫並平滑轉場。
2. While 角色起跳至落地，the Viewer shall 播放可辨識的骨架Jump，不以Idle替代，落地恢復當前動作。
3. The Viewer shall 只由運動控制器改變世界位置，動畫不產生額外水平或垂直root displacement。
4. When 重複同一動作或連續切換，the Viewer shall 不反覆重置同一動畫或累積持續有權重的過時動作。

### Requirement 4: 外觀與既有功能
**Objective:** As a 使用者, I want 新角色與鏡頭泡泡相容, so that 能繼續原操作。
#### Acceptance Criteria
1. The Viewer shall 將角色正規化為公尺、腳底對齊地面、面向既有heading方向，並提供合理的角色高度與眼位。
2. While 切換角色、移動、跳躍或不同鏡頭，the Viewer shall 維持頭頂泡泡定位及第一人稱自身隱藏，內容不重置。
3. The Viewer shall 保留既有碰撞、鍵盤／可見控制、光影、Follow與魚眼行為。
4. While 使用390×844或桌面視窗，the Viewer shall 保持可讀載入狀態、重試與角色資訊而無水平溢出。

### Requirement 5: 重建與驗證
**Objective:** As a 維護者, I want 可重建及量測, so that 能評估交付品質。
#### Acceptance Criteria
1. The project shall 保存可重建衍生GLB的腳本、操作方式與必要來源說明，不要求安裝額外付費工具。
2. The project shall 驗證三個角色的skinning、四種動畫、轉場與錯誤／重試流程，區分自動測試及實際畫面證據。
3. The project shall 記錄測試環境、資產大小、draw calls／triangles及本機效能樣本，不將單機結果當跨裝置承諾。
4. The project shall 通過既有全套測試及production build，新增資產單檔不超過2MiB且每次只顯示一個角色；保留未做的跨GPU／實機驗收。
