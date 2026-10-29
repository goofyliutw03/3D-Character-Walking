# camera-obstruction-modes 驗證紀錄

1M-0，2026-10-29使用者確認規劃，2026-10-30完成本機操作回歸；非第七里程碑。requirements → design → tasks → implementation依序、自動inline審閱，不委派、不commit／push；原HEAD e5b3627，保留既有未追蹤.codex／.vscode。模型未切換。

## 實作與task-local review
見tasks.md的RED／GREEN與各task VERDICT。新增SceneAppearance、CameraObstruction，環境邏輯分組；Controls／CameraController持有desired，遮擋後輸出rendered供renderer／overlay／picker，縮距不回寫原構圖。Front候選只在zoom保留。模式初始zoom，75%透明為opacity0.25；線框只處理environment，主角／fallback在範圍外，目前無NPC。

## Mechanical Results
- `./scripts/project.ps1 test`：66 tests／66 pass／0 fail／0 skip，exit0。新9測試加強共享材質／array／texture所有權、移除物件、連續切換／dispose、長時間遮擋後平滑回復、重新操作desired、隱藏祖先、多層遮擋、First person／投影、實際OrbitControls與grouped city點地取樣。
- `./scripts/project.ps1 build`：tsc與Vite exit0，39modules；ViewerApp650.95kB、gzip164.92kB，既有>500kB advisory保留。
- `git diff --check` exit0。feature runtime／tests無新TODO／FIXME／HACK／XXX或hardcoded secret命中。未新增套件、外部資產或機密。
- 原Front靜止結果約3.5e-8m平滑尾差，已在比例誤差<1e-8時收斂，穩定測試通過；未刪除安全／頭腳可見斷言。

## Production browser
- 4173載入實際production：WebGL2 ready、Rigged man Ready。初始Auto zoom；切Wireframe場景三角網格可見，主角正常；First person／Third person跨切保留mode。近右側街邊Front，Transparent blockers可透過建物看到主角；回zoom恢復實體材質，過程可短暫被牆遮住，收斂後主角可見。
- Wireframe + Fisheye呈現160°圓形；切Child到真實Rigged child Ready，角色保持正常。390×844尺寸下魚眼圓形未拉伸、選單可操作；已恢復預設viewport。只屬桌面尺寸模擬，不代表iPhone真機驗收。
- 第一次點地／drag工具操作未觀察到導航狀態，不當作通過。跨日續作時原4173／4174均無listener，重新啟動既有Vite production4173（strictPort、localhost），未停止其他preview或改防火牆。恢復後真實點路面可見Man Run／Running to destination，Stop後Idle、導航提示恢復；實際drag可見場景旋轉及角色中心移動，未觸發Run。console warn/error空。
- 第一人稱transparent提示說明策略暫停，眼位與自身隱藏保留。有限取樣／封閉空間、平滑進入期間短暫遮擋、多層透明排序及三角線框外觀限制保留。

## Requirements Coverage
| 條件 | 證據 |
|---|---|
| 1.1, 1.2 | production選單預設／三模式、跨view／First person／角色；狀態含mode，Follow不重設mode |
| 2.1, 2.2 | zoom位置時間序列、180幀持續遮擋再移開wall後平滑回復，desired原值不變；production近牆 |
| 2.3 | 真正OrbitControls在壓縮期間改旋轉／縮放／pan後返回更新位置；reduced-motion直接到位 |
| 3.1, 3.2 | 多層／分組透明、同色neighbor原材質不變、離開／不可見祖先還原；production近牆透明及切回 |
| 3.3 | CityScene所有環境mesh線框、主角排除測試及production畫面 |
| 4.1 | First person位置／lens不縮距、透明清除、線框仍保留；production提示／自身隱藏 |
| 4.2 | 全套既有camera／fisheye／mouse-orbit／tap／navigation／rigged／expression回歸；production操作 |
| 4.3 | 連續mode／array／原材質／texture不dispose、clone各釋放一次、移除／重複dispose；ViewerApp先appearance後CityScene |
| 4.4 | 全套tests／build／production browser啟動與操作通過 |

## Integration Validation
- DECISION: GO（本機程式交付範圍；正式發佈／索引結果另列下方）
- MECHANICAL_RESULTS: tests／build／smoke boot PASS，placeholder／secrets CLEAN。
- INTEGRATION: desired與rendered權威分離，單一loop／renderer，材質只有environment範圍；UI只調用ViewerApp，picker與overlay均讀rendered。無跨界吸收運動或資產責任。
- COVERAGE: 4/4 requirements sections、12/12驗收條件有對應證據，無LOCAL缺口。
- DESIGN: File Structure Plan吻合，無新依賴、架構漂移或所有權違反；camera-modes／mobile navigation／表情／rigged已回歸。
- OWNERSHIP: LOCAL；UPSTREAM_SPEC: N/A；BLOCKED_TASKS: none。
- Verification STATUS: VERIFIED（FEATURE_GO，本機範圍）；非跨GPU、實機iPhone Safari／Chrome／Edge或M6全部人工環境驗收通過。

## Release、索引與token
- 2026-10-30 07:06:26（Asia/Taipei）：`./scripts/project.ps1 release` exit0；66/66 tests、tsc／Vite39modules成功後依序同步至固定Release，Added3／Updated1／Skipped8。外部寫入使用宿主require_escalated成功；未刪舊hashed或陌生檔，index.html最後更新。
- `./scripts/project.ps1 preview-release`啟動localhost4174（session77086），未停止4173（恢復後session31709）。正式Release新頁預設zoom，WebGL2 ready／Rigged man Ready，切Wireframe成功，console warn/error空。證據截圖保存在忽略目錄`.local/camera-obstruction-release.jpg`，預覽保留供使用者確認。
- 索引前codebase_status回報Qdrant不可用；依AGENTS已授權執行既有`./scripts/rag.ps1 start`，health確認Qdrant／Ollama／既有EmbeddingModel均True。未安裝、下載模型、重建或刪除索引；接著執行增量更新並以status確認（結果另記）。

- 索引完成：2026-10-30 07:09:26（Asia/Taipei）codebase_status確認green／Incremental update completed，77個可索引檔掃描、新增4／更新7／移除0、61個新chunks，總203chunks；graph59files／112edges，watcher disabled。範圍為遵守.gitignore／.socraticodeignore的原始專案可索引檔，不含外部Release；沒有索引錯誤。

Token基準為本chat首個取得的本機rollout token_count：2026-10-29T15:35:00.296Z，input284,741／output1,107／total285,848；cached input230,656已含input、reasoning40已含output。結束檢查點2026-10-29T23:09:15.682Z（台北10/30 07:09:15），累計input13,032,605／output37,182／total13,069,787。可確認區間實際差額：input12,747,864／output36,075／total12,783,939；cached input12,170,112已含input、reasoning7,977已含output，不重複加總。基準前的本chat開頭工作與結束檢查點後的紀錄／回覆未涵蓋；跨日沿用同一基準，不與前chat或前階段重複。完整階段token用量：無法取得精確值（缺階段起點及收尾尾段）；以上為可確認區間的本機session實際值，不是帳號額度或估算。
