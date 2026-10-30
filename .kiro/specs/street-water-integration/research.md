# Research & Design Decisions

## Summary
Integration-focused discovery，讀取 CityScene、ViewerApp、SceneRenderer、FollowCamera、CameraObstruction、SceneAppearance、GroundPicker、WaterFeature／waterShaders、WaterPrototype、面板與既有 tests。沿用已安裝 Three.js，不引入依賴或素材。

## Research Log
- CityScene walkable x ±8.3／z ±26.5，人行道僅 3.8m；街尾中央既有島約 (0,-25.4)，用 4.5×3.5m 水景替換後仍有雙側道路。中心前移 -24.6，後緣 -26.35 留在 bounds 內。
- ViewerApp 建構時 snapshot environment.children 作 GroundPicker／FollowCamera 輸入，故水景須在 CityScene constructor 完成後已附加。
- SceneAppearance 對 environment 子 root 成組 clone 材質；ShaderMaterial.copy 預設 clone uniforms，動畫因此與 WaterFeature 原 uniforms 分離，且 ShaderMaterial.opacity 不會自動乘入自訂 GLSL。需材質自帶 copy／onBeforeRender 契約。
- 本機 node_modules/three/src/materials/ShaderMaterial.js、Material.js、renderers/WebGLRenderer.js 是目前鎖定依賴的實際 API 來源；copy 回傳 this，clone 使用 constructor，material.onBeforeRender 在 draw 前呼叫。實作前核對來源並以測試／GPU 驗證。
- GroundPicker 只接受最近 hit walkable=true 且 isWalkable 通過；水景不標 walkable，障礙完整矩形阻止點穿下方道路。
- 水景 shaders 使用 local xz 計算波形、world position 計算眼向量，平移不破壞波形。程序反光不是照明模型；日夜主要影響池岸與背景，不聲稱水面接收陰影。

## Design Decisions
1. Generalization：分離 WaterShaderModule（材質／時間／設定）與 WaterFeature（既定幾何／品質／瀑布 visible）；公開 index.ts。只擴充必要重用介面，不建立任意 shader registry。
2. Build vs adopt：保留已驗原型 GLSL 與 Three ShaderMaterial；無新 SDK／安裝需求，避免另加水庫／反射 render target 改變已確認風格。
3. Simplification：材質 subclass 的 copy 保留同 module 動畫 uniforms 引用，獨立 opacity uniform；onBeforeRender 將 material.opacity 同步至 shader。SceneAppearance 不需水景專屬邏輯，clone 由既有 owner 釋放。
4. 相機 ray hit 以 userData.cameraObstruction=false 排除水面與瀑布；仍參與選地射線。透明 root 可由池岸／石牆判定，對整個水景組套用。
5. 場景組裝新增 StreetWaterFeature，管理底座與 WaterFeature，CityScene 更新／設定／釋放；主 renderer／lights 不分叉。

## Risks
透明排序、shader clone state、模式切換後的 dispose 順序、街尾導航格點、背景計時及原型回歸須實測。既有 shader 的程序光照與單片瀑布側面限制保留。GPU 成本不從 RAF 呈現上限推論。

## Consulted Skills
kiro-spec-init／requirements／design／tasks；採 EARS、numeric traceability、boundary-first、sequential tasks。使用者授權同範圍自動審閱；不委派／commit。
