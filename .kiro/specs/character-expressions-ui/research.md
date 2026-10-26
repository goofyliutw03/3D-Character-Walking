# Research & Design Decisions

## Summary
- Feature: character-expressions-ui
- Discovery Scope: Extension，採 light integration discovery。
- 已讀 requirements／design／tasks 技能與 EARS／review gates／synthesis、核心 steering。依 AGENTS.md 不委派，審閱 inline。
- 無新函式庫、資產、安裝或外部服務，沿用已安裝 Three.js 與 DOM API。

## Research Log
### 投影與 frame ordering
Sources: src/engine/FisheyePass.ts、src/camera/CameraController.ts、src/engine/ViewerApp.ts、src/engine/SceneRenderer.ts。
shader 由輸出圓半徑 r 映回 tan(r*80°)/tan(80°) 的 capture 半徑；反向 anchor 必須使用 camera-space angle。radius 使用最短邊一半，與 shader aspect scale 一致。camera 在 render 前剛更新，投影須先 updateMatrixWorld，避免使用上一幀 inverse matrix。
### 編輯與 latch
Sources: src/input/InputManager.ts、tests/input.test.mjs。
keydown 已忽略表單，但 focus 進編輯時舊 keys／latch／runToggle 仍可能存在；focusin 清除，IME isComposing 防止非表單事件移動。既有 Stop 介面可供 main 使用。
### 載入狀態
Sources: .kiro/steering/roadmap.md:30、src/main.ts。
目前 renderer ready 不是 asset ready。新可存取區塊顯示實際 prototype ready，只有未來 loader 提供 loading/error 事件。現在以契約測試驗證，不新增 demo loading 操作。

## Architecture Pattern Evaluation
| Option | Strengths | Limits | Decision |
|---|---|---|---|
| DOM overlay | 原生文字、多行與可存取對照 | 需匹配魚眼投影 | 採用 |
| Three sprite/text texture | 自然3D遮擋 | 額外紋理、字型及無障礙成本 | 不採用 |
| 新 UI framework | 元件系統 | 無此必要，增加依賴 | 不採用 |

## Design Decisions
- Generalization：純 expression state 同時驅動控制與 overlay；LoadingState 為三種可觀察狀態，無 speculative loader adapter。
- Build vs adopt：採原生 textarea／select／textContent／ARIA；自建小型投影函式以匹配既有專案 shader。
- Simplification：不做臉部動畫、遮擋 raycast、儲存、timeout、emoji image assets 或新 loop。
- IME 保留 composition draft，結束才截短正規化；不以 UTF-16 maxlength 破壞 emoji。

## Risks & Mitigations
- 魚眼位置錯置：離軸與 aspect 數學 roundtrip，加 GPU browser smoke。
- 邊緣文字超界：native wrap＋實際DOM尺寸clamp，browser resize檢查。
- 逐幀播報：overlay aria-hidden，狀態只在內容動作改變時更新。
- 未提交基線：逐檔差異，不 stage／commit；同檔依序修改。

## References
以上 repo sources 為此功能的已安裝實作依據；無新增外部 API。
