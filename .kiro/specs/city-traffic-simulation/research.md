# Research & Design Decisions

## Summary
- Feature：city-traffic-simulation；Complex Integration，單一受號誌協調的城市模擬交付。
- 現有CityScene道路x±4.5、人行道x4.5–8.3、斑馬線z±1.6；WalkableWorld只含bounds／AABB／groundHeight，不能直接代表人行表面。
- DestinationNavigation是主角既有格網，保留；NPC另用表面多邊形與portal。
- Character提供三種程序外觀與步態，可重用而不增加下載／非同步資產所有權。

## Research Log
### 導航與場景
來源：src/scene/CityScene.ts、src/character/motion.ts、src/navigation/DestinationNavigation.ts。
凸矩形分割可精確表示本場景軸對齊人行道及AABB障礙；半徑先內縮外界、擴張障礙，再切分座標邊界，建立共享邊連通。無固定解析度格網，無自動GLB烘焙承諾。入口中點加凸多邊形中心形成安全但非最短路徑。

### LOD
來源：[Three.js官方LOD](https://threejs.org/docs/pages/LOD.html) 與已安裝node_modules/three/src/objects/LOD.js。
官方支援addLevel(object,distance,hysteresis)、autoUpdate及update(camera)。採原生LOD，遠距用單一box角色／車身，近距用既有Character與多部件車輛，24m／15%遲滯。只降繪製與動畫，不跳過交通安全邏輯。

## Architecture Pattern Evaluation
|方案|結果|
|新增Recast套件|可處理任意幾何，但本次不安裝依賴，且沒有任意幾何需求|
|沿用主角格網改名|拒絕，沒有表面與共享邊契約|
|凸表面分割＋portal搜尋|採用，精確配合現有AABB街道，可純邏輯測試|

## Design Decisions
- 模擬狀態與Three.js顯示分離；只有一個TrafficSimulation權威時間，無各角色timer。
- 車綠10s→黃2s→全紅至少2s且等車輛清空→行人入場4s→行人清空至少10s且等行人清空→車綠。行人綠只允許新進，清空期仍顯示等候。
- 同向車保持4.5m中心距；車身長3.2m。行人間0.6m／主角Target0.7m；交會以兩條過街方向分流，受阻可等待，不承諾密集人群全局無死鎖。
- 程序模型是本次正式模擬外觀，與主角載入失敗fallback語義分離。
- 初始化關閉、6行人／4車預設；不偷偷替既有場景增加GPU工作量。

## Risks & Mitigations
- Target固定在(0,-1)，過街路徑分流z±0.65，需驗證不被Target堵住。
- 密集壅塞以有上限數量、可重置與狀態呈現處理；清空不使用強制逾時闖綠。
- 通用NavMesh不包含斜面／多層。新增街道布局須更新表面契約並重跑相關測試。
- 已讀kiro init／requirements／design／tasks；依專案授權inline審閱，不派agent。未取得精確token起點。
