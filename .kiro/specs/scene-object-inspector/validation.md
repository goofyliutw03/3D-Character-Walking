# 場景物件檢視器驗證（1S-0，2026-10-31）

## 接手／授權與任務盤點
已核准獨立追加需求；COMPLEX，建議高能力／高推理，沒有切換模型。原交接chat及夜景chat idle，水霧／夜景 implementation-complete，HEAD8e945af／codex/v02-particle-system及全部既有dirty保留。依序init→requirements→design→tasks→impl→validate／verify；每gate及task inline審閱，無委派／commit／push，不冒稱使用者逐份人工核准。

| 項目 | 來源 | 分類／建議動作 | 標籤 | 依賴／共用檔案 |
|---|---|---|---|---|
| 場景物件樹／編號標籤 | 使用者交接授權；本spec requirements:1 | a，scene-object-inspector spec與實作 | INSPECT-01 | ViewerApp／main／UI，必須依序進行，不可平行 |
| 六里程碑既有實作 | docs/development-plan.md:50；各spec.json phase | 已完成實作，保留各validation限制 | M1–M6 | 不重做既有功能 |
| 跨GPU／實機／摺疊待驗 | .kiro/steering/roadmap.md:93–95；docs/remaining-acceptance.md | b，保留人工待驗 | SCENE-04/05/FOLD | 非本機smoke可代替 |
| 其他Inspector編輯／XYZ／速度等 | .kiro/steering/roadmap.md:74 | c，本次只追加物件結構與標籤，其餘延後 | LATER-02 | 不擴張編輯器 |

## 自動驗證與審閱
新增4個Node測試，覆蓋穩定ID、唯一／reparent／remove／readd、不重用、未命名fallback、regex／range交集／祖先、checkbox保留、錯誤原子拒絕／安全整數邊界、normal／fisheye、world transform及隱藏祖先／offscreen。canonical前次112/112、tsc及build exit0；最終release會再次執行完整tests/build。
task1與2 RED分別為缺少Index／Inspector模組exit1，實作後通過。task3整合透過production harness驗證，未虛構額外feature-flag RED。首次harness錯誤因import的共享index帶入隱藏主入口而產生重複DOM IDs，導致選錯控制；已將harness查詢限定自身panel並改唯一執行ID，未為測試修正產品。
inline檢查修正：事件採單一容器委派，避免AbortSignal持有每個row／移除物件；programmatic toggle與手動展開狀態分離；另保留篩選下手動收合跨動態結構同步。沒有新placeholder／hardcoded secret；git diff --check exit0，既有CRLF advisory保留。無新增library／第三方資產。

## 最終Production 22/22 PASS
忽略的 `.local/inspector-validation/` localhost:4182載入當次dist hashed ViewerApp與相依模組，真GLB Caster／Target。無source替身；固定rendered camera／delta及直接觸發harness DOM控制，不宣稱為實體Orbit／觸控驗收。此bundle的共享index也啟動隱藏主入口；所有測試操作已限定harness panel，樣本只計inspector自身CPU區間，不是整頁FPS。

| 驗證 | 結果 |
|---|---|
| 實際graph完整遍歷與唯一ID | 690物件一致 |
| master預設off、交集單一label、祖先only | PASS |
| unchanged sync的DOM identity／鍵盤focus | PASS |
| checkbox、自身label及filter cycle選擇保持 | PASS |
| 非法regex／倒序range保留前次結果 | PASS |
| checkbox／filter前後visible／material引用／position／intensity快照 | 完全一致 |
| 空結果訊息／清篩選還原展開 | PASS |
| 篩選下手動收合跨粒子結構更新 | PASS |
| 九種camera含fisheye與first person | GL error=0，主角隱藏時label隱藏 |
| 夜間及水景保持渲染 | GL error=0 |
| 動態粒子加入／clear | 690→692→690 |
| child GLB替換／舊ID清出active | PASS |
| context-loss hide路徑 | label皆hidden；本次未重做原生GPU故障注入 |
| dispose兩次 | panel／layer／active／node／label清空 |

真localhost:4173入口：RIGGED GLB、690節點、Enter套用、Space總開關及Space個別checkbox；regex `rigged-character$`兩個label，range594取交集剩一個；`[`與30-10有錯誤且保留有效設定，Clear恢復690，console warn/error空。這些為真瀏覽器操作，與harness分開記錄。

## 效能短樣本
Chromium本機，690物件、800×500 harness。各120次inspector.sync（每15次）＋update CPU牆鐘區間，非GPU時間／全頁FPS／跨裝置承諾：master off median低於計時解析度、P95 0.7ms；on median2ms、P95 4.5ms、283可見labels。全部節點完整保留，無結果截斷；結構每250ms才同步，DOM keyed重用。

## Coverage / Boundary
12/12條件：1.1–1.2 Index與真graph／swap；1.3 DOM／鍵盤／focus／展開；2.1–2.2 master／checkbox／snapshot；2.3 projectAnchor tests與九camera；3.1–3.4 parser／交集／祖先／錯誤；4.1 dispose／粒子／GLB；4.2節流／樣本／完整tests與production回歸。
Index只依Three type、DOM模組只依Three／Index／既有投影；ViewerApp集中loop與dispose、main只mount，無新增相機權威或場景資源所有權。未修改水霧／夜景既有程式，完整tests保留整合。

## 限制與rollback
ID只保證本頁物件存續期，重載不固定；世界原點標籤可能重疊且不做深度遮擋。裸JS regex區分大小寫、長度160、範圍512；長度限制不保證任意惡意regex執行時間。本機可信診斷用途，不增加任意regex運算服務。
真手機LAN、跨GPU／瀏覽器、摺疊、輔助技術讀屏仍待；本次未宣稱完成M6／SCENE-05。rollback僅撤本次diff，保留原dirty後tests/build/release，不reset或刪Release陌生／舊hash。

## Token
token 用量：無法取得精確值。原規劃chat與本chat起點無可用官方token基準，未有可拆分本階段input／output／total的工具；不把context百分比、字數或估算當實際用量，不修改設定／資料庫。

## Release／索引
2026-10-31 18:52:46+08:00 `./scripts/project.ps1 release` exit0：112/112 tests，tsc／Vite PASS（62 modules），Added3／Updated1／Skipped13；既有>500kB chunk advisory保留。初次build的sandbox spawn EPERM經宿主核准相同腳本重跑，未更改安全設定或安裝工具。18:53:03逐檔核對17個dist檔案與Release SHA256，mismatches0；未mirror或刪除陌生／舊hashed資產。
沿用localhost:4174 preview，實際RIGGED GLB、690物件、篩選兩角色及世界label498／594，console warn/error空；未停止任何原preview／改防火牆。截圖`.local/inspector-validation/release-panel.jpg`；僅localhost，不當作手機LAN驗收。

## Validation Report（inline）
- DECISION: GO（本機已核准功能範圍）
- MECHANICAL_RESULTS: tests112/112、tsc／Vite exit0、markers／secrets CLEAN、production22/22、Release smoke PASS。
- INTEGRATION: Index／DOM／host契約一致、single loop、資源回收及Boundary audit CLEAN。
- COVERAGE: 12/12；人工環境限制如上。
- DESIGN: 檔案與依賴方向符合設計，無新runtime prerequisites或架構漂移。
- OWNERSHIP: LOCAL；UPSTREAM_SPEC: N/A；BLOCKED_TASKS: none。

## Verification Result
- STATUS: VERIFIED
- CLAIM_TYPE: FEATURE_GO
- CLAIM: 物件樹與編號標籤完成本機實作、驗證及正式增量發佈。
- EVIDENCE: canonical112 tests、build、production22checks、鍵盤／錯誤操作、Release hash／smoke、12條件覆蓋與inline邊界審閱。
- GAPS: 實機／跨GPU／讀屏不包含於本機成功宣稱；精確token值不可得。

索引：2026-10-31 18:54:40+08:00 codebase_status確認green、Incremental update completed（23.1秒）。codebase_update掃描118可索引檔，added3／updated6／removed0、73新chunks，總340chunks；graph97檔188edges，watcher disabled。遵守.gitignore／.socraticodeignore及工具可索引範圍，不含外部Release／忽略harness，不宣稱全部Markdown都有embedding。既有Qdrant可用，未需啟動／安裝／下載／重建；無索引錯誤。
收尾HEAD仍8e945afb3318373937060c8cb798e916b632deda，branch codex/v02-particle-system；未stage／commit／push，原水霧、夜間及.codex／.vscode修改保留。本機交付完成，等待使用者結束確認，不自動開始其他功能。
