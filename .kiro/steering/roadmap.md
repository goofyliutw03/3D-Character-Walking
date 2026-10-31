# cc-sdd 規劃對應與待辦

2026-10-31 LIGHT-01／1R-1：[night-object-lighting](../specs/night-object-lighting/) 已由使用者核准夜晚／物件光源整體方案；依序自動inline審閱／實作，無委派。瀑布chat完成後才修改共用ViewerApp／main／CityScene／UI，必須依序進行，不可平行。非第七里程碑，M6／SCENE-04/05/FOLD與其餘LATER保留。

2026-10-31 WATER-03／1N-1：[waterfall-spray](../specs/waterfall-spray/) 已由使用者核准瀑布粒子與相機濕潤整體方案；同範圍依序自動審閱／實作，不委派。世界 source 由水景公開API取得，兩入口共用效果；ViewerApp／SceneRenderer／main等必須依序進行，不可平行。非第七里程碑，M6／SCENE-05-FOLD及其餘延後項維持。

2026-10-31 CAM-04（1M-1）：[occluded-character-xray](../specs/occluded-character-xray/) 已由使用者核准並完成第4模式實作及本機驗證；水景chat交付後依序修改ViewerApp／CameraObstruction／UI，未平行。排除水、粒子及原始透明／半透明材質，見validation；M6／SCENE-05與LATER項目維持。

2026-10-31 WATER-02（1P-1）：[street-water-integration](../specs/street-water-integration/) 已由使用者核准街尾植栽島替換方案及可重用 Shader Module／API。依序完成模組、街道障礙／遮擋、主迴圈／UI、整合驗證；ViewerApp／main／CityScene 必須依序進行，不可平行。原型 WATER-01 已確認，本項取代舊時點等待街道整合授權說法；非第七里程碑，M6／SCENE-05 與其他 LATER 項維持。

2026-10-30 WATER-01（1P-0）：[water-effects](../specs/water-effects/) 為已核准的獨立水池／瀑布原型追加需求，雙 production 入口、程序素材與正式 A/B 測量；證據及限制見 validation。等待原型風格／效能確認後才談街道整合；非第七里程碑，不更改 M6／SCENE-05。build／release 共用檔案依序修改，未委派。

2026-10-30 UI-02（1O-0）：使用者核准 [left-control-panel-tree](../specs/left-control-panel-tree/)，改善既有左側UI：五大功能樹、整體／節點展開收合、桌面拖曳及鍵盤調寬，保留下方移動／粒子操作；規格及審閱／驗證／Release／索引見該spec。共用main／style在particle-interaction交付後依序修改；非第七里程碑，不變更M6／SCENE-05人工驗收或LATER延後範圍。

2026-10-30 Plan v02（1N-0）：[particle-interaction](../specs/particle-interaction/) 追加 Caster／一名獨立 Target 與單一粒子互動。這是 LATER-03 僅一名站立 Target 的明確追加授權，其餘 NPC AI／NavMesh／多角色模擬維持延後；M6／SCENE-05 待實機事項不變。ViewerApp／main／style 必須依序進行，不可平行；見 spec tasks／validation。

2026-10-30 CAM-03（1M-0）：使用者核准追加 [camera-obstruction-modes](../specs/camera-obstruction-modes/)，三種遮擋策略、desired／rendered構圖分離、環境材質隔離／還原及Camera UI；依序實作與inline審閱，驗證／Release／索引證據見validation。共用CameraController／ViewerApp／CityScene／main必須依序，未平行；不擴充NPC、不結束M6／SCENE-05、不新增第七里程碑。

追加需求（2026-10-29）：[mobile-touch-navigation](../specs/mobile-touch-navigation/) 4項tasks已完成，54 tests／build及本機production驗證通過，待結束確認。手機控制、點地跑步與靜態避障證據見[validation](../specs/mobile-touch-navigation/validation.md)。非第七里程碑，SCENE-05 iPhone三瀏覽器真機與既有M6未結事項保留；LATER-01／LATER-03不擴張。

追加需求（2026-10-26授權）：[initialization-loading-progress](../specs/initialization-loading-progress/) 已完成實作與本機驗證，13條件、43 tests及production build／browser證據見validation。擴充既有loading契約並重驗rigged／UI；非第七里程碑，不變更原人工驗收狀態。

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

2026-10-29 CAM-02（1L-0）：角色中心mouse Orbit追加需求已依核准完成，camera-modes tasks4.1–4.3／validation記錄57tests、build、Release與本機操作證據；待使用者結束確認。共用CameraController／ViewerApp依序修改，未平行；M6、SCENE-05與LATER項目不擴張。

2026-10-31 Mobile Orbit（1L-1）：沿用camera-modes追加6.1–6.4及tasks5.1–5.3，單指hold／drag置中、第二指取消且保留pinch／pan；Tap候選取消保留held pointers避免多指誤觸Run。非新里程碑，M6／SCENE-05與LATER狀態不變。

2026-10-31 Mobile Orbit（1L-1）結案：使用者確認iOS／Android操作OK並要求忽略機型，完成本次實機驗收與結束確認。其餘M6／SCENE-05環境／瀏覽器／效能項不概括關閉；下一項功能尚待指定，不自行啟動LATER範圍。

2026-10-31 剩餘驗收（1Q-1）：Galaxy S25+ 的 Mobile Orbit 操作由使用者回報 OK；沿用 1L-1 的 iOS OK，未取得 OS／瀏覽器版號。SCENE-05-FOLD（雙摺／三摺外屏、各展開形態、切換 resize、預設／放大 display scale、手勢與背景返回）依明確要求列 TODO，不阻擋下一階段。詳細來源與範圍見 camera-modes validation；未概括關閉 M6／SCENE-05，不啟動 LATER 新功能。

2026-10-31 1Q-1：剩餘驗收盤點與本機故障注入見 [remaining-acceptance](../../docs/remaining-acceptance.md)。SCENE-02真ViewerApp合成pan、SCENE-03導航中原生context loss／恢復、SCENE-04 WebGL初始化失敗提示已補本機證據；SCENE-04跨GPU／瀏覽器與SCENE-05其餘人工項仍保留。歷史未驗文字不回寫；未新增功能。
# 2026-10-31 INSPECT-01（1S-0）追加授權

使用者已核准 [scene-object-inspector](../specs/scene-object-inspector/)：場景父子樹、頁面內穩定整數ID、總開關及個別checkbox、regex與編號範圍交集、祖先保留及世界標籤；只控制label。依序接續水霧／夜間交付，未平行修改。此為LATER-02中物件結構檢視的明確有限追加授權，不擴張到XYZ／速度滑桿或編輯器；非第七里程碑，M6／SCENE-04/05/FOLD及其他LATER保留。進度與證據見spec tasks／validation。
