# 正式產物增量發佈

2026-10-29，1K-0 追加維護流程，使用者已授權；不是第七里程碑。不改變 M6／手機人工驗收狀態，不包含 commit／push。

## 操作

使用 PowerShell 7+（本機7.6.5），始終在 `D:\Work_Mine\AI-Projects\3D Character Walk Viewer` 修改與執行：

```powershell
./scripts/project.ps1 release
./scripts/project.ps1 preview-release
```

release 依序執行全部既有 tests、TypeScript／Vite production build、同步；任一步驟失敗即停止。只有 `dist` 內容會發佈至固定的 `D:\Work_Mine\Testing\3D Character Walk Viewer\Release`，不複製原始專案。`scripts/release.ps1` 為已成功建置產物的低階同步，不自行 build；日常使用上方完整流程。

預覽以既有 Vite 讀取外部 Release，固定 localhost:4174、strictPort；連接埠占用會報錯，不停止既有4173 preview，不開防火牆。瀏覽器使用 http://127.0.0.1:4174 ，不要直接開啟 index.html。僅本機驗證，不代表 LAN／iPhone 可用。來源編輯不會改變 Release；成功發佈後重新整理瀏覽器載入新入口。

## 同步保護與回復

- 預檢完整來源與目的檔案路徑，拒絕來源或目標祖先的 junction／symlink（reparse point）、路徑越界及檔案／目錄衝突。目標不存在時才建立必要目錄。
- 以 SHA256 比對，內容相同則略過，保留 mtime。變更檔先複製至目標同目錄隨機暫存檔、校驗 hash，再以 File.Move 的 overwrite 更新單檔；index.html 最後更新。輸出 Added／Updated／Skipped／CompletedAt。
- 不 mirror、不刪除陌生檔案或舊 hashed 資產，避免使用中頁面缺少舊模組。久後可能累積資產；清理須另行授權。
- 沒有整個版本的交易或自動備份；固定 URL 的 GLB／manifest 在入口前更新，使用中頁面可能讀到新資產。同步失敗時入口可能仍為舊版，但部分資產已更新；不得宣稱整版成功。停止並排除原因後重跑。
- 需要回復時，先在來源工作區之外保留已知良好的 dist 備份（不納入本次自動流程），將該版本恢復至來源 dist，再執行低階同步；不要整檔回退含使用者修改的 repo。沒有備份時不能承諾自動回復。
- 不可同時執行 build／release，亦不可由其他程序改寫目標。此工具用於使用者控制的本機目錄，不對抗惡意並行檔案系統替換。
- 拒絕 dist 內 .git／node_modules／src／.env、source map、TypeScript、常見私鑰格式；不是通用機密掃描器，不可把秘密放入 public 或前端程式。正式網站本來即包含前端 JS 與公開授權／資產資料。

## 審閱與驗證

依授權進行 inline 審閱，未使用獨立代理。已檢查固定來源／目的地、遞迴前拒絕 reparse、完整預檢、內容比較、入口最後更新、不刪除陌生／舊資產與失敗傳播。保留所有既有未提交變更，HEAD fab6fd7；未 commit／push。

- 2026-10-29 `./scripts/project.ps1 release`：54 tests／54 pass、TypeScript與Vite build exit0；36 modules。既有645.13 kB chunk提示仍為advisory。
- 已透過宿主 sandbox escalation 執行首次外部寫入，22:09:20（Asia/Taipei）：Added12／Updated0／Skipped0。
- 22:09:33低階無變更重跑：Added0／Updated0／Skipped12。逐檔確認12個SHA256與dist一致、12個mtime ticks全部未變。
- `.local/release-check`隔離fixture：首次新增2、更新1／略過1、重跑略過2；舊hash檔保留；.env、目標junction、缺少index均拒絕。fixture只在忽略目錄，沒有將測試內容寫入正式Release。
- 初版File.Replace先遇到PowerShell null字串轉換，修正後仍遭本機拒絕；改為PowerShell7／.NET同目錄File.Move overwrite，更新測試通過。未繞過sandbox。
- `git diff --check` exit0（既有CRLF提示保留）。
- `./scripts/project.ps1 preview-release`服務session41791，localhost:4174。IAB實際頁面顯示Rigged man Ready、Man Idle、WebGL2 ready、75 FPS樣本；頁面保留供使用者操作。未停止4173服務；未重驗該服務狀態，未做LAN／真機驗收。

Token 基準：本 chat 首個取得的檢查點 2026-10-29T14:06:21.439Z，input 81,101／output 383／total 81,484。不含此點之前的開頭工作，與前 chat 統計不重複。

檢查點2026-10-29T14:10:23Z：input976,442／output7,264／total983,706。可確認區間差額input895,341／output6,881／total902,222；cached input差額867,840已含於input，reasoning624已含於output。本機rollout token_count累計差，不是帳號百分比或估算；不包含開頭缺少基準區間及此檢查點後的文件／索引／回覆。完整階段token用量：無法取得精確值。

索引：2026-10-29 22:11（Asia/Taipei）codebase_update完成；掃描71個可索引檔，新增1／更新2／刪除0，8個新chunks。codebase_status確認green、Incremental update completed、共177 chunks；graph53檔94edges，watcher disabled。範圍為遵守.gitignore／.socraticodeignore的專案可索引檔；不含外部Release，亦不宣稱所有Markdown或資產均有embedding。無索引錯誤、未安裝或下載任何工具／模型。
