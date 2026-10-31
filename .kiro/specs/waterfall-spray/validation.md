# Waterfall spray 驗證（1N-1，2026-10-31）

範圍：使用者核准瀑布落水／飛濺粒子、相機接近薄霧／少量水滴與離開消退；COMPLEX，維持模型、依序實作與 inline 審閱。無新套件／外部素材、無委派／commit／push；不是第七里程碑，M6／SCENE-05／FOLD待驗維持。

## 自動與 production 證據
- canonical `./scripts/project.ps1 test`：102/102 PASS（既有95＋新增7）；負值／NaN、原子設定、世界變換、近遠／背面／實體牆、滴下落與4.05秒內過期、重複進出有界、pause／off／low／reduced、dispose及renderer例外還原均覆蓋。
- `./scripts/project.ps1 build`：tsc＋Vite PASS，雙HTML入口。sandbox spawn EPERM 經宿主核准同腳本重跑成功，未改設定繞過。既有共用Three chunk >500kB advisory仍保留。
- `git diff --check` PASS；新增模組／測試 markers／secret scan 無命中。按實際diff及新增檔案 inline 審閱；無角色／導航／Caster→Target修改。
- `localhost:4173/water.html` 真production啟動 WebGL2，噴濺鏡頭可見落水／彈起粒子與鏡頭滴，console warn/error空。
- 忽略的 `.local/waterfall-validation/` 在 localhost:4180 唯讀載入當次 dist hashed ViewerApp／相依bundle（不是source替身）。實際GLB主角及Target載入後停止宿主loop，透過同一production實例固定camera／delta做GPU檢查；不將harness直接設定camera誤稱為實體Orbit手感驗收。

## GPU 24/24 PASS
| 檢查 | 結果 |
|---|---|
| 主角維持初始z=5，實際相機近瀑布 | 有薄霧及水滴，與角色距離無關 |
| 水滴層與世界粒子分別開／關 | 直接readPixels均有可見差異 |
| 遠離／殘滴下落／停止生成／完全乾燥 | PASS |
| pause、water off、lens off | 凍結或立即清除 |
| reduced-motion | 有靜態薄霧，無滑動鏡頭滴 |
| zoom／transparent／wireframe／xray | GL error=0 |
| fisheye＋xray＋lens | 黑邊corner dry/wet RGBA同為[16,24,19,255] |
| First person | 實際眼位觸發，主角保持隱藏 |
| 420×700、DPR2、fisheye／xray | PASS |
| low容量 | 世界128、鏡頭<=10 |
| reset clock後跨100秒更新 | 水景不補時間；此為host重置路徑，非真實手機背景返回 |
| 瀑布背面、額外實體前牆 | 不沾濕；Node另驗透明外觀牆仍阻隔 |
| 10次建立／render／品質切換／dispose | geometry34／texture6／program16各輪穩定 |
| 原生WEBGL_lose_context loss／restore | clear、恢復draw及GL error=0 |
| shader編譯錯誤 | 0 |

第一次harness有兩個錯誤判準：誤認主角起點z=0（實為5），黑邊誤用RGB<20（原魚眼為[16,24,19]）。改為正確起點與dry/wet完全相同像素再重跑；沒有為迎合測試改產品。最終bundle在移除兩處每幀暫存配置後重建，再跑24/24。

## 效能樣本
環境：內建瀏覽器 Chromium156／Windows、ANGLE D3D11 NVIDIA GTX1060 6GB。固定960×600、DPR1、PCF2048、camera=(.7,1.3,-23.7)、target=(0,1,-25.45)，主角／Target站立；同一world水體保留，只隔離新增粒子及鏡頭層。每段1.5秒暖機＋10秒採樣，low／standard off→on各一次。RAF interval，非GPU timestamp；這是短樣本，不替代既有water prototype三輪正式benchmark。

| Quality | 新增效果 | 秒 | FPS | median ms | P95 ms | draw calls |
|---|---|---|---|---|---|---|
| low | off | 10.02 | 74.97 | 13.30 | 13.40 | 272 |
| low | on | 10.02 | 74.97 | 13.30 | 13.40 | 274 |
| standard | off | 10.02 | 74.97 | 13.30 | 13.40 | 272 |
| standard | on | 10.02 | 74.97 | 13.30 | 13.40 | 274 |

四段 geometry27／texture5／program9一致；原始JSON `.local/waterfall-validation/report.json`（依ignore不索引／提交）。顯示器約75Hz上限使細微差異不可分辨，不宣稱零成本。新增效果近距離多2 draw calls，乾燥鏡頭層不draw，不新增texture／render target。

最終真街道production入口可載入Rigged man／Target，展開Scene display後操作Camera mist & droplets off及quality low，checkbox與狀態文字正確、console warn/error空。原型近景截圖保存於`.local/waterfall-validation/prototype-near.jpg`。

## Coverage / Integration Review
14/14條件已映射：1.1–1.3 WaterfallSpray／WaterFeature；2.1/2.4 SprayExposure／source／configuration；2.2/2.3 WetLensState；3.1–3.4 hosts／UI／final render；4.1–4.3 tests／GPU／samples／release／index。
依賴方向符合design，world source從水景取得，ViewerApp只在rendered pose完成後更新鏡頭層，SceneRenderer兩分支最後合成；原型共用相同模組。現有material-only API保持v1 additive，沒有新相機權威／loop或特效框架。

## 限制與rollback
鏡頭滴為解析邊緣／高光，霧為透明薄層，沒有場景折射／模糊。waterfall薄片既有限制保留。實體手機LAN、跨GPU、真實手機背景返回／輔助技術、摺疊機未驗，不倒填M6／SCENE-05。資源計數穩定不等於瀏覽器總記憶體完全無變化。必要rollback只撤本次範圍並重新tests／build／release，不reset共用checkout、不刪既有dirty或Release陌生／舊hashed檔案。

## Token
token 用量：無法取得精確值。新chat開始未取得官方token_count起點，宿主未提供可拆分本階段input／output／total的精確工具；未修改設定／資料庫取統計，未將context、估算或舊v02區間混入。

## 收尾紀錄
2026-10-31 07:26:59+08:00 `./scripts/project.ps1 release` exit0：102/102 tests、tsc／Vite PASS，Added5／Updated2／Skipped10。17個當次dist檔案與Release SHA256逐檔相同，mismatches0；未刪除舊hashed／陌生檔案。沿用既有localhost:4174 Release preview，不停止服務／改防火牆。Release water.html實際WebGL2啟動、噴濺近景選項可用、console warn/error空；僅localhost非手機LAN驗收。

## Validation Report（kiro-validate-impl，inline）
- DECISION: GO（本機功能交付範圍）
- MECHANICAL_RESULTS: tests102/102、build exit0、markers／secrets CLEAN、兩production入口及Release smoke PASS。
- INTEGRATION: source／state／shader／host契約一致、rendered camera及最終合成順序正確，無Boundary Violations。
- COVERAGE: 14/14，無功能缺口；實機／跨GPU限制如上，未假造人工驗收。
- DESIGN: 元件及檔案對齊、依賴向上層單向，無架構漂移。
- OWNERSHIP: LOCAL；UPSTREAM_SPEC: N/A；BLOCKED_TASKS: none。

## Verification Result（kiro-verify-completion）
- STATUS: VERIFIED
- CLAIM_TYPE: FEATURE_GO
- CLAIM: 本次核准瀑布粒子／鏡頭濕潤完成本機production驗證並發佈。
- EVIDENCE: canonical102 tests／tsc／build、24GPU checks、兩入口及Release boot、14條件覆蓋、跨task／design審閱與無blocked。
- GAPS: 真實手機與跨GPU不在本機成功宣稱內；token精確值不可得。

索引：2026-10-31 07:28:32+08:00 `codebase_status`確認green、Incremental update completed；先前同步`codebase_update`掃描110可索引檔，新增6／更新14／移除0、新chunks86，總310chunks、graph90檔175edges，耗時29.4秒。遵守.gitignore／.socraticodeignore及工具可索引範圍，不包含外部Release／忽略harness／資產，不宣稱所有spec Markdown均有embedding。watcher disabled；無索引錯誤，未安裝工具／下載模型／重建索引。

最終Git仍在codex/v02-particle-system、HEAD8e945af；本次原始碼／tests／spec／文件未提交，原有未追蹤.codex／.vscode保留。Release近景截圖`.local/waterfall-validation/release-near.jpg`。本機功能交付完成，待使用者視覺確認；未自動啟動其他功能。
