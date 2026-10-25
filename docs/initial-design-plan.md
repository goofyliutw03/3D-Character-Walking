# 初版設計計畫

匯入日期：2026-10-14。狀態：設計基線，待階段 1.1 確認。

## 來源與匯入範圍

- 「建立 Three.js 城市角色檢視器」，chat ID `01a1079b-c8ad-7a52-a0e9-5bfbc9154d6c`。[原始對話](imported/viewer-session.md)
- 「Web 3D 規畫」，chat ID `6ac2731d-687c-83ee-b695-88d01c72a5f3`。[原始對話](imported/web-3d-planning-session.md)

此文件整合來源的設計提案，將 MVP 與後續範圍分開。原始 session 沒有完成實作，也沒有階段 1.1 的確認紀錄。舊工作目錄只有空的 work／outputs 目錄，沒有可搬移的程式或資產。此次授權匯入文件，不視為後續開發階段的確認。

## 目標與技術基線

使用 Codex 與 Blender 建立城市街道人物檢視工具，支援繞場行走、奔跑、動畫切換及多種鏡頭。先以 Web 3D 驗證行為與 UI，日後依效能需求評估 native runtime。

| 項目 | 初始設計 |
|---|---|
| 建置 | Vite + TypeScript |
| 3D | Three.js |
| Renderer | WebGPU 優先，WebGL2 fallback；顯示實際後端 |
| 資產 | Blender → glTF 2.0 / GLB |
| 動畫 | GLTFLoader + AnimationMixer；Idle / Walk / Run |
| UI | 初期 HTML/CSS；後續 Inspector / debug panel |
| 導航 | 後續採 waypoint / CatmullRomCurve3 |
| 版本管理 | Git；遠端另行設定 |

以上為匯入的設計選擇；套件版本、API 相容性及瀏覽器支援須在實作階段重新確認並鎖定版本。

## 第一階段：MVP skeleton

MVP 提供基礎地面、燈光、Blender GLB 人物、Idle／Walk／Run 切換，以及 Orbit／Follow Camera。Follow Camera 按較晚的明確需求提前納入第一階段。完整街區、自動巡迴、Top／Free Camera 留在後續階段。

| 細分階段 | 設計與交付 | 確認後的驗證 |
|---|---|---|
| 1.1 環境與專案骨架 | 盤點 Node/npm/Git；建立 Vite/TypeScript/Three.js 專案、模組目錄、PowerShell 安裝與啟動說明、依賴鎖檔 | TypeScript 檢查、production build、dev server 啟動 |
| 1.2 基礎場景 | 地面、燈光、resize、renderer 初始化與後端顯示 | 實際瀏覽器呈現、resize、WebGL2 fallback |
| 1.3 GLB 人物 | 載入、比例與朝向檢查、動畫清單、載入錯誤提示 | 真實 GLB 的骨架、材質、動畫與失敗情境 |
| 1.4 動畫狀態 | Idle／Walk／Run 狀態機、clip 映射、約 0.25–0.3 秒 crossfade | 連續切換、缺少 clip、重複選取 |
| 1.5 鏡頭 | Orbit 觀察；Follow 平滑追蹤角色位置與朝向 | 模式切換、移動目標追蹤、鏡頭穩定性 |

每個細分階段須先提交設計分析報告，經使用者確認後才開始該階段安裝、修改與自我驗證。完成後提交結果及下一階段報告。

## 模組架構與目錄

目前專案根目錄即為應用程式預定根目錄，不沿用舊 session 的 outputs/city-character-viewer 巢狀位置。

```text
public/assets/
  city/city.glb
  characters/human.glb
src/
  engine/       Renderer, SceneManager, LightingManager
  character/    Character, CharacterController, AnimationController, CharacterState
  camera/       OrbitCamera, FollowCamera；後續 TopCamera / FreeCamera
  navigation/   Path, PathFollower（階段 4）
  input/        InputManager（階段 2）
  ui/           控制面板；後續 DebugPanel
  main.ts
blender/        city.blend, character.blend
docs/           設計、資產流程、階段報告與匯入來源
```

Rendering、Character、Animation、Navigation、Camera 分離。動畫狀態不直接依賴 UI；鏡頭以角色 transform 為追蹤來源。以上為規劃目錄，尚未建立程式檔或資產。

## 資產與動畫規格

人物需有 rig，並提供 Idle、Walk、Run 三個可映射的 clip；保留來源名稱並由設定映射，避免綁死匯出命名。載入時檢查比例、朝向、骨架、材質及動畫清單。實作前須決定 root motion 或 in-place，避免動畫位移與控制器位移重複。

後續速度驅動動畫的來源提案為 0 m/s → Idle、0.1–2.5 m/s → Walk、>2.5 m/s → Run。0–0.1 m/s 間隙、閾值抖動及 hysteresis 需在階段 2 報告中明確定義。Walk → Run 約 0.25 秒、Run → Walk 約 0.3 秒為初始調整值。

尚未提供人物 GLB 或 Blender 檔。階段 1.3 前需取得資產路徑；若製作測試資產，需在該階段報告中說明並標記為測試用。

## 六階段路線圖

| 階段 | 範圍 |
|---|---|
| 1 MVP | 基礎場景、GLB 人物、Orbit／Follow、Idle／Walk／Run |
| 2 Character Controller | WASD、速度、Walk ↔ Run 自動切換、blending |
| 3 City Scene | Blender 小街區、GLB 載入、人物貼地 |
| 4 Path System | waypoint/path、自動巡迴、loop、pause、speed |
| 5 Viewer Tool | Inspector、四種鏡頭、動畫控制、速度滑桿、FPS／XYZ／debug |
| 6 進階模擬 | 碰撞、NavMesh、NPC、車輛、紅綠燈、LOD、多角色 |

街區目標為一條雙向道路、人行道、4–8 棟建築、路燈、交通號誌、樹木與人物巡迴路徑。UI 目標為左側角色／狀態／速度／動畫／路徑控制，中間 3D View，底部 FPS、renderer 與角色 XYZ。Top／Free Camera 在階段 5 納入。

## 執行方式與待確認事項

原始需求包含各階段自動選用合適模型。來源建議環境／文件採 Luna、模組實作採 Sol、跨模組設計／除錯採 Astra；這是歷史提案，沒有模型已切換的紀錄。每階段報告應如實記錄建議與實際使用模型，不宣稱未執行的自動切換。

舊 session 的 Node v24.19.0、npm 未在 PATH 等盤點結果僅供歷史參考。本次未安裝工具，1.1 須重新盤點目前環境。尚待決定實際 GLB 資產、Blender 安裝需求、相容瀏覽器與效能驗收基準。

下一步：提交／確認 1.1 環境與專案骨架報告，再依確認範圍實作。匯入完成並不代表 MVP 已可執行。
