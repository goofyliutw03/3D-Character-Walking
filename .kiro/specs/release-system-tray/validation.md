# 驗證紀錄（2026-11-11，1V-0）

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
