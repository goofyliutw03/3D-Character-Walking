# Onboarding 驗證紀錄

2026-10-31，使用者追加開發環境安裝流程並明確授權 commit／push 至既有開發分支；不是新產品里程碑，不變更 M6 或手機人工驗收。複雜度 NORMAL，沿用現有模型，未委派。

範圍：單一 onboarding 文件／CLI prompt、Codex/Claude 初始化入口、唯讀預檢、資源分級、明確選用的 Viewer/RAG 安裝。變更 scripts/install-rag.ps1 新增 SkipStartAndModels，保留原有直接使用方式。未安裝工具、未下載模型、未啟動／停止服務、未改全域設定。

Inline 審閱通過：報告預設無安裝；dry-run 提早返回；無效 scope 在偵測前拒絕；Windows x64／Node／pnpm與資源守門；失敗傳播；GPU 必須明確選擇；不採用不可靠 CIM AdapterRAM；硬體查詢各自失敗仍可回報其他結果；不收集序號／帳號；Python WindowsApps alias 不執行；不覆寫既有 config、不修改 lockfile。未進行獨立代理審閱。

- `pwsh -NoProfile -File scripts/test-onboarding.ps1`：17 個 synthetic／缺工具／版本邊界／無效選項案例通過，無 installer 執行。
- `onboarding.ps1 -InstallViewer -DryRun -Json`：report-only，未安裝。sandbox CPU／RAM CIM 受限時回傳 null/unknown，磁碟及 NVIDIA 探測仍成功。
- 經宿主允許的唯讀本機預檢：Windows 10.0.19045 x64、Intel i7-7700（8 logical processors）、RAM15.9 GiB、checkout磁碟可用97.1 GiB、GTX1060 VRAM6144 MiB（nvidia-smi）。PowerShell7.6.5、Git2.49.0、Node24.22.1、pnpm11.25.0、Python3.13.3、Ollama0.40.13、Qdrant1.20.0、SocratiCode1.16.1、WinGet1.29.380。Blender不在PATH，報missing，不能據此斷言整機未安裝。分級viewer；實體16GB機器可用容量略低於16門檻，採保守建議，既有RAG仍可運作，不將建議當成廠商最低需求。
- `./scripts/project.ps1 release`：112 tests通過、TypeScript/Vite build成功（62 modules）、2026-10-31 19:39:38 +08:00 增量Release Added0／Updated1／Skipped16；既有>500kB chunk advisory保留。
- `git diff --check`通過。未實際驗證新機安裝／重開Agent後自動讀取／ARM64／非NVIDIA顯卡／手機／跨GPU。入口依官方規則提供，不能保證所有啟動方式彈窗。

回復：本次相關commit可revert；無實際工具安裝需要解除。只推開發分支，不合併main、不改既有tag。

token 用量：無法取得精確值。本階段跨交接chat，缺少可明確歸屬的官方／本機session起點，未以context、字數或估算代替。

索引範圍：依.gitignore／.socraticodeignore的專案可索引檔，不含外部Release、依賴、模型或機密；交付後以codebase_update及codebase_status確認，實際完成時間與結果見chat收尾。
