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

只服務外部 Release 目錄，監聽 loopback 4175；保留既有 preview 4173／4174，不修改防火牆。發布仍由 `./scripts/project.ps1 release` tests → build → sync；常駐服務不負責建置或發布。同步後重新整理瀏覽器。

同一登入 session 透過 mutex 防重複。4175 被其他服務占用時不終止或接管對方，圖示顯示 unavailable、氣球提示並記錄 `%LOCALAPPDATA%\CityCharacterRelease\tray.log`；排除占用後按 Restart。服務故障保留圖示供重啟。父程序管線關閉時 Node 自行退出；正常退出會等待，必要時僅終止持有的 Process 物件，不依保存 PID 殺程序。

rollback：執行 remove 並按 Exit；僅移除本功能捷徑，保留其他 Startup 項目、Release 及既有預覽。無需回退使用者其他修改。

## 審閱與驗證

同授權範圍 inline 審閱：選單順序、無自動瀏覽、隱藏啟動、目前使用者捷徑、mutex、服務所有權、port 衝突、父子清理、路徑邊界與錯誤回報。無獨立代理。實測結果記於對應 spec validation；實際重開機／重新登入須另保留未驗狀態。
