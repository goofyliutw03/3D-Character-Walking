# 開發環境安裝與 AI Agent 初始化

2026-10-31。Windows-first；單一安裝指引，Codex 的 AGENTS.md 與 Claude Code 的 CLAUDE.md 均指向這裡。
在 checkout 根目錄啟動 Agent。初始化規則要求 Agent 先顯示偵測結果及建議，這不是 OS 彈窗、啟動 hook，也不能保證所有版本／啟動方式都讀取規則。未讀取時貼上下列 prompt。一般功能工作不必重跑。

## 新電腦逐步下載與安裝（Windows 10／11 x64、NVIDIA 獨顯）

以下流程使用 `codex/v02-particle-system` 分支。先開啟 PowerShell；每個步驟成功後才進下一步。下載目錄可自行選擇，範例使用 `$HOME\source`。私人 repository 必須先取得存取權，Git 提示驗證時由使用者完成。

### 步驟 1：準備 Git

先執行 `git --version`。若找不到 Git，執行下列安裝命令，完成後重新開啟 PowerShell。

```powershell
winget show --id Git.Git --exact --source winget
winget install --id Git.Git --exact --source winget
```

若找不到 winget，請從 Git 官方網站 https://git-scm.com/downloads/win 安裝 Git，再重新開啟 PowerShell。安裝器要求的授權或管理員提示由使用者確認。

### 步驟 2：下載指定分支

```powershell
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path "$HOME\source" | Out-Null
Set-Location "$HOME\source"
git clone --branch codex/v02-particle-system --single-branch https://github.com/goofyliutw03/3D-Character-Walking.git
if ($LASTEXITCODE -ne 0) { throw 'Git clone 失敗，請確認網路與 repository 存取權。' }
Set-Location .\3D-Character-Walking
git branch --show-current
```

如果目的地已有同名目錄，先使用其他下載目錄，或確認它就是此 repository 後再依既有 checkout 的更新流程處理。

### 步驟 3：先偵測硬體與工具

```powershell
.\scripts\onboarding.ps1 -Json
.\scripts\onboarding.ps1 -InstallViewer -DryRun
```

檢查報告中的 OS、CPU、RAM、可用磁碟、GPU／VRAM 與工具版本。NVIDIA VRAM 優先由 `nvidia-smi` 提供，無法偵測則顯示 unknown。現有 CLI 提供自動偵測、資源分級與建議，尚未提供自動效能調校或互動式安裝選單。對方電腦的效能須在該機器實測。

### 步驟 4：補齊必要工具

依預檢報告只執行缺少項目。Node.js 版本須符合根目錄 `package.json` 的 engines。

```powershell
winget show --id Microsoft.PowerShell --exact --source winget
winget install --id Microsoft.PowerShell --exact --source winget
winget show --id OpenJS.NodeJS.LTS --exact --source winget
winget install --id OpenJS.NodeJS.LTS --exact --source winget
```

完成後開啟 **PowerShell 7**，切回下載的 repository 根目錄。若腳本被組織政策阻擋，交由管理員按組織規則處理。

### 步驟 5：安裝精確版本的 pnpm 與專案依賴

```powershell
$ErrorActionPreference = 'Stop'
node --version
$viewerPackage = Get-Content .\package.json -Raw | ConvertFrom-Json
npm.cmd install --global $viewerPackage.packageManager
if ($LASTEXITCODE -ne 0) { throw 'pnpm 安裝失敗。' }
.\scripts\onboarding.ps1 -InstallViewer
```

全域 pnpm 安裝是本步驟的明確選用操作，會影響同機其他使用全域 pnpm 的專案。依賴安裝使用既有 lockfile。

### 步驟 6：驗證與啟動

```powershell
.\scripts\project.ps1 test
.\scripts\project.ps1 build
.\scripts\project.ps1 dev
```

逐條執行，測試與建置成功後才啟動 dev。開啟終端機列出的 localhost 網址，檢查場景、角色、相機與畫面流暢度，使用 Ctrl+C 停止開發服務。新機的開發流程到此即可，`release` 使用原工作站固定目的地。

### 可貼給對方 Codex CLI／Claude Code 的安裝 prompt

先完成步驟 1、2，再從 repository 根目錄啟動已安裝的 Agent，貼上以下內容。

```text
請依 docs/onboarding.md 初始化此 repo 的開發環境，目標 Windows 10／11 x64、NVIDIA 獨顯。
先讀 AGENTS.md、README.md、package.json、pnpm-lock.yaml 與 onboarding 指引。
先執行 .\scripts\onboarding.ps1 -Json，顯示硬體、工具版本、unknown 項目與資源分級。
我授權安裝缺少的 Viewer 必要工具、packageManager 指定版本的 pnpm 與專案依賴。
先列出具體安裝計畫，再依文件執行已授權項目；需要管理員、套件授權或帳號驗證時交給我處理。
只安裝缺少或明確不符合需求的工具，保留既有修改，依 frozen-lockfile 安裝。
每步檢查成功才繼續，失敗立即停止並回報命令、錯誤與處理建議。
完成後依序執行 project.ps1 test、build，提供 dev 啟動命令及瀏覽器驗證清單。
依實測硬體提供效能建議；任何自動優化必須說明具體參數、作用範圍與回復方式，取得我的選用後才套用。
RAG、模型下載、服務啟動、Blender、驅動及系統／防火牆設定須另外讓我選擇。
不得宣稱已測得其他電腦的硬體或效能，不 commit/push，不執行原工作站專用 release。
```

若對方尚未安裝 Agent，可直接照上述 PowerShell 步驟完成 Viewer 安裝。選用 GPU RAG 的流程見下方第 3 節，依該機 GPU 支援狀態另外確認。

若需要用 Codex 操作 Blender 場景，另見 [Windows Blender MCP 安裝指引](#4-選用-blender-mcpwindows)。

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

## 4. 選用 Blender MCP（Windows）

需要用 Codex 讀取或操作 Blender 場景時才執行本節。Viewer 可獨立安裝與執行。先自行安裝相容版本的 Blender，並確認 Codex CLI 可用。專案的 `onboarding.ps1` 不偵測或安裝 Blender MCP。

### 安裝 uv 與 MCP 工具

先執行 `uv --version` 和 `uvx --version`。若缺少 uv，先查閱套件資訊再安裝。完成後重開 PowerShell 並重新檢查版本。以下命令逐步執行，每步成功後再繼續。

```powershell
winget show --id astral-sh.uv --exact --source winget
winget install --id astral-sh.uv --exact --source winget
```

```powershell
uv tool install mcp-for-blender
```

若遇到 `UnknownIssuer`，可改用 Windows 信任的憑證存放區重試，TLS 驗證仍會啟用。

```powershell
uv --system-certs tool install mcp-for-blender
```

### 安裝 Blender 外掛並設定 Codex

從 uv 查詢執行檔的絕對路徑，讓 Codex 可直接啟動工具。先確認 `addon-paths` 列出的目錄涵蓋要使用的 Blender 版本。若需指定外掛目錄，可用 `install-addon --help` 查詢 `--addons-dir`。

```powershell
$blenderMcpBin = uv tool dir --bin
if ($LASTEXITCODE -ne 0 -or -not $blenderMcpBin) { throw '無法取得 uv 工具執行目錄。' }
$blenderMcpExe = Join-Path $blenderMcpBin 'mcp-for-blender.exe'
if (-not (Test-Path -LiteralPath $blenderMcpExe -PathType Leaf)) { throw '找不到 Blender MCP 執行檔。' }
& $blenderMcpExe addon-paths
if ($LASTEXITCODE -ne 0) { throw '無法查詢 Blender 外掛目錄。' }
```

確認目錄後，在同一個 PowerShell 視窗執行。若列出多個版本或使用自訂目錄，請在 `install-addon` 後加上 `--addons-dir` 和目標版本的完整外掛目錄路徑，並以引號包住路徑。

```powershell
& $blenderMcpExe install-addon
if ($LASTEXITCODE -ne 0) { throw 'Blender MCP 外掛安裝失敗。' }
```

先用 `codex mcp list` 檢查既有設定。若已有 `blender`，用 `codex mcp get blender` 在本機確認是否可沿用。若需替換，先備份該項設定並確認變更範圍。只有明確選用新增 Codex 使用者層設定且名稱可用時，才在同一個 PowerShell 視窗執行。

```powershell
codex mcp add blender --env DISABLE_TELEMETRY=true -- $blenderMcpExe
if ($LASTEXITCODE -ne 0) { throw '新增 Codex Blender MCP 設定失敗。' }
codex mcp get blender
if ($LASTEXITCODE -ne 0) { throw '無法讀取 Codex Blender MCP 設定。' }
```

### 啟用、驗證與回復

1. 儲存作品並重開 Blender。在 **Edit → Preferences → Add-ons** 啟用 **MCP for Blender**。若原本已啟用，可停用後再啟用以載入新版。
2. 在 3D 視窗按 `N` 開啟側欄，切到 **MCP for Blender**，按 **Start MCP Server**。使用 localhost，保留既有防火牆設定。MCP 可執行 Blender Python，修改場景前先儲存作品。
3. 完全退出並重開 Codex。`codex mcp get blender` 可確認啟用狀態、stdio、執行檔路徑與遙測變數。再貼上下列提示，確認 Codex 能列出目前場景的物件。

   ```text
   使用 Blender MCP，讀取目前場景並列出物件，先不要修改。
   ```

若要撤銷本節新增的連線，可執行 `codex mcp remove blender`，再關閉 Blender 的 MCP Server 並停用外掛。若先前替換過設定，使用備份還原該項設定。基本場景操作無需付費生成服務或外部資產 API。

原工作站於 2026-11-19 以 Blender 5.2.2 LTS 和 `mcp-for-blender` 2.3.1 驗證，成功讀取預設場景的 Cube、Light、Camera。上游也提供 `uvx mcp-for-blender setup`，可先用 `--dry-run` 查看變更範圍。[MCP for Blender 上游指引](https://github.com/ahujasid/mcp-for-blender)

### 可貼給 Codex CLI 的選用安裝 prompt

```text
請先依 docs/onboarding.md 執行唯讀預檢並顯示結果，再依第 4 節安裝 Windows Blender MCP。
我已自行安裝 Blender，授權安裝缺少的 uv、mcp-for-blender 工具、指定 Blender 版本的外掛，並新增我的 Codex 使用者層 blender MCP 設定。
先檢查既有工具、外掛目錄和同名 MCP 設定。若需要覆寫既有設定，請先回報。每步確認成功再繼續。
請提供 Blender 啟用及重開 Codex 的步驟。等我開啟本機 MCP Server 後，唯讀驗證能否列出目前場景的物件。
```

## 驗證、失敗與回復

`pwsh -NoProfile -File ./scripts/test-onboarding.ps1` 使用 synthetic facts 測試決策，不安裝。報告成功只代表完成偵測，不表示工具安裝或 Viewer/RAG 驗收。缺工具先按建議修正，版本 unknown 不假定可用；安裝錯誤停止，不刪 lockfile、不自動重試下載。保留現有修改；腳本與文件可用單一相關 commit revert 回復，已明確安裝的全域工具需另外人工解除安裝，不自動刪其他專案共用工具／模型。

官方依據（2026-10-31 查閱）：[Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)、[Claude Code memory／CLAUDE.md](https://code.claude.com/docs/en/memory)、[pnpm 安裝](https://pnpm.io/installation)、[WinGet install](https://learn.microsoft.com/en-us/windows/package-manager/winget/install)。Agent 指令載入受工作目錄、版本、優先序與設定限制；如工具未執行，只能提供手動命令。
