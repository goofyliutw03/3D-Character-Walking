# Implementation Plan

依核准範圍 sequential；不委派、不 commit。requirements／design／task plan gate 及 task-graph sanity review：inline PASS，依使用者授權自動審閱，非人工逐份核准。已檢查建置前置、單一 loop、先模組後 UI／測量；每項完成驗證後才勾選。

- [x] 1. 建立可建置的獨立原型入口
  - 保留街道並加入水景 production 入口，所有 HTML 在資產後發佈。
  - 可觀察完成：build 同時產生 index.html 與 water.html，原有入口不變。
  - _Boundary: Build entries, Release ordering_
  - _Requirements: 3.4_

- [x] 2. 實作程序化水景與可釋放設定契約
  - 青綠細波／反光、環形波、向下流動瀑布及接合泡沫；低／標準品質。
  - 可觀察完成：設定／凍結／恢復／非法值／品質替換／冪等釋放的 Node 測試通過；shader 可在下一項 production 場景驗證。
  - _Boundary: WaterFeature, waterShaders_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_

- [x] 3. 整合獨立場景、操作及效能比較
  - 場景／鏡頭／控制、暖機與正式三輪採樣、隱藏／resize 中止、統計與資源循環測試。
  - 可觀察完成：production 頁面可操作，含固定條件、測量結果、取消及明確錯誤呈現；全部測試與 build 通過。
  - _Boundary: WaterPrototype, WaterBenchmark, WaterMain, WaterCSS_
  - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

- [x] 4. 執行功能整合、WebGL 與效能驗證
  - 近／遠／斜角、操作、透明排序／泡沫接合、shader errors、重複釋放及正式 A/B。
  - 可觀察完成：全套 tests／production smoke 與完整測量有新證據；無法執行的環境明列，手機不冒稱驗收。
  - _Boundary: Water integration validation_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

## Implementation Notes
Release／索引為專案授權收尾，結果記 validation；本 tasks 不新增交付里程碑。原型風格確認與街道整合仍待使用者。

4 項完成，task-local review VERDICT: APPROVED（inline）；最終 82/82 tests、build、Release、標準／低品質各三輪及資源循環有新證據，見 validation。真機及實際背景降頻仍未驗，不冒稱通過。
