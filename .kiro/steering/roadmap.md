# cc-sdd 規劃對應與待辦

最新狀態（2026-10-26）：里程碑5已由使用者確認，6 rigged-character-assets完成實作與驗證，待結束確認，見[validation](../specs/rigged-character-assets/validation.md)。三角色GLB與四骨架clips含依使用者授權製作的小孩／Jump衍生，真實載入與失敗／Retry已驗證。以下未開始／initialized屬歷史。六個功能里程碑的實作完成不等於跨GPU／實機／螢幕閱讀器等人工驗收完成。

最新狀態（2026-10-26）：使用者已確認里程碑 4，里程碑 5 character-expressions-ui 依授權完成實作與驗證，待結束確認。20 項條件覆蓋與限制見 [validation](../specs/character-expressions-ui/validation.md)。里程碑 6 未開始；真實載入／資產授權與實機驗收仍保留。以下 initialized 及較舊進度屬歷史，不作目前狀態。

最新狀態：里程碑3已由使用者確認；里程碑4 camera-modes完成實作與驗證，待結束確認，見[validation](../specs/camera-modes/validation.md)。里程碑5、6未開始。下游表情anchor需考慮cameraView及160°魚眼投影，不能直接沿用普通透視螢幕座標。本段取代下方舊時點狀態。

目前進度（2026-10-25）：里程碑 3 character-movement 實作與驗證完成，含使用者追加 First person（70° FOV），等待結束確認；證據見 [validation](../specs/character-movement/validation.md)。里程碑 4–6 未開始。下文 initialized 與「等待開始里程碑 3」屬首次導入時點，現況以本段及各 spec.json 為準。

更新：2026-10-24（Asia/Taipei）。使用者已核准 product／tech／structure steering，並要求將目前 plan items 導入 cc-sdd 規劃方式。本文件記錄導入與分析，不核准後續實作。

## 來源與判定

需求以 [development-plan.md](../../docs/development-plan.md) 為準；[stage-1.2.md](../../docs/stage-1.2.md) 是較新的完成與驗證紀錄。initial-design-plan.md 與 imported/ 是歷史參考，未被目前計畫採納的部分維持延後，不自動建立開發授權。

四個 spec 目前僅 initialized。requirements.md 只有輸入描述；requirements／design／tasks 的 generated、approved 均為 false，ready_for_implementation 為 false。這是完成規劃入口導入，不是完整規格、任務或實作完成。狀態以各 spec.json 為準。

## 導入方式與階段界線

2026-10-24 使用者更新：同一已確認里程碑內，requirements → design → tasks → 實作 → 驗證及審閱自動依序執行，記錄結果、修正問題後持續推進；不逐階段或逐項等待確認。里程碑結束總結並提示使用者確認，確認後才開始下一里程碑。本段取代下文舊逐階段審閱限制。commit、模型切換與外部操作授權維持 AGENTS.md 規則，不跨里程碑自動推進。

採里程碑對應 spec，保留已完成工作的驗證紀錄。未完成程式功能依序走 spec-init → spec-requirements → spec-design → spec-tasks，每階段停下審閱；實作逐項指定 tasks 編號，之後 validate-impl。小修改可免完整 spec，但先計畫等核准。人工驗收與外部阻擋保留編號，不混入已完成項目。未採用自動核准或 spec-batch。

共通約束：TypeScript OOP／組合、模組責任分離、免費工具、資產授權與 attribution、機密不入文件／版本控制。不得因此啟動 RAG、安裝 Blender、操作外部服務、commit 或 push。

## Specs (dependency order)

- [x] [character-movement](../specs/character-movement/) — 里程碑 3；程序化男／女／小孩、停止／走／跑／跳、輸入、移動狀態、碰撞／可走區限制、基本 Follow／Orbit。依賴：既有場景。
- [x] [camera-modes](../specs/camera-modes/) — 里程碑 4；前方／俯視／低角度／魚眼、平滑切換、獨立跟隨開關。依賴：character-movement 的 transform 與 Follow 邊界。
- [x] [character-expressions-ui](../specs/character-expressions-ui/) — 里程碑 5；emoji／情緒、可編輯泡泡、可見控制、載入回饋呈現與無障礙實作／驗證完成，待結束確認。依賴：character-movement；鏡頭控制整合依賴 camera-modes。
- [x] [rigged-character-assets](../specs/rigged-character-assets/) — 里程碑 6；授權來源與衍生清楚的三角色GLB、四骨架動作、載入／錯誤／Retry、效能樣本與本機文件已驗證，待結束確認。環境限制與Front遮擋後續調查仍保留。

載入器與錯誤狀態由 rigged-character-assets 擁有；character-expressions-ui 擁有狀態的可視／輔助技術呈現，前期可用測試狀態，最終須真實載入驗收。共用契約在 design 階段審閱。

## 計畫覆蓋表與 TODO 分類

分類：(a) spec 程式工作；(b) 人工／實機驗收；(c) 外部阻擋或延後；(d) 小修改。標籤為規劃／驗收 ID，非預先占用 chat 標題。

| 項目 | 來源（檔案:行號） | 分類 | 建議動作／狀態 | 建議標籤 | 依賴／共用檔案 |
|---|---|---|---|---|---|
| 里程碑 1：骨架、依賴、Git 歷史 | docs/development-plan.md:18；docs/setup-validation.md:3 | b | 已有 build／HTTP 紀錄，保留證據，不倒填 spec 完成紀錄 | BASE-01 | package.json、scripts/project.ps1；不重新安裝 |
| 里程碑 2：場景／光影／resize／Orbit／後端狀態 | docs/development-plan.md:19；docs/stage-1.2.md:7 | b | 已有實作及 build／瀏覽器驗證紀錄；非重新實作 | SCENE-01 | ViewerApp.ts、SceneRenderer.ts、CityScene.ts、main.ts |
| pan、context loss／恢復、初始化失敗／不支援瀏覽器、實機觸控效能 | docs/stage-1.2.md:21；docs/development-plan.md:38 | b | 各保留未驗收，不因已有 smoke check 勾完成 | SCENE-02（pan）、03（context）、04（失敗／相容）、05（實機） | 既有場景；實機與相容瀏覽器選定 |
| 里程碑 3：原型角色與移動／跑跳／碰撞／Follow | docs/development-plan.md:20；docs/stage-1.2.md:25 | a | character-movement，initialized；下一步 requirements | CHAR-01 | ViewerApp.ts、CityScene.ts、main.ts；先於下列功能 |
| 里程碑 4：多鏡頭／魚眼／獨立 Follow | docs/development-plan.md:21 | a | camera-modes，initialized | CAM-01 | 角色 transform、ViewerApp.ts、main.ts |
| 里程碑 5：表情／泡泡／控制／載入回饋／無障礙 | docs/development-plan.md:22 | a | character-expressions-ui，initialized | UI-01 | 角色 anchor、ViewerApp.ts、main.ts；載入事件與 GLB spec 協調 |
| 里程碑 6：rigged GLB／動畫／效能／本機操作 | docs/development-plan.md:23 | a | rigged-character-assets，initialized；原型不能替代真實動畫驗收 | GLB-01 | 角色狀態、UI、public/assets/、README.md |
| 資產來源／授權、root motion 或 in-place、clip 缺失與閾值／hysteresis | docs/initial-design-plan.md:67；docs/initial-design-plan.md:71 | c | 尚待資產與設計決定；由 GLB spec requirements／design 釐清，不直接採納歷史數值 | GLB-02 | GLB-01、CHAR-01；不自行下載／安裝 Blender |
| 相容瀏覽器與效能門檻 | docs/initial-design-plan.md:90 | c | 在相關 spec requirements 明定並審閱，SCENE-04／05 與 GLB-01 共用基準 | ACCEPT-01 | SceneRenderer.ts、驗收環境 |
| WebGPU 與 fallback 評估 | docs/development-plan.md:33 | c | 維持延後，另行評估與核准；目前是 WebGL2 | RENDER-01 | SceneRenderer.ts；不得宣稱已支援 |
| chunk >500 kB | docs/stage-1.2.md:19 | d | advisory，非 build 失敗；資產整合時再評估拆包，非現在修改 | PERF-01 | GLB-01、建置配置 |
| 歷史自動巡迴／waypoint／loop／pause／speed | docs/initial-design-plan.md:80 | c | 未納入目前六里程碑，延後；日後核准才建 path-navigation spec | LATER-01 | CharacterController、camera；不得默默取消或開發 |
| Blender 城市／貼地、Inspector／debug／XYZ／速度滑桿 | docs/initial-design-plan.md:79；docs/initial-design-plan.md:81 | c | 靜態程序化街景與 FPS 已有；其餘歷史提案延後，先確認需求 | LATER-02 | CityScene.ts、main.ts、資產來源 |
| NavMesh／NPC／車輛／紅綠燈行為／LOD／多角色模擬 | docs/initial-design-plan.md:82 | c | 延後；目前男／女／小孩是可選角色，不自動擴充同時多角色 | LATER-03 | navigation／scene／character |
| 舊計畫與驗證說法落差 | docs/development-plan.md:5；docs/setup-validation.md:12 | d | 本次新增導入註記與指向較新證據，歷史原文保留 | DOC-01 | development-plan.md、steering；不改寫歷史證據 |
| RAG 新連線設定驗收與跨機重建 | docs/gpu-optimization.md:30；docs/local-rag.md:40 | c | helper 有既有驗證；MCP 新連線與跨機仍屬操作／環境驗收，不啟動服務、不重建索引 | ENV-01 | .codex/、tools/rag/、scripts/rag.ps1；非 viewer runtime |

涉及 ViewerApp.ts、CityScene.ts、main.ts、README.md 等相同共用檔案的修改，**必須依序進行，不可平行**。表列依賴不構成平行修改授權。

## 驗證與下一步

本次只驗證文件連結、里程碑覆蓋與 spec 初始化狀態；未重跑 build 或瀏覽器驗收。stage-1.2.md 的既有驗證屬先前紀錄，本次未重現。

目前 cc-sdd 導入里程碑已完成。下一里程碑為 3：character-movement，複雜度 COMPLEX（移動、輸入、碰撞、相機與生命週期跨模組），建議高能力模型、高推理；未切換。等待使用者確認結束導入並開始里程碑 3；確認後從 `$kiro-spec-requirements character-movement` 自動推進至同一里程碑的實作、審閱與驗證，結束再總結等待確認，不自動開始里程碑 4。
