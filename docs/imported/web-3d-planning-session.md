# Web 3D 規畫娱乐主管

Imported: 2026-10-14
Source chat ID: 6ac2731d-687c-83ee-b695-88d01c72a5f3

Historical transcript; implementation status and environment observations refer to the original session date. Embedded citation markers are preserved as source text, not resolved references.

## User

我要用 Codex + Blender 設計一個城市一般街道環境的3D 人物繞場行走與奔跑切換的3D 檢視工具, 初期設計階段我該用  web 3D 或是 Direct 3D 來製作? 請幫我規畫一下

## Assistant (message)

以你這個專案的目標來看，我會建議**初期先用 Web 3D，不要直接從 Direct3D 12 開始**。

原因很簡單：你現在的核心需求不是打造底層 3D 引擎，而是做一個「城市街道場景 + 3D 人物 + 行走/奔跑動畫切換 + 繞場檢視 + 之後可讓 Codex 持續擴充」的工具。這類需求，用 **Blender + glTF/GLB + Three.js/WebGPU** 或 Babylon.js 做 MVP，開發速度會快很多。Three.js 現在的 `WebGPURenderer` 可以優先走 WebGPU，不支援時回退到 WebGL 2，對原型和跨平台很有利。:chatgpt-content-reference{index="0"} Blender 本身也可以直接把 Mesh、材質、Camera、Light、Skinning 和動畫輸出到 glTF/GLB，非常適合這條 pipeline。:chatgpt-content-reference{index="1"}

Direct3D 12 的優點是效能、GPU 控制力和 Windows 原生整合，但它是低階 API，你需要自行處理更多 command queue、memory、synchronization、descriptor、pipeline state 等工作。微軟也明確指出 D3D12 比 D3D11 更貼近硬體，代價就是應用程式要負擔更多底層管理。:chatgpt-content-reference{index="2"} 對你目前「3D 檢視工具」的第一版來說，這些成本暫時沒有必要。

我會把整個專案規畫成下面這種架構：

```text
Blender
   │
   │ Export .GLB
   ▼
Asset Pipeline
   ├─ City.glb
   ├─ Character.glb
   ├─ Walk animation
   ├─ Run animation
   └─ Idle animation
          │
          ▼
Web 3D Viewer
Three.js + WebGPU
          │
          ├─ Scene Manager
          ├─ Character Manager
          ├─ Animation Controller
          ├─ Camera Controller
          ├─ Path Controller
          ├─ Collision / Ground
          └─ Debug / Inspector UI
```

你的角色部分，第一版不用先做太複雜的 AI。可以採一個簡單的 State Machine：

```text
          ┌────────┐
          │  IDLE  │
          └────┬───┘
               │ Move
               ▼
          ┌────────┐
      ┌──►│  WALK  │
      │   └────┬───┘
      │        │ speed > threshold
      │        ▼
      │   ┌────────┐
      └───│  RUN   │
          └────────┘
```

例如人物速度：

```text
0 m/s        → Idle
0.1–2.5 m/s  → Walk
> 2.5 m/s    → Run
```

動畫切換不要直接硬切，應該做 Animation Cross Fade，例如：

```text
Walk → Run
crossFade = 0.25 sec

Run → Walk
crossFade = 0.3 sec
```

這樣人物在城市道路上移動會自然很多。

第一階段我建議你只做一個很小的城市測試區，不要一開始建完整城市：

```text
        Building       Building
        ███████        ███████

Sidewalk ─────────────────────────

========= Two-lane Road ==========

         Character
             ↓
             ●
             │
             │ Path
             ▼

========= Two-lane Road ==========

Sidewalk ─────────────────────────

        ███████        ███████
        Building       Building
```

場景只需要先有：

- 一條雙向道路
- 人行道
- 4～8 棟簡單建築
- 路燈
- 交通號誌
- 幾棵樹
- 一個有 Rig 的人物
- Idle / Walk / Run 三個 Animation Clip
- 一條人物巡迴路徑

第一版 Viewer 的 UI 我建議這樣：

```text
┌───────────────────────────────────────────────┐
│ City Character Viewer                        │
├──────────────┬────────────────────────────────┤
│ Character    │                                │
│              │                                │
│ State        │           3D View              │
│ ● Walking    │                                │
│              │                                │
│ Speed        │             🧍                 │
│ 1.8 m/s      │            /│\                 │
│              │            / \                 │
│ Animation    │                                │
│ Walk ▼       │                                │
│              │                                │
│ Path         │                                │
│ ○ Auto       │                                │
│ ○ Manual     │                                │
│              │                                │
│ [Walk]       │                                │
│ [Run ]       │                                │
├──────────────┴────────────────────────────────┤
│ FPS 60 | WebGPU | Character XYZ: 12,0,35     │
└───────────────────────────────────────────────┘
```

Camera 至少先提供四種模式：

```text
Orbit Camera
自由旋轉觀察角色

Follow Camera
第三人稱跟隨

Top Camera
俯視場景

Free Camera
WASD 自由移動
```

其中最重要的是 Follow Camera，因為之後你如果把它擴展成模擬工具、測試工具，會很實用。

技術上我建議你的第一版 stack 用：

| 層 | 建議 |
|---|---|
| 3D Asset | Blender |
| 模型格式 | GLB / glTF 2.0 |
| Web Framework | Vite + TypeScript |
| 3D Engine | Three.js |
| Renderer | WebGPU 優先 / WebGL2 fallback |
| UI | React 或單純 HTML UI |
| Animation | Three.js AnimationMixer |
| 路徑 | CatmullRomCurve3 |
| Debug | lil-gui |
| AI Coding | Codex |
| Source control | Git / GitHub |

Blender → GLB 這條路特別適合你，因為 glTF 就是為 Web 和 native runtime 傳輸與載入 3D asset 設計，而且 Blender exporter 支援 skinning 與 animation。:chatgpt-content-reference{index="3"}

專案目錄我會讓 Codex 一開始就按照這種方式建立：

```text
city-character-viewer/
│
├─ public/
│   └─ assets/
│       ├─ city/
│       │   └─ city.glb
│       │
│       └─ characters/
│           └─ human.glb
│
├─ src/
│   ├─ engine/
│   │   ├─ Renderer.ts
│   │   ├─ SceneManager.ts
│   │   └─ LightingManager.ts
│   │
│   ├─ character/
│   │   ├─ Character.ts
│   │   ├─ CharacterController.ts
│   │   ├─ AnimationController.ts
│   │   └─ CharacterState.ts
│   │
│   ├─ camera/
│   │   ├─ OrbitCamera.ts
│   │   ├─ FollowCamera.ts
│   │   └─ FreeCamera.ts
│   │
│   ├─ navigation/
│   │   ├─ Path.ts
│   │   └─ PathFollower.ts
│   │
│   ├─ input/
│   │   └─ InputManager.ts
│   │
│   ├─ ui/
│   │   └─ DebugPanel.ts
│   │
│   └─ main.ts
│
├─ blender/
│   ├─ city.blend
│   └─ character.blend
│
└─ docs/
    ├─ architecture.md
    └─ asset-pipeline.md
```

這個結構有一個很重要的優點：**Rendering、Character、Animation、Navigation、Camera 全部拆開**。之後你要改成 Direct3D、Unity、Unreal，甚至你的 C# Windows 工具，都比較容易移植，而不會把整個 prototype 綁死在 Three.js。

Codex 在這個專案裡，我反而建議扮演「主程式設計師」，Blender 則負責 asset。工作分配可以變成：

```text
你
 ↓
Codex
 ├─ 建立 Three.js project
 ├─ Character Controller
 ├─ Animation State Machine
 ├─ Camera
 ├─ UI
 ├─ GLB Loader
 ├─ Path movement
 └─ Debug tools

Blender
 ├─ City
 ├─ Character
 ├─ Rig
 └─ Animation
```

Blender 甚至可以再讓 Codex 幫你寫 Python script，自動產生一些城市元素，例如道路、路燈、建築 block、樹木 placeholder，再 export GLB。這會非常適合你現在「Codex + Blender」的方向。

我會把整個 development roadmap 分成六階段：

1. **MVP**：空白 3D scene、載入人物、Orbit Camera、Idle / Walk / Run。
2. **Character Controller**：WASD、速度控制、Walk ↔ Run 自動切換、動畫 blending。
3. **City Scene**：Blender 建小型城市街區，GLB 載入，人物貼地移動。
4. **Path System**：設定 waypoint/path，人物自動繞場，支援 loop、pause、speed。
5. **Viewer Tool**：Inspector、camera 切換、animation control、speed slider、FPS/XYZ/debug資訊。
6. **進階模擬**：碰撞、NavMesh、NPC、車輛、紅綠燈、LOD、多人角色。

做到第 6 階段，你才需要重新評估是否轉 Native 3D。

判斷標準很簡單：

```text
                    Web 3D
                       │
            能滿足效能需求？
                  /          \
                YES          NO
                 │            │
           繼續 Web 3D      Windows only？
                             /        \
                           YES        NO
                            │          │
                    Native D3D    Vulkan /
                    or Engine      Engine
```

如果最後你的需求變成「Windows 專用、數百甚至數千角色、超大場景、高度自訂 rendering pipeline、特殊 GPU compute」，才值得深入 D3D12。D3D12 確實能降低 CPU overhead 並給你更細的 GPU 控制，但同時也要求自己管理更多底層資源。:chatgpt-content-reference{index="4"}

所以以你目前這個專案，我會定案成：

**Blender + GLB + TypeScript + Three.js WebGPU + Codex**

而不是：

**Blender + C++ + Direct3D 12**

前者大概是你現在最適合的架構，而且它不會阻礙之後轉 D3D。實際上你可以把 **GLB asset pipeline、Character State Machine、Path/Navigation architecture** 保留，未來只替換 renderer/runtime。

尤其你之前本來就有 C# / C++ / Python、Windows UI，以及想讓 Codex 作為 AI coding agent 的方向，這個專案還可以再設計成「Web Prototype → C# Native Viewer」兩階段：先快速把行為、動畫與 UI 驗證完成，再決定是否把核心做成 Windows native。

如果你下一步要真的開始做，我建議第一個 Codex 任務就定成：**建立一個 Three.js + TypeScript 的 City Character Viewer skeleton，載入 Blender GLB 人物，支援 Orbit/Follow Camera，以及 Idle/Walk/Run 狀態切換。**這會是最穩的起點。


