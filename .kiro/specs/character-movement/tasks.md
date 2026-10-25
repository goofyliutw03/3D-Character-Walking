# Implementation Plan
使用者已確認里程碑 3；自動審閱、依序執行、不自動 commit。共用檔案不可平行修改。

- [x] 1. 運動基礎
- [x] 1.1 建立測試入口與運動資料契約
  - 以既有 Node 跑行為測試，記錄尚無功能的失敗基線，無新依賴。
  - 完成時 test 命令可執行並能偵測缺少能力；應用依賴與 TS 設定不變。
  - _Boundary: motion types, test infrastructure_
  - _Requirements: 6.3_
- [x] 1.2 完成移動、跳躍、地面與靜態碰撞
  - 正規化方向、Run／Stop、單次跳躍、落地、delta cap；實際位移推導動作。
  - 完成時測試證明邊界、障礙、滑動與地面高度，不重複連跳。
  - _Boundary: CharacterController_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3_

- [x] 2. 角色、輸入與跟隨
- [x] 2.1 完成三種人物與動作姿態
  - 共用資源、切換保留 transform、原型外觀與踏步／跳躍姿態。
  - 完成時測試可檢查高度差、pose 與資源 dispose。
  - _Boundary: Character_
  - _Depends: 1.2_
  - _Requirements: 1.1, 1.2, 1.3, 6.2_
- [x] 2.2 完成鍵盤、指標與清除輸入
  - 表單隔離、jump pulse、Run／Stop、blur／hidden 與 pointer cancel。
  - 完成時 cancel／lostcapture／dispose 不殘留方向或事件行為。
  - _Boundary: InputManager_
  - _Requirements: 2.5, 4.1, 4.2, 4.3, 4.4, 6.2_
- [x] 2.3 完成位置及朝向跟隨
  - 依角色 transform 構圖，支援 immediate／reduced-motion。
  - 完成時測試證明移動目標帶動鏡頭、立即模式到位。
  - _Boundary: FollowCamera_
  - _Requirements: 5.1, 5.3_

- [ ] 3. 整合與驗證
- [ ] 3.1 整合城市資料、loop、生命週期及可見控制
  - CityScene 發布碰撞、單一 loop 更新、Follow／Orbit 互斥。
  - 完成時角色選擇、方向、Run／Jump／Stop、狀態可操作，production build 通過並保留光影／靜態鏡頭。
  - _Boundary: CityScene, ViewerApp, UI integration_
  - _Depends: 1.2, 2.1, 2.2, 2.3_
  - _Requirements: 1.1, 1.2, 1.3, 2.3, 3.1, 3.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_
- [ ] 3.2 執行完整行為、瀏覽器與回歸驗證
  - 完整測試與 build，production preview 首次可用、走跑跳停、切角色、相機與失焦。
  - 完成時有可見輸入、窄螢幕與既有光影證據；限制明列，不冒稱實機效能驗收。
  - _Boundary: feature validation_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_

## Task-plan review
2026-10-24 inline PASS：7 個子任務，22 個驗收條件完整對應；基礎／核心／整合／驗證順序清楚、依賴無循環；不平行、不委派、不自動 commit。

## Implementation Notes
逐項 review、RED／GREEN 證據與最終結果存於 validation.md；runtime smoke 必須驗證實際 production artifact。

