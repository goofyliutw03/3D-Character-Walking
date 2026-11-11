# 設計
Windows PowerShell STA + NotifyIcon；WSH 隱藏 launcher；Startup 捷徑只針對目前使用者。Node 內建 HTTP 提供固定 Release，獨立 loopback 4175；mutex 保護單例。父程序持有 Process 與 stdin，Exit/Restart 關閉管線，父程序異常退出亦由 EOF 清理子程序。靜態檔 realpath 邊界拒絕越界；無需 Vite 或新依賴。圖示程式繪製，錯誤保留圖示並寫 LocalAppData log。

依使用者已核准整體方案自動 inline 審閱 requirements→design→tasks；未宣稱逐份人工核准。本階段實作與規格在同一工作區建立，未使用 cc-sdd 自動核准 skill。
