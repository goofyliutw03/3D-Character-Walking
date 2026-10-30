# Requirements Document

## Project Description (Input)
使用者觀察控制主角時，需要看清被街景遮住的身體。新增第4個 Camera block mode，以半透明反相／difference 類似 XOR 效果凸顯被遮住部分。2026-10-31 核准本計畫及排除水、粒子、原始透明／半透明材質的新增條件。

## Requirements

### Requirement 1: 遮擋角色顯示
1. When 使用者選擇 X-ray character, the Viewer shall 保留鏡頭構圖及環境外觀，只將操作主角被不透明環境遮住的部分以50%混合高對比反相效果顯示。（1.1）
2. While 主角部分／完全／沒有被遮擋, the Viewer shall 分別顯示局部／完整／沒有幽靈輪廓，可見部分保持正常。（1.2）
3. While 主角有身體自重疊或骨架動畫, the Viewer shall 不把角色自身當遮蔽物，效果與當前姿勢一致，適用男／女／小孩及程序fallback。（1.3）

### Requirement 2: 排除與相容
1. The Viewer shall 排除水面／瀑布、所有粒子及原始透明或opacity小於1的材質，對多材質物件按區段判定；實體池岸與不透明建物仍可遮擋。（2.1）
2. When 切換鏡頭、角色或Follow, the Viewer shall 保留所選模式，普通透視與魚眼均正確對齊；First person保持自身隱藏且不顯示X-ray。（2.2）
3. The Viewer shall 保留原三模式、Orbit、點地Run、跑跳、表情、水景與粒子操作。（2.3）

### Requirement 3: 操作與生命週期
1. The Viewer shall 提供第4個具標籤及說明的選項，初始仍為Auto zoom。（3.1）
2. When 切換模式、角色、resize或dispose, the Viewer shall 還原所有暫時狀態，釋放自有資源且不釋放原始材質／貼圖或累積重複資源。（3.2）
3. The Viewer shall 通過tests、build與實際GPU瀏覽器遮擋驗證，記錄效能及本機環境限制。（3.3）

## Boundary Context / Review
本功能是六里程碑內的追加需求，不變更M6／SCENE-05實機驗收。僅處理操作主角，不擴充Target或NPC功能。前三模式原有透明策略不因本規格變更。Requirements inline審閱PASS：9條件可觀察、排除與First person邊界明確；依使用者授權自動審閱，非逐份人工核准。
