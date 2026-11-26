# 調查與設計決策

## 摘要
本次為既有選取系統擴充，採 integration-focused discovery。已讀核心 steering、cc-sdd init／requirements／design／tasks／impl／review／verify／validate 技能與相關規則；依使用者授權不委派、依序 inline 審閱。

## 調查紀錄
- GroundPicker 原實作更新整棵環境後取第一個命中；牆頂會擋住可走地面。
- ViewerApp 僅傳入 environment.children，主角與 Target 位於 scenes.root，因此原實作沒有角色攔截。
- CityScene 地面為單位 BoxGeometry 經 transform 縮放；CaveScene 地面為有限 BoxGeometry。只有這些明確宣告的盒頂允許解析求交。
- DestinationNavigation 及 CharacterController 已負責 bounds／obstacles／路徑，選取不介入碰撞。
- CameraModeManager 的 groundTapEnabled 依 standard／running-orbit／inspection 與場景能力管理；本次保留該政策。第一人稱的 inspection 禁用與直接選取 first-person 不同，不把原有政策擴寫成新禁用規則。
- TrafficView 擁有 NPC LOD；提供只讀 NPC roots，排除車輛與紅綠燈裝飾。由可見樹遍歷避免隱藏 LOD 誤攔。
- 已核對本機 node_modules/three/src/objects/Mesh.js：內建 raycast 有 boundingSphere，boundingBox 存在時會先篩選；不需新相依或空間索引。
- multi-scene-foundation 的 tasks 已勾選但 approvals 舊值仍 false；本次不回填歷史核准。舊人工待驗以 remaining-acceptance 最新裁定為準。

## 方案比較與決策
| 方案 | 判定 |
|---|---|
| 全場景全命中排序 | 能穿透但仍遍歷無關環境，不採用 |
| 無限水平面 | 會虛構地面、漏掉多高程及斜地，不採用 |
| 明確表面集合＋解析盒頂＋其餘 raycast | 採用，有限範圍及最近合法點規則一致 |
| BVH／第三方空間索引 | 目前沒有必要，不新增依賴或重建成本 |

## 整合與效能取捨
GroundPicker 在建構時收集靜態可走 Mesh 與明確 blocker roots。每次點擊只更新候選祖先矩陣；不更新整棵裝飾。動態 blocker roots 每次由 Viewer 注入。候選數達16個或合計達2048三角形時，對靜態非解析表面預算 local boundingBox，沿用 Three 的保守篩選；這是工程分支門檻，非正式 FPS 保證。以結果等價與實際 raycast 呼叫數測試驗證門檻兩側。

## 風險與緩解
- 盒頂宣告只供未變形 BoxGeometry；自訂幾何、材質陣列、背面材質等回退 mesh raycast。
- 最近合法表面仍須 normal.y >= .9、裁切與 isWalkable；不實作多樓層路徑。
- 動態新增可走地面須重建 GroundPicker；切場景即重建。幾何修改必須重新宣告／重建，不以封閉標籤推測。
- rollback 使用本次前 .local/ground-picking-baseline 的逐檔副本比對，只撤回本次差異；不 reset 既有 dirty。
