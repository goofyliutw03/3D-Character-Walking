# Plan v02 — Particle System 驗證

## 範圍與審閱
2026-10-30 Asia/Taipei，1N-0，分支 codex/v02-particle-system，基準 HEAD cc52088。保留原有未追蹤 .codex/、.vscode/；無 commit／push、無委派／新依賴／新資產／模型切換。規格 init → requirements → design → tasks，按使用者授權自動 inline 審閱通過，非逐份人工核准。僅一名 Target 追加授權，無 NPC AI／戰鬥，M6／SCENE-05人工驗收保持原狀。

| 項目 | 來源 | 分類 | 動作／標籤 | 依賴 |
|---|---|---|---|---|
| v02雙角色粒子 | requirements.md:11 | a | particle-interaction／1N-0，已核准實作 | ViewerApp／main／style，必須依序進行，不可平行 |
| 手機／跨GPU人工驗收 | docs/development-plan.md、roadmap SCENE-05 | b | 保留原待辦 | 實機輸入 |
| 其他NPC／NavMesh | roadmap LATER-03 | c | 維持延後 | 不在本案 |

## Mechanical Results
- Tests：`./scripts/project.ps1 test`，73 tests／73 pass，exit0；新增7項測試（Target2、粒子5），既有66全過。
- Static／build：`./scripts/project.ps1 typecheck`、`./scripts/project.ps1 build` exit0；41 modules。658.80 kB 主engine chunk 為既有 >500kB 類型 advisory，未做未核准拆包。
- RED：Target／Particle 模組尚未存在時 canonical isolation=none 報 ERR_MODULE_NOT_FOUND；初次缺少 isolation 造成 spawn EPERM 是環境錯誤，未當作行為 RED。核心採 test-first，未做完整 feature-flag OFF protocol；整合依實際 production 操作驗證，此流程差異已記錄。
- `git diff --check`：修正 README 多餘 EOF 空白後通過。既有 LF→CRLF 提示不影響內容。
- 新程式／測試掃描無新增 TBD／TODO／FIXME／HACK／XXX 或硬編碼機密。實際檢視 diff 與所有新增檔，未修改資產／上游相機／移動契約。

## Production Browser
使用既有 localhost:4173 production preview，未停止原服務。IAB 真實載入 man 與 woman Target：兩名角色及藍／橘胸部錨點，Caster／Target標籤可見。
- 單發結果 Hit · Active0 · Hits1；連點兩次與 Space 按鈕啟動結果 Active3；沒有新增快捷鍵或Jump衝突。
- Lifetime0.1 套用後得到 Expired、Active0；Reset歸零。
- Speed0.5、limit1連發得到 Capacity reached／Active1，稍後逾時。
- Speed99原生數值驗證與明確錯誤，設定不變；恢復8／32／3。
- Caster選Child並實際move right得到Child Walk，Stop後Idle；Target維持Rigged woman Ready及站位。
- First person保留Target且隱藏Caster標示；魚眼、wireframe、transparent均可切換並發射，最後恢復zoom／overview。
- 390×844模擬窄版按鈕可操作及換行，已reset viewport；不是手機LAN或真機驗收。
- browser console error清單為空；本機75 FPS短樣本，非效能承諾。Caster移至障礙附近後既有auto zoom曾壓至極近構圖，維持既有策略，未聲稱各構圖皆能同時看見兩人。

## Integration Gate
- DECISION: GO（本機功能範圍，Release／索引結果另列）
- Cross-task contracts：Target獨立CharacterAssets／mixer／骨架／geometry；Caster變更不影響Target。Particle只消費向量，不回寫角色位置。
- Coverage：1.1–1.4→Target／整合，2.1–2.4→Particle，3.1→設定與快照，3.2–3.4→整合／既有回歸／資源測試；12/12。
- Design：檔案結構、依賴方向與boundary符合；獨立載入、上限128 slots、每命中8粒子、共享單一geometry、每slot材質釋放。512次滿額命中後所有512材質釋放、場景子物件歸零。
- BLOCKED_TASKS: none；OWNERSHIP: LOCAL；UPSTREAM_SPEC: N/A。
- Verification STATUS: VERIFIED；task review VERDICT: APPROVED，inline而非獨立審查。細節見tasks Implementation Notes。
- 未驗證：真機／跨GPU、實體IME／螢幕閱讀器、瀏覽器強制context loss；不變更原人工待辦。

## Release／索引
`./scripts/project.ps1 release` 經宿主 escalation 核准，73/73 tests、build exit0，完成時間2026-10-30T07:41:27.2631541+08:00。目的地 `D:\Work_Mine\Testing\3D Character Walk Viewer\Release`，Added4／Updated1／Skipped7；逐一比對dist的12個檔案SHA256，mismatch0。保留既有hashed資產，未複製source／設定／機密。

`preview-release`嘗試啟動因4174已占用報錯exit1，未停止任何服務；改以既有4174頁面實際確認新版本。man及Target woman皆Ready，單發Hit／Active0／Hits1，console error空。截圖在忽略目錄 `.local/particle-validation/release.png`，IAB頁面保留供檢視。這是localhost驗證，非LAN驗收。

索引2026-10-30 07:43（Asia/Taipei）完成：codebase_update掃描81個可索引檔，新增4／更新5／移除0，57個新chunks；codebase_status確認green、Incremental update completed、共219 chunks，graph63 files／122 edges。無索引錯誤、未啟動或安裝服務／模型。範圍為遵守.gitignore／.socraticodeignore的本專案可索引檔，不含外部Release，亦不宣稱全部Markdown／資產均有embedding。最終文件紀錄補入後再次增量確認。

## Token 用量
完整階段 token 用量：無法取得精確值。規劃chat缺少基準，本chat首次token事件亦已含開頭工作，且收尾紀錄之後仍有回覆。可確認本chat部分區間將於收尾記錄；不填0、不估算、不重複計入 cached／reasoning。

本機session官方token_count可確認部分區間：2026-10-30 07:32:02.202–07:42:11.916（Asia/Taipei），input差額5,147,629／output21,333／total5,168,962。cached input4,890,880已含於input，reasoning1,325已含於output。基準累計input24,945／output194／total25,139；差額只計本chat上述區間，不含基準前與此點後、前規劃chat，無已重複計入區間。未更動設定或資料庫。
