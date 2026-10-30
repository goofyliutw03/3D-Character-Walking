# Implementation Plan

依使用者已核准 v02 範圍逐項執行；共用檔案必須依序進行，不可平行。無 commit／push 授權。

- [x] 1. 建立獨立站立接收角色
  - 既有授權 woman GLB 獨立載入、fallback／retry／late result 釋放；重設站位、胸口錨點與陰影。
  - 真實資產測試證明站立狀態及資源不受另一實例切換／釋放影響，dispose 後不再採用非同步結果。
  - _Boundary: TargetActor_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.4_

- [x] 2. 建立有上限定向粒子及命中回饋
  - 參數驗證／發射快照／線段球碰撞／一次命中／短回饋／逾時／重設／dispose。
  - 測試可區分命中與移動後未命中，快速連發不超出上限，非法參數不改設定，清除後無效果物件。
  - _Boundary: ParticleInteraction_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.4_

- [x] 3. 整合雙角色標示、發射與設定控制
  - ViewerApp 組裝、錨點／標籤投影、獨立載入狀態、UI 參數與按鈕；context lost／dispose。
  - production build 可啟動，UI 可觸控／鍵盤操作且不觸發導航；既有角色控制及相機維持可用。
  - _Depends: 1, 2_
  - _Boundary: ViewerApp／main／style integration_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

- [x] 4. 完成整合回歸與 production 操作驗證
  - 驗證重複／連續發射、命中／未命中／逾時、移動／角色切換、參數、重設與資源；全 tests／build。
  - production 真實 GLB、雙角色、鏡頭與導航操作有觀察紀錄，清楚區分 localhost 與手機／跨GPU待驗。
  - _Boundary: feature integration validation_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

## Task Plan Review
inline PASS：需求12條全映射、先角色再效果再整合再驗證；無隱藏套件／資產前置；每項具可觀察完成條件。Task-graph sanity inline PASS，未派獨立代理；依使用者授權自動審閱核准。

## Implementation Notes
Task 3：canonical tests 73/73、typecheck／production build exit0；IAB production 實際雙角色 ready、click連發、Space發射不跳躍、上限拒絕、設定非法拒絕、reset、Child切換／Target不變、First person及魚眼／wireframe／transparent驗證。inline VERDICT: APPROVED／STATUS: VERIFIED，無邊界擴張；context loss 修正為清除後同步統計。整合未另執行 feature-flag OFF RED，採 task 1／2 核心 RED 與 production 互動證據，明示流程差異，不宣稱完整 flag protocol。
Task 4：canonical tests 73/73；高速命中／未命中逾時、設定快照與512次滿額命中資源回收已測。production 無 error console，窄版390×844可點Fire、控制換行；視窗已復原。Caster移動後既有auto zoom可能極近構圖，未改相機策略；未做手機LAN／跨GPU／screen reader／context loss實機驗收。inline VERDICT: APPROVED／STATUS: VERIFIED（本機功能範圍）。未 commit。
Task 2：RED ERR_MODULE_NOT_FOUND；GREEN canonical tests 71/71、typecheck exit0。inline VERDICT: APPROVED／STATUS: VERIFIED；獨立方向快照、掃掠一次命中、逾時距離裁切、上限及冪等 disposal 皆驗證，無新依賴。未 commit。
Task 1：RED 為 isolation=none 下 ERR_MODULE_NOT_FOUND（初次未加 isolation 的 EPERM 屬環境，未當作行為 RED）；GREEN canonical test 68/68。inline VERDICT: APPROVED，STATUS: VERIFIED；檢查新檔與真實 GLB、獨立 skeleton／geometry／mixer、retry／late disposal，無 boundary spillover。未 commit。Release／索引為 AGENTS.md 已授權收尾操作，不另擴張功能 task。
