# Validation — 1T-0

## 授權與起點
2026-11-01，使用者明確要求執行NavMesh、NPC AI、車輛、紅綠燈行為、LOD、多角色模擬。LATER-03整合追加，非第七里程碑。起點HEAD a1dc0d9638181295c0869de7f7fa10821f2c668a；保留原有20份dirty，含1R-4陰影。未commit／push、未切換模型、未委派。

## 規格審閱
依kiro-spec-init→requirements→design→tasks順序處理。已讀模板／EARS／review gate／discovery／synthesis／tasks規則，使用者執行授權及AGENTS里程碑政策優先於skill逐階段停下要求。不使用--auto／-y／spec-batch。
- Requirements inline PASS：六項功能全覆蓋；數值是可逆合理預設；無外部輸入前置、真實交通法規或裝置效能宣稱。
- Design inline PASS：每項需求有元件、契約與測試；表面NavMesh獨立於舊格網；同一協調器保證路權互斥；LOD只影響視覺；所有新資源有唯一dispose持有者。
- Task graph inline PASS：五個依賴任務依序，整合任務明示跨元件，無平行標記。approval為依使用者授權自動審閱通過，非使用者逐份人工核准。

## Token
token 用量：無法取得精確值。本chat與交接chat均無可取得的官方input／output／total起點；未以額度、context或估算替代。

任務1.1 inline PASS：凸分割只在幾何邊界產生，portal需共享正長度邊；障礙半徑與非法／角落不連通測試1/1 PASS（Node runner）。

任務2.1 inline PASS：3/3 tests，包括600秒12行人8車之路權／合法表面／車距／過街覆蓋。修正車身停止線、入口壅塞（輪序過街＋本地活動）、避讓後靜態路徑重接；無強制清空或傳送。TrafficView初稿於核心測試等待期間建立，僅在2.1通過後進入其審閱與整合。

任務3.1 inline PASS：5/5 tests。遠距NPC由多mesh步態切為單box、triangles減少；24m/15%遲滯、關閉LOD恢復近距、shadow及unique dispose驗證。車流阻擋／恢復、非法dt與dispose亦通過。

任務4.1 inline PASS：真實main瀏覽器啟用、12行人8車、pause/reset/resume/LOD控制可操作，WebGL2 ready、主角Rigged GLB及Target保留。首次number欄位fill/Tab未套用，改有效input即時套用／change恢復非法值後重測PASS。dev首次spawn EPERM，宿主escalation允許既有Vite啟動後成功，非自動核准拒絕。完整Node runner119/119 PASS；typecheck PASS。

## 任務5.1／kiro-validate-impl整合審閱
模式inline，無獨立agent審查。依技能檢查跨任務資料流、需求覆蓋、邊界、殘留TODO／機密、完整測試及build；未找到新增邊界違反或必要未實作項目。正式模型是既有程序Character，未冒稱NPC載入rigged GLB。

|需求|實作與驗證|
|---|---|
|1.1, 1.2|凸表面／portal／A*與精確聯集segment簡化；障礙半徑、非法點、不連通角落、路徑區段測試PASS|
|2.1, 2.2, 2.3|三種獨立程序角色、所在地活動／ID輪序過街／idle／yielding；600秒12人8車，所有NPC移動、多名實際過街、Target避讓、合法表面PASS|
|3.1, 3.2, 3.3|可視號誌／停止線／雙向車、五phase互斥與清空、4.5m頭距、動態blocker停車恢復及端點再利用PASS|
|4.1, 4.2, 4.3|0／24人8車、非法設定原子拒絕／snapshot隔離／reset／pause／off／dispose測試PASS；真實ViewerApp8項生命週期PASS|
|5.1, 5.2|近遠geometry／mesh數減少、15%遲滯、LOD off／shadow／unique dispose PASS；邏輯與LOD分離、有界dt；無裝置FPS門檻宣稱|

### 真實ViewerApp／GPU接線
忽略harness `.local/traffic-validation/index.html`（dev來源）8/8 PASS：24行人8車與時間前進、pause完整狀態凍結、reset保留pause及數量並歸零、off凍結、原生WEBGL_lose_context可用、loss期間凍結、restore後恢復且無大幅時間跳躍、gl.NO_ERROR。console warn/error空。這不是只dispatch假context事件，也不是Release／外機／手機人工驗收。

### 完整回歸與Release
- 2026-11-01 `./scripts/project.ps1 release`：首次119/119 tests及tsc通過，Vite受sandbox spawn EPERM阻擋，未同步。經宿主escalation後循序重跑exit0，119/119 tests、tsc／production build PASS。
- Release完成時間 **2026-11-01T21:31:01.8645892+08:00**；目的地 `D:\Work_Mine\Testing\3D Character Walk Viewer\Release`，Added5／Updated2／Skipped10；保留目的地陌生檔與舊hash資產，既有>500kB advisory保留。
- `./scripts/project.ps1 preview-release` 同樣先遇EPERM，宿主允許後於localhost:4174成功啟動。實際Release入口WebGL2 ready、Rigged man ready、12行人8車／pause／LOD呈現、console warn/error空；畫面 `.local/traffic-validation/release-overview.png`。僅本機in-app browser證據，不當作手機LAN或跨GPU驗收。
- `git diff --check` PASS；既有character-expressions-ui validation的LF→CRLF提醒保留，非本次格式重寫。HEAD仍a1dc0d9，未commit／push；原有20份dirty保留。
- 本次啟動的dev server驗證後已停止；Release preview保留，未停止任何原有preview、未改防火牆。

### 索引
起初codebase_status回報Qdrant unavailable。依既有授權 `./scripts/rag.ps1 start`，接續health確認Qdrant／Ollama／既有EmbeddingModel皆True；沒有安裝、pull、模型下載、雲端或重建／刪除索引。既有collection `codebase_89a2b01c4b0d`。
首次codebase_update完成：127 indexable files，Added5／Updated5／Removed0，72 new chunks；code graph102 files／201 edges。遵守ignore，.local harness與二進位資產不入索引。此收尾紀錄與完成metadata再增量更新一次，最後狀態以收尾codebase_status實際結果為準。

## 新chat任務盤點與保留事項
|項目|來源（檔案:行號）|分類|動作／標籤|依賴／共用檔案|
|---|---|---|---|---|
|六項城市模擬|docs/development-plan.md:3|a|city-traffic-simulation，5/5任務完成／LATER-03；待使用者結束確認|ViewerApp、main、UI；必須依序進行，不可平行|
|跨GPU／瀏覽器|docs/remaining-acceptance.md:9|b,c|維持PARTIAL／SCENE-04|外部裝置，非本次驗收|
|效能與讀屏|docs/remaining-acceptance.md:12、13|b,c|維持ToDo／ACCEPT-01、M5/M6|人工環境與門檻，不新增待辦|
|手機、IME、摺疊專項|docs/remaining-acceptance.md:8、10、11|b|手機／IME Done，摺疊取消；不重開|保留最新使用者裁定|

## 限制、風險與rollback
NavMesh支援本次平面、軸對齊表面與AABB；不是任意斜面／多層GLB烘焙。NPC為保守狀態機與局部避讓，過街一人持有reservation，非大規模群眾全局無死鎖保證。持續用主角擋路或高密度可能停等，安全優先；可減少數量／reset。主角可自行走進車道，沒有車禍物理或阻止使用者重疊的主角動態碰撞契約。此限制不取代已驗證的模擬主動避讓。

Rollback只移除本次SurfaceNavMesh／simulation／tests／spec、新增UI與ViewerApp接線及本次文件追加；不可reset或覆蓋原有陰影與驗收dirty。若回退需另依release流程發佈。下一工作階段須由使用者選擇，建議優先既有ACCEPT-01（NORMAL、均衡能力／中推理，先定環境與門檻），不自動開始下一項或建立無新階段的重複chat。
