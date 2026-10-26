# Development plan

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
