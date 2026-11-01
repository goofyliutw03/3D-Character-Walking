# Implementation Plan

- [x] 1. 建立有限物件光源掛載能力
  - 可掛載隨動、原子更新及移除；失效handle不能修改重用槽。
  - 驗證非法設定／offset、容量、跨池、重用及dispose，公開API範例可用。
  - _Boundary: ObjectLightPool_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1_
- [x] 2. 增加夜晚並讓六路燈照亮街道
  - 三時段往返可恢復原設定，夜間燈具與真燈同步。
  - 獨立燈具材質、完整回收及非法時段測試通過。
  - _Boundary: CityScene_
  - _Depends: 1_
  - _Requirements: 1.1, 1.2, 1.3, 4.1_
- [x] 3. 為粒子群組加入有界隨行照明
  - 發射快照、命中淡出與逾時／縮量／清除／dispose回收可驗。
  - 128效果最多8燈，滿額保留發射且釋出後補槽；碎片不移動Light。
  - _Boundary: ParticleInteraction_
  - _Depends: 1_
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1_
- [x] 4. 整合時段與粒子光源控制
  - Night選項及五個光源欄位可操作、原子拒絕非法值、顯示單位／容量限制。
  - ViewerApp公開委派且維持既有鍵盤／觸控導航隔離。
  - _Boundary: UI integration_
  - _Depends: 2, 3_
  - _Requirements: 1.1, 3.5, 3.6, 4.2_
- [x] 5. 驗證production整合與回歸
  - canonical tests/build與真GLB production GPU可用，日夜、照明參數、四遮擋／魚眼／水景回歸有證據。
  - 性能短樣本與限制如實記錄，未驗手機／跨GPU待辦保留。
  - _Boundary: Feature validation_
  - _Depends: 4_
  - _Requirements: 1.1, 1.2, 1.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2_

## Implementation Notes
- Task5 inline VERDICT: APPROVED；STATUS: VERIFIED。canonical108/108與production22/22 GPU、真入口UI成功；GPU／窄版／實機差異及工具限制詳validation。release於2026-10-31 18:33:44+08:00成功，tests/build/sync序列且17檔hash一致，無額外功能或依賴。
- Task4 inline VERDICT: APPROVED；STATUS: VERIFIED（桌面控制），窄版列task5。tsc/Vite build exit0（sandbox spawn EPERM經宿主核准原命令重跑）；production Night選項、標籤／範圍／套用、ArrowUp/Enter與發射成功。既有InputManager對input/select/button阻擋遊戲鍵、TapGesture限定canvas，未改輸入所有權。ViewerApp只新增lightRoot組合與時段委派，保留瀑布rendered camera流程。
- Task3 inline VERDICT: APPROVED；STATUS: VERIFIED。RED三項均因缺少光源／驗證失敗，GREEN canonical108/108 PASS（含4輪128連發）。首次GREEN發現空陣列spread呼叫Three.add產生警告，已改逐一掛回；重跑無該警告。快照、0.25秒淡出、釋出後補槽、失效回收及純Mesh移動經diff／tests確認。
- Task2 inline VERDICT: APPROVED；STATUS: VERIFIED。RED為六路燈預期6實為0；GREEN canonical105/105 PASS。diff檢查保留瀑布getWaterSpraySource，時段／霧／材質隔離／dispose符合，無新增marker或secret。視覺可讀性保留task5 GPU gate。
- Task1 inline VERDICT: APPROVED；STATUS: VERIFIED。RED為canonical isolation=none下ERR_MODULE_NOT_FOUND；GREEN新2 tests及canonical104/104 PASS。實際新增模組／tests逐檔審閱，失效／跨池handle、參數原子性、變換、dispose皆符合；無markers／secrets。第一次省略canonical isolation參數遇spawn EPERM，改用專案既有命令而非擴權。
- 規格／設計／tasks gate與task graph sanity：inline PASS，依使用者連續推進授權自動審閱通過，非人工逐份核准。一次一task，不委派、不commit。
- 既有Three／Node測試工具可直接使用，不需安裝。共用檔案在瀑布chat完成後依序修改。
- 設計修正：ParticleInteraction公開lightRoot指向停放root，ViewerApp將其作為scene sibling加入；既有root只包含Flight，保持原API／測試對children語義。所有權仍由ParticleInteraction.dispose管理。


## 追加單一路燈陰影
- [x] 6. CityScene單一共享陰影與最近燈選擇
  - 六PointLight直接持有、0.5m緩衝、Night/Shadows開關、冪等回收。
  - _Boundary: CityScene_；_Requirements: 5.1, 5.2, 5.3_
- [x] 7. 接入主角位置並驗證整合／發佈
  - movement後同步位置，Node回歸、production GPU回歸或明列工具阻擋、release與索引。
  - _Boundary: ViewerApp / Feature validation_；_Depends: 6_；_Requirements: 5.2, 5.4_

追加規格／設計／tasks inline自動審閱：PASS，依使用者明確授權，非逐份人工核准。邊界集中CityScene，維持通用pool與粒子契約；資源共享防止輪流選燈留下六份GPU target；task6→7依序，不委派、不commit/push。

Task6 inline審閱：PASS，night tests 2/2（含24輪fixture切換與時段／Shadows往返）exit0。首次缺少PointLightShadow公開export改用PointLight.shadow；資源測試抓到PointLight.dispose會重複釋放共享map，現集中釋放後清空map/mapPass，重跑通過。沒有擴張pool API。

Task7 inline審閱／驗證PASS：113/113 tests、tsc/Vite、production GPU20/20，2026-10-31 23:10:18+08 release Added2/Updated1/Skipped14成功；詳validation。

## 1R-3 手選多燈（依使用者明確授權依序推進）
- [x] 8. 獨立路燈陰影與選擇API／安全快照／回收測試
  - _Boundary: CityScene_；_Requirements: 6.3_
- [x] 9. ViewerApp委派與原生六checkbox、停用保留、輸入隔離
  - _Boundary: ViewerApp / main / controlPanelContent / style_；_Depends: 8_；_Requirements: 6.1, 6.2_
- [x] 10. 全套與production GPU、六燈成本、文件／release／索引
  - _Boundary: Feature validation_；_Depends: 9_；_Requirements: 6.4_

1R-3 規格／設計／task graph inline自動審閱PASS：手選語義、0–6有界、原子驗證、資源獨立及輸入邊界明確；依使用者授權，非逐份人工核准。不委派／commit／push。

Task8 inline PASS：night tests2/2，0/1/3/6選擇、非法及sparse陣列原子拒絕、快照／輸入陣列隔離、四輪切換、獨立shadow與各target一次dispose。首次編輯tests遇預設編碼錯誤後明用UTF-8修正重跑；舊測試呼叫已移除auto API的失敗已由新語義測試取代。

Task9 inline PASS：公開API委派、移除每幀auto選燈、原生fieldset/legend/六label；day/evening或Shadows off停用保留。沿用ControlPanel keydown隔離及canvas-only pointer導航。113/113 tests，tsc/Vite PASS（spawn EPERM後經宿主核准重跑）。

Task10 inline／feature gate PASS：fresh113/113 tests、tsc/Vite、GPU22/22、真production窄版UI10/10、release及hash17/17、增量索引green。requirements6四項完整覆蓋，Boundary audit CLEAN；未宣稱真機／跨GPU驗收，詳validation。

## 1R-4 自動觸發偵測
- [x] 11. 距離狀態API與主角完整世界位置更新，邊界／拒絕／保留／資源測試
  - _Boundary: CityScene / ViewerApp_；_Requirements: 7.2, 7.3, 7.4, 7.5_
- [x] 12. auto checkbox／radius range／公尺output與即時同步
  - _Boundary: main / controlPanelContent / style_；_Depends: 11_；_Requirements: 7.1, 7.4, 7.5_
- [x] 13. 全套tests/build、production GPU與窄版UI、文件、release及索引
  - _Boundary: Feature validation_；_Depends: 12_；_Requirements: 7.1–7.5_

規格／設計／tasks inline審閱PASS：依使用者明確授權自動審閱，非人工逐份核准。候選與effective狀態獨立、精確邊界、權威motion含高度，沒有新增pool或資源所有權；task11→12→13依序。

Task11 inline PASS：canonical114/114，含精確邊界、多候選、高度、世界父變換、非法輸入原子性、快照及模式往返；檢查motion→CityScene在movement後render前，獨立shadow所有權未變。

Task12 inline PASS：production build62 modules、420px真入口DOM14項（含原生label/range、即時output、狀態保留與鍵盤隔離），無水平溢出；非真觸控／讀屏。

Task13 inline PASS：114/114 tests、build62 modules、GPU29/29與UI14項；release2026-10-31 23:53:31+08 Added3/Updated1/Skipped13，17檔hash一致。最終索引結果見交付摘要。
