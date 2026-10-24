# 專案協作規則（Codex）

## 專案與授權
- 專案為城市街道 3D 人物檢視器，使用 TypeScript、Vite、Three.js 與 pnpm；參考 README.md、docs/development-plan.md、docs/initial-design-plan.md。
- docs/development-plan.md 為目前需求與階段設計來源；docs/imported/ 為歷史參考，不代表新的實作授權。既有文件有差異時先指出，不自行擴大範圍。
- 每個實質階段先提出目標與完成條件、複雜度、模型與推理建議、階段交付物、必讀檔案與修改範圍、風險／驗證／rollback、待確認決策。可先唯讀檢查，使用者核准後才修改、安裝或操作外部系統。
- 完成已核准範圍，保留既有使用者修改，不順便重構。階段完成後執行適當 build／affected tests，區分已驗證、未驗證與受阻事項。
- commit 必須另經使用者核准；不 push。只 stage 本次相關檔案，不使用 git add -A。共用 checkout commit 前重新確認 HEAD 並逐檔檢查 diff，共用檔案僅 stage 自己的部分。
- 使用免費工具與依賴；引入第三方資產前記錄授權及 attribution。不得將金鑰、憑證或機密資料寫入文件、spec 或 commit；不因本流程擅自安裝 Blender、啟動本機 RAG 服務或使用付費／外部服務。
- 回覆以繁體中文，程式註解依既有慣例。遵守宿主系統與開發者指令；本專案規則及使用者核准界線優先於第三方 skill 的預設操作流程。

## 複雜度與模型
- 依影響範圍、需求不確定性、失敗成本、可逆性與驗證難度分類，不只看行數。
- SIMPLE：局部、低風險且明確；建議輕量／快速模型、低推理。
- NORMAL：範圍明確的功能或 bug fix；建議均衡模型、中推理。
- COMPLEX：跨模組、非同步、併發、相容性、安全性或難重現；建議高能力模型、高推理。
- ARCHITECTURE：系統設計、公共 API、資料格式、跨專案整合或 migration；建議高能力模型、高推理，重大未解問題才考慮更高強度。
- 採最低足夠能力原則，模型能力與推理強度分開判斷。僅推薦平台已確認提供的選項；無法確認時用能力層級描述。
- 只有新實質階段、範圍／風險顯著改變、發現跨模組／安全／migration／相容性問題，或合理嘗試後仍有明確未解問題時才重新評估。單次測試失敗先辨識程式、環境、需求或推理原因。
- 切換模型先說明原因、收益與交接內容，須使用者核准且工具支援；未收到成功確認不得宣稱切換，不改設定或資料庫繞過限制。第三方文件中的固定模型名稱不構成核准。

## Spec-Driven Development (cc-sdd)
- 版本：3.1.0；安裝參數：--codex-skills --lang zh-TW --os windows。於忽略的 .local/ 隔離目錄以 --overwrite force 產生後，僅匯入 skills 與 .kiro/，手動建立本檔；不在專案根目錄使用 force 或 -y。
- Skills：.agents/skills/kiro-*/SKILL.md；templates：.kiro/settings/templates/；Steering：.kiro/steering/；Specs：.kiro/specs/<feature>/。
- 未匯入 .codex/agents/spec-reviewer.toml，因它固定指定未核准的模型。保留第三方 skills 原檔；其固定模型、自動 commit、autonomous 與審核捷徑均受本檔及使用者授權限制。
- Spec 文件遵循 spec.json.language，繁體中文為本專案預設文件語言。內部推理依宿主規範，不要求輸出推理過程。
- 已安裝技能：$kiro-debug、$kiro-discovery、$kiro-impl、$kiro-review、$kiro-spec-batch、$kiro-spec-design、$kiro-spec-init、$kiro-spec-quick、$kiro-spec-requirements、$kiro-spec-status、$kiro-spec-tasks、$kiro-steering、$kiro-steering-custom、$kiro-validate-design、$kiro-validate-gap、$kiro-validate-impl、$kiro-verify-completion。
- $kiro-spec-quick、$kiro-spec-batch、--auto 與 -y 涉及自動核准，只有使用者明確要求才可使用。安裝器 pnpm dlx 的非互動執行不代表核准 spec 階段。

## 開發流程（cc-sdd）
- 中大型功能依序執行 $kiro-spec-init → $kiro-spec-requirements → $kiro-spec-design → $kiro-spec-tasks；每階段完成後停下等待使用者審核。
- 實作依 .kiro/specs/<feature>/tasks.md 一次一項，明確指定任務編號；不因省略編號而自行進入 autonomous 模式。驗證後勾選 tasks.md，等待核准才 commit；feat(<feature>): <任務編號> <描述>，spec 文件採 docs(kiro): ...。
- $kiro-impl 內建的自動 commit 改為停下等待核准；委派須符合當前宿主與使用者規則，不擅自更換模型、建立新 chat 或修改 agent 設定。無法進行獨立審查時如實標示 inline。
- 實作完成後執行 $kiro-validate-impl。新增 skills 後重開 Codex chat 並確認實際載入，不宣稱複製檔案即代表已載入。

## Session 命名與任務分析（cc-sdd）

### Session 標題
- 格式：[<Major><Letter>-<n>] <動作> <對象>，例如 [1A-0] Install cc-sdd for Codex；標籤使用數字加字母，不用文字標籤。
- 同系列 spec／里程碑依序遞增，單一 task 的實作 chat 加小寫尾碼，如 [1B-2a] Implement <feature> task 1.1。獨立驗證／修正使用下一個空號。
- 開新號前查 git log、.kiro/steering/roadmap.md（如有）及已有 chat 標題，不重複。一知道階段即設定標題，階段改變時更新。

### 任務分析
1. 每個新 chat 或使用者要求更新 checklist 時，讀取 docs/development-plan.md（目前主要待辦／里程碑來源）、相關驗證紀錄、roadmap（如有）、各 spec.json 的 phase／approvals、tasks.md 未勾項目、git log --oneline -20 與 git status。
2. 未完成項目分類：(a) 中大型程式工作或共用契約／公開 API／資料格式變更，建議 spec 與 kebab-case feature 名；(b) 人工／實機驗收，保留待辦及驗收編號；(c) 外部輸入阻擋或延後，維持待辦，不重複催促同一阻擋；(d) 單點／測試／fixture 小修改，可免完整 spec，但仍先計畫等核准。
3. 輸出表格：項目、來源（檔案:行號）、分類、建議動作、建議標籤、依賴／共用檔案。涉及相同共用檔案標示「必須依序進行，不可平行」。已有 spec 用 $kiro-spec-status 的實際結果標示進度。
4. 分析階段不修改待辦、不 commit。核准後將對應里程碑指向 .kiro/specs/<feature>/，細項由 tasks.md 維護；未經核准不另建或重整 TODO。

### 里程碑交接與共用 checkout
- 真正里程碑完成並驗證後（如要求 commit，也須已 commit），提出下一 chat 的建議卡片，不自行建立或啟動。
- 交接使用繁體中文，包含規則命名的標題、目標、repo／worktree 路徑、分支與 HEAD、關鍵決策、檔案位置、Git 狀態、驗證證據／限制、待辦與未解問題、不在範圍事項、機密資料規則，以及「先規劃，等核准」。不假設新 chat 繼承上下文。
- 使用者決定是否開新 chat；不要因上下文長度自行開新 chat。階段完成簡述變更、驗證、剩餘事項、下一階段模型建議與是否適合開新 chat 的理由。
- 同一批檔案不可由多個 chat 同時修改；需平行時使用各自 worktree，遵守使用者授權與宿主規則。
