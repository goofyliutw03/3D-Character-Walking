# 有界飛行需求

接續1Y-14使用者「OK please go on」與來源交接授權。非第七里程碑，水域、太空、全翻滾、大氣散射、任意網格物理與外部資產不在範圍。

## Requirements
### 1. 場景與共用能力
1.1 When 使用者選取Flight, the Viewer shall 從正常Environment入口切入有界空中驗證場景，並可返回城市、地表與洞穴。
1.2 While 飛行, the Viewer shall 重用三角色、表情、粒子、相機／魚眼／X-ray、Inspector與Needle／legacy單一更新入口；姿態維持地平線，明示既有Jump動畫fallback。
1.3 The Flight scene shall 使用原創程序天空Shader、非實體網格雲與可見同源盒障礙／著陸平台，無資產下載。
### 2. 權威移動與輸入
2.1 When 接收WASD／方向鍵、升降與加速輸入, the Flight strategy shall 正規化三維方向、積分加速／阻力並限制最高速度，放開減速、Stop立即煞停。
2.2 The Flight strategy shall 使用1/60秒固定步進、每幀最多四步並記錄丟棄時間；失焦、背景、context中斷清空暫態，既有ground步進不變。
2.3 While flight能力有效, the Viewer shall 提供桌面及觸控升降與明確起飛／著陸控制，拒絕點地導航、巡迴、自動奔跑；三維速度及位移由唯一策略提交。
### 3. 碰撞、範圍與著陸
3.1 When 最高速度／低幀率移動, the Flight strategy shall 以完整直立膠囊連續掃掠有限盒、禁入區及XYZ邊界，四接觸滑動並清除向內速度。
3.2 While 角色距外圈或禁入區不足3m, the Viewer shall 顯示警戒並減少朝邊界推進；硬邊界仍連續阻擋且保留切向移動。
3.3 When 明確著陸, the Viewer shall 僅接受下方2m內、坡度≤45°、全膠囊淨空及掃掠合法的支撐面，成功才提交ground；再次起飛需明確切換。
3.4 If 資料、尺寸、出生點、傳送或模式切換無效, the Viewer shall 原子拒絕，保留最後有效狀態。
### 4. 整合與驗證
4.1 The Viewer shall 保持Profiles v1向後相容、保存flight場景設定，載入回安全出生點而不保存速度／瞬時模式。
4.2 The Viewer shall 驗證三尺寸、高速、低幀、上下界、禁入區、著陸、非法資料、切換與context恢復，記錄兩runtime正式入口證據及真機／效能限制。

## Requirements gate
inline PASS，12條件含主流程／失敗／範圍；依使用者授權自動審閱，非逐份人工核准。
