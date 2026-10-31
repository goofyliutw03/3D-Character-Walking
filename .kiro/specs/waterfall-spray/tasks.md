# Implementation Plan

2026-10-31 使用者核准 1N-1 範圍；依序一次一項、inline 審閱，不委派／commit／push。既有 Node／Three.js／Vite 與測試 infrastructure 可直接使用，無安裝步驟。

- [x] 1. 建立瀑布落水與飛濺及世界噴濺源
  - 可看到落水／彈起飛濺，low／standard 容量有界、pause/off 正確，world source 隨 parent 變換。
  - 測試證明固定 buffer、quality 切換及冪等釋放；不修改 Caster→Target。
  - _Boundary: WaterfallSpray、SpraySource、WaterFeature、index、相關測試_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.4_
- [x] 2. 建立鏡頭濕潤狀態與最後合成
  - 近時薄霧／稀疏水滴；離開停止生成並下滑淡出，反覆進出有界，pause/off/reduced 正確。
  - 變換／方向／實體遮擋與設定測試通過；合成保留 renderer state、魚眼黑邊。
  - _Boundary: SpraySource、WetLensState、WetLensEffect、相關測試_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_
- [x] 3. 整合街道、原型與可控制開關
  - 兩入口由實際相機驅動共用模組，鏡頭關閉立即清除，不阻擋 UI；水景及既有相機模式可並用。
  - 重驗背景／故障、resize／DPR、面板及既有 tests／typecheck／build。
  - _Boundary: StreetWaterFeature、CityScene、SceneRenderer、ViewerApp、WaterPrototype、main、controlPanelContent、water-controls測試_
  - _Requirements: 1.3, 3.1, 3.2, 3.3, 3.4_
- [x] 4. 驗證 production GPU 與效能及修正
  - 兩入口 smoke、近遠／遮擋／模式／資源循環及固定條件效果 off/on 樣本有可重現結果。
  - 全 tests／typecheck／build 通過，validate-impl／verify-completion 有覆蓋與限制紀錄；之後依 AGENTS 收尾 release／index。
  - _Boundary: 本feature測試／模組、驗證harness及spec／API／操作文件_
  - _Requirements: 4.1, 4.2, 4.3_

## Task Plan Review
Gate PASS；Task-graph sanity PASS inline（依使用者規則未委派）：14/14 條件映射，先 source／粒子、再 state／合成、顯式跨界整合、最後 GPU。無隱含安裝、順序衝突、未定擁有權或 optional 關鍵驗證。

## Task-local Review
### Task 1
- RED_PHASE_OUTPUT：新增 world source／buffer 行為測試，Node runner exit1（createSpraySource 尚無 export）。GREEN：canonical test 97/97、typecheck exit0。
- VERDICT: APPROVED inline。git diff 及新增檔案直接審閱；buffer 固定、quality prefix 混合兩種粒子、pause/off/flow、source parent 變換、dispose 冪等可測；API clone 測試改只檢查 Mesh，符合 SceneAppearance 既有邊界。marker／secret scan 無新增命中。無 Caster／角色修改。
- Verification: VERIFIED（TASK，模組與 Node 範圍）；GPU 外觀保留 task4。

### Task 2
- RED_PHASE_OUTPUT：wet-lens Node runner exit1（WetLensState module 尚不存在）。GREEN：新增4條行為／渲染例外測試通過、全套101/101、typecheck exit0。
- VERDICT: APPROVED inline。直接檔案及diff審閱；近遠／背面／parent／透明外觀實體牆／hidden ancestor、反覆進出上限、殘滴下落、pause／off／reduced／low、render例外還原已覆蓋。markers／secret scan clean、無上層import。
- Verification: VERIFIED（TASK，狀態／射線／合成契約）；實際GPU合成保留task4。

### Task 3
- RED_PHASE_OUTPUT：UI及city source測試 exit1，缺少 water-lens label／getWaterSpraySource。GREEN：canonical test102/102、typecheck（build內）通過。
- 修正：main callback 誤用 app DOM 變數，由typecheck指出並改為viewer公開API及AbortSignal。Vite sandbox spawn EPERM，宿主核准重跑build exit0，未改設定繞過。
- VERDICT: APPROVED inline。diff確認 rendered camera 更新順序、雙 render 分支最後合成、context clear、off立即clear、Prototype背景delta0及pagehide釋放、UI listener abort。無角色／導航行為變更。
- Verification: VERIFIED（TASK）；production water.html實際WebGL2啟動，噴濺預設近景可見落水／飛濺與鏡頭滴，console warn/error空；其餘GPU／成本在task4。

### Task 4
- GREEN：最終canonical102/102 tests、tsc＋production build exit0、GPU24/24、兩入口boot、控制面板開關、10資源循環及兩品質隔離off/on短樣本通過。修正兩個harness錯誤判準（初始z=5／魚眼非全黑），非產品缺陷；移除source vector clone與spawn slice的每幀暫存配置後，重建並重跑GPU及樣本。
- VERDICT: APPROVED inline。validate-impl本機實作整合GO：14/14覆蓋、無blocked、檔案／API／依賴方向對齊、無新依賴或角色／導航擴張。完整證據及實機限制見validation。
- Verification: VERIFIED（TASK／FEATURE_GO，本機production範圍）；Release／index收尾按實際結果另記，不先宣稱發佈成功。
