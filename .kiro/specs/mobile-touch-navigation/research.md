# Research & Design Decisions

## Summary
Integration-focused discovery，沿用 Three.js 0.186、原生 DOM／Pointer Events、Node test runner，無新依賴。依 AGENTS 與本次使用者規劃核准採 sequential／inline review，不委派、不自動 commit。

## Research Log
- InputManager.sample 將 x/z 量化；導航意圖必須在 sample 後合成，不能放入量化方向鍵路徑。
- CharacterController 是 motion／collision 唯一權威，run=4m/s，radius=0.28m。公開既有半徑常數供導航共用，不搬移物理。
- CityScene.walkableWorld 提供 bounds／AABB／groundHeight；目前道路與人行道為離散高度。拾取採實際 scene raycast，將道路／人行道及地面標線標為 walkable，先命中的非地面物件阻擋選點。
- FisheyePass 使用短邊圓直徑及 θ=r×80°；魚眼 ray 必須從此 θ 反算 camera-space direction，再轉 world quaternion，不能直接 setFromCamera。
- 現有 viewport 在 <=600px 為 60dvh、min380，控制藏於側欄。新增 workspace 包含 viewport＋唯一操作列；手機以 100svh 及安全區安排第一屏，避免瀏覽器工具列改變造成控制離開視野。
- 官方 Pointer Events：https://w3c.github.io/pointerevents/ 。pointercancel／lostpointercapture 必須放棄候選 tap；多指全手勢封鎖直到全部離開，不攔截 OrbitControls。
- 官方 Three.js Raycaster：https://threejs.org/docs/pages/Raycaster.html 。普通鏡頭使用 setFromCamera；排序 intersections 決定最前景表面。已核對本機 three 原碼與現有 imports。

## Design Decisions
1. Build：靜態 AABB 可視圖＋最短路徑。既有 world 約數十個矩形障礙，點選時才求路，無逐幀建圖；不引入 NavMesh／新套件。以角色半徑膨脹障礙，corner另留0.02m餘裕，路徑全段檢查。
2. Generalization：統一 screen ray 供透視／魚眼拾取；統一 cancel 供 InputManager 的手動／生命週期通知，不讓下層輸入依賴導航。
3. Simplification：導航只有單目的地與 transient waypoints；無巡迴、序列儲存、路徑編輯器。marker採既有投影與 DOM，無新 GPU 資源。
4. 到達0.08m；中途 waypoint0.015m，依 delta限制輸入幅度防越點；1.5秒無進展判定阻擋。失敗點選取代舊路徑並停止，避免仍跑向舊目的地。

## Risks
真實 iPhone 三瀏覽器、OS 失焦與安全區需人工驗收；本機尺寸與 synthetic pointers 不冒稱實機。沿用既有近牆／封閉空間鏡頭限制，無 FPS 承諾。保留來源 chat 的 Child／Front／context recovery 證據及未提交內容。
