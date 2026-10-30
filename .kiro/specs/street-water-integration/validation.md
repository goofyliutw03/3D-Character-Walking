# Street water integration 驗證

## 授權與範圍
WATER-02／[1P-1]。使用者已核准街尾植栽島水景方案，另要求 Shader 功能設計為 Module／API；規格、inline 自動審閱與實作依序進行，不是逐份人工審閱。非第七里程碑，M6／SCENE-05 人工未驗事項維持；沒有委派、commit、push、安裝、下載素材或模型。

分支 codex/v02-particle-system／HEAD cc52088，保留本次開始時所有既有 tracked／untracked 修改。原型 water-effects 與面板 left-control-panel-tree 均已 implementation-complete，原型確認後才進入本次具體核准範圍。

## 規格與審閱
- Requirements：4 區／13 criteria，numeric IDs、EARS、明確位置／通行／相機／API／效能證據。inline PASS。
- Design：13/13 ID mechanical mapping 無缺漏；boundary／file plan／所有權／Shader clone／回歸觸發完整。inline PASS。
- Task plan：4 項依序執行，無新 runtime／依賴；task-graph sanity inline PASS。不是獨立代理審查。
- Task 1：公開 module 缺席 RED→API／狀態／clone GREEN，全套84 tests及typecheck通過。
- Task 2：StreetWaterFeature 缺席 RED→world／manual motion／navigation／ray GREEN，全套88 tests及typecheck通過。
- Task 3：水景節點缺席 RED→accessible labels／範圍／接線 GREEN，全套89 tests及build通過。
- 未採第三方 skill 完整 feature flag OFF→ON→移除流程；以實際缺席／assertion RED 記錄，不假稱已完整執行該 protocol。

## 實作與契約
- 公開 src/water/index.ts，API v1；WaterShaderModule 不持有 DOM／renderer／geometry／應用迴圈，可將兩材質用在宿主網格。WaterFeature 為固定網格組裝，WaterPrototype／StreetWaterFeature 都從公開入口使用。
- 材質 copy 共享同 module 的動畫 uniforms，opacity uniform 各自持有，onBeforeRender 讀 material.opacity；外觀 clone 可同步時間與設定並正確透明，還原後由外觀系統釋放 clone，module 釋放原材質。
- CityScene 持有街尾水景，ViewerApp 共用既有 loop，背景與 context 恢復首幀 water delta=0；低品質只影響水景，SceneRenderer／DPR／陰影解析度未更動。
- 基準檔備份在忽略的 .local/street-water-validation/；與原 ViewerApp／main 逐段 diff，保留先前粒子與面板修改。navigation fixture 原 z=-23 已在池內，移至池前 -22，另新增池內拒絕。
- 街尾 pool center (0,-24.6)，占地 x ±2.25／z -26.35..-22.85，原島與樹移除。完整矩形障礙使走／跑／跳均不可進入；不是可涉水區。

## Mechanical evidence
2026-10-31T00:04:05+08:00 release 執行 89/89 tests、TypeScript與Vite build exit0；既有 chunk >500KB advisory 仍保留。第一次 sandbox spawn EPERM 在 build 停止，未同步；宿主核准 escalation 後完整重跑成功。
git diff --check exit0（既有 CRLF warning）；feature 源碼及 tests 的 placeholder／secret pattern scan 無命中。

## Release
2026-10-31T00:04:05.0203824+08:00 Added5／Updated2／Skipped10，目的地為既有 D:\Work_Mine\Testing\3D Character Walk Viewer\Release。17 個 dist 檔 SHA256 mismatch0。未複製 source／node_modules／.git／機密，未刪除陌生或舊 hashed 資產。
2026-10-31T00:23:59.0290233+08:00 最終 release 再次89/89 tests、TypeScript／Vite build exit0，Added0／Updated0／Skipped17；hashed資產與已量測版本相同，沒有重寫相同內容。
沿用既有 localhost:4174 preview，未停止或更換；root Ready、Caster／Target 載入及水景 Scene display controls 已由實際 Release 開啟，正常 console warn/error 空。localhost 不是 LAN 驗收。

## GPU resource evidence
忽略的 localhost:4176 隔離驗證頁只讀提供實際 Release hashed 模組；不將測試工具加入正式入口。Vite helper 共用 root entry 的 side-effect app 先以正常 pagehide teardown 釋放，再建立唯一量測 app。
10 次新建→low→standard→wireframe→transparent→normal→dispose，各次回到無水景 baseline：26 geometries／5 textures／4 programs，shaderErrors0。資源檢查 renderer.info.autoReset=false 的 calls／triangles 為多次 render 累計，只用資源 counts 判斷穩定，不當正式 draw statistics。
Three.js 資源數不等於 GPU bytes 或完整 memory profiler。

## 街道正式效能
完整報告：[benchmark.json](benchmark.json)，兩品質各 off/on 60秒×3輪，每段另暖機5秒，12段全部完成、每段約60.0102–60.0104秒。Windows10／Chrome156／GTX1060 6GB／ANGLE D3D11；960×600 DPR1、PCF2048陰影開、相機(7,5,-17)看向(0,1,-24.6)，Rigged man Caster與Rigged woman Target載入完成並站定。採樣使用實際 Release ViewerApp、WaterBenchmark 純採樣；不是 dev runtime 或原型 FPS。

| 品質／效果 | 三輪 FPS 範圍 | median／P95 ms | calls | triangles |
|---|---|---|---:|---:|
| 標準 off | 74.937136–74.970588 | 13.3／13.4 | 312 | 31,448 |
| 標準 on | 74.970338–74.970463 | 13.3／13.4 | 313 | 32,216 |
| 低 off | 74.920597–74.937261 | 13.3／13.4 | 312 | 19,160 |
| 低 on | 74.937136–74.970338 | 13.3／13.4 | 313 | 19,928 |

各段 min=max：29 geometries／5 textures／6 programs，shaderErrors0。off 保留同品質水面網格，on 增加瀑布的1 call／768 triangles；因此不是完整移除水景的比較。兩品質近75Hz呈現上限，細小成本可能被VSync掩蓋，不能推論零 GPU 成本；RAF 幀時間不是 GPU timestamp。低品質 on 比標準減少12,288個 triangles，但本環境 FPS 差異不足以推論手機收益。測量時沒有執行索引服務更新。

## 交互與視覺回歸
[integration-check.json](integration-check.json) 記錄22/22檢查通過：暫停前後elapsed10.3073相同、off保留池面並隱藏fall、恢復前進、非法設定原子拒絕、模擬visibility事件後首幀無背景補算、quality不改DPR、真實遮擋時整個水景組opacity=.25、shader uOpacity=.25且uTime10.6507→10.7573持續、wireframe／原材質還原、solid zoom constraint、9相機與日夜／陰影。背景為事件／首幀模擬，不冒稱真實作業系統背景降頻。

實際近景、低側角、遠景觀察無可見接合裂縫或共面閃爍；側角用Transparent模式保持固定構圖，Auto zoom本來會因前景遮擋推近，不將構圖改變誤判水景消失。瀑布薄片側面限制保留。截圖在忽略目錄 .local/street-water-validation/near.png、release-overview.png、mobile.png。

正式root UI：Scene display開關off→Static water／Low、paused→Water paused，滑桿鍵盤End到wave2.0／flow3.0再還原1.0，quality還原standard。390×844時scrollWidth375≤innerWidth390，canvas375×602，無橫向溢出；面板收合／展開、窄版→桌面resize可用。Fire particle命中顯示Hits1，Caster／Target Ready，Fisheye＋Wireframe可切回Overview／Auto zoom，正常root console warn/error空。

water.html成功載入並使用公開API，重新執行10次建立／quality／dispose：[prototype-resource-check.json](prototype-resource-check.json) PASS，每輪回到28geometries／3textures／2programs，shaderErrors0。保留原型既有正式效能歷史，不為本次重跑13分鐘原型數據。

驗證頁初次直接import Release ViewerApp因Vite helper引入root side effect出現Application root was not found；修正測試host加root初始化／正常pagehide teardown後重載，後續無新錯誤，正式root沒有此錯誤。舊log跨reload仍保留，已按timestamp區分。測量host／server僅在.local，完成後關閉驗證分頁並停止本次4176server；保留既有4174及其他preview。

## Integration Validation Report
- DECISION: GO（本機街道整合範圍；手機／跨GPU未驗）。
- MECHANICAL_RESULTS: 89/89 tests PASS、TypeScript／Vite build exit0、placeholder／secret scan CLEAN、root與water.html production boot PASS。
- INTEGRATION: UI→ViewerApp→CityScene→StreetWaterFeature→WaterFeature→WaterShaderModule契約一致；唯一主loop與renderer，clone動畫／opacity／restore／dispose一致，背景首幀與context恢復guard已審閱。
- COVERAGE: 4/4 sections、13/13 criteria；1.1–1.3→world／collision／navigation／picker tests＋視覺；2.1–2.4→UI、22項GPU檢查及既有相機tests；3.1–3.3→公開API文件、獨立／clone狀態與資源循環；4.1–4.3→production回歸、12段測量、Release與收尾索引。
- DESIGN: File Structure Plan與實際一致，無反向依賴／外部runtime／未授權範圍擴張。water-effects API extraction與原型、camera-obstruction-modes／mobile導航／panel的revalidation triggers均已重驗。
- OWNERSHIP: LOCAL；UPSTREAM_SPEC: N/A；BLOCKED_TASKS: none。
- VERIFICATION STATUS: VERIFIED（本機）；inline審閱，沒有冒稱獨立review或逐份人工核准。

## 限制與 rollback
水面採程序固定風格反光，不接收場景陰影／即時反射；瀑布是薄片，側面變薄。手機／LAN／其他GPU／其他瀏覽器／真實背景降頻未驗；不以原型或本桌面結果外推。
Rollback 只撤本次差異與新檔，恢復舊植栽島；保留既有粒子／面板／其他未提交修改及 water.html 原型，不用 reset／整檔 checkout，不刪 Release 舊產物。

## Token baseline
本 chat 官方本機 rollout 首點 2026-10-30T15:54:46.765Z input25377／output150／total25527。規劃與實作共用此 chat，可確認區間從首點計算，首點前與最終回覆缺口不估算；不重複計入原型 chat 的已交接區間。

## 索引收尾
2026-10-31 00:24（Asia/Taipei）codebase_update同步完成：101個可索引檔，新增7／更新12／移除0，81個新處理chunks；codebase_status確認green、Incremental update completed，277 indexed chunks、graph82files／154edges。範圍依.gitignore／.socraticodeignore，不含.local驗證頁／外部Release／被排除資產；watcher disabled。沒有錯誤，未安裝／下載／重建索引。補入本段後再update／status確認最終文件狀態。

Token官方可確認區間：2026-10-30T15:54:46.765Z→16:24:34.560Z，末點input15,717,684／output43,920／total15,761,604；差額input15,692,307／output43,770／total15,736,077。cached input15,518,336已含input，reasoning7,813已含output，不重複加總。統計範圍為本chat街道水景規劃與實作，不含原型chat。完整階段token用量：無法取得精確值，首點前及本末點後文件／索引／回覆仍有缺口；已計區間如上，不捏造0或估算。
