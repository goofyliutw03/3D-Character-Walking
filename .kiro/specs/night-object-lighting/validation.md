# Night / object lighting 驗證（1R-1，2026-10-31）

## 範圍與審閱
使用者核准夜晚、六路燈、群組隨行光、公開掛載API與粒子UI；COMPLEX，沿用模型／推理，依序init→requirements→design→tasks→impl→validate-impl。各gate與task逐項inline審閱通過，無獨立代理，依使用者授權自動審閱而非逐份人工核准。非第七里程碑，SCENE-04/05/FOLD待辦保留；未commit/push，既有瀑布dirty及.codex/.vscode保留。

## 自動證據
- canonical `./scripts/project.ps1 test`：108/108 PASS（既有102＋新增6），exit0。Node公開契約涵蓋原子拒絕非法boolean/color/finite/範圍、父層變換及offset快照、跨池／失效handle、固定槽重用／dispose、128效果8燈與補槽、多輪連發／命中／逾時／縮量／reset、獨立顏色及發射快照、0.25秒淡出、三時段恢復、六路燈材質隔離與回收。
- `./scripts/project.ps1 build`：tsc及Vite exit0、60 modules、雙入口；既有>500kB chunk advisory保留。sandbox spawn EPERM經宿主核准原腳本重跑，沒有更改安全設定或安裝工具。
- `git diff --check` exit0（CRLF提示保留），新增模組／tests與相關diff檢查無新placeholder／機密。類型匯入、生命週期與依賴方向符合設計。
- RED證據：task1缺模組失敗；task2六路燈預期6實為0；task3光源／上限／非法設定3項失敗，實作後通過。第一次task1誤用isolation預設引起spawn EPERM後改回canonical；task3首次測試發現empty spread add警告，修正逐一add後全套無該警告。

## Production GPU 22/22 PASS
忽略的 `.local/night-validation` harness由localhost:4181載入當次dist hashed ViewerApp，真實主角與Target GLB載入後暫停host loop，固定camera／delta做GPU比較。不是source替身，也不把harness固定鏡頭誤稱實體Orbit手感。

| 驗證 | 結果 |
|---|---|
| 真GLB Caster／Target boot | PASS |
| 白天／黃昏／夜晚framebuffer差異 | PASS |
| 六路燈開／關影響受光表面 | PASS，520892 pixels差異 |
| 同一粒子光開／關 | PASS，133950 pixels差異 |
| 獨立紅／藍光、強度、截止半徑、衰減 | 每項framebuffer有差異 |
| 128效果／6路燈＋8群組燈／全點光無陰影 | 恆14盞；PASS |
| 5輪發射／清除shader數量 | 10→10，無連發新增變體 |
| zoom／transparent／wireframe／xray | GL error=0 |
| 魚眼＋xray＋點光 | GL error=0 |
| woman／child／man夜間rig | 各載入渲染PASS |
| First person | 主角保持隱藏 |
| 夜間水景／噴濺／鏡頭濕潤 | mist=.895，GL error=0 |
| 420×700 render target魚眼／xray | GL error=0 |
| shader compilation errors | 0 |

localhost:4173真街道入口顯示Rigged man／Target Ready、Night路燈與角色可辨識；實際UI ArrowUp將光強60→61、Enter Apply成功、Fire命中；radius=0拒絕且顯示設定未改，修正8後可套用；開關off後仍可發射。Console warn/error空。既有input/select/button遊戲鍵隔離及TapGesture只接canvas之邊界未變，Node既有輸入測試亦通過。

420px iframe實際呈現窄版（面板在場景／移動控制下方，無寬度把手），但CUA iframe點擊失效，未聲稱真觸控／窄版完整操作驗收。browser viewport override無實際改變innerWidth（仍1280），已reset，沒有把該次誤報為窄版。

## 效能短樣本
Chromium156／Windows／ANGLE D3D11 GTX1060 6GB；960×600、DPR1、camera=(9,7,15)看向(0,1,4)，水景保留、鏡頭濕潤關閉，角色站立。每段1秒暖機＋5秒RAF interval，單次樣本；點光off指visible=false排除shader，on含固定14槽（無發射時動態槽零強度）。不是128粒子的壓力FPS、GPU timestamp或跨裝置效能保證。

| 時段 | 點光slots | FPS | median ms | P95 ms | draws |
|---|---:|---:|---:|---:|---:|
| day | 0 | 74.97 | 13.30 | 13.50 | 617 |
| day | 14 | 74.37 | 13.30 | 13.50 | 617 |
| night | 0 | 74.97 | 13.30 | 13.50 | 617 |
| night | 14 | 73.77 | 13.30 | 13.40 | 617 |

四段geometry35／texture6／program24一致。約75Hz上限令細微成本不可分辨，不聲稱零成本；資料 `.local/night-validation/report.json` 忽略不提交／索引。

## Coverage / Integration
15/15條件映射：1.1–1.3 CityScene與夜景tests／GPU；2.1–2.4 ObjectLightPool、契約tests及docs/lighting-api；3.1–3.5 ParticleInteraction、快照／池tests及GPU／UI；3.6既有輸入隔離、面板實際鍵盤操作與限制；4.1容量tests／GPU，4.2全tests與production回歸。
通用pool只依Three，不認識particle／time；CityScene、ParticleInteraction各持有pool，ViewerApp組合，main只連公開API。沒有改水Shader、角色動畫、相機權威或導航；瀑布rendered camera及最終合成流程保留。沒有未解本地功能阻擋。

## 限制與rollback
點光無陰影會穿牆；沒有bloom／光暈；MeshBasic及既有水Shader不接場景光。物件移除前由呼叫者remove handle，勿自行重掛或clear池內Light。固定零強度槽仍有shader成本。真手機LAN、跨GPU／瀏覽器、摺疊、真觸控與輔助技術驗收仍待，未倒填M6。回復僅撤本次diff再tests/build/release，保留瀑布及其他dirty，不reset／不清理Release舊hash或陌生檔。

## Validation Report（inline）
- DECISION: GO（本機功能範圍）
- MECHANICAL_RESULTS: canonical108/108、tsc/Vite exit0、markers/secrets CLEAN、production smoke PASS。
- INTEGRATION: 契約一致、所有權及回收清楚、Boundary audit CLEAN。
- COVERAGE: 15/15；人工環境限制明列。
- DESIGN: File Structure Plan一致，無架構漂移；lightRoot相容調整已回填設計。
- OWNERSHIP: LOCAL；UPSTREAM_SPEC: N/A；BLOCKED_TASKS: none。

## Verification Result
- STATUS: VERIFIED
- CLAIM_TYPE: FEATURE_GO
- CLAIM: 已核准夜晚／物件光源完成本機production功能驗證。
- EVIDENCE: 全套108tests、build、22GPU檢查、真入口UI／boot、契約／需求／設計跨task審閱。
- GAPS: 真機／跨GPU／完整窄版操作不包含於成功宣稱。

## Release / 索引 / Token
2026-10-31 18:33:44+08:00 `./scripts/project.ps1 release` exit0：108/108 tests、tsc/Vite PASS、Added2／Updated1／Skipped14。18:33:49逐檔比較當次dist的17檔與外部Release SHA256，mismatches0。無mirror／刪除舊hash或陌生檔案。

`./scripts/project.ps1 preview-release`啟動localhost:4174（未停止4173），實際載入Rigged man與Target，選Night／Street level呈現暖色燈光及深藍夜空，console warn/error空。正式截圖 `.local/night-validation/release-night.png`。這是localhost，非手機LAN驗收。

完整階段token 用量：無法取得精確值，原規劃chat與此chat開頭缺少基準。可取得的本機token_count區間將另列，cached與reasoning不重複加總；不修改設定／DB，不把百分比或context當token。

本機rollout可確認區間：2026-10-31T10:23:38.781Z（18:23:38+08:00）至10:34:59Z（18:34:59+08:00）。起點input509398／output2020／total511418；終點input7828844／output27327／total7856171；差額input7319446／output25307／total7344753。cached input差額7243904已含input，reasoning差額1559已含output，不另加。這是官方session token_count累計差，不含該區間之前／之後或原規劃chat，不代表整個里程碑用量。

索引：第一次codebase_update因本機Qdrant未運作失敗；依授權執行既有`scripts/rag.ps1 start`，health確認Qdrant／Ollama／既有EmbeddingModel皆true。未安裝、下載模型或重建索引。其後增量成功：掃描115可索引檔、added5／updated7／removed0、new chunks62；2026-10-31 18:36:41+08:00 codebase_status確認green、Incremental update completed（28.8秒），總323chunks、graph94檔183edges、watcher disabled。
索引範圍遵守.gitignore／.socraticodeignore與工具支援之原始碼；不含外部Release、忽略harness／資產，不宣稱全部Markdown都embedding。初次連線錯誤已排除，無剩餘索引錯誤。HEAD仍8e945afb3318373937060c8cb798e916b632deda，branch codex/v02-particle-system，無stage／commit／push。
最終文件收尾再查遇一次ECONNRESET，重試成功：115檔全部unchanged/skipped、added/updated/removed皆0；codebase_status再次green、323chunks、Incremental update completed（0.4秒）。未因暫態錯誤重建索引。
