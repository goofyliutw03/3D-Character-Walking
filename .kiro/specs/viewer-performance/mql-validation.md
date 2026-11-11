# Validation Record

2026-11-10／1U-0，使用者核准同範圍依序執行；無委派，審閱模式inline，無commit／push。

## 基準與環境
- 初始HEAD `47f5e68d9a8c6931dff187dc53fe7503233d38e9`，main。既有dirty `.codex/config.toml`保留不讀內容；執行中另出現已stage的`docs/onboarding.md`，不是本次修改，保持原狀。
- 唯讀登錄／nvidia-smi：Intel UHD Graphics630 driver30.0.101.1339；NVIDIA GTX1650 4096MiB driver560.94（Windows登錄32.0.15.6094）。此不提供GPU0/1映射，也不保證所有瀏覽器選卡。
- 原生CUA先前因無法可靠辨識Chrome網址停止，本次不繞過政策。使用既有Playwright作隔離headless瀏覽器整合測試，不使用既有分頁／profile、不改安全／GPU設定。
- Chrome基準：HeadlessChrome156（UA精簡版號156.0.0.0），Windows NT10.0；ANGLE NVIDIA GTX1650／D3D11，確實非SwiftShader；context high-performance／antialias true。視窗1280×800，canvas960×460，DPR1。
- 既有inspector／shadows／水景設定維持；四場景透過真UI設定，3秒暖機＋15秒採樣，各三輪。CPU為RAF callback耗時，不是GPU timestamp。結果見`chrome-before.json`。
- 第一次腳本有控制項位於收合details的timeout；修正祖先展開後重跑。另一次結束時因favicon404失敗，該輪不列正式比較；腳本只對無關favicon回204，應用資源錯誤仍失敗。sandbox內網路遭拒、跨層localhost逾時後，以核准的同層localhost5176獨立伺服器測試，不改防火牆。

## Task 1 Review
- STATUS: READY_FOR_REVIEW
- VERDICT: APPROVED（inline）
- 檢查真main、獨立profile、四場景三輪、nearest-rank與elapsed算法、console／pageerror失敗條件及finally關閉自建browser；`node --check scripts/viewer-benchmark.mjs` exit0。
- 3個requirements sections／11條criteria均有design映射；requirements／design與task graph gate inline PASS。15個既有spec皆implementation-complete且tasks無未勾，保留M6與SCENE-05人工待驗。
- Claim TASK1 VERIFIED：Chrome12筆實測、renderer、docs六組平台矩陣齊備；手機真機未驗明示，Edge後續同條件回歸不由Chrome推定。

## 排除的候選與局部修改依據
- 初讀曾懷疑每幀characterReport導致相同innerHTML重建；補讀main.ts:113確認已有key去重。正式基準所有輪guideChanges=0，維持既有機制，不新增比較器或型別抽取；已修正需求／設計／任務。
- 正式基準可計數reduced-motion的matchMedia每幀1次，單輪約840–850次、約13–17ms合計；屬小CPU／配置成本，不宣稱GPU瓶頸。
- RED_PHASE_OUTPUT：`RED_ONLY=1 node scripts/viewer-smoke.mjs` exit1，assert steady frames reuse，0.5秒額外查詢實際26、預期0。這是原症狀的整合證據。
- Chrome基準期間曾執行上述約5秒RED smoke，可能干擾部分末段採樣；不將其FPS差異當因果證據。後續正式after量測不與其他browser或build／索引並行。

## 實機與平台界線
iPhone Safari與Android Chrome／Edge／Firefox、真Intel context、前景Chrome／Edge、手機OS／機型下限、LAN、熱降頻、實際背景／鎖屏與OS GPU重設仍未驗。桌面viewport及原生WebGL擴充故障注入僅是本機整合證據。不自動勾M6／SCENE-04/05/FOLD。

## Task 2 Review
- STATUS: READY_FOR_REVIEW
- VERDICT: APPROVED（inline）
- 修改前已讀實際diff：ViewerApp僅新增一個readonly MediaQueryList並替換三處matchMedia呼叫；公開API、main狀態去重、畫質／renderer及更新時序保持原狀。沒有新增listener，不需解除註冊，讀matches而非快取boolean。
- GREEN：`node scripts/viewer-smoke.mjs .local/chrome-dev-smoke.json` exit0，7組檢查：穩態query不增加；同一MQL經reduce→no-preference→reduce即時反映；三角色；鏡頭／Follow／遮擋；W移動／放開Idle；夜間＋魚眼＋Xray與三尺寸resize；原生context loss／restore。pageerror及console error皆空。
- 測試初次遇到下一幀更新時序與Follow提示元素判斷錯誤，修正測試等待與selector後通過；不改產品來迎合測試。
- Fresh全套`./scripts/project.ps1 test`：112 pass／0 fail／0 skipped，exit0；`build`含tsc，exit0，62 modules。保留既有>500kB chunk advisory，不藉此改拆包。
- 掃描本次明列檔案無placeholder／硬編碼機密匹配；未讀既有config，git diff --check通過。未安裝或引入新依賴。
- Claim TASK2 VERIFIED：重用query與即時偏好、原互動在本機Chrome整合範圍通過；不外推跨平台真機。

## Chrome 前後比較

| 場景 | Before FPS三輪範圍 | After FPS三輪範圍 | Before query數／輪 | After query數／輪 | Draws／triangles（相同） |
| --- | --- | --- | --- | --- | --- |
| 一般街道 | 56.015–56.284 | 56.600–56.628 | 841–844 | 0 | 674／50.1k |
| 夜間水景overview | 56.240–56.505 | 56.631–56.769 | 844–848 | 0 | 674／50.1k |
| 魚眼 | 56.532–56.614 | 56.615–56.741 | 849–850 | 0 | 548／47.9k |
| Xray | 56.466–56.687 | 56.454–56.687 | 848–850 | 0 | 1083／62.3k |

三輪P95 before18.1–18.2ms、after18.2ms；CPU callback median沒有一致下降，Xray FPS範圍重疊。部分場景FPS略升，但環境排程、instrumentation及順序效應未排除，且基準末段可能受一次RED smoke干擾，不宣稱可歸因的FPS增幅。已證實的是每幀查詢物件建立消除、畫質設定及渲染統計不變。完整12+12筆資料與CPU P95見`chrome-before.json`／`chrome-after.json`；無console／pageerror。

Edge157（UA精簡版號157.0.0.0）修改前亦使用ANGLE GTX1650／D3D11、960×460／DPR1；其7組dev整合smoke exit0、errors空，見`edge-dev-smoke.json`。修改後正式比較依序執行，未與Chrome／build／索引並行。

## Edge 前後比較

| 場景 | Before FPS三輪範圍 | After FPS三輪範圍 | Before query數／輪 | After query數／輪 |
| --- | --- | --- | --- | --- |
| 一般街道 | 56.549–56.603 | 56.562–56.666 | 849–850 | 0 |
| 夜間水景overview | 56.369–56.636 | 56.668–56.755 | 846–850 | 0 |
| 魚眼 | 56.418–56.755 | 56.629–56.720 | 846–852 | 0 |
| Xray | 56.682–56.720 | 56.531–56.851 | 851 | 0 |

多個場景範圍重疊、CPU callback median沒有一致改善；P95 before18.1–18.2ms、after18.1–18.2ms。draws、triangles、geometries、textures與Chrome對應場景一致且修改前後相同，guideChanges皆0，errors皆空。與Chrome相同，只確認query建立成本移除，不宣稱FPS增幅。完整資料見`edge-before.json`／`edge-after.json`。

## Production 與 Release
- Chrome／Edge在localhost4177各跑7組相同整合檢查，皆exit0／errors空，見`chrome-production-smoke.json`及`msedge-production-smoke.json`；兩者為獨立profile，屬功能回歸，未混入正式效能採樣。
- 18:02:49（Asia/Taipei）`./scripts/project.ps1 release` exit0：fresh112／112 tests、tsc／build通過；Added2、Updated1、Skipped14。目的地`D:\Work_Mine\Testing\3D Character Walk Viewer\Release`，hash相同略過、資產先、index最後；未mirror／刪陌生或舊hashed檔。既有chunk>500kB提示保留。
- `preview-release`啟動exit1，原因4174已被既有服務使用；未停止／替換該服務。18:03:17使用既有4174核對index.html與water.html回應全文均與當前dist完全一致，兩入口WebGL就緒、無非預期errors，見`release-smoke.json`。本次Chrome完整版本156.0.8078.48；仍為headless，不算LAN／真機驗收。

## Feature Validation（本機範圍）
- DECISION: GO（已核准的本機局部優化、量測與跨平台驗證規劃）；真機／Intel／前景環境為MANUAL_VERIFY_REQUIRED，不外推完成。
- MECHANICAL_RESULTS: 112 tests PASS／build PASS／production smoke兩瀏覽器PASS／Release PASS；preview新啟動因port占用失敗，既有服務已驗為最新Release且雙入口PASS。placeholder及機密pattern掃描CLEAN，無新增依賴。
- INTEGRATION: main去重及ViewerApp／MediaQueryList契約一致；read matches維持即時，無新listener。相機、角色、導航相關112單測與production互動／native context回歸通過。
- COVERAGE: 3／3 sections、11／11 criteria有設計／任務／實測或明確驗證矩陣映射。1→Chrome／Edge48筆；2→RED26次與GREEN0次、即時MQL及真UI；3→六組矩陣、限制與Release／索引。
- DESIGN: File Structure Plan吻合；只更動ViewerApp三處query與新增readonly欄位。原設計候選經實測排除，不引入新比較器、向上依賴或共享狀態。無Boundary Violations。
- OWNERSHIP: LOCAL；UPSTREAM_SPEC: N/A。沒有必要上游修復。
- BLOCKED_TASKS: 無本機實作阻擋；手機及跨GPU等既有人工待驗保持原狀。
- Rollback：僅撤本次query重用並重跑release即可；無資料遷移／持久設定，不碰使用者config與已stage onboarding，不commit／push。

## Index / 收尾
- 2026-11-10 18:04（Asia/Taipei）既有SocratiCode `codebase_update`同步完成：123個indexable files，新增4／更新2／移除0、33個新chunks。`codebase_status`確認green、Incremental update completed，總計358 chunks，graph99 files／188 edges；watcher disabled，無錯誤。
- 範圍為遵守.gitignore／.socraticodeignore的本專案可索引檔案；不含外部Release、.local、public/assets、機密及其他排除項；不保證每個Markdown／JSON皆被embedding。未安裝、下載模型、重建／刪除索引或啟動雲端服務。此收尾文件更新後再執行增量確認。
- Claim TASK3 VERIFIED（本機）：Chrome／Edge共48筆效能採樣、四份dev／production整合JSON、112測試與build、Release雙入口及索引完成證據。審閱VERDICT APPROVED（inline）；整體跨GPU／手機實機仍MANUAL_VERIFY_REQUIRED。
- HEAD仍47f5e68；未stage／commit／push本次檔案。建議後續先以真機矩陣驗收iPhone Safari及Android三瀏覽器，再依實測決定品質／DPR；不自動啟動新的實作或第七里程碑。
- 自建5175／5176 dev及4177 production preview已用各自session的Ctrl+C停止，既有4174未動。5176 dev watcher在寫入四份新測試JSON時曾報EBUSY，這是證據檔watch事件，非瀏覽器pageerror；production與Release驗證均通過，未據此隱藏應用錯誤或重試產品修改。

## Token
token用量：無法取得精確值。此工作階段起點無官方可取得的精確用量基準，不能拆分原chat與本chat或以context／字數估算；未讀改Codex資料庫／設定。
