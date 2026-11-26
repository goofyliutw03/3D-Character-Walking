# Requirements Document

## Project Description (Input)
使用者操作城市角色時，手動移動、導航、巡迴及 XYZ 編輯目前分別判定可走區域。依已確認的 scene-runtime-collision-mask-spec v0.1，第一批建立共用查詢／活動範圍契約及城市相容適配，統一通行判定並保留既有城市操作。

## Boundary Context
範圍包含城市地面角色的通行、目的地及編輯位置限制；洞穴／地表維持既有相容行為。不加入飛行、游泳、零重力、三維洞頂求解、物理引擎、固定步進改造或 debug UI。完整 v0.1 是分批方向，本次不是所有場景同時交付。

## Requirements
### Requirement 1: 權威查詢與能力
1.1 When 呼叫通行、掃掠、表面或區域查詢, the World Query shall 回傳一致座標、公尺單位及明確結果。
1.2 If 資料缺失、非有限、角色尺寸無效或查詢不支援, the World Query shall 明確拒絕，不把失敗視為可通行。
1.3 Where 城市相容適配啟用, the World Query shall 明示僅支援地面高度與沿 Y 延伸的 XZ 代理，不宣稱洞頂／多層或完整三維膠囊能力。

### Requirement 2: 活動範圍
2.1 When 角色沿外圈或禁入區移動, the viewer shall 納入角色半徑，阻止穿越且保留可行切向移動。
2.2 If 允許區缺失或角色完整體積不能容納, the viewer shall 拒絕該位置。
2.3 When 角色正好接觸邊界, the viewer shall 以明列容差一致處理導航、移動與位置編輯。

### Requirement 3: 城市整合
3.1 When 使用鍵盤、自動跑步、導航、巡迴或位置編輯, the viewer shall 透過共用查詢執行限制；導航仍在執行時逐步驗證移動。
3.2 When 使用者步跑跳、貼地或切換場景, the viewer shall 保留現有速度、跳躍與城市代理阻擋行為；NPC／車流停讓及相機遮擋分類不變。
3.3 If 非法輸入、無效表面或編輯位置被拒絕, the viewer shall 保留最後有限有效角色狀態。

### Requirement 4: 可驗證交付
4.1 When 完成本批, the project shall 記錄正常／非法資料、高速掃掠、邊界滑動、不同尺寸及四種操作的一致性證據。
4.2 When 完成本批, the project shall 記錄回歸、型別、production 建置／啟動、Release 與索引結果及未驗事項，不以本機結果推定手機或其他場景驗收。

## Review
2026-11-10 requirements gate PASS（inline，依使用者本批授權自動審閱）。四區十一條條件均可驗證；EARS、錯誤路徑、分批範圍與城市回歸明確。非逐份人工核准，未委派。
