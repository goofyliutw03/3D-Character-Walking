# 物件光源 API

`src/lighting/ObjectLightPool.ts` 提供可重用、有容量上限的 Three.js 點光源，不依賴 ViewerApp 或粒子。

```ts
import { Vector3 } from 'three';
import { ObjectLightPool } from '../src/lighting/ObjectLightPool';

const lights = new ObjectLightPool(4);
scene.add(lights.root); // 停放槽保持固定 shader 燈數
const handle = lights.attach(object, {
  enabled: true, color: '#66ddff', intensity: 20, radius: 5, decay: 2,
}, new Vector3(0, 1, 0)); // object 的局部座標，隨父層變換
if (handle) {
  lights.update(handle, { intensity: 40, color: '#ff8844' });
  lights.remove(handle);
}
lights.dispose(); // 場景擁有者離開時釋放；可重複呼叫
```

容量為整數1–32，非法建構值拋RangeError。attach滿額／非法設定回null；update非法或失效handle回false，保留全部原設定。remove後舊handle失效，即使槽已重用也不能修改新光源。offset複製且要求有限值。

設定：enabled為boolean、color為#RRGGBB、intensity為0–200cd、radius為0.1–30m有限截止半徑、decay為0–4（預設2平方反比）。所有數值必須finite；update接受部分設定並原子驗證。不要自行改動池內光源的父層或清空其物件；移除目標前應remove對應handle。管理器只擁有光源，不會dispose目標物件。

街道六個路燈與粒子八個槽各自管理。粒子超出8個亮燈效果時仍可發射純視覺效果，空槽釋出後補上；Apply僅影響新shot。Night且Shadows開啟時，CityScene依Night shadow lights手動勾選1–6燈同時投影（預設第2燈，全取消為零）；粒子與本API仍無陰影，無陰影光可穿牆。六路燈各持有獨立512px cube target，關閉保留以供恢復，dispose逐一釋放，點光每次需六面渲染；影子受12m照射半徑、其他光源與材質影響，沒有bloom；僅對支援場景光的材質生效，MeshBasic與現有水Shader不受點光照明。固定零強度槽也有shader成本，不代表所有裝置FPS保證。

`CityScene.setTimeOfDay('day'|'evening'|'night')`／ViewerApp同名委派提供時段切換；setEvening(boolean)保留相容。非法時段回false不變更。夜晚同步背景／霧／半球光／主光並自動啟用路燈，白天與黃昏關閉。


## 路燈陰影選擇（CityScene / ViewerApp）
```ts
const lamps = viewer.getLampShadowOptions(); // 新陣列／物件：{id, x, z, selected}，id固定1–6
viewer.setLampShadowSelection([2, 5]); // 兩盞同時投影，不隨角色移動覆寫
viewer.setLampShadowSelection([]); // 無路燈陰影
```
非法ID、非整數、非陣列回false且保留原選擇；重複ID視為集合。Night且Cast shadows開啟時生效，day/evening或關陰影會停用UI但保留選擇。無跨重載保存；不擴張到粒子燈。UI位置為燈的世界x/z（m），每側z=-17/3/20；Light1–3 x=-4.4、4–6 x=4.4。開六盞可產生多重影子且成本較高；其他光可能填亮影子，12m外無該燈影子。

## 陰影自動觸發偵測（1R-4）
`ViewerApp.getLampShadowDetection()`回新物件`{enabled:false,radius:10}`；`setLampShadowDetection(enabled:boolean,radius:number):boolean`原子拒絕非法boolean或非finite／1–30m外半徑。UI range步進0.5m，API允許區間內其他有限值。
六個手動checkbox是候選清單。Auto off維持所有候選同時投影；auto on在Night且Cast shadows開啟時，所有候選中距離≤半徑者投影，>半徑即停，無遲滯／最近一盞限制。取消全部即零路燈影子。
CityScene `updateLampShadowPosition({x,y,z}):boolean`驗證完整有限向量、複製保存；ViewerApp在建構及movement後render前傳CharacterController的世界腳底motion，包含路面高度及跳躍。至PointLight世界位置計算完整3D距離；setter立即依最後位置同步。日夜及陰影開關保留auto／半徑／候選；僅本頁保存。
偵測半徑1–30m預設10m不擴大燈本身12m照射範圍。六份獨立shadow及dispose契約不變，粒子與通用pool仍不投影。

## Solar Sport（1U-0）
`ViewerApp.getSolarSettings()` 回傳獨立快照 `{enabled,hour,season,latitude}`；`configureSolar(patch)` 完整驗證後原子套用，hour為[0,24)、latitude為[-90,90]，season為spring/summer/autumn/winter。預設false/12/spring/25。非法值或已dispose回傳false。
`setTimeOfDay(day|evening|night)` 退出Solar模式並記錄預設；`configureSolar({enabled:false})`恢復最近選取預設。太陽高度≤0無直射，≤-6°沿用night路燈及候選shadow。Solar設定不改手動路燈選擇／auto距離／shadows。
`getTimeOfDay()`提供目前有效光照分類。`setSolarReport(callback|null)`每幀於實際相機更新後回報heading（北0、東90）及代表太陽高度；由應用程式單一更新loop驅動，UI只在值改變時更新DOM。dispose清除回呼。SolarPosition為純數學模組，無Three.js依賴。
