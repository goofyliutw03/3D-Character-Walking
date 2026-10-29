# rigged-character-assets validation

## 1H-0 Child hand correction — 2026-10-26
- 使用者外觀確認（2026-10-26）：回覆「OK good as my expectation. please go on」，確認本次Child手部修正符合預期。僅代表此修正驗收，不延伸為跨GPU／實機或其他人工項目通過；commit仍未授權。
- 使用者確認修正方案後實作；沿用既有里程碑6資產範圍，非第七里程碑。HEAD fab6fd7；既有Front修改保留，無commit／push／委派／模型切換。
- 根因：T-pose手指跨過world Z=1.45，原warp_child把部分手部橫向比例從0.73跳成0.94；原始左手rest surface寬約0.247，衍生Child反增至0.355。抽查手部weights總和正常，非缺權重。
- 修正：依Wrist及其descendants的vertex groups辨識手部，以腕為原點均勻縮放0.73，同步rest bones；邊界以原skin weights混合。保留成人手拓撲／權重，未改runtime、相機或其他角色。
- pipeline新增`-- child`選擇輸出，僅重建child.glb與其manifest條目；成人GLB／來源hash不變。Child 888628bytes，SHA256 `4f51df97aa3f927bdf64e59a5ce3676c9ae3e7393996945341e792e1b2314d0e`。
- 新回歸檢查實際蒙皮表面：雙手、四clips、各13個時間點，對照Man腕部至手部最遠距離比例0.67–0.79；修正資產PASS。舊資產反證嘗試受Node spawnSync git EPERM阻擋，finally保留修正資產，不冒稱RED已完成。
- Full suite 46/46 PASS；TypeScript／Vite production build PASS。主chunk638.84kB／gzip161.46kB，既有500kB advisory保留。
- Production127.0.0.1:4173實際Child Ready，Front近距Idle／Jump可見手掌與手指恢復，Walk／Run狀態可播放；完整動畫時間覆蓋由蒙皮測試補足。原預覽已停止而connection refused，重新啟動既有preview後可用。跨GPU／實機等既有限制保留，不冒稱里程碑6人工驗收通過。
- Inline review PASS：修改限Child生成／資產／測試／attribution與紀錄；不引入來源、依賴或runtime契約變更。
- Token統計：本chat session JSONL首個token_count基準input34526／output192／total34718，至收尾第一次統計input1973875／output6197／total1980072；差額input1939349／output6005／total1945354。cached input與reasoning已包含，不重加。範圍包含本chat診斷與修正至該統計點，排除基準前、後續索引／收尾與原Front chat；全階段精確值無法取得，不能以此當完整最終總量。

## Authorization / baseline
2026-10-26：使用者確認5並要求繼續，授權下載兩包，繼而指定優先專用資產、找不到合適者接受明確標示骨架衍生角色／動畫，允許使用現有Blender5.2。未安裝，實查5.2.2LTS可執行。
main / af73f11fe44c406ec784aeb9e496a710b2c6c939，保留所有里程碑3–5修改。無stage／commit／push、無委派／切換模型。

## Spec review gates
- Requirements PASS（inline）：19條EARS，覆蓋資產授權、3角色4動作、非同步競態、fallback／retry、資源及本機驗證。使用者備案授權補入，無必要範圍輸入。
- Design PASS（inline）：19條numeric IDs全部映射；明確boundary／out-of-boundary／allowed dependencies／revalidation triggers。loader不改physics／camera，無新套件。衍生Jump不使用Idle冒充。
- Tasks PASS（inline）：5執行單位，pipeline→rigged→async→integration→validation，依賴與observable deliverable完整；task-graph sanity PASS（inline，AGENTS不允許擅自委派）。
- approvals代表依使用者里程碑授權自動審閱，不冒稱逐份人工核准。

## Task1.1
- RED：實際GLB測試因man.glb不存在ENOENT而FAIL，exit1；Blender pipeline生成後PASS，exit0。
- Blender5.2.2以factory-startup／disable-autoexec／background執行；初次probe寫使用者cache被sandbox拒絕，正式生成將BLENDER_USER_RESOURCES導向.local/blender-profile，無使用者設定修改／安裝。
- 專用資產調查：作者2019Jump實際取得（CC0 Man HMnuH5geEG），但31-joint骨架與目標62-joint不同，未冒稱直接相容；bounded搜尋未取得可確認適合的獨立小孩。依使用者備案授權製作目標骨架Jump與比例衍生child。
- Review Verdict: APPROVED（inline）；來源／SHA／修改／CC0與pipeline都保存，四clips與skinning、child頭部占比測試PASS，尺寸886940／946952／887516bytes。無新npm依賴。
- Verification Result: VERIFIED（TASK）；尚未宣稱視覺／runtime完成。

## Task1.2
- RED：模組不存在ERR_MODULE_NOT_FOUND；加入實作後RIGGED_ENABLED=false讓真實身高測試失敗，exit1。移除flag後3/3 affected、typecheck PASS；全套37/37 PASS（含資產測試），exit0。
- Review Verdict: APPROVED（inline）；來源clip四動作驗證、腳底／公尺正規化、world motion權威、crossfade舊action主動stop、unique geometry/material/texture/skeleton釋放與detach均已讀新檔確認。
- Verification Result: VERIFIED（TASK）；GPU外觀仍待production browser。

## Task2.1
- RED：module不存在；LOAD_ENABLED=false亦讓兩競態／重試tests失敗，exit1。移除flag後全套39/39 PASS、typecheck及diff check PASS。
- Review Verdict: APPROVED（inline）；實際新檔審閱，token過時先release、disposepending不發布ready、create失敗release、retry使用最新definition，無unhandled rejection。
- Design refinement：CharacterAssets以services物件注入load/create/release及callbacks，select接AssetDefinition；避免state協調依賴concrete loader／catalog或DOM。ViewerApp組裝factory，維持既定依賴方向。
- Verification Result: VERIFIED（TASK）；實際404／retry仍由production驗收補足。

## Task2.2
- RED／integration：production啟動捕捉getCameraSubject讀尚未建立assets.current而TypeError。加入初始fallback safe access後，WebGL2 ready、真實GLB Ready及互動均成功；此失敗證明typecheck不代表runtime。
- Browser發現Jump雙手跨過torso，新增實際骨架mid-pose wrists測試先FAIL，修正Blender從bone局部X改成基礎姿態world-X在各bone局部的映射後PASS；三GLB與manifest已重新生成。
- 39/39 tests、build PASS，exit0。GLTFLoader動態載入45.18kB，主chunk654.02kB／gzip166.22kB；既有500kB advisory保留。
- 真實失敗驗收：暫時移動dist的child.glb（public來源不動），browser顯示FALLBACK／alert／Retry且場景可用；還原並核hash後按Retry，變Rigged child Ready／retryHidden=true／busy=false。備份檔已還原，無測試開關殘留。
- Review Verdict: APPROVED（inline）；主程式只使用public API。asset callbacks／canvas accessible label／同幀root與anchor／第一人稱雙模型隱藏／按需loader／error fallback均實查。無camera／movement策略變更。
- Design refinement：SceneRenderer.info每幀reset且autoReset=false，將fisheye capture與screen pass計數合併；ViewerApp每秒只讀stats callback，未新增loop或改shader。保留user可讀渲染指標。
- Verification Result: VERIFIED（TASK）。

## Task3 / final integration evidence
- Fresh full suite：39/39 PASS，exit0；production build（TypeScript／Vite）PASS，exit0。主JS654.02kB／gzip166.22kB，按需GLTFLoader45.18kB／gzip13.45kB。既有500kB advisory保留。
- 實際source與generated三模型的SHA256逐一與asset-manifest.json比對PASS。三資產886940／946952／887516 bytes，皆<2MiB。未新增npm dependency，lockfile未改。
- Production localhost4174，使用已安裝Vite preview。初次舊預覽已停止而connection refused，重新啟動後使用新IAB分頁；不是產品錯誤。最終乾淨分頁到達WebGL2 ready及Rigged Ready，console warn/error=[]。
- Browser：男／女／child各可載入，actor正向／材質與腳底可見；小孩明示derived，4動作由真實GLB自動測試逐角色覆蓋，實際畫面補足Idle、child Walk／Run／Jump與woman Jump、轉場／落地。Jump雙手交叉的修正已用mid-pose骨架測試與連續畫面重驗。
- First person：child眼位、模型自身隱藏及overlay hidden=true；切回Third person／Front／魚眼恢復。情緒與中英文對話保留，cameraView及Follow原契約不變。390×844：scrollWidth375≤innerWidth390，bubbleWithin=true；viewport override已reset。
- 故障／恢復：dist child GLB暫時移動後真實loader失敗，FALLBACK／error alert／Retry出現；還原且核hash後Retry變Ready，busy=false、retry隱藏。沒有假成功或永久測試開關，public源檔未動，dist備份已還原。
- 9次man／woman／child循環選擇後，最後child Ready、文字保留。魚眼同視角樣本前後geometry16、texture5相同；不是完整memory profiler，但無明顯累積。競態／過時解碼／dispose則由可控promise單元測試覆蓋。
- 本機效能樣本（IAB、WebGL2、Windows，DPR由既有renderer capped2）：畫面FPS約75（顯示樣本，可能受刷新率限制）。1280×720樣本：Front man389draws／18.4k triangles，woman387／19.7k；魚眼child305／17.2k。計數含當幀shadow／capture／screen等pass，與視角及frustum有關，不能將不同鏡頭數字當同場景benchmark。後續面板尺寸變動至810×892仍可用。未做跨GPU承諾。

## Requirements coverage
| ID | Evidence |
|---|---|
| 1.1 | ATTRIBUTION、manifest、source保存與SHA256 readback |
| 1.2 | 三GLB、child比例測試、UIproject-derived／project-authored明示 |
| 1.3 | catalog local URL、production實際載入，無遠端模型runtime |
| 2.1 | loading／ready實際DOM、選擇後保留motion／expression |
| 2.2 | 真實無效資產／fallback／Retry＋缺skin／clip單元 |
| 2.3 | latest-token／stale-release／disposed-pending單元＋9次切換 |
| 2.4 | unique geometry／material資源dispose-once、mixer停止、過時release |
| 3.1 | 真實GLB三角色Idle／Walk／Run、0.18fade與browser動作 |
| 3.2 | 三Jump clip、膝關節vary、mid-pose wrists、實際airborne畫面 |
| 3.3 | outer root由MotionSnapshot唯一寫入，Jump只骨架pose；world position行為測試 |
| 3.4 | 同action不reset、過時action stop、重複轉場inUse≤2測試 |
| 4.1 | 三高度／腳底測試、browser正向及合理眼位 |
| 4.2 | child First person hidden、Front／魚眼overlay、切角色內容保留 |
| 4.3 | 上游全部33項仍PASS，跑跳／Follow／鏡頭shader整合與shadow策略保留 |
| 4.4 | 390×844無橫向溢出、文字及載入狀態可讀；Retry原生按鈕 |
| 5.1 | pipeline.py、兩原始GLB、manifest、asset-pipeline.md離線重建方式 |
| 5.2 | 三角色×四動作自動測試＋代表性browser視覺＋實際error/retry |
| 5.3 | 資產大小、環境／DPR／FPS及render counters樣本、限制已記錄 |
| 5.4 | full39／buildPASS、三資產<2MiB、activecurrent與fallback互斥、未做實機驗收保留 |

## Review Verdict
- VERDICT: APPROVED
- TASK: 3
- MECHANICAL_RESULTS: Full tests39/39 PASS、Build PASS、SHA256 PASS、diff check PASS、placeholder／secret scan CLEAN、Boundary WITHIN。
- FINDINGS: 啟動時序與Jump軸修正均有RED及重驗；無本spec未解阻擋缺陷。上游Front近距遮擋仍是獨立調查候選。
- SUMMARY: 主agent inline審閱，非獨立reviewer；未跳過runtime／資產授權／failure gates。

## Validation Report
- DECISION: GO
- MECHANICAL_RESULTS: 39/39 tests、production build、fresh smoke boot、source+derived hash與local assets PASS；正常分頁console warn/error空。故意缺檔流程為預期錯誤且已還原。
- INTEGRATION: UI→ViewerApp→token loader→RiggedCharacter與MotionSnapshot／camera／expression契約一致；單一loop／camera，active角色與fallback顯示互斥。LoadingFeedback僅呈現、loader擁有真實結果。
- COVERAGE: 5/5區、19/19條件有映射；mechanical design／tasks ID掃描無遺漏。
- DESIGN: concrete factory注入與renderer只讀統計已同步design；無physics／camera權威／外部服務漂移。三資產與四動作、pipeline/source／manifest及docs file plan一致。
- OWNERSHIP: LOCAL
- UPSTREAM_SPEC: N/A（既有Front觀察另屬camera-modes候選，不納入本次修正）
- BLOCKED_TASKS: 無。

## Verification Result
- STATUS: VERIFIED
- CLAIM_TYPE: FEATURE_GO
- CLAIM: 里程碑6本機骨架角色、四動作／轉場、真實loading/error/retry、授權／衍生／重建與本機效能紀錄可供結束確認。
- EVIDENCE: Fresh39/39 tests、production build及正常browser、真實缺檔＋Retry、19條覆蓋與inline整合審閱、hash readback。
- GAPS: child與Jump為使用者授權的專案衍生，非獨立原作者小孩／Jump資產、非mocap／臉部動畫。未驗跨GPU／瀏覽器、實機觸控效能、實體IME／螢幕閱讀器、故意context-loss；FPS不是跨平台承諾。原Front近距幾何遮擋未定位／未修復，500kB advisory保留。
- NOTES: 未stage／commit／push，HEAD未變，所有既有未提交內容保留。六個功能里程碑的程式交付完成仍待使用者6結束確認，人工／環境驗收不是自動完成。
