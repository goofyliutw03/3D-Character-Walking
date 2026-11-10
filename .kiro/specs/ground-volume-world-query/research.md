# Research
## Summary
本機既有契約擴充，讀取1Y-13全部spec、natural-terrain-validation、multi-scene-foundation、目前開發計畫／roadmap與實作。採用kiro init→requirements→design→tasks→impl→review→validate-impl／verify-completion，全部sequential inline，使用者禁止委派／commit／模型切換。
## Investigations
- 城市capability只有planar-extrusion，必須保持原分支；Controller垂直移動沒有sweep、固定capsule1.8未隨variant變更。
- HeightField共用65² Uint8及固定cell diagonal，CPU／GPU既有誤差驗收不可破壞。groundSample需要normal且與相同triangle求解。
- CaveScene盒可同時建立有限代理，roof中央真實開口不能用全域ceiling平面蓋住；鐘乳石保守box明列誤差。
- GroundPicker目前回XZ丟y、DestinationNavigation永遠用y0；只改query不足，必須顯式integration task。
- Viewer固定maxPlacementHeight2.1與膠囊淨空衝突，需以query取代；Profiles schema及相機自訂composer保持不變。
## Design Decisions
歸納為支撐表面選擇與有限實體淨空兩問題；共用query與policy為seam，不讓Viewer判斷岩體細節。現有Three.js僅有ray／box，未使用既有剛體solver；本批盒形靜態驗證可用分段二次距離作精確膠囊sweep，不引入套件／引擎、網路或授權成本。不上任意mesh solver／空間索引，現場代理數量有界；實際成本記錄而非推定手機FPS。
建議.02m skin未直接套用，地表既有1mm貼地要求優先；用1e-8接觸容差並測接觸／離開／低幀率。四迭代／.25m／45°須由本批tests與production驗證再作結論。
## Risks
階梯／平台讓上下層同XZ，點選高度、空中選支撐、尺寸切換及編輯落點均需一體驗證；沒有一般跨樓層navmesh承諾。真機與正式效能維持待驗。
