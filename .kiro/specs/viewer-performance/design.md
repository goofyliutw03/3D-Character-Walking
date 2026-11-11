# 技術設計

## Overview
在現有 SceneObjectIndex 內重用未變的索引列，直接比較同步快照，移除每次 JSON 序列化。ViewerApp 仍每 250 ms 呼叫 sync；UI、渲染與公開 ObjectRow 欄位維持既有契約。目標是可量測的局部 CPU／配置改善，不是跨裝置 FPS 承諾。

## Boundary Commitments
- 本規格擁有：SceneObjectIndex 的資料重用、同步變化偵測及其量測／回歸，以及PC production工程樣本。
- Out of Boundary：Three.js 場景、畫質、同步排程、Inspector DOM、相機、動作、其他分支及人工驗收結果。
- Allowed Dependencies：既有 Object3D、CityScene 及 Node 原生 perf_hooks／test；不加套件、不下載。
- Revalidation Triggers：若 ObjectRow、sync 回傳語意或篩選／checkbox 路徑改動，重驗 scene-object-inspector 的樹、編號及世界標籤；若量測未改善則撤回最佳化，不改寫效能門檻。

## Architecture
既有 ViewerApp → SceneObjectInspector → SceneObjectIndex 依賴方向維持。索引持有 active 列與最後成功同步的快照；configure／setChecked 仍立即更新 active，但不改最後同步快照，因此下一次 sync 仍可判斷自上次同步以來的內容差異。

### 資料與契約
- `rows` 仍為 readonly ObjectRow[]；欄位與深度優先順序不變。場景 transform／visible 改變不屬索引內容，不觸發樹重建；標籤仍每幀投影。
- `sync(root): boolean` 遍歷實際場景，不以 root 的版本號猜測後代變化。對應位置的 object、id、parentId、name、path、checked、matched 全相同時重用舊列；全部相同時保留 active 陣列。
- 比較目前列與最後同步快照的語意欄位，判斷回傳值；不得因 configure 產生新物件但內容相同而誤報。
- 新增／移除／排序／重新掛載會更新快照；同一物件仍由 WeakMap 保留 ID。改名須更新子孫路徑與篩選。dispose 清空兩組快照及身份，nextId 延續既有行為。
- 不原地修改舊列，呼叫端先前持有的快照內容保持穩定。

## File Structure Plan
- `src/inspector/SceneObjectIndex.ts`：唯一產品修改。
- `tests/scene-object-inspector.test.mjs`：變化通知、改名、排序／重新掛載、舊快照隔離與釋放重建。
- `scripts/benchmark-object-index.mjs`：固定街景、暖機及多輪同步成本量測，輸出 JSON；非 CI 的時間閾值測試。
- `.kiro/specs/viewer-performance/`：需求、設計、任務、研究及驗證證據。
- `docs/development-plan.md`、`.kiro/steering/roadmap.md`：僅追加此次授權與規格連結。

## Requirements Traceability
| 條件 | 實現／驗證 |
|---|---|
| 1.1, 1.2 | benchmark 與 validation 的版本、環境、樣本及限制 |
| 2.1 | 列／陣列重用；穩定場景測試及 benchmark |
| 2.2 | 真實場景遍歷；排序、改名、重新掛載／加入測試 |
| 2.3 | active 與同步快照分離；checkbox／篩選通知及既有原子性測試 |
| 2.4 | dispose 清除兩組快照；重新 sync 測試 |
| 3.1, 3.2, 3.3 | 完整 tests、build、瀏覽器、release、索引／status 與六組平台矩陣／限制紀錄 |

## Validation / Rollback
先保存未修改產品的 benchmark 與原版索引至忽略的 `.local/viewer-performance/`，同一程序交替比較原版／新版以降低溫度與背景排程偏差。回歸不設定機器依賴的時間 assert，改驗證避免資料重建且保持行為。量測目標為穩定場景中位耗時降低，正式數字由實際樣本報告。
Release 必須依 scripts/project.ps1 release；pnpm 自動依賴檢查不可觸發安裝，使用其既有可停用檢查的程序環境選項。若無法安全停用，記錄阻擋，不安裝／改全域設定。回退僅還原本次明列檔案，不 reset checkout 或刪既有 Release 資產。

## 設計審閱
PASS（inline）：9/9 條件均有映射，保留同步通知及 immutable snapshot；無 API、套件或渲染改動。快照可保留已移除物件直到下次 sync，此生命週期有界，dispose 立即清空。

### 目標平台驗證
使用者指定 PC Chrome／Edge、Android Chrome／Edge／Firefox、iPhone Safari。優先查本機既有瀏覽器並記錄真實版本；不安裝工具、不將 viewport 模擬視為 Android／iPhone。手機真機缺口與正式 FPS／幀時間門檻獨立記錄；Node A/B 僅證明演算法同步 CPU 成本改善。

## PC 量測設計追加
範圍擴充至工程量測，產品修改仍僅既有索引；忽略的 .local/viewer-performance/pc-* harness 載入 dist ViewerApp，利用現有執行期物件讀取 stats，不新增 window exports。固定800×500、DPR1、陰影開、水景 standard、每段暖機3秒、量測5秒、三輪，四案例逐一執行；先以短樣本核對環境與計時。實際RAF驅動既有update，保留動畫與完整渲染；禁止virtual-time budget。走跑以固定時間切換方向，粒子固定節奏發射。逐樣本記錄幀數／elapsed／分位數／stats範圍及GL錯誤；保留原始JSON。headless工程樣本與前景／正式驗收分開，若GPU落入軟體則明示，不冒稱硬體效能。無embedding並跑。4.1–4.3對應task4–6；主agent inline審閱PASS。rollback只撤回此次新增harness／文件差異，不碰既有修改。
