# Research & Design Decisions

## Summary
既有 CameraController 同時產生構圖並立即 constrain，會把壓縮後位置帶回下一幀追蹤；OrbitControls 亦直接持有此相機。CityScene 以顏色共用材質；ViewerApp 在加入主角前擷取遮擋物，因此目前只有環境、不含 NPC。

## Research Log
- 本機依據：CameraController.update／finishFrame／resolveFront、FollowCamera.constrain、ViewerApp loop／dispose、CityScene.material；實際安裝 Three.js 原始碼 Raycaster.intersectObject 會遞迴且不自動排除 invisible。自行檢查祖先 visible，避免隱藏物造成假遮擋。
- [Three.js Material](https://threejs.org/docs/pages/Material.html)：opacity 搭配 transparent，depthWrite 決定深度寫入；clone 不代表貼圖所有權移轉。透明 clone 設 opacity0.25、transparent=true、depthWrite=false；只 dispose clone，不 dispose texture。
- [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html)：交點按距離排序，網格預設僅正面。從主角身體取樣到鏡頭可找到進入障礙物的表面，採同一路徑偵測多層遮擋。

## Architecture Pattern Evaluation
採既有 Three.js 的 raycaster／material clone，不引入套件或 GPU pass。將 desired camera 與 rendered camera 分離，比每幀把壓縮相機回存 Orbit 再還原更可靠：DOM 事件可在幀間修改 Orbit，因此回存方案會吞掉手動縮放。兩台相機中只有 rendered camera 被渲染，仍只有一個 renderer／loop。

## Design Decisions
1. CameraController 只維護未壓縮構圖；Front 的候選角度探測保留於 zoom，其他兩模式關閉候選選角。FollowCamera.constrain 保留作現有安全位置計算與回歸，不再直接壓縮 CameraController 輸出。
2. CameraObstruction 統一三策略與縮距比例的指數平滑；每幀從 desired 重新計算，入／出 rate=8，dt 上限0.05。reduced-motion 立即。非 zoom 仍平滑釋放既有縮距；First person 立即重設比例1、還原透明效果。
3. SceneAppearance 只管理 CityScene.environment 的 material clone；environment 子節點為完整邏輯物件（建物、樹、長椅、路燈或單一地面網格）。透明模式對身體頭／軀幹／腳與肩寬取樣中任一遮擋物整組生效，不連帶污染同色其他物件。
4. 線框只處理環境，主角與fallback在 environment 之外；沒有實際 NPC，不增建預留 NPC 層。所有線框材質均不改原材質。
5. 簡化：不新增抽象策略工廠、儲存、外部資產或事件匯流排。模式是本頁記憶體狀態，reset鏡頭保留模式。

## Risks & Limits
有限身體射線不是完整像素遮擋或掃掠碰撞；突然出現障礙時平滑拉近有短暫遮擋，封閉空間不保證全身可見。透明多層可能累積顏色與排序差異。全場景三角形線框不是去除共面邊的建築輪廓，會顯示三角網格；保留既有光影。這些不冒稱物理碰撞／跨GPU／真機驗收。

## Consulted Skills
kiro-spec-init、requirements（EARS／review gate）、design（light discovery／synthesis／review gate）、tasks（sequential coverage）、impl／review／verify-completion／validate-impl。依 AGENTS 同階段自動審閱、逐任務依序、inline 審查；不委派、不 commit。
