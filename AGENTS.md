# 專案協作規則（Codex）

## 里程碑收尾：索引與 token 用量（2026-10-26 使用者更新）
- 每次交付里程碑完成實作與驗證、準備提出結束確認時，自動更新本專案 codebase index，不逐次索取核准。優先使用既有 SocratiCode 的增量 codebase_update；尚無索引才使用 codebase_index。若使用者另核准收尾 commit，提交後再次確認索引涵蓋最終狀態。
- 此授權包含以 scripts/rag.ps1 start 啟動既有本機 Qdrant／Ollama 供索引使用；遵守 .gitignore／.socraticodeignore 及機密排除，不安裝工具、下載模型、使用雲端或重建／刪除既有索引。缺少既有服務／模型或工具失敗時記錄阻擋，不冒稱完成。
- 索引後查 codebase_status 確認完成，收尾摘要顯示結果、索引範圍／完成時間及錯誤（如有）；背景作業僅啟動不算完成。
- 每次里程碑結束摘要顯示本階段實際 token 用量與統計範圍。開始時記錄可取得的官方工具或本機 session 用量基準，結束時取差額；若跨 chat，彙總可明確歸屬本里程碑的各段用量，避免重複計算累計值。
- 有明細時分列 input／output／total；cached input、reasoning 等若已包含在上層分類，僅作附註，不重複加總。帳號額度百分比、context 占用量、字數或估算不得當成本階段實際 token 數。
- 若無可取得的精確用量、缺少階段起點或無法拆分共用 chat，明示「token 用量：無法取得精確值」及缺漏原因／可確認的範圍，不填 0、不捏造，亦不為取得統計修改 Codex 設定或資料庫。交接帶入用量基準、已計入區間及缺漏。
- 本政策不增加里程碑、不變更里程碑開始／結束確認及 commit／push 授權；取代舊規則中禁止為本項已授權收尾作業啟動既有本機 RAG 的限制。

## Session 政策（2026-10-26 使用者更新，優先於下文舊規則）
- 後續所有本專案 sessions：進入新的工作階段時，自動建立新的 chat，將目標與必要交接內容帶入；不要藉由更新原 chat 標題代替建立新 chat。使用者已明確授權此行為，不逐次重問是否開新 chat。
- 新 chat 仍須遵守命名、範圍與里程碑授權規則；建立 chat 不等於授權範圍擴張、commit、push、模型切換或平行委派。同一批檔案必須依序交接，原 chat 交接後停止修改。
- 適當時機整理精簡上下文／交接摘要，保留目標、授權、決策、Git 狀態、驗證證據與未解事項；有系統支援時使用上下文壓縮，無可呼叫工具時不得宣稱已執行系統壓縮。不要只因上下文長度建立沒有新工作階段的重複 chat。
- 本政策取代下文「不自行建立或啟動」「由使用者決定是否開新 chat」與「階段改變時更新原 chat 標題」等衝突規則，適用之後所有本專案 sessions。

## 里程碑審閱政策（2026-10-24 使用者更新，優先於下文舊逐階段確認規則）
- 里程碑以 docs/development-plan.md 的六個交付里程碑及 roadmap 對應為準；requirements、design 或單一 task 不另算里程碑。
- 使用者確認開始某里程碑後，範圍內的規劃、requirements、design、tasks、實作、審閱、修正與驗證自動依序推進，不逐階段或逐項索取核准。每個里程碑開始仍提出目標與完成條件、複雜度、模型／推理建議、交付物、必讀與修改範圍、風險／驗證／rollback、待決事項。
- 自動審閱須確實檢查並記錄結果，不跳過品質門檻。通過後可更新 spec.json 對應 approvals，但須記錄為依使用者授權自動審閱通過，不冒稱使用者逐份人工核准。實作自行依 tasks.md 依賴選擇及記錄任務編號，一次一項，驗證後勾選並繼續。
- 只有里程碑結束時，總結變更、審閱結果、驗證證據、限制、剩餘事項與下一里程碑建議，提示使用者確認；確認後才開始下一里程碑。未解必要外部輸入或授權限制如實指出，不假造驗收或跨越授權。
- 同一已確認里程碑內可使用自動審閱／核准選項；不跨里程碑自動推進，跨功能 spec-batch、平行委派與範圍擴張仍需另有授權。小修改在里程碑範圍內先計畫後執行，範圍外仍待核准。
- commit 另行核准、不 push、保留既有修改、模型切換另行核准，以及工具安裝／外部系統／免費資產與機密限制維持原規則。自動審閱不授權額外外部操作。
- 本政策取代下文與第三方 skills 中同一里程碑內的「每階段停下審核」「逐項等核准」「未指定任務編號不得繼續」限制；保留 cc-sdd 階段順序與驗證要求。交接須帶入本政策，不再要求已確認里程碑內逐階段人工審閱。

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
