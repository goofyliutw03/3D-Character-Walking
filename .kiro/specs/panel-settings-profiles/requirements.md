# 需求

## Project Description
桌面／手機使用者需要在 reload 後保留全部面板設定。依 2026-11-09 [1Y-10] 完整授權，不新增里程碑，不含角色即時位置、奔跑、按鍵或模擬進度。

## 1. 完整設定
1.1 The system shall 保存場景、角色、表情文字、鏡頭預設／Follow／遮擋／穿透、四靈敏度、粒子套用值及草稿、交通、水景、太陽／光照／路燈、封閉光源／頭燈、巡迴／位置草稿、貼地／速度、物件標籤／篩選與面板 layout。
1.2 When 套用 Profile 或 Reset, the system shall 同步 runtime 與 UI，停止移動且不恢復暫態。
1.3 When 切換場景或 reload, the system shall 保留各場景設定；隨機生成光源不算使用者修改。

## 2. Profiles 與 temp
2.1 The system shall 提供 Panel.Reset、profile combobox、Save，單一 JSON 保留最新十個 profiles 加固定 temp。
2.2 When Save, the system shall 以場景名加00至99循環命名；依建立時間淘汰最舊，同名循環取代舊同名。
2.3 When 選另一 profile, the system shall 先存當前至 temp；先前載入且未修改的 profile 不覆寫 temp。
2.4 When 設定變動或 Reset, the system shall 更新 temp；Reset 套預設，reload 優先 temp。

## 3. 儲存
3.1 The system shall 優先 OPFS panel-profiles.json，由 browser 管理實體路徑；不支援／不可用以 IndexedDB 保存相同 JSON 並顯示方式。
3.2 If 損壞、版本不符或拒寫, the system shall 顯示未保存，保留記憶體設定，讀取損壞時不自動覆寫，允許明確 Save／Reset 重試。
3.3 While 初始化、連續寫入或選擇, the system shall 序列化操作，避免舊資料覆蓋新設定；初始化前禁用 profile 操作。
3.4 The system shall 在手機 LAN HTTP 嘗試 IndexedDB，皆失敗時顯示僅本頁；不承諾跨 origin／port／browser 共用或永久備份。
