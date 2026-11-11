# 實作計畫

2026-11-11 交接整合註記：本檔為遠端 209f9ca 的重建 tasks 1–6。本機 a0579d2 的原 MQL tasks 1–3 已完整保存於 [mql-tasks.md](mql-tasks.md)，其規格／研究／驗證為同目錄 mql-* 歷史文件；兩組編號不可混用。原始驗證僅代表各自版本，整合後回歸另於交接清單記錄。

新規格依 2026-11-10 使用者重建授權制定，不代表交接所稱原 task 1–3。必須依序進行，不可平行；主 agent inline 審閱，無 commit／push。

- [x] 1. 建立可重現同步基準
  - 以真實街景輸出節點數、暖機及至少七輪每次同步耗時；保存原版作 A/B 對照。
  - 完成時可在無瀏覽器、無額外依賴下重跑並取得 JSON；標明 CPU 微量測範圍。
  - _Boundary: SceneObjectIndex 量測_
  - _Requirements: 1.1, 1.2_
- [x] 2. 重用未變索引並保留動態更新
  - 先新增有意義的回歸並確認原版未重用；再替換序列化比較，驗證穩定列／快照、改名、排序、重新掛載、checkbox／篩選及釋放。
  - 完成時索引測試全過、A/B 同步中位成本改善，沒有場景或 DOM 契約變更。
  - _Boundary: SceneObjectIndex_
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
- [x] 3. 整合審閱、驗證與發佈
  - 完整 tests／型別／build、production 瀏覽器啟動及 Inspector 操作、release、增量索引及 status；記錄數據、限制及 token 統計範圍。
  - 完成時證據可追溯；保留既有 M6／跨裝置人工驗收，不冒稱整體里程碑已結束。
  - _Boundary: 整合驗證與交付文件_
  - 六組目標平台分別列實測／待驗，手機真機與 FPS 門檻缺口不得用桌面替代。
  - _Requirements: 3.1, 3.2, 3.3_

## 任務審閱
PASS（inline）：3 個循序單位，覆蓋 9/9 條件；Node／依賴已存在，原基準 112 tests／typecheck／build 通過。task-graph sanity PASS（inline）；使用者限制不委派，未宣稱獨立審查。

## Implementation Notes
- Task 1 VERIFIED：benchmark exit0，200 次暖機、9輪各1000次同步，原版已保存 `.local/viewer-performance/baseline.ts`，原始結果 `before.json`；量測不涉及瀏覽器或 FPS。inline APPROVED：使用既有 CityScene，無依賴或產品變更。
- Task 2 VERIFIED：新增快照重用測試在原版實際 RED，另一次未指定 test-isolation 的執行受 spawn EPERM 阻擋不算 RED；正確指令補驗後確認 assertion failure。實作後索引6/6及完整114/114 PASS。交替A/B九輪中位 baseline0.2677102ms/current0.1666602ms，約減少37.75%，只代表 Node 同步微量測。inline APPROVED：動態樹仍完整遍歷；同步快照與 active 分離保留 configure／checkbox 通知；dispose 兩組釋放；無渲染、ID或 UI 契約變更。
- Task 3 VERIFIED（本次局部交付）：114 tests／typecheck／build、Chrome及Edge production各23檢查、Release與17檔SHA256一致；增量索引完成且status green。六平台狀態已列矩陣，手機真機與正式效能門檻仍待驗，不因任務勾選視為M6結案。結果見validation。

## PC 續作與手機 ToDo
- [x] 4. 固定 production 環境並完成可信 RAF 小樣本檢查（Requirements 4.1, 4.2）
- [x] 5. 依序完成 Chrome／Edge 四負載三輪，分析是否有足夠證據支持局部修正（Requirements 4.1–4.3）
- [x] 6. inline審閱、必要回歸／release、證據與增量索引收尾（Requirements 3.2, 4.3）
- [ ] M6-MOBILE-01 ToDo：Android Chrome 真機；記錄OS／版本／硬體、幀時間與走跑／魚眼xray／粒子水景／夜間操作。
- [ ] M6-MOBILE-02 ToDo：Android Edge 真機；同上。
- [ ] M6-MOBILE-03 ToDo：Android Firefox 真機；同上，不以Chromium結果代替。
- [ ] M6-MOBILE-04 ToDo：iPhone Safari 真機；記錄iOS／Safari／硬體及相同案例。
手機依使用者指示延後，不索取手機輸入、不以viewport替代、不阻擋PC。正式門檻尚缺；上述工程task完成不代表M6結案。任務審閱PASS（inline），必須依序進行，不可平行。

Task4 VERIFIED／inline APPROVED：pc-pilot.json確認硬體D3D11、真實RAF75frames、尺寸/DPR/原畫質與walk/run；未使用virtual time，無GL或runtime錯誤。task5開始。

Task5 VERIFIED／inline APPROVED：Chrome／Edge各12段、無runtime／GLerror，GPU／尺寸／畫質一致。近75Hz上限，未有足夠證據支持新增產品修正；保留高負載成本及前景／真機缺口，完整表格見validation。task6開始。

Task4/5更正：收尾發現Vite helper side effect啟動隱藏主頁Viewer，首次樣本不作單實例證據。依validation修正pagehide teardown與單canvas assertion，task5完整重跑中；先前Task5 VERIFIED紀錄由本段取代。

Task5 最終 VERIFIED／inline APPROVED：修正host後Chrome／Edge各12段、單canvas、無runtime／GLerror，表格僅採最終單實例資料；無額外產品修正依據。

Task6 VERIFIED（限PC工程交付）：114tests／build／release、17檔hash、diff check、增量索引與status已完成；最終metadata後再次確認。手機4組及M6正式門檻／前景待辦保持未完成。inline審閱APPROVED，未委派。
