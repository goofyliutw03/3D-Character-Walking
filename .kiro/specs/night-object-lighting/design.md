# Design Document
## Overview
在既有WebGL2街道加入Night與有界物件光源；不改動角色、相機與水景所有權。採Three.js PointLight及Object3D組合，沒有新依賴或外部素材。
### Goals
日夜同步、六盞路燈、粒子群組照明、設定與公開API可驗證。
### Non-Goals
泛光、粒子陰影、NPC、水Shader重寫、跨GPU驗收。
## Boundary Commitments
### This Spec Owns
ObjectLightPool契約與設定驗證、時段狀態、路燈和Flight光源生命週期、UI對應。
### Out of Boundary
水景Shader／濕鏡頭、角色動畫、相機權威與遮擋演算法、導航與M6人工待辦。
### Allowed Dependencies
ObjectLightPool只依賴Three；CityScene直接持有靜態PointLight；ParticleInteraction向下依賴pool；ViewerApp組合、main連接UI。不得反向匯入。
### Revalidation Triggers
ParticleSettings及TimeOfDay契約需重驗main/UI；group子節點與材質變化需重驗particle／四遮擋模式；renderer光數或陰影變動需重驗GPU與水景合成。
## Architecture
```mermaid
graph TD
  UI --> ViewerApp
  ViewerApp --> CityScene
  ViewerApp --> ParticleInteraction
  CityScene --> ObjectLightPool
  ParticleInteraction --> ObjectLightPool
  ObjectLightPool --> Three
```
既有setEvening保留相容包裝，新增setTimeOfDay(day|evening|night)拒絕非法值。背景與霧同色，夜間sun冷色低強度、hemisphere保持可讀性；白天／黃昏恢復原值並重設所有顏色。
## File Structure Plan
| 檔案 | 動作／責任 |
|---|---|
| src/lighting/ObjectLightPool.ts | 新增公開設定型別、預建有限池、opaque handle掛載管理 |
| src/scene/CityScene.ts | 新增TimeOfDay、六路燈池及獨立emissive材質 |
| src/interaction/ParticleInteraction.ts | 增加平面light設定、Flight租用／淡出／補槽及回收 |
| src/engine/ViewerApp.ts | 時段公開委派 |
| src/ui/controlPanelContent.ts、src/main.ts | Night與光源欄位、原子設定及狀態說明 |
| tests/object-lighting.test.mjs、tests/particle-lighting.test.mjs、tests/night-lighting.test.mjs | 公開契約、回收、日夜與整合回歸 |
| docs/lighting-api.md、README.md、docs/development-plan.md、.kiro/steering/roadmap.md | 使用與授權對應；保留現有內容 |
## Components and Interfaces
### ObjectLightPool
`PointLightSettings { enabled:boolean; color:string; intensity:number; radius:number; decay:number }`；`ObjectLightHandle`不可自行建構有效租用。
- constructor(capacity:整數1–32)，固定root含capacity預建且無陰影PointLight。
- attach(parent:Object3D, settings, offset?:Vector3):handle|null；非法設定、非法offset、dispose後或滿額回null，無部分更動。
- update(handle, patch:Partial<PointLightSettings>):boolean；先合併再驗證，失效／跨池handle回false。
- remove(handle):boolean；歸還零強度燈至root，清除租用映射。dispose冪等、使所有handle失效並釋放PointLight。activeCount觀察租用、capacity觀察上限。
- enabled必須boolean，color為#RRGGBB，intensity 0–200、radius .1–30、decay0–4，皆finite。offset為有限局部座標，複製不保留呼叫者可變參照。
### CityScene
六路燈的point位置在燈具下方且不繼承燈具縮放；獨立燈具材質共享於六盞但不與一般box共享。Night=120cd/12m/2、emissive夜間1.5，day/evening=0。追加後直接持有六PointLight，dispose釋放共享陰影、燈及材質。
### ParticleInteraction
ParticleSettings新增lightEnabled/lightColor/lightIntensity/lightRadius/lightDecay；舊欄位保留，getter回傳快照。燈池8槽root加入particle root且命名，Flight自身存handle|null。
每Shot快照設定，滿槽回退純視覺，update結束補上空槽。burst只移動Mesh，clear前暫存Light子節點、重建Mesh後掛回（保持租用，以免搶槽）；光強=快照強度乘剩餘burst比例。remove/clear/dispose歸還租用，縮容量同既有移除最舊。預設lightEnabled=true。公開lightRoot指向停放root，由ViewerApp加入scene作為Flight root的sibling，保持root只包含效果群組的既有語意。
### UI integration
Number欄位與API同範圍，intensity標cd、radius標m，衰減0–4、獨立color及checkbox。Apply維持新shot快照與非法時保留原設定；既有panel阻擋導航／輸入保留。
## System Flows
```mermaid
stateDiagram-v2
  Parked --> Flying: attach
  Flying --> Burst: hit
  Flying --> Parked: expire or reset
  Burst --> Parked: fade complete
  Parked --> Disposed: dispose
```
## Requirements Traceability
| 條件 | 元件／驗證 |
|---|---|
| 1.1, 1.2, 1.3 | CityScene、night tests、GPU |
| 2.1, 2.2, 2.3, 2.4 | ObjectLightPool、object tests、API範例 |
| 3.1, 3.2, 3.3, 3.4 | ParticleInteraction、particle lighting tests、GPU |
| 3.5, 3.6 | ParticleSettings、UI/main、實際面板互動 |
| 4.1, 4.2 | 池、全tests/build、production GPU及回歸 |
## Error Handling
非法API輸入回false/null，不throw或部分套用；非法capacity建構throw RangeError。UI顯示既有允許範圍錯誤，滿燈不阻擋發射。
## Testing Strategy
- Node：有限值與boolean／hex、原子拒絕、offset快照、父層旋轉縮放隨動、跨池／失效handle、重用及dispose事件。
- Node：128連發／8燈上限、多輪hit與expire／shrink／clear、fade後補槽、Mesh子節點不誤動Light、快照不變。
- Node：三時段往返恢復及非法時段、六獨立燈材質及dispose。
- production：真GLB載入、夜晚角色／地面readPixels有差、光顏色／半徑／強度效果、四遮擋／魚眼／水景、鍵盤與窄版控制、短效能樣本；真機與跨GPU標未驗。
## Performance & Scalability
固定6路燈＋8動態槽；追加最近單一路燈六面陰影，額外draw成本見validation；停放零強度但仍列入shader，代價是白天也有固定計算成本，收益為避免連發新增shader變體。測量揭露而不保證所有GPU FPS。
## Migration / Rollback
additive時段API與本頁設定無持久化migration；只撤本次diff，保留瀑布dirty。tests→build→sync依既有release腳本，失敗停止；不刪舊資產。

## 最近路燈陰影追加設計（2026-10-31）
CityScene直接持有六盞靜態PointLight，位置／色彩／強度／半徑不變，不擴張ObjectLightPool公共API。六燈共用同一PointLightShadow（512px各面、near=.1、far=12、bias=-.0003、normalBias=.02），只有選中的castShadow=true；WebGLShadowMap僅為投影燈渲染，六面共用同一cube target，切燈不分配新target。CityScene集中釋放共享shadow target一次並清空map/mapPass，再dispose各light（Three內部會再次呼叫shadow.dispose但已無target）；dispose冪等。
ViewerApp在movement.update後傳遞motion.x/z，CityScene用水平歐氏距離選燈；候選比現選近超過0.5m才切換。首次以(0,0)選燈，拒絕非finite位置。時段與Shadows皆立即同步castShadow；關閉時保留selection與已配置target供恢復。sun維持原契約。主角高度不參與選燈，仍由點光完整3D距離決定實際照明。
新增tests檢查六燈數量／光強不變、邊界緩衝、跨六燈循環、時段／Shadows恢復、共用target與一次dispose。實際shader與整合需production GPU gate；不能用Node或HTTP200替代。若工具不可用，記MANUAL_VERIFY_REQUIRED。
Rollback僅撤本追加diff；不改水Shader、相機權威或粒子池。點光六面額外draw成本須揭露，沒有跨GPU效能保證。

## 1R-3 手選多燈設計（取代上述最近／共享策略）
CityScene持有Set<number>，預設[2]（初始水平最近，等距取建造順序）。getLampShadowOptions()回傳新陣列與新物件{id,x,z,selected}；setLampShadowSelection(ids:readonly number[]):boolean先驗證陣列及每個1–6整數，非法不部分套用，重複ID視為集合。ViewerApp只委派，不每幀選最近燈。所有勾選燈在Night且Shadows時castShadow=true。各PointLight保留原生獨立shadow，配置512px、near .1/far12、bias-.0003/normalBias .02；懶配置target、關閉保留，dispose逐燈一次。
main以公開快照初始化checkbox並傳回整組勾選ID；fieldset/legend與label提供名稱，Night/Shadows條件更新disabled；選擇保留於頁面生命週期，無持久化。位置列可換行不設定最小寬度，沿用panel輸入隔離。新增six-checkbox內容及小幅CSS；不改動態粒子燈。
需求6.1–6.2→task9 UI/main與GPU，6.3→task8 API/lifetime tests與GPU，6.4→task10全套與GPU回歸。rollback只撤本次差異後release，保留原dirty及舊hashed資產。最大六燈六面渲染，無跨GPU FPS承諾。

## 1R-4 距離偵測設計
CityScene新增getLampShadowDetection():{enabled,radius}新快照、setLampShadowDetection(enabled:boolean,radius:number):boolean整組驗證後套用；radius允許finite 1–30（API不強制UI步進）。updateLampShadowPosition(position:{x,y,z}):boolean拒絕null/非物件/非finite分量，複製至內部Vector3；初始(0,groundHeight(0,5),5)。PointLight.getWorldPosition暫存Vector3，distanceTo≤radius，不加epsilon或hysteresis。auto off短路距離計算，候選與effective castShadow分開。
CharacterController motion是世界腳底位置；Character/RiggedCharacter.root.position直接設motion.xyz，scene root未變換。ViewerApp建構及每幀movement後傳motion，含groundHeight與jump，UI setter使用最後已保存位置立即同步。六個target配置／dispose不變。
UI的auto及radius放既有Night fieldset內；radius在auto off額外disabled。input事件即時送setter、output顯示m；候選不被effective狀態覆寫。範圍1–30m允許局部或跨數燈，10m預設涵蓋附近且與12m實際照射距離相近；偵測半徑不擴張12m光照半徑。設定限本頁生命週期。
需求7.2–4→task11 API/邊界/原子性/快照與movement；7.1/5→task12 UI及task13 production回歸。依序實作，不委派。rollback僅撤本次增量，保留既有dirty後release。
