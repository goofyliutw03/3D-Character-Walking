# Research & Design Decisions

## Summary
particle-interaction 為既有 viewer extension，採 integration-focused light discovery。閱讀 product／tech／structure／roadmap、資產文件、rigged-character-assets 與 camera-obstruction-modes design、ViewerApp／CharacterAssets／RiggedCharacter／main 及 tests。

## Research Log
- CharacterAssets 每次選擇會 dispose 前模型，GLTFLoader.loadAsync 每次解析獨立資源；新增 Target 使用自身 CharacterAssets，避免共用場景或 skeleton。沿用 stale request 釋放與 retry。
- Caster 初始 (0,5)，Target (0,-1) 同街道，取 groundHeight，避免新增導航邏輯。
- environment 是遮擋材質覆寫邊界；角色與粒子掛 scene 外層，避免環境模式破壞效果。
- AnchorProjection 已支援魚眼／螢幕外裁切，直接重用，無新增投影。
- 參照 node_modules/three/src/math/Line3.js、SphereGeometry、MeshBasicMaterial 既有 API；不引入新套件、外部資產或網路服務。
- 已讀 kiro init／requirements／design／tasks／impl／review／validate-impl／verify-completion；採數字追蹤、明確 boundary、逐 task RED/GREEN 與 inline 審閱。使用者不授權委派及 commit，覆蓋 skills 預設。

## Architecture Pattern Evaluation
| 選項 | 判斷 |
|---|---|
| clone 既有模型 | 需額外處理 skeleton 及共享 GPU ownership；此規模不採用 |
| 獨立解析既有 GLB | 簡單且符合既有 dispose 契約，採用；多一名角色有固定成本 |
| GPU simulation／新特效套件 | 超出單一效果規模且增加依賴，不採用 |
| 有上限 mesh slots | 利用現有 Three，易測碰撞／生命週期，採用 |

## Design Decisions
ParticleInteraction 消費 Vector3 快照而非角色物件，保持角色與特效隔離。每次一個 projectile，命中轉短 burst；上限包含 burst。Target 不接受移動控制，重設清除舊發射。UI 使用專用按鈕無新鍵盤快捷鍵。

## Risks & Mitigations
獨立雙載入用真實 GLB 測隔離；高速用線段球碰撞；非同步 late result 與 disposal 沿用 CharacterAssets 並測試；生效設定複製避免改變飛行中效果；production 重驗相機、導航及重設。
