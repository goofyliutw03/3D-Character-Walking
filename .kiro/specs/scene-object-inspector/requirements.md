# 需求：場景物件檢視器

## Project Description
使用者目前無法從 Control Panel 對照場景父子物件；新增物件樹、整數編號及世界標籤選擇／篩選，以觀察場景結構。已由使用者核准整體範圍，非第七里程碑。

## 1. 階層與編號
- 1.1 When 場景可用，the Inspector shall 呈現 Scene、Group、Mesh、Light、Bone 等實際父子結構，含未命名節點的類型名稱。
- 1.2 When 物件加入、移除或重新掛載，the Inspector shall 更新階層，讓同一物件在本頁存續期間保持唯一正整數編號，不重用已分配編號；重新載入不保證相同編號。
- 1.3 The Inspector shall 允許鍵盤操作展開／收合與個別 checkbox，保留未被移除節點的選擇及展開狀態。

## 2. 標籤控制
- 2.1 When 總開關啟用且物件 checkbox 勾選且符合篩選，the Inspector shall 在該物件世界原點顯示其編號；總開關預設關閉，物件預設勾選。
- 2.2 When checkbox、總開關或篩選改變，the Inspector shall 僅變更編號標籤，不改物件 visible、材質、動畫、光源或碰撞。
- 2.3 While 物件及所有祖先可見且世界原點在視野中，the Inspector shall 使用目前實際鏡頭投影編號，包括160度魚眼；視野外、隱藏物件或 context loss 時不顯示標籤。

## 3. 篩選與錯誤
- 3.1 When 套用名稱／階層路徑 regex pattern，the Inspector shall 以區分大小寫的正規表達式比對名稱或完整路徑，空白表示不限制。
- 3.2 When 套用編號範圍，the Inspector shall 支援含端點的正整數區間及單號，以逗號分隔並允許空白，例如10-30,45,70-80；空白表示不限制。
- 3.3 While 同時設定兩種篩選，the Inspector shall 只讓符合交集的物件顯示標籤；樹保留符合節點及必要祖先，祖先只因保留而出現不代表符合。
- 3.4 If regex 無效、區間格式錯誤／倒序／超出安全整數，the Inspector shall 顯示可存取錯誤提示，保留前一次有效篩選與選擇；無結果時顯示明確狀態。

## 4. 整合與生命週期
- 4.1 The Inspector shall 隨角色替換與粒子新增移除更新，標籤本身不成為場景物件；停止後回收事件與DOM，不持有已移除物件的強參照。
- 4.2 The Inspector shall 以可捲動的面板呈現完整結果，節流結構更新並避免每幀重建物件樹；驗證現有水景、夜景、相機與角色整合，保留原人工實機驗收範圍。

## 審閱
2026-10-31：numeric IDs／EARS／錯誤／邊界與已核准使用流程覆蓋通過。依使用者授權 inline 自動審閱通過，非使用者逐份人工審閱。
