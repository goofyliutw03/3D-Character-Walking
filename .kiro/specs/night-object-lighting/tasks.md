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

