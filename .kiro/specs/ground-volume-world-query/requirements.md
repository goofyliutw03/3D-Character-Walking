# Requirements Document

## Project Description (Input)
地表與洞穴使用者目前仍受平面障礙限制，跳躍不檢查洞頂且目的地沒有高度。本批接續已確認 World Query 方向，提供地表坡面一致性、有限三維岩體、角色淨空及上下層識別。

## Boundary Context
地表保持原量化表面；洞穴用可見階梯岩台驗證上下層與頭部空間。保留城市、相機、Profiles、導航、巡迴、編輯及兩種 runtime。飛行、水域、太空、任意網格剛體、動態地形、通用跨樓層尋路及新增 UI 不在本批。

## Requirements
### Requirement 1: 地表與查詢一致性
1.1 While 角色在地表步跑或落地, the Viewer shall 保持既有量化三角面腳底誤差低於 1mm，品質切換不改通行高度。
1.2 When 查詢地表坡面、有限岩體或上下層表面, the World Query shall 提供有限三維位置、法線及穩定表面識別，不將同 XZ 的不同高度合併。
1.3 If 資料、尺寸或查詢輸入無效, the Viewer shall 拒絕提交並保留最後有效角色狀態。
### Requirement 2: 膠囊與淨空
2.1 When 角色步跑、跳躍或大位移接觸有限岩體、洞頂或邊界, the Viewer shall 阻止完整角色體積穿越並允許沿接觸面滑動。
2.2 When 角色接近階梯或坡面, the Viewer shall 僅在步高、坡角及頭部淨空允許時上行；離開高台時落下而非吸附至另一層。
2.3 When 使用者切換男、女或小孩, the Viewer shall 依角色高度驗證淨空；空間不足時保留原角色與位置。
### Requirement 3: 操作整合
3.1 When 使用者點地導航或設定目的地, the Viewer shall 保留選中表面高度，拒絕無合法地面連線的跨層路徑。
3.2 When 手動、自動跑步、導航、巡迴或 XYZ 編輯觸及同一邊界, the Viewer shall 使用一致範圍與淨空判定。
3.3 When 在城市、地表與洞穴往返, the Viewer shall 保留既有相機、Profiles、光照、粒子及渲染操作並重設移動暫態。
### Requirement 4: 驗證
4.1 The Viewer shall 以自動測試覆蓋接觸容差、高速、斜向、低幀率、三角色尺寸、坡面及多層／洞頂異常路徑。
4.2 The Viewer shall 通過 Needle 與 legacy 正式建置頁面之操作驗證，記錄可重現結果及真機／效能未驗範圍。

## Review
Requirements gate inline PASS：11 條 EARS、數字 ID、主流程與錯誤／範圍完整；依 1Y-14 接續授權自動審閱，非使用者逐份人工核准。
