# Requirements Document

## Introduction
LATER-02：讓街景檢視者使用可重建的原創 Blender 街區建築、觀察 XYZ／速度及安全編輯角色位置與手動速度。來源為 initial-design-plan:79、81–84，延後候選自動完成授權見 continuation-checkpoint。

## Boundary Context
包含八棟本機原創建築資產與載入失敗回復、主角位置及手動行走速度控制。沿用程序道路、人行道、樹木、路燈、水景與既有碰撞地表；這是混合街景，不宣稱取得歷史第三方城市原檔。Inspector、場景切換、任意物件編輯、持久化與動態角色碰撞不在範圍。巡迴／點地速度保持各自設定。

## Requirements
### Requirement 1: 可重建街區
**Objective:** As a 檢視者, I want 本機街區資產, so that 不依賴外部下載也能觀察城市。
1.1 The Viewer shall 顯示八棟原創建築的街區，保留道路、人行道及既有互動。
1.2 When 建築載入失敗, the Viewer shall 保留程序建築、顯示失敗及可重試操作。
1.3 The project shall 提供原創來源、授權、可離線重建方法與輸出識別，明示混合場景範圍。

### Requirement 2: 安全 XYZ 編輯與貼地
**Objective:** As a 檢視者, I want 編輯主角位置, so that 能重現指定座標的觀察。
2.1 When 檢視角色狀態, the Viewer shall 顯示實際世界 XYZ 及實際速度而不覆蓋未提交的輸入草稿。
2.2 When 提交合法 XYZ, the Viewer shall 停止移動及導航並將角色移到指定座標，地面以上位置自然落地。
2.3 If 座標非有限數、超出可走範圍、位於膨脹障礙內、低於地表或高於地表10公尺, the Viewer shall 拒絕整筆位置修改並顯示原因。
2.4 When 選擇貼地, the Viewer shall 使用目的地的實際地表高度，之後沿用碰撞、跑跳及貼地規則。
2.5 While 圖形連線中斷、頁面隱藏或已釋放, the Viewer shall 拒絕位置提交。

### Requirement 3: 手動速度
**Objective:** As a 檢視者, I want 調整手動行走速度, so that 比較移動及動畫。
3.1 When 調整手動行走速度, the Viewer shall 接受0.5–4m/s，預設1.8m/s；Shift／Run維持4m/s，巡迴及點地保持其既有速度。
3.2 If 速度超出範圍或不是有限數, the Viewer shall 保留原設定並顯示錯誤。
3.3 While 使用XYZ或速度輸入, the Viewer shall 隔離鍵盤移動，且不自動恢復先前導航。
