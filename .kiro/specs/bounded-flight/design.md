# 有界飛行設計

## Boundary Commitments
本spec擁有FlightWorldQuery（組合既有GroundWorldQuery／CapsuleBox）、FlightController、FlightScene及Viewer／Input／UI／Profiles整合。WorldQuery僅擴充能力型別，ground行為不變。查詢與移動純CPU，不依賴DOM、Three或Viewer。
不擁有任意mesh物理、體積聯集、旋轉膠囊、相機演算法、水域／太空、全域固定時鐘、資產下載。依賴方向：WorldQuery/CapsuleBox→FlightWorldQuery→FlightController→Viewer；FlightScene建立可見代理與query；main只傳意圖。

## Architecture
FlightWorldQuery以GroundWorldQuery提供有限盒／XYZ範圍／表面，附加明列禁入盒（相同精確膠囊掃掠），能力ground+flight。允許區單一盒，禁入優先。警戒距離扣完整半徑／高度，用禁入盒膠囊安全包絡保守提示；警戒只縮減朝外加速，安全由sweep保證。

FlightController與CharacterController共用最小結構介面（snapshot/shape/walkSpeed/setWalkSpeed/setCapsule/relocate/update）。flight controller內部持有ground controller，模式同時只更新一個。著陸先surfaceSample(maxRise=0)，距離0..2m、normal≥cos45°、完整向下sweep到表面與overlap通過，再relocate ground並切模式；失敗不改位置／速度。起飛保留位置，清速度；idle/Jump為既有動畫fallback，不宣稱飛行clips。

flight最高速度正常8／加速24m/s，加速度18m/s²，無輸入阻力12m/s²；三維輸入正規化。固定1/60，每幀最多4步，超量丟棄並累計；每步最多4接觸，位移及速度同時投影法線。任何query失敗回復本幀狀態。ground分支仍用原update。Stop／blur／hidden／context清速度與accumulator。Viewer對flight傳原始有界frame delta，其他維持.05上限。

FlightScene為80×80×40m單一範圍，地板／兩個有限盒平台及高柱由同一資料建立Mesh與query，單一紅色線框禁入盒與黃色警戒視覺標記納入Inspector。程序天空球Shader與橢球網格雲不參與碰撞／camera obstruction；共享資源dispose一次。spawn=(0,0,5)安全地板，初始flight。

Input沿既有方向button capture／鍵盤latched慣例擴充up/down（E/Q，Space亦可上升），run為boost；ground不讀升降。UI flight fieldset提供起飛／著陸與fallback／速度／警戒／丟棄時間status。Profiles v1僅擴充場景enum及命名前綴，舊三場景資料原樣接受，無動態位置／速度新欄位。SceneSwitch prepare先驗證spawn與query，再提交；context期間取消切換，恢復驗證CPU狀態。

## File Structure Plan
- src/world/{WorldQuery,FlightWorldQuery}.ts：能力／有界query。
- src/character/{FlightController,motion}.ts：策略／可選升降意圖。
- src/scene/{FlightScene,SceneSwitch}.ts：程序視覺／場景能力。
- src/input/InputManager.ts、src/engine/ViewerApp.ts、src/main.ts、src/ui/controlPanelContent.ts：正常入口與控制／暫態。
- src/settings/{PanelProfiles,validateViewerSettings}.ts：v1相容。
- tests/flight.test.mjs及既有回歸：查詢、策略、場景與Profiles。
- 本spec、development-plan、roadmap、scene-runtime規範：實際能力／驗證。

## Traceability and Validation
1.1–1.3→場景／Viewer／兩runtime；2.1–2.3→Controller／Input／UI；3.1–3.4→query／策略故障測試；4.1→Profiles回歸；4.2→完整tests、typecheck/build、正式入口兩runtime、Release/hash、索引status。接觸容差1e-8m；測試最大速度斜向與三尺寸、上／下界、拒絕非法資料、著陸切換及失焦context。保留原城市／地表／洞穴、相機、導航／巡迴回歸。

## Risks / Rollback / Review
速度24m/s配合80m範圍由連續掃掠保安全，警戒3m不是煞停距離保證；不宣稱任意三角面膠囊或手機效能。回復只撤本批差異後重release，不reset、不刪外部陌生資產。無必要外部輸入；具體初值依本規範採合理預設。inline design gate PASS：責任／整合／12條件均有映射，無委派、commit、push或模型切換。

## 2026-11-18 integration amendment
固定步進拒絕>3600秒的非法frame delta，避免極大有限值溢位。Context恢復實測觸發multi-scene-foundation的既有生命週期缺口；修正由該上游責任擁有，見其design／validation追加。整合範圍明列src/engine/ContextResources.ts、SceneRenderer與tests/context-resources；loss時釋放GPU註冊／陰影／離屏目標（保留CPU與角色位置），restore時重建與驗證，而非在flight query加入渲染知識。回歸需涵蓋四場景、角色、魚眼／X-ray與兩runtime。
