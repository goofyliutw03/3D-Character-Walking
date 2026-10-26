# Implementation Plan
依使用者里程碑6授權自動inline審閱，一次一項，無委派／commit。相同ViewerApp／main／角色檔案必須依序進行，不可平行。

- [x] 1. 資產與骨架動作
- [x] 1.1 製作三個授權清楚且可重建的骨架GLB
  - 優先專用資產調查已有紀錄；骨架不相容／小孩未有適合候選時依授權製作衍生。
  - 三GLB具有四clips、skinned mesh，child頭身比例不同且標示衍生；來源與hash完整。
  - _Boundary: Asset pipeline_
  - _Requirements: 1.1, 1.2, 1.3, 3.2, 3.3, 5.1_
- [x] 1.2 完成模型正規化與骨架動作播放
  - 四動作可辨識、轉場不重複reset、不累積active actions，世界位置由motion控制。
  - 真實GLB行為及資源釋放測試通過。
  - _Boundary: RiggedCharacter, AssetCatalog_
  - _Requirements: 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 5.2_

- [x] 2. 載入及整合
- [x] 2.1 完成最新選擇優先的非同步載入與錯誤重試
  - 快速切換／dispose後舊結果不可顯示且會釋放；失敗可retry，無unhandled rejection。
  - 缺骨架／clip與loader reject皆可測。
  - _Boundary: CharacterAssets_
  - _Depends: 1.2_
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
- [x] 2.2 整合角色／真實載入狀態與既有鏡頭泡泡
  - 主程式透過public API使用loader；fallback與derived來源清楚，error可重試。
  - 三高度／First person／魚眼／表達內容／390×844維持既有功能。
  - _Boundary: Integration — ViewerApp, main, CSS_
  - _Depends: 2.1_
  - _Requirements: 1.2, 2.1, 2.2, 4.1, 4.2, 4.3, 4.4_

- [x] 3. 最終整合驗證
  - 完整測試及production build通過；browser三角色四動作、錯誤重試及資源stats有證據。
  - 資產單檔≤2MiB、同時顯示一個角色；區分本機樣本與實機／跨GPU未驗收。
  - _Boundary: Integration validation_
  - _Depends: 2.2_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_
