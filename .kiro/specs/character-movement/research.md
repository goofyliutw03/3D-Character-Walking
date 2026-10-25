# Research & Design Decisions
## Summary
既有小型 viewer 的 integration-focused light discovery。已讀 requirements／design／tasks／impl／review／verify-completion／validate-impl skills 及必要 rules／templates；審閱與 commit 界線依 AGENTS.md 最新政策。

## Research Log
- CityScene：道路寬 9m／長 54m，sidewalk 中心 x=±6.4、寬 3.8，建物內緣 abs(x)=8.5；樹槽、長椅與路燈直接建立碰撞 metadata。街尾中央樹另含底座。
- ViewerApp：單一 loop、PerspectiveCamera、OrbitControls，delta cap 0.05；維持此組裝，不引入框架。
- 既有已安裝 three／@types/three 提供 Group／Mesh／Vector3／OrbitControls；不升級或引入套件。本機 Node v24.22.1，原生測試配合 experimental-transform-types。
- 官方參考：[Object3D](https://threejs.org/docs/pages/Object3D.html)、[OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)、[Node TypeScript](https://nodejs.org/api/typescript.html)。使用本機型別與實測確認，不以網站最新版本取代鎖檔。

## Architecture Pattern Evaluation
選擇純 controller + AABB world：無新依賴、可測且足以靜態街道。完整物理引擎增加套件、同步及生命週期成本，目前不採用；此原型無 NavMesh 或動態碰撞。

## Design Decisions
- Generalization：三種人物共用 geometry、動作與安全碰撞半徑，以比例／顏色區分。
- Build vs Adopt：沿用 Three、OrbitControls、DOM pointer capture，自己實作有限運動，不重做通用物理或 UI framework。
- Simplification：單一 active character、motion snapshot 與 Follow，不提前建立 loader／相機 registry。
- 路緣簡化為可踏上的高度變化；碰撞按 XZ footprint，跳躍也不能穿過設施。

## Risks & Mitigations
- 座標漂移：CityScene 建設施時產生碰撞資料，controller 不重抄位置。
- 卡鍵：focus／visibility／pointer cancel 統一清除與測試。
- 鏡頭互爭：Follow 明確禁用 Orbit；退出恢復。
- 原型與最終驗收混淆：UI 標示 Procedural prototype。
- 審閱模式為主 agent inline，未宣稱獨立 reviewer，未更換模型或啟動外部服務。
- 瀏覽器發現街尾轉身時 Follow 進入樹冠；加入目標到相機的靜態 scene Raycaster 遮擋解算，角色從 blockers 排除。回歸測試先觀察到失敗斷言，再加入距離限制；設計同步更新，維持基本 Follow 邊界。
