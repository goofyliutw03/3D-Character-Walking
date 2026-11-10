# 任務

- [x] 1. 實作自動奔跑、觀看、手勢與滾輪狀態，驗證邊界。
- [x] 2. 接入相機、運動、頭燈與面板，保留既有模式。
- [x] 3. inline 審閱、測試與瀏覽器驗證、Release、索引與限制紀錄。

- [x] 4. 1Y-5 建立模式輸入策略、切換管理與DOM輸入管理，驗證既有行為及手勢重設。
- [x] 5. 1Y-5 inline審閱、完整驗證、Release與索引。

- [x] 6. 交互審查與修正。建立有向視角／跑停／Follow／轉場／遮擋矩陣，修正焦點、重複 F1、跨場景檢視殘留。
- [x] 7. 場景能力模組。接入六類型政策、城市／洞穴與相容回退，測試其他類型契約。
- [x] 8. 交互審查收尾。測試、建置、瀏覽器、Release、索引與限制紀錄。
- [x] 9. 手機觸控與靜止縮放入口、操作按鈕、清理及回歸測試。
- [x] 10. 手機尺寸實際觸控事件瀏覽器驗證、Release、索引與手勢說明。

- [x] 11.1 實作鎖定生命週期及四模式靈敏度
  - 可連續轉向；Y/Stop/Esc/失焦/hidden安全退出；拒絕顯示實況；倍率即時生效。
  - _Boundary: CameraInputManager, AutoRunControls, ViewerApp, main_
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
- [x] 11.2 驗證既有控制及整合Profiles回歸
  - fresh測試與browser證據區分合成／真人限制。
  - _Boundary: validation_
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

## 1Y-10 task11.1 inline review
RED：configureSensitivity介面不存在；GREEN：四倍率、鎖定相對位移、未鎖定180度、第一人稱界限、Esc/hidden/拒絕/晚到/卸載/coarse不鎖定局部測試pass。VERDICT: APPROVED，無獨立reviewer；native headless API回覆denied且UI如實顯示，不宣稱真人成功。未commit／push。

11.2 VERDICT: APPROVED（inline），全套175pass，Release browser確認實況／Y停止，手機coarse與舊控制回歸由測試覆蓋；真人Pointer Lock及手機驗收未宣稱。
