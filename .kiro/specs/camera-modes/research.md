# Research
## Summary
2026-10-25 integration-focused discovery；已讀既有 engine／camera／UI、上游 spec、steering 與 cc-sdd review rules。沿用目前 skills 與使用者授權自動 inline review，不委派、不更換模型。
## Research Log
- 上游 CameraPreset／CharacterStatus 在 ViewerApp，Follow 開關原本會強制第三人稱；本里程碑需改為構圖與 Follow 分離。
- 既有 FollowCamera 的 raycast 可公開 constrain，避免新視角重做遮擋。FirstPersonCamera 保留實際眼位與70° FOV。
- 已查本機 three/@types 的 WebGLRenderTarget、ShaderMaterial、setRenderTarget／getRenderTarget，以及官方 [WebGLRenderTarget](https://threejs.org/docs/pages/WebGLRenderTarget.html)、[ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html)。不升級依賴。
## Decisions
- 選擇160° equidistant circular fisheye：square160° pinhole capture映射 tan(r×80°)/tan80°，是角度等距投影；不是只有FOV擴大。與180°cubemap比，只渲染一次場景、無新套件，但不宣稱完整半球180°。
- 採獨立 CameraController 管鏡頭協調，避免 ViewerApp 不斷累積模式判斷；保留已有眼位／遮擋能力。
- 轉場採相對注視點球面旋轉；線性 camera position 從前到後會穿過人物，不採用。
- shader最後做tone mapping／colorspace，RT線性資料；選用可用的half-float，無支援則unsigned-byte，不更動WebGL2基線。
## Risks
實測修正：低角度暫停時原Orbit maxPolarAngle會抬高鏡頭，已調整低角度限制並以真實OrbitControls回歸測試。魚眼初版低解析度中心偏糊，採1536–2048 square target兩倍取樣；增加GPU記憶體但不擴充180°或cubemap範圍。production browser驗證周邊彎曲、resize圓形及正常透視恢復，console無shader錯誤。
GPU shader、顏色、長寬比必須真實瀏覽器驗證；Node只驗證資源與呼叫合約。性能不設定未核准的全平台FPS保證；魚眼增加RT成本將列限制。
