# Release 系統匣常駐

2026-11-11 使用者核准的維護功能，非新里程碑。NORMAL，均衡能力／中推理；無模型切換、委派、commit 或 push。僅修改 scripts、對應測試及文件，不變更場景與手機驗收。

## 使用

在原始專案 `D:\Work_Mine\AI Project\3D Character Walk Viewer\3D-Character-Walking` 執行：

```powershell
./scripts/release-tray-startup.ps1 install
./scripts/release-tray-startup.ps1 start
./scripts/release-tray-startup.ps1 remove
```

install 只建立目前使用者 Startup 捷徑，下次登入自動啟動；start 立即背景啟動。沒有命令視窗、不自動開瀏覽器，不要求管理員。登出前不執行、不是 Windows Service。原始專案與 Node.js 必須保留；移動專案後重新 install。使用 Windows PowerShell、Windows Forms、WSH 及既有 Node.js，未新增依賴。

藍底白色人物圖示為本專案程式繪製，無第三方素材。Windows 可能放在隱藏圖示區（向上箭頭），可由使用者拖至常見圖示區。

選單依序：

1. **Browsing**：以預設瀏覽器開啟 `http://127.0.0.1:4175/`，亦支援雙擊圖示。
2. **Restart**：先停止本功能建立的 Node 服務，再啟動。
3. **Exit**：移除圖示、停止自有服務，保留下次登入自啟。

4175 在 loopback 提供每使用者的獨立版本。發布由 `./scripts/project.ps1 release` 依序執行 tests → build → Release 同步 → Update 差異包公開。4173／4174 可繼續使用，其中 4174 讀取外部 Release。切版後請重新整理 4175 的頁面。

## dist 自動更新

- 首次載入新控制器時，如果舊版系統匣仍在執行，先以其選單 **Exit** 結束，再執行 `./scripts/release-tray-startup.ps1 start`。舊版 **Restart** 只重啟其服務子程序。既有登入自啟捷徑會在下次登入時載入新腳本。
- 差異包位於 Release 同層的 `Update\<版本>`。首包含完整 dist，後續包含新增／替換內容與移除清單。控制器啟動時檢查，之後每 60 秒檢查並依序處理下一版。缺包或驗證失敗會保留舊版，下一次檢查重試同一版。
- 驗證新版備妥後才停止原 Node。新版通過 4175 HTTP 入口驗證並提交後，會清理前版並顯示版本及 Release 日期。啟動或驗證失敗會復原舊版；若其他程序在切換期間占用 4175，舊版資料仍保留供 **Restart**。
- 逐檔與切換歷程位於 `%LOCALAPPDATA%\CityCharacterRelease\updates-4175\update.jsonl`。此目錄也保存目前版本及指標。Update 來源包需依序保留，讓尚未升級的控制器能補上缺少的差異。

同一登入 session 透過 mutex 防重複。4175 被其他服務占用時不終止或接管對方，圖示顯示 unavailable、氣球提示並記錄 `%LOCALAPPDATA%\CityCharacterRelease\tray.log`；排除占用後按 Restart。服務故障保留圖示供重啟。父程序管線關閉時 Node 自行退出；正常退出會等待，必要時僅終止持有的 Process 物件，不依保存 PID 殺程序。

rollback：執行 remove 並按 Exit；僅移除本功能捷徑，保留其他 Startup 項目、Release 及既有預覽。無需回退使用者其他修改。

## 審閱與驗證

2026-11-24：正式 4175 已切換至新版控制器，版本 000000000001 的 HTTP 入口 SHA-256 驗證通過。Windows 更新成功氣球與重新登入／重開機後自動啟動由使用者實機驗收通過。

2026-11-18：使用者確認已驗證系統匣人物圖示及 Browsing／Restart／Exit，列為使用者人工驗收通過；不是代理透過 UI 工具觀察所得。重新登入／重開機自啟尚未明確回報，保留待驗。

同授權範圍 inline 審閱：選單順序、無自動瀏覽、隱藏啟動、目前使用者捷徑、mutex、服務所有權、port 衝突、父子清理、路徑邊界與錯誤回報。無獨立代理。實測結果記於對應 spec validation；實際重開機／重新登入須另保留未驗狀態。
