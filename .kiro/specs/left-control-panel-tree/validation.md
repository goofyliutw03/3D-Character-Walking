# Left Control Panel Improvement 驗證

## 範圍與審閱
2026-10-30 Asia/Taipei，1O-0；基準HEAD cc52088，保留既有粒子等未提交修改。粒子chat completed後才修改main／style，無平行寫入。使用者核准功能樹、整體／節點展開收合及拖曳寬度；無新增里程碑、依賴、資產、模型切換、委派、commit／push。

依序init→requirements→design→tasks；14/14條件經inline自動審閱通過，非使用者逐份人工核准。Tasks 1→2→3各自驗證與inline審閱，記錄見tasks。

## Mechanical Results
- `./scripts/project.ps1 test`：77 tests／77 pass，exit0；新增面板4項，原有73項全過。
- `typecheck`與`build`：exit0，44 modules；既有658.80kB engine chunk >500kB advisory維持，不在本次拆包。
- RED：FunctionTree及ControlPanel不存在時canonical test各exit1／ERR_MODULE_NOT_FOUND；整合前production缺少調寬把手count0。未執行完整feature-flag OFF protocol；按核心RED及production前後實際操作驗證，明示流程差異。
- `git diff --check`通過；新檔逐一讀取、與本次前main／style備份比較，保留既有粒子內容。placeholder／機密pattern掃描無新增命中。未改ViewerApp／InputManager／SceneRenderer。

## Production Browser
使用localhost:4173 production preview；首次未啟動時connection refused，啟動既有project preview後正常。以下均實際透過瀏覽器UI操作，無注入測試場景狀態。
- 五大分類及子群組獨立details，Enter／Space可切換；較長資產說明預設收合。節點不重建、資料驅動模板保留原ID。
- 鍵盤End→520px／Home→260px／Shift+Right→292px；Man維持Idle。分離面板keydown冒泡避免觸發全域移動／跳躍。
- 整體收合52px、canvas1228px；隱藏內容與把手離開Tab順序，toggle有焦點；還原292px、happy、文字「功能樹測試 <hello>」及獨立節點open狀態。
- 真實pointer拖曳292→432px；canvas848px，pointerup後drag樣式清除。單元事件驗證pointer ownership、cancel、lost capture、blur、media change及冪等dispose。
- 視窗851px，End最大491px，scene／canvas均360px，無橫向溢出。390×844與844×390模擬窄版全寬、把手hidden，scene／movement在面板前，無橫向溢出；已reset viewport。
- 切Child後真實資產Ready，Target仍Rigged woman Ready。Mood／Speech更新可見overlay；收合後草稿保留，literal <hello>未當成HTML。
- Speed10套用成功，Fire得到Hit／Active0／Hits1；Reset target歸零。收合後speed仍10。Appearance內Size9非法且先收合時，Apply會展開Appearance並focus particle-size，顯示範圍錯誤且不套用；恢復0.14可套用。
- First person正確停用Follow；Fisheye／wireframe／transparent／zoom可切換；Follow可開關，最後回Overview。時段evening→day、陰影off→on均可操作。
- 窄版Move right鍵盤啟動、Stop後Child Idle，Fire／Reset可點。下方移動區與粒子控制維持原位。
- console error清單空，scene ready，畫面比例隨面板變化同步；不是手機LAN／真機／跨GPU／screen reader驗收。

## Validation Report
- DECISION: GO（本機功能範圍，Release／索引另列）
- MECHANICAL_RESULTS: Tests PASS；Static／build PASS；Smoke boot PASS。
- INTEGRATION: main只組裝UI與既有公開API，ControlPanel僅DOM版面；renderer既有ResizeObserver正常。所有控制ID唯一，無新的底層場景依賴。
- COVERAGE: 1.1–1.3→FunctionTree／PanelContent與草稿保存；2.1–2.3→ControlPanel及收合；3.1–3.4→pointer／鍵盤／clamp；4.1–4.4→native disclosure／CSS／renderer整合／既有功能回歸。14/14，無未覆蓋必要條件。
- DESIGN: File Structure Plan符合，無架構漂移、依賴方向違反或boundary spillover。鍵盤隔離與非法欄位展開是本次UI整合修正。
- OWNERSHIP: LOCAL；UPSTREAM_SPEC: N/A；BLOCKED_TASKS: none。
- VERIFICATION STATUS: VERIFIED；review VERDICT: APPROVED，inline。

## 限制與Rollback
偏好只留本頁，重新整理回預設。窄版不提供拖曳寬度；桌面需至少851px且非coarse pointer排列。M6／SCENE-05、既有auto zoom近距構圖等限制不變。強制載入失敗／真機IME／screen reader未重做；原載入回復契約及既有測試保留，面板layout控制已從場景disabled清單排除。

Rollback只還原本次main／style、三個新UI模組及面板測試／文件對應，保留先前粒子與其他使用者修改；未執行Git reset。

## Release／索引
`./scripts/project.ps1 release`經宿主escalation核准，77/77 tests及build exit0；2026-10-30T23:12:07.1334409+08:00完成，Added4／Updated1／Skipped7。目的地為既有`D:\Work_Mine\Testing\3D Character Walk Viewer\Release`，逐檔比對dist的12個SHA256，mismatch0；保留舊hashed資產，未複製source／設定／機密。

`./scripts/project.ps1 preview-release`成功啟動localhost:4174（session88129）；未停止4173 preview。Release實際載入Man及Target Ready，End調寬520px／收合再展開保存、Fire得到Hit／Active0／Hits1；控制ID重複0，console error空。成果截圖`.local/panel-validation/release.jpg`，分頁保留供檢視。只代表localhost驗證，非手機LAN。

索引2026-10-30 23:14（Asia/Taipei）完成：codebase_update掃描85個可索引檔，新增4／更新4／移除0，51個新chunks；codebase_status確認green、Incremental update completed，共235 chunks，graph67 files／128 edges。首次因Qdrant不可達失敗；依AGENTS啟動既有本機服務後，啟動瞬間health仍未ready，再次health確認Qdrant／Ollama／既有EmbeddingModel皆true，重試成功。未安裝工具、下載模型或使用雲端。範圍遵守.gitignore／.socraticodeignore的本專案可索引檔，不含外部Release，不宣稱所有Markdown或資產有embedding。文件補入後再次增量及status確認。

## Token 用量
token 用量：無法取得精確值。本chat規劃階段缺少官方用量基準，當前可用工具未提供可拆分本次階段的精確input／output統計；不估算、不填0、不引用其他chat累計、不修改設定或資料庫。
