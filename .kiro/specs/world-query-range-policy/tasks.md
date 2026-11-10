# Implementation Plan
依本批使用者授權自動審閱，必須依序進行，不可平行。無委派；逐項明確執行並驗證，commit 另行核准。

- [x] 1. 建立權威查詢與城市範圍判定
  - 先建立失敗測試，再提供型別結果、能力、位置／連續掃掠／表面／區域與水平射線相容查詢。
  - 完成時尺寸、缺省拒絕、非法資料、邊界切線、高速及不支援查詢測試通過。
  - _Boundary: World Query / Range Policy_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_
- [x] 2. 整合城市操作的共用限制
  - 顯式整合 controller、navigation、CityScene 及既有巡迴／編輯入口，保留步跑跳與交通／鏡頭政策。
  - 完成時四流程對同一代理／邊界決策一致，非法輸入／高度缺口不污染狀態，完整既有回歸通過。
  - _Boundary: City integration_
  - _Depends: 1_
  - _Requirements: 3.1, 3.2, 3.3, 4.1_
- [x] 3. 審閱、production 驗證與交付
  - 完成 inline validate-impl、型別／建置／production smoke、Release 增量發佈及索引/status，記錄證據與限制。
  - 完成時 validation 可追溯所有11條件；明列未交付三維能力及手機待驗，不擴張到下一場景批次。
  - _Boundary: Integration validation_
  - _Depends: 2_
  - _Requirements: 4.1, 4.2_

## Task Plan Review
PASS（inline）：11/11 條件對應、型別→適配→消費端→production 順序明確。Task-graph sanity PASS（inline，使用者禁止委派）；無未安裝 runtime，既有 Node／Vite／Needle 可用，原始183 tests通過。所有共用檔依序修改。

## Implementation Notes
Task 1 VERIFIED／inline APPROVED：測試先因新 module 尚未建立 ERR_MODULE_NOT_FOUND 失敗（不是 assertion RED），實作後6/6查詢測試與 tsc 通過。能力明列 planar-extrusion；資料即時讀取、缺省拒絕、接觸／高速／尺寸與不支援查詢已驗證。無外部依賴或獨立 reviewer。

Task 2 VERIFIED／inline APPROVED：三項整合測試先 assertion RED（非法intent污染NaN、City未持有query、消費端未調用query），整合後 PASS。補正容差內離開障礙、沿邊移動判定，1500段固定seed高速sweep接觸後不在禁入內；完整193/193及tsc PASS，宿主production build109 modules PASS。sandbox Vite spawn EPERM僅為環境失敗，沒有sync；後續宿主build成功。交通、鏡頭與模擬時鐘未修改。Task 3開始。

Task 3 VERIFIED／inline APPROVED：最終193/193、型別／109modules build、正式Release與31檔SHA256、完整頁面Needle／legacy smoke皆PASS，三角色／XYZ／巡迴／自動跑步／場景往返、canvas無增加且GLerror0／errors空。增量索引完成、status green，176可索引檔、625chunks／graph146files369edges；metadata收尾後再次增量確認。詳細證據／測試harness修正、token子區間與完整三維能力限制見validation。無commit／push或獨立reviewer，未啟動下一批。
