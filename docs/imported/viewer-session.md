# 建立 Three.js 城市角色檢視器

Imported: 2026-10-14
Source chat ID: 01a1079b-c8ad-7a52-a0e9-5bfbc9154d6c

Historical transcript; implementation status and environment observations refer to the original session date. Embedded citation markers are preserved as source text, not resolved references.

## User

A.**建立一個 Three.js + TypeScript 的 City Character Viewer skeleton，載入 Blender GLB 人物，支援 Orbit/Follow Camera，以及 Idle/Walk/Run 狀態切換。**
B.請參考 ChatGPT session topic "Web 3D 規畫娱乐主管" 的內容並且照階段執行.
C.每個細分階段請自動選用合適的 AI 模型.
D.每個細分階段請先做設計規劃分析report, 等我確認後才開始進行修改與自我驗證.
E.開發環境設定安裝步驟或自動安裝相關工具.


## Assistant (commentary)

我會先找出你提到的「Web 3D 規畫」聊天內容，並檢查目前工作目錄與開發工具，再整理第一個細分階段的設計分析 report。依你的要求，收到確認後才會修改、安裝與自我驗證。


## Assistant (commentary)

我會使用 OpenAI Docs skill 查核模型選用方式。開發目錄目前沒有偵測到專案設定檔；系統能找到 Node、Git 與 Python，npm 的可用性還需要確認。


## Assistant (final_answer)

已讀取你指定的 **「Web 3D 規畫」聊天內容**。會依原訂六階段推進，並將第一階段拆細；**每個細分階段先提交 report，等你確認後才修改、安裝與自我驗證。**目前只完成唯讀盤點。

**第一階段設計分析 report：MVP skeleton**

採用 **Vite + TypeScript + Three.js + Blender GLB**，UI 先用 HTML/CSS。Rendering、Character、Animation、Camera 分離，便於後續擴充。

| 細分階段 | 工作與設計 | 確認後的驗證 |
|---|---|---|
| 1.1 開發環境與專案骨架 | 補齊 npm、建立 Vite/TypeScript 專案、安裝 Three.js、建立模組目錄及啟動文件 | TypeScript 檢查、正式 build、開發伺服器啟動 |
| 1.2 基礎 3D 場景 | 地面、燈光、尺寸調整；WebGPU 優先、WebGL2 fallback，顯示實際後端 | 瀏覽器呈現、resize、fallback |
| 1.3 Blender GLB 人物 | 載入人物、檢查比例與動畫清單、顯示載入錯誤 | 真實 GLB 的骨架、材質與動畫檢查 |
| 1.4 動畫狀態 | Idle／Walk／Run 狀態機、clip 名稱映射、約 0.25–0.3 秒 crossfade | 連續切換、缺少 clip、重複選取 |
| 1.5 Orbit／Follow Camera | Orbit 繞角色觀察；Follow 平滑跟隨角色位置與朝向 | 模式切換、目標追蹤、鏡頭穩定性 |

GLB 使用 `GLTFLoader`；動畫使用 `AnimationMixer`。這符合 Three.js 的[模型載入](https://threejs.org/docs/pages/GLTFLoader.html)與[動畫系統](https://threejs.org/manual/pages/animation-system.html)。

目前沒有找到人物 GLB。1.3 開始前需要你的資產路徑；若尚未製作，可先規劃 Blender 測試人物，驗證用資產會明確標示。

**1.1 環境盤點與安裝方案**

- 工作目錄目前只有 `work/`、`outputs/`，尚無專案。
- Node **v24.19.0**、Git、Python 可用；PATH 未找到 npm。
- Node 版本符合目前 [Vite 的版本要求](https://vite.dev/guide/)。
- 確認後先補齊專案可用的 npm，再安裝 `three`、`vite`、`typescript`、`@types/three`，鎖定依賴版本。
- 提供 PowerShell 安裝／啟動腳本及手動操作文件；Blender 安裝需求留待資產階段盤點。
- 建議完整可交付專案放在 `outputs/city-character-viewer/`。

**模型選用**

依任務複雜度選用：環境與文件採 Luna；模組實作採 Sol；跨模組設計與疑難除錯採 Astra。這是依[官方模型選用指引](https://developers.openai.com/api/docs/guides/model-selection)制定的初始策略。

目前工具不能直接切換本聊天的主模型，因此我會在各階段 report 標示建議模型與實際執行方式，不會宣稱已自動切換。

後續沿用原六階段：**MVP → Character Controller → City Scene → Path System → Viewer Tool → 進階模擬**。Follow Camera 按你的 A 項要求提前納入 MVP。

請回覆 **「確認 1.1」**，我就開始開發環境設定、專案骨架建立與該階段驗證；完成後提交結果及 1.2 report。此確認關卡來自你 D 項的明確要求。


