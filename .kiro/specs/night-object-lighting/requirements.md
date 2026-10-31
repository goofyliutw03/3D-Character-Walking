# Requirements Document

## Project Description (Input)
使用者觀察城市人物時，目前只有白天／黃昏，路燈及發射效果不會照亮周圍。新增夜晚環境、路燈與粒子群組真光源、可重用物件掛載API及粒子光源設定；保留既有角色、相機與水景行為。

## Introduction
讓觀察城市與粒子互動的使用者切換夜晚、辨識角色並看見路燈及發射效果照亮附近表面。

## Boundary Context
包含三種時段、路燈、粒子群組光源、可重用掛載介面及設定。保留 Caster→Target、四遮擋模式與水景；不新增 NPC、陰影系統、泛光或水 Shader 受光。非第七里程碑；SCENE-04/05/FOLD待驗保留。

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



