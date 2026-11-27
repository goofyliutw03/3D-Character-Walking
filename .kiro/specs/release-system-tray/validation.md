# 驗證紀錄（2026-11-11，1V-0）

## 2026-11-27 系統匣版本選單整合

- 將 GitHub 桌面系統匣的 Version／Version details 整合至正式 4175。顯示前核對目前服務的身分與入口 SHA-256。自動化驗證涵蓋初始版本、更新提交、切換失敗復原及重啟。
- 正式系統匣重新啟動後，4175 提供 Release `000000000006`，回應 HTTP 200，服務身分與入口 SHA-256 均符合版本狀態。4174 預覽原程序持續運作。
- 使用者在新版載入後回覆「驗收 OK」，登記為兩個版本選單項目的使用者實機驗收。
- 整合時完整 Release 流程 181/181 測試及 TypeScript／Vite 建置通過，新增 0／更新 0／略過 27。既有 4174 預覽回傳的入口與正式 Release 一致。分支 `codex/pr-ci-pilot`，HEAD `2586981`。

## 2026-11-24 TRAY-02／1V-1

- 接續驗收時已結束本專案舊系統匣，並透過原啟動器載入新控制器。正式 4175 回應 HTTP 200，入口 SHA-256 與活動版本 000000000001 一致。歷程確認健康檢查、提交、清理，通知檔含正確版號與 Release 日期 2026-11-24。
- 使用者在收到明列項目後回覆「已經驗收」，確認 Windows 更新成功氣球與重新登入／重開機後自動啟動。這兩項登記為使用者實機驗收。

- 依序補充 requirements、design 與 tasks，在已授權範圍內做 inline 審閱。核對差異包原子公開、版本鏈、完整雜湊、服務所有權、HTTP 回應、回退與通知順序。
- Windows 主機測試涵蓋新增、替換及移除、略過未完成暫存包、基準不符、payload 損毀、注入新版啟動故障後復原舊版、重新啟動保留新版。切版及復原使用實際 Node HTTP 子程序。Sandbox 內首次測試的 loopback EACCES／原子 rename EPERM 由宿主授權測試排除。
- 17:36:36（台北）完整 Release 結束，175/175 tests、TypeScript／Vite build 成功，新增 0／更新 0／略過 27。外部 Update 已有首包 000000000001（Release 日期 2026-11-24），此次 dist 未變故略過出包。核對首包與本次 dist 共 27 個 SHA-256 相同。
- 正式首包以暫存狀態與動態 loopback 連接埠試跑實際控制器。入口 HTTP 200、SHA-256 與目標一致、成功通知資料的版號與日期正確，關閉父管線後控制器 exit 0。
- 既有 4175 回應 200，缺少新控制器的 instance header。保留既有系統匣程序。正式 4175 切換、Windows 氣球實際顯示及重新登入／重開機尚待實機驗收。舊系統匣須 Exit 後重啟才會載入更新器。
- 分支 codex/pr-ci-pilot，HEAD 12da6d4。Release 依當時原始工作區建置，包含同一 checkout 既有的其他變更。此階段沒有 commit 或 push。

## 2026-11-18 使用者人工驗收確認

使用者回覆「OK I have verified it. Go on please」，承接前一回覆要求驗證人物圖示與 Browsing／Restart／Exit，記為以上項目人工驗收通過；不冒稱代理工具已觀察或點擊。重新登入／重開機未明確回報，獨立保留 tasks 5.1 待驗。此次只更新紀錄，不啟動下一里程碑、不新增功能、不 commit／push。

開始時 working tree clean；HEAD 5811400（已有其他工作階段checkpoint及merge），不覆寫既有歷史或撤銷他人變更。此回合只修改驗收相關文件。

token 用量：無法取得精確值；本階段缺少可歸屬的完整起訖官方用量資料，亦未取得本回合精確工具基準。

- 使用者在前規劃chat明確 OK please go on，授權實作及目前使用者登入自啟；本chat為同一工作階段接續，沒有重複另開、委派、commit或push。HEAD be4ecbb，branch main。
- 已保留既有 .codex/config.toml、roadmap、development-plan、ViewerApp及viewer-performance相關未提交檔案；僅在兩個規劃入口增補本功能連結。
- requirements／design／tasks 同一核准範圍 inline 審閱，實作按1→2→3→4依序。規格與實作同工作區建立，未冒稱逐份人工核准或獨立代理審閱。
- 審閱修正：異常終止後 abandoned mutex 可重新取得；服務結束競爭時關閉stdin失敗仍進行Wait/Kill。程序持有Process物件，不依不可信PID殺程序；port占用不接管。
- 初次sandbox內測試localhost EACCES；依宿主escalation執行後成功。
- 13:20:46 +08:00 完整 project.ps1 release：114 tests全數通過、TypeScript/Vite build成功、62 modules；Added0／Updated0／Skipped17。既有大chunk提示屬advisory。新增測試涵蓋HTML/JS/HEAD/404/無效URL/POST拒絕、port占用時原服務存活、父stdin EOF後子服務正常exit0。
- 已安裝目前使用者Startup捷徑，Target為System32/wscript.exe，Arguments指向原始專案scripts/release-tray.vbs；remove後install重裝驗證成功。原始專案須保留；發布只同步dist，不將常駐腳本複製到Release。
- 背景powershell與自有node位於目前登入Session2；HTTP 4175回應200、入口726 bytes；重複start後自有node count維持1。實際常駐保留執行中，未自動開瀏覽器。
- 未停止既有preview，未修改防火牆。4174預覽命令仍維持原樣；本次未宣稱該服務實際運行或LAN驗收。
- UI驗證限制：computer-use sky與CUA清單僅列一般應用視窗，沒有Windows工作列或隱藏系統匣區；無法觀察/操作人物圖示與Browsing/Restart/Exit。選單順序及callback已inline審閱，但實際點擊三項、預設瀏覽器開啟與圖示外觀仍待人工驗收。實際重新登入／重開機亦未驗，不宣稱完成。
- rollback：release-tray-startup.ps1 remove + 圖示Exit；自啟remove/install已測，Exit實際點擊未測。
- token 用量：無法取得精確值；交接缺少本階段起點，沒有可歸屬的完整官方用量區間，不以估算替代。

索引：啟動既有 scripts/rag.ps1 start；首次health因服務啟動尚未就緒失敗，後續Qdrant/Ollama/EmbeddingModel全True。未安裝或下載。最終增量索引結果及時間於收尾補記。

最終實作後驗證：13:22:38 +08:00 release成功，114/114 tests、build成功、Added0/Updated0/Skipped17。異常結束已驗明CommandLine的自有tray host後，自有node在2秒檢查時已退出；修正版重新start後HTTP200，沒有停止其他程序。git diff --check通過。

索引完成：2026-11-11 13:23（Asia/Taipei），codebase_update掃描126個可索引檔，最終更新1檔／5 chunks，status green、Incremental update completed、363 chunks；graph101 files/189 edges。先前本階段新增3／更新1、7 chunks。範圍遵守gitignore/socraticodeignore，不含外部Release；文件未必全部為embedding範圍。無最終索引錯誤。人工驗收未完成，chat維持[?]；不開始下一里程碑。

## 2026-11-11 14:22 接續驗收

使用者「ok please go on」接續同階段驗收，未建立新chat、未擴充功能或commit/push。唯讀確認正式tray與自有Node仍執行、HTTP200、Startup捷徑存在。UI清單重查仍無工作列／系統匣。

為實際測選單，於忽略的.local/tray-ui-check建立暫存腳本：沿用正式腳本與同一ContextMenuStrip，僅附加標準Form及開選單按鈕、指向原始server路徑。系統Get-Process確認具名Form已建立（Character Release Menu Verification），但sky.list_windows仍未列出，因此沒有操作任何選單、不宣稱Browsing/Restart/Exit通過。未對UI工具提供猜測視窗ID或繞過存取界線。

已終止僅屬該fixture的驗證程序並重新啟動正式launcher；14:22:27 +08:00 正式tray PID13444、自有Node PID21332、HTTP200，無驗證視窗保留。正式產品程式未變；原生圖示/三項選單及登入／重開機維持待人工驗收。token用量仍無精確基準。

本次收尾（2026-11-18T17:37:20.1727349+08:00）：project.ps1 release於2026-11-18T17:36:04+08:00完成；116/116 tests、TypeScript/Vite build成功、Added0/Updated0/Skipped17，既有chunk大小提示保留。git diff --check通過。首次索引因Qdrant未啟動失敗，依授權啟動既有rag後health三項True；codebase_update掃描127個可索引檔、更新2檔/8 chunks，status確認green、373 chunks，graph102 files/191 edges（本次未重建graph）。範圍遵守忽略規則、不含外部Release；最終無索引錯誤，未安裝工具或下載模型。5個驗收文件未提交，無commit/push；重新登入/重開機人工驗收仍待回報。
