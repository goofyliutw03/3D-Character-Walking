# Implementation Plan

依使用者核准的1M-0計畫，sequential、inline review，一次一項；不委派、不commit。Requirements／design／task coverage自動審閱通過，非逐份人工核准。

- [x] 1. 環境外觀與可還原材質
  - 完成environment分組及SceneAppearance；透明只影響遮擋物組、線框涵蓋環境，離開／dispose恢復原材質引用且clone只釋放一次。
  - _Boundary: CityScene、SceneAppearance、tests/scene-appearance.test.mjs_
  - _Requirements: 3.1, 3.2, 3.3, 4.3_
- [x] 2. 遮擋顯示鏡頭
  - CameraObstruction在desired不變前提平滑拉近／退回；多層身體遮擋可透明，First person不縮距／透明，reduced-motion直接到位。
  - CameraController僅產生desired構圖；Front候選只在zoom啟用；既有Front驗證改為檢查完整輸出。
  - _Boundary: CameraObstruction、CameraController、tests/camera-obstruction.test.mjs、tests/front-obstruction.test.mjs_
  - _Depends: 1_
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2_
- [x] 3. 整合鏡頭操作與設定
  - ViewerApp組裝desired／rendered、resize、picker／overlay、狀態與dispose；Camera選單預設Auto zoom，模式跨鏡頭／Follow／角色保留且提示同步。
  - 真正OrbitControls回歸證明縮距不改使用者縮放、旋轉、pan與角色中心Orbit；魚眼與First person lens保持一致。
  - _Boundary: ViewerApp、main、tests/camera-obstruction.test.mjs_
  - _Depends: 2_
  - _Requirements: 1.1, 1.2, 2.3, 3.3, 4.1, 4.2, 4.3_
- [x] 4. 整合驗證與修正
  - 全套tests／typecheck／build及production browser實際三模式操作、角色／Follow／魚眼／First person／Orbit／點地Run與resize通過；檢查console與資源還原。
  - 執行validate-impl與verify-completion，對照12條件與設計，無未解LOCAL缺陷；人工實機限制保留。
  - _Boundary: 本feature檔案與對應測試（僅必要修正）_
  - _Depends: 3_
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

## Implementation Notes
發佈、文件同步與索引屬AGENTS已授權收尾流程；不列作新增交付里程碑。各task需記錄RED／GREEN、inline review verdict與fresh evidence後才勾選。

### Task 1 review / verification
- RED_PHASE_OUTPUT: canonical isolation=none 執行新測試，ERR_MODULE_NOT_FOUND（SceneAppearance不存在），exit1。先前省略isolation=none的spawn EPERM為環境錯誤，不作行為RED證據。
- GREEN: `./scripts/project.ps1 test` exit0，60/60；`./scripts/project.ps1 typecheck` tsc exit0。
- VERDICT: APPROVED（inline）。讀取實際CityScene diff及新檔，geometry／material所有權未變、主角在環境外、array引用還原、共享texture未釋放、連續mode及dispose釋放一次，無placeholder／secret命中。
- Verification STATUS: VERIFIED；僅task1，尚未宣稱整個feature完成。未commit。

### Task 2 review / verification
- RED_PHASE_OUTPUT: 新camera-obstruction測試ERR_MODULE_NOT_FOUND，exit1。拆分desired後既有Front直接檢查desired的安全距離失敗；依design改檢查完整rendered輸出，未刪除身體可讀性／頭腳安全斷言。
- 修正：Front靜止漂移量約3.5e-8m，確認為指數收斂尾差而非候選角度震盪；縮距比例在差小於1e-8時收斂到目標，最大95m觀察距離誤差低於1微米。
- GREEN: `./scripts/project.ps1 test` exit0，64/64；typecheck及git diff --check exit0。
- VERDICT: APPROVED（inline）。實際diff／新模組對照設計，desired未被覆寫、多層遮擋與不可見祖先、First person及三模式還原測試通過，無新依賴／placeholder／secret。
- Verification STATUS: VERIFIED；task2範圍，UI尚未接線。未commit。

### Task 3 review / verification
- RED_PHASE_OUTPUT: 原Release 4174實際UI無Objects block mode；新整合測試首次執行遇無DOM OrbitControls.dispose測試fixture錯誤，移除未曾connect的無DOM controls.dispose後通過，未改產品程式繞過。
- GREEN: 全套66/66，build（含tsc）exit0；production4173實際Objects block mode三選項及線框顯示可用，First person／Third person切換保留線框、主角正常顯示，console warn/error空。
- VERDICT: APPROVED（inline）。已讀ViewerApp／main實際diff；Orbit綁desired、resize同步aspect、picker／overlay／renderer綁rendered，dispose先還原外觀再city資源，狀態包含mode且UI不操作底層物件。無邊界外修改／新placeholder／secret。
- Verification STATUS: VERIFIED；更廣production操作與發佈仍待task4／收尾。

### Task 4 review / verification
- VERDICT: APPROVED（inline）。validate-impl／verify-completion：12/12條件覆蓋、4/4 sections、跨任務狀態／所有權／檔案與設計吻合；無未解LOCAL缺陷、blocked task或placeholder／secret。
- Fresh evidence: 2026-10-30 `./scripts/project.ps1 release` exit0，66/66 tests、tsc／build PASS；4173 production三模式／近牆透明／First person／魚眼／Child／390×844及點地Run／Stop／Orbit通過。正式4174新頁WebGL2 ready、Rigged man Ready、預設zoom及切Wireframe成功，console warn/error空。
- Verification STATUS: VERIFIED（本機FEATURE_GO）；不代表M6／SCENE-05真機驗收。發佈同步與索引另記validation，不commit。
