# 1Y-9 實作與整合驗證

2026-11-08，使用者核准後依序 init→requirements→design→tasks→實作／inline 審閱／驗證。範圍為第三人稱地面點擊穿透，非第七里程碑。未委派、commit 或 push；分支 codex/v02-particle-system，HEAD 2825627f80622563e80ed08b64f9f60f85ba168a。保留既有大量 dirty，逐檔與本次前副本比對。

## 改變與界線
GroundPicker 預收集可走表面，跳過環境遮擋，沿原普通／魚眼射線取最近合法地面。城市／洞穴宣告有限盒頂能力；auto 使用解析盒頂，其餘走 Mesh raycast。候選>=16或合計>=2048三角形時預算非解析地面包圍盒，沿用內建保守篩選。未加入依賴、BVH、全場景每次raycast或每幀picker更新。

只有明確標記 groundPickBlocker 的物件，或 Viewer 注入的當前主角／Target／NPC 可攔截，且須在選取地面之前並可見。支援隱藏祖先與NPC LOD；骨架更新 bindMatrixInverse 和動態bounds，避免模型外觀更新後漏攔。車輛／裝飾未明確指定為攔截物。未建立機關功能；未修改導航、碰撞、CameraModeManager或手勢狀態機。

## 自動驗證
| 檢查 | 結果與證據 |
|---|---|
| 完整測試 | 166/166 PASS，exit0。任務2紀錄 .local/ground-picking-task2-tests.txt；release 再跑同套通過，.local/ground-picking-release.txt。 |
| 型別／build | typecheck及production build exit0。首次sandbox Vite spawn EPERM，宿主權限重試通過；舊chunk >500kB提示保留為advisory。 |
| 核心新增測試 | 8項：牆頂穿透、明確blocker前後／隱藏祖先、有限多高度／斜地／裁切／無地面／近平行／魚眼圓外、auto與raycast等價、未查詢裝飾、變換盒子與複雜度兩門檻。 |
| 實際物件 | 程序fallback、man／woman／child實際GLB在idle／run／jump、Target、NPC遠近LOD與重建，城市→洞穴→城市候選隔離。 |
| 既有回歸 | 導航繞障／不可達／碰撞、tap／drag／long／multi／cancel、相機輸入及場景能力測試維持通過。第一人稱inspection及直接選first-person沿用原政策，不擴張禁用。 |
| 靜態與邊界 | git diff --check PASS；本次程式與測試無新placeholder或機密pattern；檢查actual diff與runtime imports，無新依賴、隱藏向上依賴或boundary violation。 |

## Production 瀏覽器矩陣
Chrome headless／SwiftShader，localhost:4181 的正式dist產物，Needle與legacy，桌面1100×800與手機430×932。每組城市→洞穴→城市、third-person／fisheye，共24個view cases。每case觀察點地Running／arrived、Stop後drag不改導航；每組確認GLB ready、實際draw、無Runtime／WebGL錯誤且getError=0。已檢視桌面與手機截圖。

證據：忽略的 .local/ground-picking-smoke.mjs，.local/ground-picking-browser/ 截圖與JSON。Needle桌面6在後續手機harness失敗前已完成組內error檢查與截圖；手機獨立6及legacy12各exit0。最初返回城市ready字串寫成City ready，依實際City street ready修正。最初手機逐次等待CDP回應，SwiftShader使tap被判成hold；改成同連線依序排入50ms原生touch事件後通過。只修改harness，未繞過或放寬產品手勢規則。

## Release
`./scripts/project.ps1 release` exit0，tests→build→sync依序完成。2026-11-08 22:16:22 +08，目的地 D:\Work_Mine\Testing\3D Character Walk Viewer\Release；Added11／Updated2／Skipped17。30個dist檔案SHA256全部與目的地一致；不刪除舊hash或陌生檔案。

`preview-release` 因既有4174占用回報exit1，未停止原服務。沿用該服務，HTTP200且入口內容與最新dist/index.html完全相同。正式目錄Chrome／Needle洞穴third-person抽查exit0：GLB ready、draw、點地成功、drag隔離、getError=0、無Runtime錯誤，證據 .local/ground-picking-browser/release-results.json。

## 索引
2026-11-08 22:18:38 +08確認：既有SocratiCode增量更新已完成，status green／Incremental update — completed。掃描160個可索引檔，本次新增1／更新7／刪除0，68個新chunks；索引共535 chunks，graph132檔306edges，watcher disabled。無錯誤，未啟動新服務、安裝或下載模型，未重建／刪除索引。遵守.gitignore及.socraticodeignore，排除.local、public/assets、blender、環境與私鑰檔；範圍為專案可索引程式檔，不包含外部Release，未宣稱Markdown與二進位資產皆有embedding。

## 整合裁定
- DECISION: GO（本次本機工程驗證範圍）
- MECHANICAL_RESULTS: Tests PASS；Static PASS；Smoke boot PASS；placeholder／secret掃描CLEAN。
- INTEGRATION: 候選→ScreenRay→合法地面→明確角色blocker→既有導航契約一致；切場景替換集合，無孤立模組。
- COVERAGE: 1.1–1.3、2.1–2.3、3.1–3.3、4.1–4.3全部映射任務1–3，12/12；無必要驗收缺口。
- DESIGN: 結構／介面與設計一致；依賴方向、表面宣告與角色資料權威界線通過。
- OWNERSHIP: LOCAL；UPSTREAM_SPEC: N/A；BLOCKED_TASKS: 無。
- VERDICT: APPROVED，mode:inline；STATUS: VERIFIED；CLAIM_TYPE: FEATURE_GO。非獨立代理審查。

## 限制、回復與用量
手機為Chrome觸控模擬，不是實機觸感／LAN／跨GPU／長時間效能驗收。斜面與多高度僅檢驗選取，未新增多樓層導航；實際移動仍由walkableWorld決定。動態改地面幾何或新增表面須重建GroundPicker。包圍盒門檻為工程選擇，未宣稱正式FPS收益。既有人工驗收以docs/remaining-acceptance.md最新裁定為準，本次不概括關閉。

回復只撤回本次新增檔與相對 .local/ground-picking-baseline 的差異，不整檔重設共用dirty。發布回退仍須重建與正常release流程，未保證整版交易式回復。

Token用量：無法取得精確值。本階段含來源chat唯讀交接與本chat規格／實作／驗證；缺少可取得的官方起訖用量基準，未填0或估算，未修改設定或資料庫。

## 2026-11-09 控制面板開關追加
使用者經來源chat核准追加開關，沿用本工作階段，需求5／設計／任務4依序inline審閱通過。Camera > Objects block mode新增「點擊穿透環境」checkbox，預設開啟、立即影響下次點地；關閉走原環境首命中判定，兩狀態都保留明確角色攔截。設定由Viewer持有，跨城市／洞穴保留，重載頁面恢復預設；不取消既有目的地。

- 新增一般／魚眼開關測試先RED（關閉仍穿透屋頂），實作後9/9 picker測試及全套167/167 PASS；typecheck、build及diff --check exit0。
- production Chrome／SwiftShader，Needle與legacy×桌面與觸控模擬×城市→洞穴→城市共12case、exit0：預設checked、on／off後狀態同步、切視角與切場景保留、既有目的地不取消、點地與drag隔離、重載回on。無Runtime／WebGL錯誤，getError=0。證據 .local/ground-picking-browser/toggle-results.json，腳本 .local/ground-picking-smoke.mjs --toggle。
- Release 2026-11-09 06:47:38 +08成功，Added8／Updated1／Skipped21；tests→build→sync exit0，30檔SHA256與dist一致。沿用既有4174，HTTP200且入口與最新dist一致；不停止原預覽。
- DECISION: GO（本次本機工程範圍）；VERDICT: APPROVED，mode:inline；STATUS: VERIFIED；CLAIM_TYPE: FEATURE_GO。15/15需求映射，無阻擋任務、無邊界擴張／新依賴，未commit／push。舊人工驗收及前述限制保留；正式抽查與最新索引結果以收尾工具紀錄為準。
- 本次追加token用量：無法取得精確值，缺少本輪可取得的官方起訖基準，不沿用前輪累計當作本輪差額。
- 正式4174開關／洞穴抽查exit0，已檢視面板截圖，標籤／說明與checked顯示正常，證據toggle-release-results.json。索引初次因Qdrant離線失敗；依既有授權執行scripts/rag.ps1 start，稍後health確認Qdrant／Ollama／既有embedding模型皆True，未安裝或下載；索引最終結果見收尾工具紀錄。
- 2026-11-09 06:50:04 +08確認增量索引完成，status green／Incremental update — completed；掃描161個可索引檔，新增0／更新5／刪除0，71個新chunks，共549 chunks，graph132檔306edges。範圍沿用專案程式／測試及ignore規則，不包含外部Release；離線原因已恢復，最終無索引錯誤。
