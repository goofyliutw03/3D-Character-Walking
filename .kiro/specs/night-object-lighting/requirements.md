# Requirements Document

## Project Description (Input)
使用者觀察城市人物時，目前只有白天／黃昏，路燈及發射效果不會照亮周圍。新增夜晚環境、路燈與粒子群組真光源、可重用物件掛載API及粒子光源設定；保留既有角色、相機與水景行為。

## Introduction
讓觀察城市與粒子互動的使用者切換夜晚、辨識角色並看見路燈及發射效果照亮附近表面。

## Boundary Context
包含三種時段、路燈、粒子群組光源、可重用掛載介面及設定。保留 Caster→Target、四遮擋模式與水景；不新增 NPC、泛光或水 Shader 受光；1R-3追加授權允許手選六盞路燈同時點光陰影。非第七里程碑；SCENE-04/05/FOLD待驗保留。

## Requirements
### Requirement 1: 時段與路燈
**Objective:** 作為觀察者，我要切換日夜並看清街道與角色。
1. When 選擇白天、黃昏或夜晚, the Viewer shall 同步天空、霧、環境光與主光源，夜晚保留可辨識角色的照明。
2. While 夜晚啟用, the Viewer shall 讓六盞路燈燈具發亮並照亮附近地面及受光人物。
3. When 離開夜晚, the Viewer shall 關閉路燈照明及發光並恢復所選時段。

### Requirement 2: 物件掛載光源
**Objective:** 作為開發者，我要重用物件光源能力而不複製場景程式。
1. When 指定物件與局部位置掛載光源, the Lighting service shall 使光源隨物件世界變換移動。
2. When 更新開關、強度、顏色、半徑或衰減, the Lighting service shall 原子套用合法設定並拒絕非法值而保留原設定。
3. When 移除或釋放光源管理器, the Lighting service shall 解除掛載並可安全重複呼叫。
4. The Lighting service shall 提供公開介面與可執行用法範例，並明示容量及無陰影照明的限制。

### Requirement 3: 粒子群組照明
**Objective:** 作為使用者，我要看見發射效果照亮周邊並可控制外觀。
1. When 發射啟用照明的效果且有空閒光源槽, the Viewer shall 以該次設定的光源隨效果群組移動。
2. When 效果命中, the Viewer shall 讓光源隨命中閃光在0.25秒內淡出，且不改變原有命中統計與軌跡。
3. When 效果逾時、縮減容量、reset或dispose, the Viewer shall 回收光源且重複連發不增加容量上限。
4. If 真光源容量已滿, the Viewer shall 保留粒子發射並在空槽可用時補上照明，真光源數量維持有界。
5. When 使用者套用設定, the Viewer shall 將光源開關、強度、獨立顏色、照射半徑公尺及衰減套用到後續發射，既有發射維持設定快照。
6. When 以鍵盤或觸控操作光源控制, the Viewer shall 保留控制面板可存取名稱及既有阻止角色導航的輸入邊界。

### Requirement 4: 驗證與回歸
**Objective:** 作為維護者，我要確認新增燈光可控且不破壞既有功能。
1. The Viewer shall 限制粒子真光源容量且預設不投射點光陰影。
2. The Viewer shall 保留角色切換、相機四遮擋模式、水景及原粒子互動，並提供tests/build與本機production GPU證據及未驗範圍。




### Requirement 5: 主角附近單一路燈陰影（追加授權）
1. While Night且Shadows開啟, the Viewer shall 依主角地面位置選最近路燈投影，切換可保留0.5m距離緩衝，最多一盞點光投影。
2. When 主角移動、切換時段或Shadows, the Viewer shall 同幀更新選燈；day/evening或Shadows off停用路燈陰影，重新開啟可恢復。
3. The Viewer shall 共用單一有界點光陰影資源且dispose只釋放一次；粒子與通用光源池仍無陰影。
4. The Viewer shall 驗證點光shader、角色切換、xray/fisheye及水霧整合，記錄六面渲染成本與未驗範圍；不承諾超出12m照射半徑或任意材質皆有清晰影子。

## Requirement 6: Night 手選多光源陰影（1R-3，取代 Requirement 5 的自動單燈策略）
1. Control Panel > Lighting & shadows shall 提供六個原生checkbox，顯示固定光源編號及世界x/z位置；所有勾選燈同時投影，全取消為零路燈陰影。
2. Only while Night且Shadows on, the Viewer shall 啟用勾選路燈陰影與選擇控制；其他時段或Shadows off停用但保留選擇。初始只選最近初始位置的第2燈，移動不覆寫手選，不提供auto模式。
3. The Viewer shall 提供穩定1–6整數ID及安全快照，原子拒絕非法ID／非陣列；每燈獨立512px陰影資源，最多六份，dispose冪等且各target只釋放一次，不變更通用pool或粒子陰影。
4. The Viewer shall 保留角色切換、移動、四遮擋、fisheye、水霧及濕鏡頭，驗證0/1/多/6燈與開關資源重用，記錄六燈成本及窄版／可存取／輸入隔離證據與未驗範圍。

## Requirement 7: 陰影自動觸發偵測（1R-4，取代6.2不提供auto的限制）
1. Lighting & shadows提供原生auto checkbox、半徑range及公尺output；預設off，半徑1–30m預設10m、step .5m。
2. Night且總Cast shadows on時，auto off所有候選同時投影；auto on僅候選中完整3D世界距離≤半徑的燈投影，>半徑立即關閉，無遲滯且不限最近一盞。全取消為零。
3. 距離由操作主角腳底世界位置（包含地面高度及跳躍）至PointLight世界位置計算；movement後render前每幀同步，設定變更立即使用最後位置同步。
4. 日夜及總陰影往返保留auto、半徑與候選；disabled不清除。API原子拒絕非法boolean、radius及非finite/vector位置，getter回安全快照。
5. 保留六燈獨立陰影資源與回收、面板輸入隔離、窄版與label/output可存取性；不變更粒子或通用pool。
