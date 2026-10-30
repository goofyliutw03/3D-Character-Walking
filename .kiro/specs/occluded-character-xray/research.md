# Research and Design Decisions

2026-10-31 integration-focused discovery，使用kiro spec-init／requirements／design／tasks、impl／validate-impl。依AGENTS同一已核准範圍自動inline審閱，不委派、不commit。

- 讀取現有SceneRenderer／FisheyePass／CameraObstruction／SceneAppearance／ViewerApp／WaterFeature及camera-obstruction-modes規格與驗證。水景chat最終回覆確認交付後才修改共用檔案。
- 本機node_modules/three/src/renderers/shaders/ShaderLib/depth.glsl.js包含skinning與morph chunks，可重用MeshDepthMaterial而不複製動畫或GLB。環境／角色分開depth可排除自遮擋；單純GreaterDepth重畫角色會把自身背面也畫出，故不採用。
- FisheyePass先以160°PerspectiveCamera捕捉再做UV映射，效果須插入捕捉回呼，不能在圓形畫面上套普通投影mask。
- WaterFeature已有cameraObstruction=false；以environment限定、祖先排除及原材質透明判定處理水與粒子，不更改shader API。
- 重用Three.js MeshDepthMaterial／WebGLRenderTarget與現有shader output chunks，無新函式庫。只提供一個效果pass與捕捉回呼，避免擴張成一般後處理框架。
- 性能與GPU結果必須來自本次實測，既有水景FPS不能當本效果證據。精確token基準查原交接日期session路徑未取得結果，完整階段無精確值，不估算。
