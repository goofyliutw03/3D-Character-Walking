# 1Y-15 有界飛行審閱與驗證

## 基準／用量
HEAD8284cd1，分支codex/v02-particle-system；無commit／push／模型切換／委派。2026-11-10開始乾淨，2026-11-18恢復後保留另外的camera controls／terrain path／desktop release修改，不歸為本批成果。共享Viewer等逐段保留。

完整本階段token用量：無法取得精確值，缺最初即時起點，且跨日續作。可核算子區間起點為官方本機session JSONL 2026-11-10T13:58:45.472Z，input3773416／output26757／total3800173，cached3635072與reasoning1251已含上層；排除更早與前chat累計。終點待收尾記錄，不修改設定／資料庫。

## 規格 gates
Requirements／design／tasks依接續授權自動inline審閱PASS，12條件映射；非人工逐份核准。每項先RED再GREEN；無獨立reviewer。

## Review Verdict — 1.1
- VERDICT: APPROVED；TASK: 1.1；Verification: VERIFIED。
- RED: canonical no-isolation runner缺FlightWorldQuery模組exit1；初次未指定no-isolation遭sandbox spawn EPERM，不計為行為RED。
- GREEN: 連續高柱／飛越、禁入盒／飛越、上下界完整尺寸、警戒及NaN／非法region資料PASS。
- Boundary: WITHIN；capability只擴充motion union，不改ground值；query純CPU組合。

## Review Verdict — 2.1
- VERDICT: APPROVED；TASK: 2.1；Verification: VERIFIED。
- RED缺FlightController；GREEN query／controller4項，當時完整213/213、tsc exit0。
- 加減速／正規化／8與24m/s、三尺寸／低幀連續掃掠、Stop、固定步進丟棄、合法著陸／拒絕高空著陸／起飛、非法資料與尺寸原子拒絕。
- 補查：步進分組一致、18m/s加速結果、牆面滑動清向內速度、query unavailable整幀回復、陡坡／阻擋著陸拒絕、高空尺寸切換。MAX_VALUE時間先實際RED後增加3600秒非法時間防線，GREEN8/8。
- Boundary: WITHIN；未改CharacterController的城市／ground積分。

## Review Verdict — 3.1
- VERDICT: APPROVED；TASK: 3.1；Verification: VERIFIED（場景模組）。
- RED缺FlightScene；GREEN5/5包含同源有限盒、spawn／能力、天空與非實體雲、dispose一次。
- 初次tsc顯示重複id及下游Profiles尚無flight型別，重複id已修正，Profiles由4.1顯式整合。
- Boundary: WITHIN；原創程序幾何／Shader，不宣稱新動畫資產。

## Task 4.1 審閱紀錄
- RED：Profiles flight名字被拒、Input缺setFlightControls、SceneSwitch bind failure拋出而未回復。
- GREEN：新增flight v1相容、E/Q/Space與pointer cancel／blur、scene bind回復；整合完整218/218、tsc／Vite正式build exit0（Vite sandbox spawn EPERM後經宿主核准重跑，非產品錯誤）。
- 上游Context發現：第一次測試合成pointer無capture，改用CDP實際touch事件；未藉修改產品吞錯。兩runtime原先1282，必須補修共用恢復而非將測試忽略。追蹤及最終結果於下文續記。
- 保留其他camera／ground path修改，追加CSS僅升降button按既有grid排列、editor拒絕訊息與操作提示使用實際flight範圍。

## 必要限制
手機LAN／iOS／Android真機、跨GPU、正式FPS／長時間記憶體與熱降頻未驗；沿用M6／SCENE-04/05／ACCEPT-01，不概括關閉。碰撞為直立膠囊對有限盒，警戒包絡保守，非任意mesh／全姿態物理。水域／太空／六自由度／大氣散射仍後續。

## 來源盤點與依賴
| 項目 | 來源 | 分類／建議動作 | 標籤 | 依賴／共用檔案 |
|---|---|---|---|---|
| 空中飛行 | docs/scene-runtime-collision-mask-spec.md:99、127 | a／本批bounded-flight | 1Y-15 | WorldQuery／Viewer／main，必須依序不可平行 |
| 地表／洞穴前批 | docs/development-plan.md:3（補登前）及ground-volume-world-query/validation | 已完成基礎，僅相容回歸 | 1Y-14 | GroundWorldQuery／Controller |
| 真機／效能 | docs/remaining-acceptance.md、performance-acceptance.md | b／保留待驗，不假造完成 | SCENE-04/05、ACCEPT-01 | 實機及正式門檻 |
| 水域／太空 | scene-runtime-collision-mask-spec.md:100–103 | c／後批確認 | LATER | 共用query／Viewer，必須依序不可平行 |

## Context根因與修正證據
最小隔離正式legacy測試 `.local/context-debug.mjs` 先重現1282。擴充追蹤deleteBuffer／deleteVertexArray後定位真正首錯：恢復後第一次離開FlightScene，舊WebGLGeometries dispose listeners刪除舊context的GPU物件；早期bindTexture／deleteTexture只是讀到前個呼叫留下的pending error。修正不依賴吞getError，也不以texture標籤誤當完整根因。
共用ContextResources在lost時去重dispose目前根／保留城市的GPU registrations（geometry、material、texture、骨架texture及custom depth material），保留CPU資料與角色位置；shadow獨立depth與離屏pass同時釋放。restore只重設target／resize與驗證CPU位置。新增共享資源／CPU保留測試先缺export RED後GREEN2/2；depth獨立釋放測試亦有實際0≠2 RED紀錄。責任回記上游multi-scene-foundation。
最小重現最終只剩故意loseContext後的37442（CONTEXT_LOST_WEBGL）；restore／city／terrain／cave／flight無1282。兩runtime完整操作最終結果另記。

## 本機CPU工程樣本
200 warmup後2000次飛行query sweep：mean0.007818ms／p950.01750ms／max2.291ms，`.local/flight-query-benchmark.json`。3個有限solid＋1禁入盒與1允許區，無空間索引；不等同GPU／手機FPS或正式效能門檻。

## Review Verdict — 4.1
- VERDICT: APPROVED；TASK: 4.1；Verification: VERIFIED。
- 最終根因為舊context的geometry dispose listener，已由ContextResources修正且記回multi-scene-foundation；shadow／depth／離屏目標釋放共同完成恢復生命週期。必要upstream修正沒有塞入flight query。
- 完整224/224 tests PASS、0fail／0skip，tsc／Vite exit0。共享其他工作亦在同一suite驗證，不冒稱由本批實作。
- Boundary: WITHIN（design明列上游恢復integration amendment）。無新增套件、資產、工具安裝或全域固定步進。

## Final production browser
2026-11-18 `.local/flight-smoke.mjs` exit0、`.local/flight-smoke-final.log` needle PASS／legacy PASS；隔離Chrome headless、SwiftShader、localhost4173正式dist，不使用使用者分頁或產品debug API。
- 正常Environment入口與三個rigged角色在Y20升降、高空尺寸切換；明確地面著陸、5m平台著陸與高空拒絕、起飛。
- Boost朝高柱停止X6.72、禁入盒停止X-16.72；child頂界feet38.85（height1.15）、地板不穿透；非法XYZ拒絕、blur煞停。
- 透明／線框／X-ray／zoom、160°魚眼、粒子操作、flight00 Save／Restore回安全spawn、city/terrain/cave/flight多次往返。
- 原生WEBGL_lose_context注入，恢復位置不跳／速度0，之後四場景往返；追蹤draw／uniform／bind／deleteBuffer／deleteVertexArray／deleteTexture等，恢復後faults=[]、GL error0、Runtime errors=[]。
- 390×844模擬手機，以CDP Input.dispatchTouchEvent真實touchStart／touchEnd按升降，Needle最終Y13.50／legacy13.10，非人工點擊或手機LAN；canvas數量未增，draw counter25807／23367且末端持續增加。
- `.local/flight-validation` results.json及needle/legacy flight／fisheye／mobile截圖，已目視正常角色／操作配置。沒有以軟體渲染FPS當手機性能。

## Review Verdict — 5.1 / Final Validation Report
- VERDICT: APPROVED（inline）；TASK: 5.1；DECISION: GO（本批功能）。Verification Result: VERIFIED（FEATURE_GO）。
- MECHANICAL_RESULTS: 最終Release重跑224/224 tests、0fail／0skip，tsc／Vite exit0；git diff --check PASS，新模組無TODO／FIXME／HACK／硬編碼機密。
- Smoke boot: PASS；實際Release localhost4174 HTTP200，index與Release相同，`.local/flight-release-smoke.mjs`／log needle PASS、legacy PASS、GL error0／errors=[]。這是發佈後正式入口驗證，非只驗dist或宣稱已啟動服務即成功。
- INTEGRATION: 唯一motion owner、flight-only固定時鐘、明確ground交接、三尺寸與CPU Query一致；導航／巡迴／auto-run依能力拒絕；Profiles v1舊城市與flight roundtrip。Query無DOM/GPU向上依賴，正常UI接公開方法。相機／地表既有dirty保留並回歸。
- COVERAGE: 12/12；1.1四環境入口；1.2三角色／表情及既有回歸／粒子／camera composer；1.3天空Shader／非實體雲／同源幾何；2.1加減速／boost／Stop；2.2fixed-step／discard／blur／context；2.3桌面／真touch事件與能力限制；3.1高速／三尺寸／滑動；3.2禁入／3m警戒／硬界；3.3地板／5m平台／陡坡與阻擋拒絕；3.4NaN／極大時間／傳送／尺寸／query失敗；4.1 Profiles；4.2兩runtime／Release與限制。
- DESIGN: File Structure Plan相符；ContextResources／SceneRenderer補修明列上游責任與integration amendment。Boundary audit CLEAN。UPSTREAM_SPEC: multi-scene-foundation（恢復缺口已修復、下游重驗PASS）；無未解必要程式阻擋。
- 本批收尾為準備結束確認，不開始下一批水域／太空、不commit／push／委派／切模型。真機／正式性能仍MANUAL_VERIFY_REQUIRED，非本機功能GO的跨裝置承諾。

## Release
2026-11-18 08:32:28 Asia/Taipei，`./scripts/project.ps1 release`完整tests→build→sync exit0，Added11／Updated1／Skipped21。33/33 dist對既有Release SHA256一致，資產先／index最後，未刪陌生檔或舊hashed、未複製source／node_modules／機密。經宿主既有授權escalation，不繞過sandbox。Vite大chunk advisory保留。
preview-release啟動嘗試因4174已占用而exit1，遵規則未停止原服務；核對原服務HTTP200／index match後完成兩路Release操作。正式入口成功不宣稱手機LAN／真機通過。

Release重測末端draw counters Needle24987／legacy23872；觸控後feet Y13.37／14.03，兩路恢復errors=[]、glError0。前段25807／23367及Y13.50／13.10為4173首次最終dist測試，非混合當成同一輪。

## 索引
2026-11-18 08:35 Asia/Taipei，SocratiCode codebase_update同步完成53.2秒，186可索引檔、Added2／Updated9／Removed0、104新chunks；codebase_status green、Incremental update completed、690chunks，graph155files419edges，watcher disabled。與開始status688chunks相比只更新差異；共享checkout含其他工作的既有索引，不把工具全數變更歸為本批。遵.gitignore／.socraticodeignore與工具支援類型，排除.local、public/assets、外部Release及機密；沒有重建／刪collection、安裝或模型下載，既有服務可用，無錯誤。收尾metadata後再增量確認。

## Token統計
完整本階段「token 用量：無法取得精確值」，缺本chat最初即時基準；未使用估算或帳號額度。可核算子區間為2026-11-10T13:58:45.472Z至2026-11-18T00:35:54.443Z（Asia/Taipei08:35:54），官方同一session JSONL累計差額：input18,516,838／output34,126／total18,550,964。起input3,773,416／output26,757／total3,800,173；迄input22,290,254／output60,883／total22,351,137。cached input／reasoning已含上層，不重加。排除起點前、此終點後文件／索引／回覆及前chat用量，沒有更改設定／資料庫。

## 交付與後續
本批功能與必要本機驗證完成，等待使用者結束確認。下一批水域（swim／浮力／水面／池壁與乾濕交界）建議ARCHITECTURE、高能力／高推理，未切換；太空其後。新階段依政策另開chat、共用checkout依序交接。未獲新授權前不開始下一批，不commit／push。

收尾metadata後第二次增量：Added0／Updated0／Removed0、0新chunks，2.6秒；最終status green、Incremental update completed、690chunks／186檔掃描、155files419edges。此為最終可索引狀態；Markdown等工具未納入類型不宣稱已有embedding。無索引錯誤。
