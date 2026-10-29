# Implementation Plan

採 sequential／inline review。使用者已核准本階段範圍；依 AGENTS 自動依序執行，一次一項，不委派、不commit。

- [x] 1. 實現單點靜態繞行與跑步意圖
  - 有效目的地可沿安全路徑繞過矩形障礙，經真實移動控制器抵達並停止。
  - 拒絕越界／障礙內／不可達點；重選、卡住與取消具有可測狀態。
  - 共用既有角色半徑，不改物理或動畫權威。
  - _Boundary: DestinationNavigation, motion radius contract_
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. 實現與畫面一致的地面拾取
  - 普通／魚眼反投影可roundtrip，圓外／無效尺寸拒絕。
  - 實際城市首個命中面決定地面，遮擋／非地面及不可走點拒絕。
  - _Boundary: ScreenRay, GroundPicker, CityScene ground tagging_
  - _Depends: 1_
  - _Requirements: 2.1, 2.3, 2.4_

- [x] 3. 實現輕點辨識及手動取消通知
  - tap提交；拖曳再回原點、長按、多指、取消／失焦／釋放不提交。
  - 鍵盤／按鈕／Stop／Jump及生命週期可通知取消，不變更既有方向sample。
  - _Boundary: TapGesture, InputManager_
  - _Requirements: 2.2, 4.1, 4.2, 4.4_

- [x] 4. 整合導航、目的地標記與同屏手機控制
  - 接通實際canvas點選→導航→原運動／動畫，狀態與marker對應；所有取消入口生效。
  - 唯一操作列位於場景正下方；直橫向／短高／safe-area、44px目標及鍵盤控制維持可用。
  - 完成本機production互動與既有功能回歸，記錄實機未驗範圍。
  - _Boundary: explicit integration — ViewerApp, main, CSS, index, feature tests_
  - _Depends: 1, 2, 3_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2_

## Task 4 整合驗證（2026-10-29）
- 原始 DOM 的方向控制在 aside、無 navigation status；完成後唯一操作列在場景正下方，接通 canvas → picker → navigation → 原 CharacterController／動畫。
- 54/54 tests、TypeScript／production build、git diff --check 通過。10/26 已驗證普通／魚眼跑步、抵達、Stop／Jump與多種手機尺寸；10/29 重新由正式產物驗證 rigged ready、點地 Run、Stop 回 Idle，以及844×390橫向畫面。
- VERDICT: APPROVED（inline），STATUS: VERIFIED，CLAIM_TYPE: TASK。依使用者授權自動審閱通過；無獨立代理審查。已檢查接線、事件釋放、取消入口及實際 diff，臨時 debug／flag 已移除。
- iPhone 三瀏覽器真機、OS生命週期及新導航的實際 context-loss 測試未完成；詳細覆蓋與限制見 validation.md。

## Task-plan review
2026-10-26 inline PASS：18條需求均有映射；1→2→3→4依序，無安裝／新runtime前置，跨模組接線集中於顯式整合task4。共用檔案不平行。依使用者範圍核准自動審閱通過；無獨立代理審查。

## Implementation Notes
### Task 1
- RED_PHASE_OUTPUT：canonical isolation=none 首次缺module；實作flag OFF後3/3失敗（false≠true／idle≠blocked），符合新增導航行為。
- GREEN：移除臨時flag後全套49/49 PASS（exit0），typecheck PASS；真實CharacterController＋CityScene繞樹／椅、rectangle、抵達、不可達及卡住測試通過。
- VERDICT: APPROVED（inline）。已讀actual diff及新增檔、placeholder／secret掃描clean；只公開既有radius，無motion公式改變、無導航寫transform／新依賴。STATUS: VERIFIED，CLAIM_TYPE: TASK；範圍限task1，尚未宣稱runtime接線完成。
- 首次未指定isolation參數遭spawn EPERM，改用專案既有--test-isolation=none；環境失敗不當功能RED證據。

### Task 2
- RED_PHASE_OUTPUT：新增測試缺module失敗；picker flag OFF時實際城市有效路面回傳null（1,5）失敗，screen-ray roundtrip通過。
- GREEN：移除臨時flag後全套51/51 PASS（exit0），typecheck PASS；portrait／landscape透視與魚眼、地面標線、樹／椅／前景遮擋及邊界拒絕通過。
- VERDICT: APPROVED（inline）。檢查CityScene actual diff與新增檔；僅地面標記、無幾何或shader變更；掃描clean。STATUS: VERIFIED，CLAIM_TYPE: TASK；尚待task4 canvas接線。

### Task 3
- RED_PHASE_OUTPUT：InputManager實際consumer未收到callback（true≠false），TapGesture尚無module。新增後tap／drag-back／long／multi／cancel／lostcapture／blur／hidden／resize／dispose與手動通知皆通過。
- GREEN：全套54/54 PASS（exit0），typecheck PASS。VERDICT: APPROVED（inline），已檢查actual input diff及新增gesture；事件不preventDefault、不攔Orbit，不更動sample量化，placeholder／secret掃描clean。STATUS: VERIFIED，CLAIM_TYPE: TASK。
