# 實作任務

依使用者授權逐項執行，inline 審閱，不委派、不 commit／push。

- [x] 1. 實作穿透環境的混合地面選取及明確攔截
  - 牆頂不阻擋；僅有效地面前的可見指定物件拒絕選取。
  - 解析有限盒頂與其餘表面求交結果一致，複雜度分支不改變答案。
  - 邊界、裁切、斜面、無地面、魚眼等測試通過，記錄 RED／GREEN。
  - _Boundary: GroundPicker_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2_
- [x] 2. 整合城市／洞穴與可見角色，維持導航及手勢政策
  - 既有場景宣告地面能力；切換後使用新集合，主角／Target／NPC 外觀及 LOD 依可見狀態攔截。
  - 地面點擊沿既有繞障路徑，拖曳／多指與第一人稱禁用不回歸。
  - _Boundary: Viewer 整合、CityScene、CaveScene、TrafficView_
  - _Depends: 1_
  - _Requirements: 2.1, 2.2, 2.3, 3.3, 4.1, 4.2, 4.3_
- [x] 3. 驗證整體選取流程與建置產物
  - 全套測試、型別與建置通過，production smoke 顯示可用場景及點地／drag 隔離。
  - 記錄覆蓋、inline 審閱、限制與必要人工差距，不概括舊待驗。
  - _Boundary: 整合驗證_
  - _Depends: 2_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [x] 4. 整合控制面板穿透開關及原遮擋回退
  - 預設開啟、切換立即影響下次點擊；換場景保留、重載重設，不取消既有導航。
  - 關閉時環境首命中決定地面可用性，兩狀態皆保留指定物件攔截；一般與魚眼測試、production UI及完整回歸通過。
  - _Boundary: GroundPicker、ViewerApp、main、controlPanelContent 整合_
  - _Depends: 3_
  - _Requirements: 5.1, 5.2, 5.3_

## 規格審閱
2026-11-09 追加範圍已由來源chat傳入使用者核准；NORMAL、建議均衡能力／中推理，未切換模型。需求／設計／任務圖inline PASS，依序執行任務4；無委派或commit授權。rollback只撤回本次開關差異，既有穿透功能及其他dirty保留。token用量無法取得精確值，沒有官方起點用量基準。

2026-11-08：需求 EARS／數字ID、設計12項驗收映射與邊界通過；task graph sanity review：PASS，mode:inline。1核心→2明確整合→3驗證，無新安裝或外部資產前置，共用檔依序。依使用者範圍授權自動審閱通過，非獨立代理或逐份人工核准。

## Implementation Notes
### 任務 4（2026-11-09）
- RED_PHASE_OUTPUT：新增開關測試初次9項中1項失敗；false時屋頂後仍回傳地面而非null。加入原環境首命中分支後9/9通過。一般／魚眼、預設開、off→on、無遮擋地面及兩種狀態的明確blocker均覆蓋。
- 全套167/167、typecheck／build、diff --check通過。production Chrome的Needle／legacy×桌面／手機×城市→洞穴→城市，共12case，exit0。驗證預設開啟、off後切視角不被status回報覆寫、on點地成功、off不取消既有目的地、跨場景保留off、每次重載恢復on與drag隔離；無Runtime／WebGL錯誤，getError=0。證據 .local/ground-toggle-tests.txt、ground-toggle-build.txt、ground-picking-browser/toggle-results.json。
- VERDICT: APPROVED（inline）；STATUS: VERIFIED；CLAIM_TYPE: TASK。檢查首命中回退共用合法性／明確角色攔截，Viewer是頁面設定權威，main含狀態key同步及AbortSignal清理，無儲存或新依賴；只追加需求5及明確整合邊界，未改導航／碰撞／手勢。15/15驗收映射通過，無阻擋任務。

### 任務 1
- RED_PHASE_OUTPUT：新增測試初次因 GroundPicker export 尚無而失敗；實作保留 OFF flag 後4項中3項失敗，牆頂未穿透、解析查詢仍走 raycast、隱藏地面未拒絕。啟用並移除 flag 後4/4通過。
- 全套162/162通過，typecheck通過。舊環境遮擋拒絕測試依新需求改成穿透成功，障礙footprint／邊界拒絕保留。
- VERDICT: APPROVED（inline）；STATUS: VERIFIED；CLAIM_TYPE: TASK。檢查 actual diff、候選／blocker邊界與runtime imports；placeholder／secret掃描clean。發現盒子倒轉時解析頂面不等於最近可走面，已限制適用法線，不適用時回退raycast。尚未宣稱 Viewer 接線完成。

### 任務 2
- RED_PHASE_OUTPUT：實際GLB／NPC新增測試初次5/7通過；man/idle漏攔截，NPC隱藏測試因fixture地面範圍不足而失敗。前者確認是 SkinnedMesh.updateMatrixWorld 的bindMatrixInverse未更新，改成更新角色root世界矩陣及綁定矩陣；後者修正fixture範圍，未修改產品導航。
- 三種實際GLB在idle/run/jump、Target、程序fallback及NPC兩級LOD攔截通過；隱藏祖先／重建／城市→洞穴→城市／變換盒面與複雜度測試通過。全套166/166、typecheck及build exit0；build初次spawn EPERM，宿主權限重試通過，保留原有chunk advisory。
- VERDICT: APPROVED（inline）；STATUS: VERIFIED；CLAIM_TYPE: TASK。逐檔與本次前副本diff確認Viewer僅替換picker與注入roots、場景僅地面宣告、TrafficView只讀NPC集合；未改手勢／導航／碰撞權威，舊dirty保留。未作獨立代理審查。

### 任務 3
- 全套166/166、typecheck、production build及diff --check通過。Chrome headless／SwiftShader完成24個view cases：Needle／legacy各桌面6與手機6，城市→洞穴→城市、third-person／fisheye；點地成功、drag不啟動導航、繪圖與GLB ready、getError=0，無Runtime／WebGL錯誤。手機使用CDP原生touch events；不是實機。
- harness首輪返城市ready文案寫錯，改為City street ready；手機首輪逐次等待CDP回應造成SwiftShader延遲將tap判為hold。改成同一連線依序排入50ms觸控後手機通過。兩項均只修忽略harness，不修改產品輸入政策。Needle桌面6在後續手機失敗前已完成含error檢查與截圖；手機獨立6及legacy12各exit0。
- VERDICT: APPROVED（inline）；STATUS: VERIFIED；CLAIM_TYPE: TASK。12項驗收全部有映射，無boundary violation／孤立程式／新依賴。第一人稱僅保留現有inspection／場景能力政策，不擴充直接選first-person的輸入規則。
