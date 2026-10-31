# 開發環境安裝與 AI Agent 初始化

2026-10-31。Windows-first；單一安裝指引，Codex 的 AGENTS.md 與 Claude Code 的 CLAUDE.md 均指向這裡。
在 checkout 根目錄啟動 Agent。初始化規則要求 Agent 先顯示偵測結果及建議，這不是 OS 彈窗、啟動 hook，也不能保證所有版本／啟動方式都讀取規則。未讀取時貼上下列 prompt。一般功能工作不必重跑。

## 可直接貼給 Claude Code／Codex CLI 的完整 prompt

```text
請初始化本 repo 的開發環境。先讀 AGENTS.md、docs/onboarding.md、README.md、package.json 與 lockfile，保留現有修改，不 commit/push。
先執行 ./scripts/onboarding.ps1 -Json（僅唯讀報告）；未授權執行／不是 Windows 時提供命令與限制，不假造結果。
向我顯示 OS/architecture、CPU/核心、RAM、checkout 磁碟可用空間、GPU/VRAM、PowerShell、Git、Node/pnpm/Python 與選用 RAG/Blender 工具版本。不可收集序號、帳號、憑證；無法讀取顯示 unknown。
依實測結果分級，說明 Viewer 必要項與 RAG/Blender 選用項、缺少或版本不符工具、可複製安裝命令、磁碟與相容性限制；遵守 packageManager/lockfile，不能改用 latest 或其他 package manager。
預設 dry-run/report，不下載或安裝。列出具體範圍後讓我選 Viewer 或 RAG；已明確授權的選項直接依文件執行。未選用不可裝 Blender、下載模型、啟動服務、改全域設定、防火牆或 Agent/MCP 設定。
只使用免費工具／本機服務；Agent 本身帳號與服務費不算本專案免費工具承諾。不得把 secrets 寫入文件、prompt 或 log。
Viewer 使用 scripts/project.ps1 install，再 test/build；RAG 使用 onboarding.ps1 -InstallRag（重用 install-rag.ps1 且跳過服務與模型），模型／服務另行明確選用。
報告實際執行、成功／失敗與未驗項；失敗立即停止，不宣稱安裝完成。新機不要執行原工作站專用 release，也不要照抄 .codex/config.toml 絕對路徑或不相關 ESP-IDF 設定。
```

## 1. 唯讀預檢（不需要 Node）

從 repo 根目錄用 PowerShell 7 執行；若只有 Windows PowerShell 5.1 可先用它執行報告，再安裝 PowerShell 7。不要修改全域 execution policy；被政策阻擋請由管理員按組織規則處理。

```powershell
./scripts/onboarding.ps1
./scripts/onboarding.ps1 -Json
./scripts/onboarding.ps1 -InstallViewer -DryRun
./scripts/onboarding.ps1 -InstallRag -DryRun
```

只查本機 CIM、checkout 所在磁碟與已存在工具版本；不掃描使用者資料、不連網、不啟動 RAG。CLI 版本探測會執行已安裝的程式；Python App Execution Alias 若導向 Microsoft Store，請取消並手動檢查 Python，不接受商店安裝。RAM/空間用 GiB、VRAM 用 MiB；unknown 在 JSON 數值欄以 null 表示。CIM AdapterRAM 對大顯存不可靠，不採用；NVIDIA nvidia-smi 成功時提供 VRAM，其餘保留 unknown。版本不在 PATH 不等於沒安裝，先檢查 PATH／重開 shell；不自動升級驅動。

| 分級 | 本專案保守建議（不是廠商最低需求） | 建議 |
| --- | --- | --- |
| unknown | RAM 或磁碟不可取得 | 補查後再決定，暫緩 RAG |
| constrained | RAM <8 GiB 或空間 <5 GiB | 先處理資源限制，只做 Viewer 試跑 |
| viewer | RAM >=8、空間 >=5，但未達下一級 | Viewer；RAG CPU 可能爭用 RAM |
| local-rag-candidate | RAM >=16、空間 >=15 GiB | 可選本機 RAG；模型／索引需額外空間 |

GPU 不影響必要工具安裝判定；瀏覽器 WebGL2、實際 FPS 與跨 GPU 表現仍須執行 Viewer 檢查。GPU RAG 必須另查 Ollama 支援，不憑顯存量自動開啟。自動安裝限 Windows x64，ARM64／其他 OS 先人工評估，尤其既有 Qdrant 下載固定 x64。

## 2. 必要工具與 Viewer（明確選用才執行）

必要：Git、受支援 Node.js LTS（package.json >=22.12.0，建議24 LTS）、精確 packageManager 版本 pnpm、PowerShell 7（完整專案腳本）、WebGL2 瀏覽器。Python、Blender、Docker、Qdrant、Ollama 都不是 Viewer 必要依賴。

以下是實際安裝命令，**不是預檢的一部分**。先用 winget show 確認套件、版本與授權，僅執行缺少項；winget 缺少時從官方網站安裝。依系統權限可能需管理員同意，不自動接受所有協議。

```powershell
winget show --id Git.Git --exact --source winget
winget install --id Git.Git --exact --source winget
winget show --id Microsoft.PowerShell --exact --source winget
winget install --id Microsoft.PowerShell --exact --source winget
winget show --id OpenJS.NodeJS.LTS --exact --source winget
winget install --id OpenJS.NodeJS.LTS --exact --source winget
# 重開 PowerShell，先確認 node --version 符合 package.json，再執行：
$viewerPackage = Get-Content ./package.json -Raw | ConvertFrom-Json
npm install --global $viewerPackage.packageManager
./scripts/onboarding.ps1
./scripts/onboarding.ps1 -InstallViewer
./scripts/project.ps1 test
./scripts/project.ps1 build
./scripts/project.ps1 dev
```

npm global 安裝會更動全域 pnpm；只有明確選用才執行。保留根 pnpm-lock.yaml，使用 frozen-lockfile；不要因版本不符刪 lockfile。根 packageManager 目前 pnpm@11.25.0，tools/rag 是獨立 pnpm@10.32.1，由既有腳本處理。不要跑 pnpm latest/self-update 更改專案版本。沒有必要依賴可跳過全域安裝，但 onboarding 的明確安裝模式要求 PATH 中的 pnpm 精確匹配。

## 3. 選用 RAG／資產工具

RAG 先閱讀 [local-rag.md](local-rag.md)、[gpu-optimization.md](gpu-optimization.md)。Python 僅選用 RAG CPU 安裝／資產處理需要；版本與 Python PATH 請先確認。可從 [Python Windows 官方下載](https://www.python.org/downloads/windows/) 安裝。Blender 僅製作資產需要，從 [Blender 官方下載](https://www.blender.org/download/) 選相容版本；不自動安裝。現有 GLB 可直接執行。

```powershell
# 安裝工具／下載套件，會寫入 .local/rag 與 tools/rag/node_modules。
# CPU 模式會下載 Ollama 精簡包；GPU 模式可能透過 winget 安裝原生 Ollama。
./scripts/onboarding.ps1 -InstallRag
# 只有查過 https://docs.ollama.com/gpu 並明確選 GPU 時：
./scripts/onboarding.ps1 -InstallRag -Gpu
# 等價底層入口（須自行確認資源／版本）：
./scripts/install-rag.ps1 -SkipStartAndModels
# 以下是另外明確選用的服務啟動／模型下載；不是安裝的默認後續：
./scripts/rag.ps1 start
./scripts/rag.ps1 pull
./scripts/rag.ps1 health
```

原 `install-rag.ps1` 不帶新選項時保留舊有啟動／拉模型行為；onboarding 一律傳 `-SkipStartAndModels`。第三方原生 Ollama 安裝器本身可能啟動其應用／服務，選 GPU 安裝時需確認；本 wrapper 不呼叫 rag start/pull。模型未下載時 health 不會通過，不能冒稱 RAG ready。索引遵守 ignore 與 secrets 排除，不重建既有索引。

`.codex/config.toml` 是原機絕對路徑參考，需人工依 checkout 改寫本機設定；不自動覆寫。`.vscode/settings.json` 的 ESP-IDF 不相關。新機不執行硬編碼目的地的 `release`；原工作站維護依 [release.md](release.md)。

## 驗證、失敗與回復

`pwsh -NoProfile -File ./scripts/test-onboarding.ps1` 使用 synthetic facts 測試決策，不安裝。報告成功只代表完成偵測，不表示工具安裝或 Viewer/RAG 驗收。缺工具先按建議修正，版本 unknown 不假定可用；安裝錯誤停止，不刪 lockfile、不自動重試下載。保留現有修改；腳本與文件可用單一相關 commit revert 回復，已明確安裝的全域工具需另外人工解除安裝，不自動刪其他專案共用工具／模型。

官方依據（2026-10-31 查閱）：[Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)、[Claude Code memory／CLAUDE.md](https://code.claude.com/docs/en/memory)、[pnpm 安裝](https://pnpm.io/installation)、[WinGet install](https://learn.microsoft.com/en-us/windows/package-manager/winget/install)。Agent 指令載入受工作目錄、版本、優先序與設定限制；如工具未執行，只能提供手動命令。
