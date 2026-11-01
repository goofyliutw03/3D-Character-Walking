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

## 1R-2 最近單一路燈陰影追加（2026-10-31）
本節取代上方歷史「全點光無陰影」對路燈的限制；通用ObjectLightPool與粒子仍無陰影。使用者明確授權，非第七里程碑；COMPLEX，未切模型、未委派、未commit/push。原六份dirty文件保留。

- task6 inline PASS：六路燈直接持有，共用一個shadow；Night/Shadows雙條件、水平最近燈與0.5m緩衝、非法座標拒絕、dispose冪等。Node 2/2 exit0，循環遍歷六燈四輪與日夜／Shadows往返，stub target僅dispose一次。首次發現Three不公開export PointLightShadow及PointLight.dispose重複釋放共享target，皆已修正並重驗。
- task7整合：ViewerApp建構與每幀movement.update後送motion.x/z，渲染前選燈；未改角色移動、相機權威、水Shader或粒子池API。canonical test 113/113 exit0；tsc/Vite build exit0（sandbox spawn EPERM經宿主核准重跑）。git diff --check PASS，既有CRLF advisory保留。
- production GPU：忽略目錄`.local/shadow-validation` harness由localhost:4183載入當次dist ViewerApp；Chrome156 headless、ANGLE D3D11 NVIDIA GTX1060 6GB，960×600 DPR1。真GLB Caster/Target boot、恆一投影燈、512px cube target、路燈shadow開關31,957 pixels差異、三輪六燈移動仍同target、day/evening/night、Shadows off/on、四遮擋模式、fisheye+xray、woman/child/man、水霧及濕鏡頭皆PASS，20/20、shader errors0、gl errors0。report.json僅為本機忽略證據，不提交／索引。沒有把歷史GPU結果當成本次。
- 成本樣本：固定鏡頭，sun陰影同開，只切路燈陰影；draw calls277→812、triangles31020→69538、textures7→7。這是單幀CPU計數而非FPS／GPU時間或跨裝置保證。點光陰影六面512px；保留已配置target供開關恢復，不隨選燈新增。
- integration/coverage：5.1–5.3由CityScene與Node/GPU覆蓋，5.2由ViewerApp motion→CityScene→render串接審閱，5.4由20GPU checks及成本／限制記錄覆蓋。原通用pool契約與粒子全套回歸通過，依賴方向CLEAN，無Boundary Violations、無blocked tasks。規格／設計／task graph inline自動審閱PASS。
- kiro-validate-impl / kiro-verify-completion：GO（本機功能），FEATURE_GO VERIFIED；fresh full suite/build、built GLB runtime liveness、GPU點光差異與整合、coverage與design alignment均有證據。真手機LAN／跨GPU／其他瀏覽器待既有人工驗收，沒有倒填SCENE-04。
- 限制：最多一盞投影，其他照明仍可能穿牆、填亮影子；12m截止半徑外無該路燈影，MeshBasic/既有水Shader不接點光。邊界可略晚於幾何最近燈切換以防抖。非保證任意距離／材質皆有清晰影子。rollback僅撤本次相關diff再release，不清理舊hash／陌生檔。
- token 用量：無法取得精確值。本追加階段與前chat沒有官方起點基準，不估算、不填0，不修改設定／資料庫。

1R-2 release：2026-10-31 23:10:18+08:00 canonical release exit0，113/113 tests、tsc/Vite PASS，Added2／Updated1／Skipped14；17份dist/Release SHA256相同（mismatches0）。既有>500kB advisory保留，未停止原preview、未改防火牆。

1R-2 收尾：codebase_update成功，122可索引檔，updated6／unchanged116／added0／removed0，36新chunks；2026-10-31 23:11+08 codebase_status green、356chunks、Incremental update completed（23.4秒），graph97檔186edges、watcher disabled。遵守ignore，範圍不含外部Release、.local harness／瀏覽器profile及忽略資產；沒有安裝／下載模型或重建索引。
localhost:4174 HTTP200；先前LAN網址192.168.100.110:4174本次連線拒絕。嘗試以原授權命令恢復指定IP preview得到Port4174 already in use，未停止既有preview、未更換port／變更firewall；讀取網路監聽/IP資訊遭Access denied，未進一步調整。本次不宣稱LAN可達或外機驗收成功。功能交付可於localhost重整Night+Shadows檢視；既有LAN連線問題與SCENE-04人工待辦保留。


## 1R-3 Night 手選多光源陰影（2026-10-31）
本節取代1R-2最近單燈／共享資源限制。使用者明確選擇所有勾選燈同時投影，已授權追加，非第七里程碑。COMPLEX，維持模型、不委派、不commit/push，保留原17份dirty。task8→9→10依序inline審閱；非獨立審查或逐份人工核准。

- CityScene以固定ID1–6集合控制；預設[2]，0–6同時投影，移動不覆寫。每燈獨立PointLightShadow／512px cube target；Night且Shadows on才啟用，關閉保留選擇及target。API原子拒絕非法ID、sparse／非陣列；快照及輸入陣列均隔離；逐燈dispose且整體冪等。通用pool及粒子無陰影契約不變。
- task8 Node2/2、整合canonical113/113 PASS exit0；tsc/Vite PASS exit0，62 modules。sandbox Vite spawn EPERM經宿主核准原命令重跑；既有>500kB advisory保留。diff --check PASS（既有CRLF提示），boundary檔案markers／secrets搜尋無新增殘留。
- production GPU：忽略的.local/multi-shadow-validation於localhost:4185載入當次dist hashed ViewerApp，真GLB Caster/Target；Chrome156 headless／ANGLE D3D11 GTX1060 6GB、960×600 DPR1。22/22 PASS、shaderErrors0；六獨立512px cube target、0/1/2/6同時選擇、三輪target重用、日夜及Shadows往返、四遮擋、fisheye+xray、woman/child/man、水霧濕鏡頭皆通過。六燈對零燈55061 pixels差異，從Light2增加Light5有2511 pixels差異；六target dispose事件各一次。draw時gl errors=0。
- 真production index入口於同源420×700 iframe驗證10/10 PASS：boot至可操作與Target Ready、六原生label/checkbox、Night啟用預設2、雙選、Shadows與evening停用保留、六選／全清、panel keydown不達window、scrollWidth405≤innerWidth420、fieldset328px。這是合成DOM操作與layout，非真手機觸控或讀屏人工驗收。初次UI harness只等靜態Idle即操作而失敗；修正等待lighting可操作及Target Ready後重跑10/10，沒有改runtime掩蓋問題。初次dump-dom在非同步完成前退出，改用保持執行的獨立headless profile取得完整報告。

短成本樣本：固定camera(9,7,15)望(0,1,4)，sun陰影保持開、所有路燈照明保持開，鏡頭濕潤關閉；每段0.5秒暖機＋3秒RAF，單次headless樣本，target皆已配置保留。非GPU timestamp／跨裝置承諾，75Hz上限限制判讀。

| 路燈投影數 | FPS | median ms | P95 ms | draws | triangles | textures |
|---|---:|---:|---:|---:|---:|---:|
| 0 | 74.97 | 13.2 | 16.2 | 529 | 47616 | 12 |
| 1 | 74.85 | 13.3 | 16.5 | 812 | 69538 | 12 |
| 6 | 69.17 | 13.9 | 20.2 | 1853 | 102782 | 12 |

kiro-validate-impl / kiro-verify-completion inline：DECISION GO（本機授權功能）；FEATURE_GO VERIFIED。需求6.1–6.2由task9/UI10項與GPU覆蓋；6.3由task8 Node與GPU lifetime覆蓋；6.4由task10全套／GPU22項覆蓋。UI→ViewerApp→CityScene契約一致，移除movement後auto呼叫，未改導航或角色狀態；原三角色／相機／水景整合回歸PASS。設計檔案及依賴方向一致、Boundary audit CLEAN、OWNERSHIP LOCAL、UPSTREAM N/A、blocked tasks none。
限制：12m外無該燈陰影，其他光源仍可填亮，MeshBasic／現有水Shader不接點光；最多六燈成本較高。RTX2050舊版操作回報不視為本新增功能驗收；真手機LAN、跨GPU、讀屏及M6既有待辦不變。rollback只撤本次diff再release，保留其他dirty及Release舊hashed／陌生檔。
token 用量：無法取得精確值；本階段沒有官方session token_count起點及可用差額，不估算／不填0，不修改設定或資料庫。


1R-3 release：2026-10-31 23:42:16+08 canonical release exit0，113/113 tests、tsc/Vite PASS；Added3／Updated1／Skipped13。17份dist/Release SHA256相同（mismatches0），未刪舊hash／陌生檔。localhost:4174 HTTP200；sandbox內LAN請求拒絕，宿主授權的唯讀檢查確認192.168.100.110:4174 HTTP200，監聽PID31972、localhost PID21424均保留，未改firewall／停止原preview。本機LAN入口可達並非外機人工驗收。

1R-3 索引：2026-10-31 23:43+08增量update完成（27.6秒），122可索引檔、updated9／unchanged113／added0／removed0、73新chunks；codebase_status green、357chunks、graph97檔186edges、watcher disabled。遵守ignore，不含Release／.local或忽略資產，未安裝／下載／重建。最終文件補記後再次增量／status確認，結果見交付摘要。

## 1R-4 陰影自動觸發偵測
使用者明確授權，同範圍規劃→spec→inline審閱→task11→12→13依序，無委派、模型切換、commit/push。Requirement7覆蓋7.1–7.5，舊6.2不提供auto限制由本追加取代。
- canonical test114/114 PASS；build tsc/Vite62 modules PASS。sandbox build遇spawn EPERM，經宿主審核以原腳本重跑成功，未改安全設定。
- Node新增精確≤邊界及離開、3D高度、多候選、候選空集、非法boolean/radius/vector原子拒絕、快照、父層世界變換及日夜／總陰影保留。
- 當次dist production GPU29/29 PASS：GTX1060 6GB／Chrome156 headless，auto邊界同時2燈、離開0燈、高度、候選即時、權威xyz及jump同幀（y=.3525）、六獨立cube targets重用／各dispose一次、可見像素差、三角色、四遮擋、fisheye+xray、水霧濕鏡頭及shader errors0。
- 真入口420×700 iframe DOM14項PASS（原生label/range/output檢查為truthy DOM元素）：即時7.5m、auto/radius往返、range及checkbox鍵盤隔離、六候選與全清、disabled保留；scrollWidth405≤420，fieldset328。合成DOM/layout，非真觸控／讀屏。
- GPU短樣本0/1/6燈約58.3/67.0/46.7FPS，draws529/809/1848，受同時UI iframe與當時負載影響，不能推論單調效能或跨GPU承諾。
Integration inline PASS：UI→ViewerApp→CityScene契約一致；motion腳底xyz包含ground/jump，在movement後render前傳遞；setter用最後位置即時同步；candidate不受effective覆寫。六shadow所有權不變、無pool/particle改動、依賴方向符合設計，Boundary audit CLEAN、OWNERSHIP LOCAL、UPSTREAM N/A、blocked implementation none。新增TODO/FIXME與secret掃描CLEAN。FEATURE_GO VERIFIED（本機功能）；M6／SCENE-04/05/FOLD及外機／讀屏既有待驗保留。
限制：偵測半徑不擴大12m光照；六燈GPU成本高。rollback撤本次增量且保留原dirty後release，不刪陌生／舊hash。
token 用量：無法取得精確值；本chat無官方session token用量起點／可用差額，未使用前chat累計，未估算或更改設定／資料庫。

1R-4 release：2026-10-31 23:53:31+08 tests→build→sync exit0，Added3／Updated1／Skipped13，17份dist/Release SHA256相同。未刪舊hash／陌生檔，未停止原preview；新功能需刷新入口。索引收尾結果見本chat交付摘要。
