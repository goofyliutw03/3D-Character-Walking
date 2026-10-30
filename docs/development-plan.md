# Development plan

2026-10-31 CAM-04（1M-1）：使用者核准 [occluded-character-xray](../.kiro/specs/occluded-character-xray/) 第4遮擋模式，僅凸顯操作主角被不透明環境遮住的像素；排除水／粒子／原始透明材質。已依序完成實作、inline審閱、93 tests／build／GPU及Release，驗證及限制見該spec。非第七里程碑，M6／SCENE-05維持。

2026-10-31 WATER-02（1P-1）：使用者確認原型並核准街尾植栽島水景整合，另明確要求 Shader 可重用 Module／API；規格見 [street-water-integration](../.kiro/specs/street-water-integration/)。中心約 (0,-24.6)、完整池岸障礙與相機相容、Scene display 水景控制，兩入口共用公開 API；本次依序實作與 inline 審閱。下方原型「街道整合尚未授權」為原型交付時點，已由本項取代。非第七里程碑，M6／SCENE-05 未驗事項維持。

2026-10-30 WATER-01（1P-0）：使用者核准 [water-effects](../.kiro/specs/water-effects/) 獨立水池／瀑布原型與規格，requirements→design→tasks→實作／inline 審閱依序推進。入口 `water.html`，程序素材及兩種品質；實測、Release、索引見該 spec validation。原型待風格／效能確認；街道整合尚未授權。非第七里程碑，M6／SCENE-05 人工待驗與既有延後範圍不變。

2026-10-30 UI-02（1O-0）：使用者核准 [left-control-panel-tree](../.kiro/specs/left-control-panel-tree/)，改善既有左側UI：五大功能樹、整體／節點展開收合、桌面拖曳及鍵盤調寬，保留下方移動／粒子操作；規格及審閱／驗證／Release／索引見該spec。共用main／style在particle-interaction交付後依序修改；非第七里程碑，不變更M6／SCENE-05人工驗收或LATER延後範圍。

2026-10-30 Plan v02（1N-0）：使用者已核准 [particle-interaction](../.kiro/specs/particle-interaction/)；主玩家為 Caster，追加一名使用既有授權資產的獨立站立 Target、可設定定向粒子、單次命中回饋及逾時／上限。依序規格、實作與 inline 審閱；驗證、Release、索引結果見該 spec validation。僅本案一名 Target 為 LATER-03 追加授權；不包含 NPC AI／NavMesh／戰鬥、不改 M6／SCENE-05 人工驗收狀態、不新增第七里程碑。

2026-10-30 CAM-03（1M-0）：使用者已確認三種鏡頭遮擋模式規劃，規格見 [camera-obstruction-modes](../.kiro/specs/camera-obstruction-modes/)。Auto zoom平滑入／出、遮擋物75%透明、全場景線框與主角排除已實作；First person保持眼位，模式跨鏡頭／Follow保留。完成證據與發佈／索引結果見 [validation](../.kiro/specs/camera-obstruction-modes/validation.md)。本次非第七里程碑，不變更M6／SCENE-05實機待驗或LATER-03 NPC延後範圍。

追加需求（2026-10-26授權，2026-10-29完成本機驗證）：[mobile-touch-navigation](../.kiro/specs/mobile-touch-navigation/) 已完成場景下方手機控制、點地跑步、靜態避障與取消；4項tasks、54 tests及production證據見[validation](../.kiro/specs/mobile-touch-navigation/validation.md)。待結束確認及SCENE-05真機驗收；非第七里程碑，不更動M6、LATER-01巡迴或其他延後項目。

2026-10-26 補充：Front近牆／樹旁避障壓縮裁切已依授權完成局部修正與本機驗證，見[camera-modes validation](../.kiro/specs/camera-modes/validation.md)的1G-0紀錄。貼牆可能採斜前／近側構圖；封閉空間、轉場路徑及既有人工環境限制仍保留，不代表里程碑6人工驗收通過。

追加需求（2026-10-26使用者授權）：初始化載入進度條與旋轉立體文字，獨立規格 [initialization-loading-progress](../.kiro/specs/initialization-loading-progress/)。實作與本機驗證完成，真實下載資訊／未知總量、錯誤Retry／Reload、reduced-motion規則及compact提示證據見 [validation](../.kiro/specs/initialization-loading-progress/validation.md)。不是第七里程碑，亦不代表里程碑6結束或人工環境驗收通過。

最新進度（2026-10-26）：里程碑 5 已由使用者確認；里程碑 6 rigged-character-assets 已完成本機三角色骨架GLB、四動作／轉場、載入／錯誤重試及文件，待結束確認。使用者允許優先找專用資產、必要時明示衍生角色／動畫及使用現有Blender5.2；已記錄來源／修改與驗證。[證據及限制](../.kiro/specs/rigged-character-assets/validation.md)。不代表跨GPU／實機／全部環境驗收完成；原Front近距遮擋觀察仍保留。

最新進度（2026-10-26）：使用者已確認里程碑 4 並授權開始 5。里程碑 5 character-expressions-ui 已完成情緒、可編輯泡泡、控制、載入呈現與無障礙實作／驗證，待結束確認；[證據與限制](../.kiro/specs/character-expressions-ui/validation.md)。里程碑 6 尚未開始，真實 GLB 載入驗收仍保留。以下舊時點敘述保留作歷史。

最新進度：使用者已確認里程碑3並授權開始4；目前里程碑4的前方／人物俯視／低角度／160°魚眼、平滑切換與獨立Follow已完成實作與驗證，待使用者結束確認。[證據與限制](../.kiro/specs/camera-modes/validation.md)。里程碑5尚未開始；以下舊時點進度保留作歷史。

目前進度（2026-10-25）：里程碑 3 程序化人物、移動／跑跳、靜態碰撞、Follow／Orbit 及使用者追加 First person 已完成實作與驗證，等待里程碑結束確認。證據與環境限制見 [validation](../.kiro/specs/character-movement/validation.md)。里程碑 4 尚未開始。

Updated: 2026-10-19 (Asia/Taipei).

流程更新（2026-10-24）：使用者確認開始某交付里程碑後，該里程碑內規劃、requirements、design、tasks、實作、審閱與驗證自動依序推進；僅里程碑結束時總結並提示確認，確認後才開始下一里程碑。此規則取代以下註記與歷史文字的逐階段人工審閱限制；commit、模型切換及外部操作授權仍依 AGENTS.md。

cc-sdd 導入註記（2026-10-24）：以下為原始需求與階段設計，保留原文。里程碑 1 的驗證見 [setup-validation.md](setup-validation.md)，里程碑 2 的較新實作與瀏覽器驗證見 [stage-1.2.md](stage-1.2.md)；下文「下一階段場景」與當前授權描述屬舊時點，不應用來重做場景。全部規劃項目的分類、依賴與延後項見 [cc-sdd roadmap](../.kiro/steering/roadmap.md)。里程碑 3 → [character-movement](../.kiro/specs/character-movement/)，4 → [camera-modes](../.kiro/specs/camera-modes/)，5 → [character-expressions-ui](../.kiro/specs/character-expressions-ui/)，6 → [rigged-character-assets](../.kiro/specs/rigged-character-assets/)。四者目前僅初始化，requirements、design、tasks 均待逐階段產生及審閱，不構成實作授權。

This plan incorporates the current chat requirements. Historical imported plans remain available for reference. The current authorization covers repository reconciliation and project setup; the next scene implementation is described below for review.

## Product requirements

- A city street with selectable man, woman, and child characters.
- Idle/stop, walk, run, and jump actions; keyboard and visible controls.
- Switchable camera following, front, overhead, low street angle, free orbit, and fisheye views. Fisheye is the current interpretation of “fish view.”
- Emojis, emotional icons, and editable speech bubbles anchored above characters.
- Modern TypeScript with OOP and composition. Separate rendering, input, character state, animation, camera, and expression responsibilities.
- Free development tools and dependencies. No required paid APIs or cloud services. Record third-party asset licenses and attribution before inclusion.

## Delivery milestones

1. Repair and verify the Vite/TypeScript/Three.js skeleton; connect GitHub history and preserve existing files.
2. Create an OOP scene foundation with a city street, lighting, shadows, resize handling, renderer status, and orbit camera.
3. Add a clearly identified procedural human prototype, movement state machine, keyboard controls, and follow camera. Add man/woman/child variants, running, jumping, and collisions.
4. Add front, overhead, low-angle, and fisheye cameras with smooth switching and an independent follow toggle.
5. Add expressions, speech bubbles, controls, asset loading feedback, and accessibility improvements.
6. Integrate freely licensed rigged GLB assets, verify animation transitions and performance, and document local operation.

Procedural prototypes permit behavior development before final character assets are available. They are not a substitute for validated rigged character animations in the final viewer.

## Next stage design: scene foundation (1.2)

### Scope

Implement `ViewerApp` to own the update loop and disposal, `SceneRenderer` to manage rendering and resizing, and `CityScene` to own static scene geometry. Use meter-based coordinates, Y-up, and a street centered at the origin. Build a road, sidewalks, crossings, simple buildings, trees, and streetlights from reusable geometry and materials. Use generated geometry so this stage needs no external assets or Blender installation.

Use a perspective camera with orbit controls, bounded zoom, hemisphere light, directional sunlight, and capped device pixel ratio. Start with WebGL2 for a verifiable baseline; evaluate WebGPU capability and fallback separately before adopting it. Display the actual renderer rather than implying WebGPU is active.

### Acceptance criteria

- A visible street scene renders without console errors.
- Orbit, pan, and zoom work; resizing maintains correct aspect ratio.
- Ground and buildings have readable lighting and appropriate shadows.
- The page reports initialization failures clearly.
- TypeScript and production build pass, followed by an actual browser smoke check.

### Follow-on architecture

`Character` owns the character transform and appearance. `CharacterController` handles grounded movement and jump physics. `AnimationController` consumes action state. `CameraController` switches camera strategies and tracking behavior. `ExpressionManager` owns speech and emotional overlays. UI controls call public interfaces instead of modifying scene objects directly.

The historical plan requests confirmation of each stage design before implementation. This document provides the concrete next-stage design for that workflow.

2026-10-29 追加角色中心Orbit（1L-0）：使用者核准後完成mouse左鍵hold／drag平滑置中，保留短點擊Run／觸控與Follow模式邊界；57 tests、build、Release及本機production操作通過。見camera-modes validation；非新里程碑，不變更M6／SCENE-05人工驗收狀態。

2026-10-31 Mobile Orbit（1L-1）：依使用者明確授權擴充角色中心Orbit至單指觸控，雙指取消置中並維持OrbitControls操作；camera-modes追加需求6.1–6.4。手機實機、M6／SCENE-05驗收維持待辦，詳見該spec validation。

2026-10-31 Mobile Orbit結案：使用者回報iOS／Android皆OK，依要求忽略機型；本次追加需求實機驗收與結束確認完成。僅涵蓋本次操作，不推定所有瀏覽器／摺疊形態／效能皆通過，M6／SCENE-05其餘未驗項保留。見camera-modes validation。
