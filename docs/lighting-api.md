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

街道六個路燈與粒子八個槽各自管理。粒子超出8個亮燈效果時仍可發射純視覺效果，空槽釋出後補上；Apply僅影響新shot。沒有點光陰影／bloom，無陰影光可穿牆；僅對支援場景光的材質生效，MeshBasic與現有水Shader不受點光照明。固定零強度槽也有shader成本，不代表所有裝置FPS保證。

`CityScene.setTimeOfDay('day'|'evening'|'night')`／ViewerApp同名委派提供時段切換；setEvening(boolean)保留相容。非法時段回false不變更。夜晚同步背景／霧／半球光／主光並自動啟用路燈，白天與黃昏關閉。
