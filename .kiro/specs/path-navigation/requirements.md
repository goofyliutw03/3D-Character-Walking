# Requirements Document

## Project Description
使用者目前只能手動或點地移動，希望沿多個 waypoint 自動巡迴，控制循環、暫停與速度。依來源 chat 明確授權連續完成延後候選功能；合理預設已在本 chat 說明。

## 1 路線與啟動
- 1.1 When 使用者提交 1–32 個有限 X/Z 座標並開始巡迴, the Viewer shall 依清單順序移動主角，沿用可走區與靜態避障。
- 1.2 If 清單格式錯誤、越界、位於障礙或路徑不通, the Viewer shall 顯示錯誤並停止自動移動，不瞬移或跳過障礙。
- 1.3 When 頁面初次開啟, the Viewer shall 保持巡迴關閉並提供可編輯的示範路線。

## 2 播放控制
- 2.1 When 主角抵達最後 waypoint, the Viewer shall 在循環開啟時返回第一點，否則停止並顯示完成。
- 2.2 When 使用者暫停, the Viewer shall 停止移動且保留目前目標；When 使用者繼續, the Viewer shall 從目前位置重新規劃至保留目標。
- 2.3 When 使用者設定 0.5–4 m/s 速度, the Viewer shall 對後續巡迴移動套用速度並保留碰撞及走跑動畫。
- 2.4 While 巡迴狀態改變, the Viewer shall 顯示狀態與 waypoint 進度，控制可用鍵盤操作。

## 3 接管與生命週期
- 3.1 When 使用者手動移動、跑跳、點地或 Stop, the Viewer shall 取消巡迴並由既有操作接管。
- 3.2 When 視窗失焦、隱藏、輸入編輯或圖形連線中斷, the Viewer shall 取消巡迴且不自動恢復。
- 3.3 While 巡迴執行, the Viewer shall 保留角色切換、鏡頭、Follow、魚眼及其他場景功能。

## 範圍
僅操作主角，路線僅留本頁。無路線儲存、3D waypoint 拖曳、NPC 改寫或新資產。自動巡迴不改既有交通的動態碰撞限制。

## Review
EARS、數字ID、可觀察條件、錯誤與邊界 inline review PASS。依本次使用者自動推進授權核准，非逐份人工核准。
