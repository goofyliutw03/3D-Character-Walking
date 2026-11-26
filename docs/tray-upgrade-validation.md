# 系統匣服務替換與版本提示（2026-11-12，1V-1）

## 授權與範圍

使用者要求取代現有 System tray service 並增加版本提示，隨後明確選擇「保留目前 Release，只替換系統匣服務」。NORMAL，均衡能力／中推理建議；無模型切換、委派、commit 或 push。直接升級原始專案 scripts/viewer-desktop.ps1，保留 4174、既有 Startup 與 Debug 入口。未匯入或合併 origin/main 的 release-tray／4175 路線。

原始 checkout：D:\Work_Mine\AI-Projects\3D Character Walk Viewer；branch codex/v02-particle-system；HEAD 8284cd1c9279916cac90143184f9217bca3bbf9b。bounded-flight 與其他既有修改全部保留，未 reset、stash、切換 checkout 或切分修改。本次新增版本 helper 與 PowerShell 測試，並更新本文件及 release.md；未修改 Viewer／Vite／套件或下載依賴。

## 審閱與驗證

inline 審閱，未宣稱獨立代理審查。服務版本固定為 1.1.0，Release 指紋只取實際外部入口 SHA256，來源 commit 無紀錄時顯示 unknown。入口未變時不重複通知；啟動／Restart 與入口改變時提示。NotifyIcon tooltip、選單版本列及 Version details 提供持續可查的資訊。新增具名停止事件，沿用原 mutex 單例與持有 Process 的自有服務清理。

- PowerShell parser 無錯誤；test-release-version.ps1 PASS：入口缺失、完整 hash／短指紋、未知來源、時間變動不改版本、入口內容變更改版本。
- project.ps1 test：222/222 PASS；涵蓋目前工作樹，但不代表 bounded-flight 全功能或其人工驗收完成。
- 以具體命令列與建立時間核對舊 tray host PID19232，僅停止該 host 及其子程序；隱藏啟動新版成功，runtime 記錄 ServiceVersion 1.1.0，HTTP4174 回應200。
- 新版額外啟動一次：重複程序正常退出，原 host 保留，單例 PASS。透過 stop 事件正常退出，host 與原自有 server 均退出、runtime 狀態檔移除；重新啟動成功並保留運行。最終 host PID2188、server PID11540，HTTP200。這是生命週期檢查，不是點選 Restart／Exit 的人工操作證據。
- 既有 Startup `3D Character Walk Viewer.lnk` 已核對指向原始專案 viewer-desktop.ps1 tray，保留不重寫；先前只查 `City Character Release.lnk` 的不存在結果不適用此啟動器。
- 按本次明確選擇，不執行 project.ps1 release、不 build Viewer、不寫入外部 Release。替換前已保存 Release 全檔 SHA256 清單於忽略的 .local/tray-upgrade/release-before.json，替換後比對結果於收尾補記。
- Release 入口 SHA256：f695966ecb83a0a24d596623ee4afd34a4931c7b7f89e16ab8e5e80b82fbc91f，指紋 f695966ecb83。沒有此 Release 的建置來源證據，不宣稱等同 5811400 或目前 checkout。

## 限制與回復

初次交付時，人物圖示外觀、氣球提示實際可見、Version details、Browsing／Restart／Exit 的原生點擊及重新登入／重開機仍待人工驗收；後續結果見下方 1V-2 紀錄。未用 callback、HTTP 或 runtime JSON 代替人工 PASS；未自行登出／重開機。Windows 可收合圖示或抑制通知；入口 hash 不涵蓋入口未變的固定名稱資產更新。M6 手機／跨 GPU／效能門檻／讀屏等其他待辦不變。

## 2026-11-18 人工驗收接續（1V-2）

- 已確認 1V-1 交接完成；驗收對象為 viewer-desktop 1.1.0、http://127.0.0.1:4174/、Release 入口指紋 f695966ecb83，並非 origin/main 的 release-tray／4175 路線，不勾選該路線的 task 5。
- 使用者依五項清單回覆「Done and verified, every thing fine. Please go on」：人物圖示／滑鼠提示、Version details 版本與指紋、Browsing 預設瀏覽器及頁面、Restart 後重新整理、Exit 圖示消失，均記為 USER_REPORTED_PASS。這是使用者回報，非工具直接觀察；不延伸為氣球通知已驗。
- 工具觀察：Windows UI 工具僅列 Chrome 與 Codex 視窗，未暴露工作列／系統匣，因此未執行原生點擊。唯讀 version 查得入口指紋不變；回報後 HTTP4174 為200，runtime 狀態檔記載 HostPid16964／ServerPid17200，表示當下服務可用，不能作為 Exit 後自有服務已清理的直接證據。先前 PID10928 已被 ctfmon 重用，未對該程序操作；未停止任何程序。
- 使用者另明確回報「已完成，且自啟正常」及 Exit 後「是，已重新啟動」：重新登入／重開機後自啟記為 USER_REPORTED_PASS（未區分實際採重新登入或重開機，不宣稱兩種各別皆測）；重新啟動可解釋回報後仍有服務運行。Exit 圖示退出依使用者回報通過，自有服務清理沿用 1V-1 stop 事件生命週期測試證據，本次未取得 Exit 後、再次啟動前的程序快照，不冒稱直接觀察該瞬間。
- 本 chat 要求的人工驗收與結果整理完成；氣球通知實際可見及既有 M6 其他待驗項不在本次通過範圍。未修改 origin/main release-system-tray task 5，因其為不同啟動器路線。
- 本次僅更新驗收文件，保留既有未提交修改與外部 Release；沿用「保留目前 Release」授權，不 build／release、不 commit／push。文件變更以差異檢查驗證，不重跑產品測試。
- token 用量：無法取得精確值；本接續段沒有可取得的官方起點／結束用量數據。
- 收尾索引：2026-11-18 08:01（Asia/Taipei）。首次更新因既有 Qdrant 未啟動而失敗；依授權執行 rag.ps1 start 後，health 三項皆 True，未安裝或下載。同步 codebase_update 掃描184個可索引檔，更新1檔／2 chunks；codebase_status green、687 chunks、Incremental update completed。範圍為原始專案既有忽略／副檔名規則，非外部 Release，亦不宣稱 Markdown 均有 embedding；無剩餘索引錯誤。

回復：先執行 viewer-desktop.ps1 stop，確認本次 host／自有 server 均退出；從 .local/tray-upgrade/viewer-desktop.before.ps1 恢復僅此 launcher，從既有 Startup 捷徑重新啟動。無需回退整個 checkout、改 Release 或移除其他服務。備份為本機忽略內容，不是版本控制中的永久備份。

Token 用量：無法取得精確值；缺少可歸屬的官方起點／結束用量區間，未將帳號額度或估算當 token。

最終 SHA256：外部 Release 424 個檔案全部與替換前清單一致，無新增／移除／內容改變。git diff --check PASS；既有 WorldQuery／GroundWorldQuery 的 CRLF 提示非本次錯誤。新版 tray stderr 無輸出。未 commit／push。

索引：2026-11-12 07:29（Asia/Taipei），既有 rag.ps1 start 後 health 的 Qdrant／Ollama／EmbeddingModel 全 True，沒有安裝或下載。codebase_update 同步完成：掃描184個可索引檔，新增1／更新1／移除0，5個新chunks；graph153檔／417edges。範圍為目前原始專案依既有忽略與支援副檔名設定的索引快照，包含目前工作樹，不含外部 Release 或 .local，不宣稱每份 Markdown／PowerShell 均有 embedding。status 已確認 green、687 chunks、Incremental update completed，watcher disabled；未把服務啟動當索引完成。
