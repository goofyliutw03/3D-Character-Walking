# 自然地表執行任務

所有任務依序、inline 審閱，無平行委派。requirements／design／tasks 經使用者本階段授權自動審閱，非逐份人工核准。

- [x] 1. 建立共用高度與一致射線地表
  - 先寫非平面內點、對角線、邊界與量化一致性測試，再建立格網及 GPU／CPU 表面。
  - 完成時角色貼地及普通／魚眼點選可與可見三角面比較，誤差 <1mm。
  - _Boundary: HeightField, TerrainScene surface_
  - _Requirements: 2.1, 2.2, 3.1_
- [x] 2. 完成地表場景、草木與生命週期
  - 程序草木／樹幹障礙、光照、標準／低品質、減少動態效果及資源冪等釋放。
  - 完成時品質不改高度、樹幹不能穿越，dispose 事件均觸發且重新建立有效。
  - _Boundary: TerrainScene_
  - _Requirements: 1.1, 2.3, 3.2, 3.3, 4.1_
- [x] 3. 整合切換、面板與 Profiles
  - 明確整合跨模組接線；新增場景能力與地表控制，舊 Profiles 不需遷移。
  - 完成時可選 terrain、保存 terrain00 並還原品質／風動，city／cave 回歸通過。
  - _Depends: 1, 2_
  - _Boundary: Environment, Viewer, UI, Settings integration_
  - _Requirements: 1.1, 1.2, 1.3, 4.2, 4.3_
- [x] 4. 驗證整合與渲染
  - 全套測試、型別／正式建置、Needle 與 legacy production 操作、光影截圖及反覆切換。
  - 完成時記錄實際結果、錯誤、覆蓋與人工限制，無未解必要程式問題。
  - _Depends: 3_
  - _Boundary: Feature validation_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

## 收尾（非實作任務）
依 AGENTS 執行 Release 與 codebase_update/status；不得只啟動背景索引即宣稱完成。token 精確起點缺漏，最終如實註明。
