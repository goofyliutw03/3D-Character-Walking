# 設計
Windows PowerShell STA + NotifyIcon；WSH 隱藏 launcher；Startup 捷徑只針對目前使用者。Node 內建 HTTP 提供固定 Release，獨立 loopback 4175；mutex 保護單例。父程序持有 Process 與 stdin，Exit/Restart 關閉管線，父程序異常退出亦由 EOF 清理子程序。靜態檔 realpath 邊界拒絕越界；無需 Vite 或新依賴。圖示程式繪製，錯誤保留圖示並寫 LocalAppData log。

依使用者已核准整體方案自動 inline 審閱 requirements→design→tasks；未宣稱逐份人工核准。本階段實作與規格在同一工作區建立，未使用 cc-sdd 自動核准 skill。
## TRAY-02／差異更新設計

- 在 Release 的同層 Update 保存依序編號的不可變差異包。首包含完整 dist，之後只攜帶變更內容及移除清單。每包保留完整目標雜湊清單供套用及後續發佈核對；從同目錄暫存資料夾原子重新命名後才可見。
- 4175 使用獨立於外部 Release 的每使用者版本目錄。升級前建立隔離版本，從前版複製未變檔、從包複製新增或替換檔，再核對完整檔案清單與 SHA-256。初次無已套用版本時，以 Release 快照作回退來源。
- Node 控制程序持有實際服務子程序，使用私有啟動識別及 HTTP index SHA-256 確認回應。持久化指標以同目錄原子替換。舊版本於成功提交後清理，失敗時僅清理新版並恢復舊服務。Windows Forms 透過本次控制程序專用的通知檔讀取成功事件。
- 發布保留原 Release 的增量同步約定。更新器不變更公開的 Release，也不更新自身程式。已執行的舊版系統匣須 Exit 後重新啟動才載入新控制器。
