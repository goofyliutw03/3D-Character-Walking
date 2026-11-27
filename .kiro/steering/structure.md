# 結構與責任邊界

## 目前有效責任補充

updated_at：2026-11-19（Asia/Taipei）。依使用者核准的 Sync 補充既有模式；下方「後續／預留」為歷史時點，不表示人物、輸入、導航、UI或本機角色資產仍未實作，不構成搬移目錄授權。

- ViewerApp 是組裝與每幀時序的擁有者；輸入／手勢傳遞意圖，navigation 處理目的地與靜態可走區，camera 維持構圖權威。UI 透過公開介面呼叫，不直接驅動骨架或底層渲染物件。
- character 分開管理主角資產與獨立 Target 的載入／釋放；interaction 消費角色 anchor，管理有界粒子生命週期，不接管角色控制或引入 NPC AI。
- water 由 `src/water/index.ts` 暴露共用 API，宿主擁有渲染、時間與掛載；scene 以街道 adapter 整合水景及障礙，獨立水景入口重用同一模組。lighting 的有界光源池管理租用／歸還，效果到期須釋放資源。公開使用方式見 [水景API](../../docs/water-api.md) 與 [光源API](../../docs/lighting-api.md)。
- inspector 分離只讀場景索引與樹／標籤呈現；頁面內穩定 ID、checkbox／篩選只影響標籤，不編輯場景。未變列與同步快照可重用，但動態樹仍遍歷，篩選／checkbox 狀態與最後同步比較保持分離。
- UI 的功能樹／面板管理 DOM 組織及可存取操作；renderer 持有魚眼／X-ray與鏡頭水滴效果的渲染資源。新增行為維持既有 dispose 與事件清理界線。
- `scripts/` 的 Release／系統匣／自啟屬本機操作工具，與瀏覽器 runtime 分開；發佈只複製 dist，常駐腳本依賴原始專案。`public/assets/` 已含授權清楚的執行資產，來源／重建規則見 [資產流程](../../docs/asset-pipeline.md)。

## 原始模式與歷史規劃

更新日期：2026-10-24。狀態：使用者已核准 steering 內容；cc-sdd 規劃對應見 [roadmap](roadmap.md)。

## 組織原則

採用依責任拆分的 TypeScript 類別與組合。`src/main.ts` 組裝 DOM 與 UI 事件，透過應用程式公開方法驅動場景；避免 UI 直接操作 geometry、animation 或相機內部狀態。

## 現有模式

- `src/character/CharacterAssets.ts` 管最新請求與retry，注入loader／factory／release；`RiggedCharacter.ts`管normalization、AnimationMixer及unique資源釋放；`assetCatalog.ts`提供本機URL／clip／高度。既有Character保留明示fallback。ViewerApp組裝權威motion、model、camera與overlay。資產來源與Blender重建腳本見`tools/assets/`及`docs/asset-pipeline.md`。

- `src/expression/` 管情緒／對話狀態及DOM overlay；`src/camera/AnchorProjection.ts` 對應普通與160°魚眼映射，不改鏡頭權威。`src/ui/` 管載入回饋及SpeechEditor的IME／提交時序。ViewerApp集中每幀定位，main只透過公開介面。

- `src/camera/CameraController.ts` 管理鏡頭view／Follow、構圖與球面轉場，重用FirstPersonCamera與FollowCamera.constrain；ViewerApp負責組裝。`src/engine/FisheyePass.ts`由SceneRenderer按需使用，負責160°等距魚眼及離屏資源，不依人物或UI。

- `src/engine/` 管理應用生命週期與渲染。ViewerApp 組合 SceneRenderer、CityScene 與 OrbitControls，管理更新迴圈與鏡頭轉場。
- `src/scene/` 管理靜態環境、光照與可重用 geometry／material；場景負責釋放自己持有的資源。
- 類別檔案使用 PascalCase（例如 ViewerApp.ts），方法與變數使用 camelCase；既有匯入使用相對路徑與 Three.js addon 路徑，尚未設定專案路徑別名。

## 後續邊界（規劃，非既有實作）

人物外觀與 transform、移動／跳躍物理、動畫狀態、鏡頭策略與追蹤、表情 overlay 分別由各自模組負責。輸入與 UI 傳遞意圖，不直接驅動骨架或 renderer。詳細設計須按 [開發計畫](../../docs/development-plan.md) 與 spec 階段另行審核。

現有 `src/scene/` 是實際場景位置，歷史目錄提案不得作為搬移既有檔案的授權。人物、輸入、導航及 UI 預留目錄不代表對應功能已完成。

## 資產、文件與協作

`public/assets/` 預留執行時資產，`blender/` 預留來源檔；引入資產前記錄授權，來源與匯出物用途分明。`docs/development-plan.md` 維護里程碑，`docs/imported/` 保存歷史背景；不要重抄歷史清單作為現況。

協作與 session 命名依 [AGENTS.md](../../AGENTS.md)。spec 細項在 `.kiro/specs/<feature>/tasks.md` 維護；同批共用檔案必須依序進行，不可平行修改。同一 checkout 的既有未提交內容須保留，只提交已核准範圍，不 push。
