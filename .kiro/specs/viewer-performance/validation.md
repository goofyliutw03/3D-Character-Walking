# viewer-performance 驗證紀錄

## 授權與基準
2026-11-10：使用者於缺失規格查核後明確選擇「依 main 重建規格並續作」，另指定 PC Chrome／Edge、Android Chrome／Edge／Firefox、iPhone Safari。起點 main / 47f5e68d9a8c6931dff187dc53fe7503233d38e9，工作樹乾淨；保留 codex/v02-particle-system 的額外提交，未整合、未 commit／push、未委派或切換模型。

新規格 task 1–3 是此次制定，不冒稱找回交接原檔。需求→設計→任務依使用者同里程碑授權 inline 審閱 PASS，9/9 條件有對應；非逐份人工核准。

## Task 1：同步成本基準
- 可重跑：`node --experimental-transform-types scripts/benchmark-object-index.mjs`。
- A/B：先保存修改前 `src/inspector/SceneObjectIndex.ts` 至忽略的 `.local/viewer-performance/baseline.ts`，執行 `node --experimental-transform-types scripts/benchmark-object-index.mjs .local/viewer-performance/baseline.ts`。
- Intel Core i7-7700 @3.60GHz、Windows x64、Node v24.22.1，真實 CityScene 442 nodes，200 次暖機、9輪各1000次同步；同程序交替量測原／新版，各輪反轉先後順序。
- 原始資料 `.local/viewer-performance/before.json`／`after.json`。原版獨立預跑中位 0.2490761ms；正式交替比較結果如下，不能混用不同輪次當分母。

| 版本 | 每次同步 ms（9輪平均各1000次） | 九輪中位 ms |
|---|---|---|
| 原版 | 0.275804, 0.280017, 0.267710, 0.200468, 0.199735, 0.198385, 0.285928, 0.230538, 0.327572 | 0.2677102 |
| 新版 | 0.205851, 0.224138, 0.160916, 0.157785, 0.141018, 0.132223, 0.171509, 0.166660, 0.173984 | 0.1666602 |

中位同步成本減少約37.75%，每次約少0.101ms。這是 Node 的穩定場景 CPU 微量測；不是總幀時間／FPS／GPU timestamp，也沒有量測 heap bytes。ViewerApp 每250ms同步，此收益很小，不應宣稱整體畫面快38%。保持全部場景遍歷，未變時不重建442個列物件、不序列化 JSON。

## Task 2：回歸與審閱
- RED：正確加入 `--test-isolation=none` 後，原版新快照重用測試實際 assertion failure，5/6 PASS；未指定 isolation 的前次 spawn EPERM 只是環境錯誤，不算 RED。
- GREEN：索引6/6 PASS；完整114/114 PASS，無 skip／fail。舊112 tests為本次新增2 tests前基準。
- 3,000次固定seed混合改名、掛載／移除、篩選、checkbox與transform變更，原／新版每步 rows及sync回傳值一致。此為一次性對照檢查，未取代永久回歸。
- 檢查：舊快照不被修改；改名更新子孫path與matched；排序、重新加入保持ID；transform／visible不誤報；checkbox／configure與同步快照分離；dispose後重新同步正確。
- Review Verdict: APPROVED（主agent inline）。產品修改僅 SceneObjectIndex；無 UI、排程、圖形、資產、外部依賴變動。diff check PASS；產品／測試／benchmark無新增placeholder或hardcoded secrets。沒有獨立reviewer。

## Task 3：整合證據
- `./scripts/project.ps1 test` 使用既有依賴：114/114 PASS、exit0。
- `./scripts/project.ps1 build`：tsc／Vite 62 modules PASS、exit0。既有623.93kB chunk advisory保留。
- pnpm原預設自動依賴檢查嘗試install而中止，沒有接受清理或安裝。正式指令僅在該程序設 `pnpm_config_verify_deps_before_run=false`、`pnpm_config_update_notifier=false`；未改全域／專案設定。Vite sandbox spawn EPERM以宿主原流程執行成功。
- production測試採既有Inspector harness的隔離副本 `.local/viewer-performance/`，localhost:4193，直接載入本次dist ViewerApp及真實GLB；無產品debug exports。專用headless profile，不碰使用者分頁、preview或防火牆。
- Chrome156.0.8078.81及Edge157.0.4341.42各23/23 PASS、未處理runtime errors空。覆蓋690物件、真實Caster／Target ready、filter/range交集與錯誤原子性、checkbox、DOM焦點／identity、動態粒子690→692→690、GLB角色切換、九鏡頭GLerror0、夜間／水景及dispose。原始 `chrome-report.json`／`edge-report.json` 在忽略目錄。
- 瀏覽器結果屬engine／Inspector production整合與功能smoke，未驗完整main UI的前景操作、人工手感或正式跨瀏覽器FPS。headless視窗1280×720不是實際viewport；實測Chrome1264×625、Edge1256×594、DPR1。測試stage固定800×500，未用樣本作FPS比較。

## 目標平台矩陣
| 平台 | 本次狀態 | 尚缺 |
|---|---|---|
| PC Chrome | 156.0.8078.81 headless production整合23/23 PASS | 前景正式效能／目標硬體與門檻 |
| PC Edge | 157.0.4341.42 headless production整合23/23 PASS | 前景正式效能／目標硬體與門檻 |
| Android Chrome | 真機待驗 | OS／瀏覽器版本、機型或硬體級別、實際幀時間／操作樣本 |
| Android Edge | 真機待驗 | 同上 |
| Android Firefox | 真機待驗 | 同上；不能以桌面Chromium等同Firefox |
| iPhone Safari | 真機待驗 | iOS／Safari版本、實際幀時間／操作樣本 |

正式 FPS／P95 幀時間門檻尚未指定，不倒定門檻宣稱通過；既有 M6、相容性／讀屏等人工驗收未關閉。手機模擬 viewport不能代替上述真機。

## 交付作業
2026-11-10T20:27:01.3037299+08:00 `./scripts/project.ps1 release` exit0：114/114 tests、tsc、Vite PASS；Added2／Updated2／Skipped13，目的地 `D:/Work_Mine/Testing/3D Character Walk Viewer/Release`。17個現行dist產物SHA256均一致；未刪目的地陌生或舊hashed資產。既有localhost:4174 Release preview HTTP200，未停止原preview。測試Chrome／Edge程序已關閉，專用4193 server收尾停止，不碰原使用者瀏覽器。

既有Qdrant／Ollama由授權helper啟動，首次health尚未ready，後續health三項True。2026-11-10 20:28（Asia/Taipei）增量codebase_update完成，status green：掃描120個可索引檔案、Added1／Updated35／Removed53、153新chunks；最終352chunks、graph98files190edges、watcher off。較多更新／移除反映原索引與目前main分支差異，未重建／刪除collection或下載模型。索引範圍遵循既有ignore與工具可索引範圍，不含.local量測或public資產；後續本文件／任務metadata收尾後再update/status確認。

## Validation Report
- DECISION: GO（本次局部最佳化交付）；整體 M6／六平台正式效能驗收仍 PARTIAL。
- MECHANICAL_RESULTS: 完整114/114、build、23項×2瀏覽器、SHA256、diff check PASS；無新增placeholder／secrets。
- INTEGRATION: SceneObjectIndex維持原契約，真實動態場景、GLB／粒子及Inspector DOM整合通過；僅替換內部同步比較，無上游模組漂移。
- COVERAGE: 3區9/9條件皆有映射；3.3要求記錄各平台狀態，並不要求把未取得真機證據標通過。
- DESIGN: 修改檔案符合File Structure Plan，無新依賴，既有scene-object-inspector回歸與production操作已重驗。
- OWNERSHIP: LOCAL；UPSTREAM_SPEC: N/A；BLOCKED_TASKS: 本次局部交付無，正式跨裝置效能驗收仍缺真機與門檻。
- Verification Result: VERIFIED（限本次局部交付）；主agent inline審閱，不是獨立reviewer或整體里程碑結案。

## Token範圍
跨chat完整階段無精確起點，token用量：無法取得精確值。可核算子區間：本chat官方session JSONL中途基準input1040542／output3350／total1043892，至2026-11-10 20:28:40讀取時input6794627／output23211／total6817838；差額input5754085／output19861／total5773946。此數值包含重複請求的input，僅涵蓋該基準後至統計點，排除本chat先前、原chat及之後最後metadata／索引／回覆；不是完整M6或完整chat總量。cached input／reasoning已包含於上層，不重複加總；不以context、額度或估算代替。

## 1Q-5 續作
手機四組均為明確 ToDo：M6-MOBILE-01 Android Chrome、02 Android Edge、03 Android Firefox、04 iPhone Safari；各需OS／瀏覽器版本、硬體、真實幀時間及四負載操作。依使用者指示延後，不以桌面模擬驗收。PC工程量測進行中；正式FPS門檻與前景驗收仍分別保留。
Token：本chat可取得的中途基準（2026-11-10T12:33:48.571Z）input114145／output545／total114690；只核算其後子區間，先前未含。完整M6仍無精確起點。

## PC 工程量測方法（1Q-5）
- main47f5e68＋既有未提交Inspector最佳化，dist ViewerApp-DKjVaTsC.js SHA256 DFD9648016D824D8E01824783A0EDD6F89F8E050F26B85FCAF1301436D8257BA；非保留分支。
- Windows x64／i7-7700／GTX1060 6GB，driver32.0.15.8278；Chrome156.0.8078.81及Edge157.0.4341.42隔離headless各自依序執行，ANGLE D3D11硬體渲染。沒有virtual time／GPU disable／embedding作業並跑；未停止其他既有服務。
- 測試host載入真實dist ViewerApp及Caster／Target GLB（兩者ready才開始），非完整main控制面板；固定stage800×500、drawingBuffer800×500、DPR1、antialias／PCF陰影開、water standard／wave1／flow1、未暫停、wet lens保留預設。
- 每案例新建／dispose ViewerApp，固定案例順序×3輪；3秒暖機（排除載入及初次shader），量測至少5秒。真實requestAnimationFrame只執行一次既有update；關閉原renderer animationLoop防雙重更新。FPS=實際間隔數/首末RAF時間差，分位採排序ceil(n*p)；原始每幀間隔保留JSON。
- walk-run：third-person／zoom／day，每秒交替W走與S跑（透過現有輸入事件）；fisheye-xray：靜止主角／魚眼／xray／day；particle-water：既有Street全景／zoom／day、每250ms發射一次既有預設帶光粒子，水景保持啟用；night：靜止third-person／zoom／night。
- 水景樣本為遠距Street全景，不包含瀑布水霧近距離特寫。Inspector預設label off且未mount控制面板；仍有既有250ms同步及每幀更新。既有23項×2功能整合測試另有Inspector操作證據，不將其視為本次效能樣本。
- 每段蒐集RAF幀間隔、update wall-clock耗時、每幀draw calls／triangles範圍、GLerror及全域error／unhandledrejection。update wall-clock包含JS與CPU驅動提交，不是GPU elapsed；未以同步gl.finish扭曲排程。headless document visible不等於前景人工驗收。
- 原始小樣本pc-pilot.json、正式pc-chrome.json／pc-edge.json與pc-harness.js／pc.html／server.mjs位於忽略的.local/viewer-performance；沒有新增產品debug exports或依賴。GPU與driver首次sandbox唯讀查詢拒絕，宿主唯讀查詢成功；未更改系統設定。


## 工具審閱修正
首次矩陣收尾審閱發現ViewerApp chunk匯入index helper，會啟動隱藏主頁Viewer，故前述小樣本及第一次24段撤銷單實例基準資格；原始pc-*-dual-invalid.json保留但不採用。修正host：等待模組初始化後觸發既有pagehide teardown，釋放主頁Viewer／UI，再建立測試Viewer；每一段assert全頁恰有一個canvas。修正後重跑兩瀏覽器完整矩陣；不把第一次數字併入最終結果。先前Release仍為114tests／typecheck／build成功，但效能task5重新驗證中。

## PC 最終單實例三輪結果
| 瀏覽器／案例 | FPS範圍 | RAF中位／P95 ms範圍 | update中位／P95 ms範圍 | calls | triangles |
|---|---|---|---|---|---|
| chrome / fisheye-xray | 74.970–74.972 | 13.300–13.300 / 13.400–13.400 | 3.600–4.300 / 4.500–6.600 | 830–830 | 57928–57928 |
| chrome / night | 74.967–74.972 | 13.300–13.300 / 13.400–13.400 | 2.600–2.900 / 3.800–7.400 | 402–402 | 44912–44912 |
| chrome / particle-water | 74.970–74.970 | 13.300–13.300 / 13.400–13.400 | 3.100–3.400 / 5.300–5.900 | 627–635 | 49896–50536 |
| chrome / walk-run | 74.969–74.972 | 13.300–13.300 / 13.400–13.400 | 2.300–2.600 / 3.600–5.200 | 297–414 | 36748–45000 |
| edge / fisheye-xray | 74.970–74.972 | 13.300–13.300 / 13.400–13.400 | 3.500–4.800 / 4.600–7.700 | 830–830 | 57928–57928 |
| edge / night | 74.970–74.973 | 13.300–13.300 / 13.400–13.400 | 3.700–6.300 / 7.500–9.100 | 402–402 | 44912–44912 |
| edge / particle-water | 74.970–74.972 | 13.300–13.300 / 13.400–13.400 | 3.000–3.900 / 5.500–7.500 | 627–635 | 49896–50536 |
| edge / walk-run | 74.970–74.972 | 13.300–13.300 / 13.400–13.400 | 2.700–5.500 / 3.800–7.800 | 295–414 | 36724–45000 |
兩瀏覽器各12/12段完成、每段單canvas assertion通過、runtime errors空、每段GLerror0。最終結果近75Hz呈現上限，未見可重現持續掉幀；魚眼xray提交與繪製量較高，但未有足夠瓶頸證據支持修改，故保留畫質／產品實作。本次不是前後FPS A/B或正式PASS；update wall-clock非GPU timestamp。正式門檻、完整main UI前景、長時間熱穩定、較高DPR／尺寸、近距離水霧、其他GPU及四組手機仍未驗。三輪固定順序，不以小差異排名瀏覽器。

## 1Q-5 inline審閱／交付
需求4.1–4.3→tasks4–6及最終24段樣本；手機M6-MOBILE-01–04全部未勾。審閱捕捉並修正雙Viewer測試干擾，無效數據未混用；requirements／design邊界已同步PC追加範圍。審閱APPROVED（主agent inline，無獨立reviewer）。DECISION: GO（本次PC工程樣本交付）；M6整體PARTIAL。未新增產品修正、依賴、資產或debug API；未委派／commit／push／切換模型。

最終Release：2026-11-10T20:47:05.0321274+08:00，release exit0、114/114 tests、tsc／Vite62modules PASS、Added0／Updated0／Skipped17；17個dist與Release SHA256一致，ViewerApp hash未變，既有localhost4174 HTTP200。專用Chrome／Edge測試PID與4193server已停止，原preview／使用者分頁未操作。既有623.93kB chunk advisory保留，未因其擅自拆包。Git HEAD仍47f5e68，既有未提交檔案均保留；本次無新產品修改。

Token子區間：本chat中途基準2026-11-10T12:33:48.571Z input114145／output545／total114690，至12:47:05.208Z input4508623／output13848／total4522471，差額input4394478／output13303／total4407781。僅本chat該區間，排除基準前與末點後文件／索引／回覆；cached／reasoning已包含上層不重加。舊chat已核算區間total5773946與本區間不重疊，合計可確認子區間total10181727（input10148563／output33164），仍非完整M6。完整階段token用量：無法取得精確值，缺跨chat完整起點與尾段。

1Q-5索引：2026-11-10 20:47（Asia/Taipei）codebase_update同步完成，掃描120可索引檔、Added0／Updated1／Removed0、新chunks5；codebase_status green、352chunks、graph98files190edges、watcher off。遵循既有ignore／工具可索引範圍，.local與public資產不含於索引；無錯誤，未安裝／下載／重建或刪除collection。最終文件metadata後再增量確認，僅啟動背景作業不視為完成。
