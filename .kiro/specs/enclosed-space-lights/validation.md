# [1Y-7] 驗證

2026-11-07，原始 checkout，保留既有未提交修改。依使用者授權自動 inline 審閱 requirements → design → tasks → 實作與驗證，未冒稱逐份人工核准。

- 155 tests PASS，含新增原子設定驗證／快照隔離、全部 30 處固定燈具可開啟、隨機至少 5 火把／13 晶簇、手動色彩／強度不被動畫覆寫、效果恢復、reduced motion 與日照不覆寫手動開關。
- typecheck、Vite production build、scripts/project.ps1 release 成功。增量同步至既定 Release，未刪除陌生檔案。
- 正式 localhost:4174，Chrome headless SwiftShader，Needle 與 legacy 入口各驗證 32 列場景光源、全部開／關、獨立色彩／倍率／effects、Solar Sport 後關燈保留、切城市隱藏面板、重進洞穴倍率回預設。WebGL error 0，runtime／shader errors 空陣列。
- 忽略的 .local/environment-lights-validation 保留截圖與 results.json；目視確認面板、燈具、洞內光照與天井光束。審閱發現倍率 output 換行，已加不換行及 range 伸縮樣式。發現零強度天井仍有光束，已同步倍率並加測試。
- 動態光源材質採明確 preserveLightMaterial，避免相機透明／線框複製 uniform 導致手動改色失效。水景的原有 clone／restore 回歸通過。
- 初次 Release 測試因過廣的光效材質排除造成水景測試失敗，已縮小標記範圍並重跑通過，失敗版本未同步。

量測為全部場景光源開啟後 29 個 requestAnimationFrame 間隔，Needle 平均 248.8 ms，legacy 253.0 ms，屬軟體 WebGL 環境的功能檢查，未代表硬體 GPU 流暢度。未做手機 LAN、真機多光源效能、讀屏或所有色彩組合目視驗收。頭燈使用原有唯一面板與來源，未新增第二份設定。

模組審閱確認來源副本、驗證再套用、場景資源釋放、固定粒子容量。切換使用既有 SceneSwitch／Environment 可選 lights 契約，城市及未宣告光源的場景可沿用。對未來空間不新增場景幾何。

Token 用量：無法取得精確值。此階段無官方起訖用量基準，未使用估算值。無 commit／push。索引結果見最終交付。

最終版本於 2026-11-07 23:37:03 +08:00 發佈，新增 8／更新 1／略過 21；修正後再次執行 Needle／legacy harness 均 PASS。面板數值換行修正已由截圖確認。

SocratiCode 增量更新已完成，3 新增／10 更新、103 chunks，status green、511 indexed chunks，完成於本次 23:39（Asia/Taipei）。沒有索引錯誤。最終 tasks 文件完成後再確認索引。

## 使用者驗收

2026-11-08（Asia/Taipei），使用者回覆「Ok 驗證完成」，本階段封閉空間光源面板記為 USER_REPORTED_PASS，完成結束確認。未提供裝置、瀏覽器或效能數據，既有工具測試與效能量測範圍仍依上文。此回報不新增實測數據。
