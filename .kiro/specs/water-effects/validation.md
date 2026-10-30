# Water effects 原型驗證

## 範圍與狀態
WATER-01／[1P-0]，使用者核准的獨立水池／瀑布規格及原型。不是第七里程碑；M6／SCENE-05 不變，街道整合尚未授權。requirements → design → tasks → task-local inline 審閱／修正 → integration validation 依序執行，沒有委派、commit、push、安裝或第三方素材下載。

分支 `codex/v02-particle-system`、HEAD `cc52088`。保留所有既有未提交修改；本次 runtime 只新增 water 入口／模組，未修改 ViewerApp、main 或既有 style。development-plan／roadmap 只新增指向本 spec。

## 規格與 task-local review
- Requirements gate：inline PASS，3 區／12 criteria，numeric IDs／EARS／範圍及人工待驗一致。
- Design gate：inline PASS，12/12 映射、明確所有權／依賴／file plan；程序 GLSL 與既有 Three.js，無新套件。
- Task plan gate／sanity：inline PASS，4 項 sequential，先雙入口 setup、後水景、再 UI／測量及整合驗證；無隱藏前置。
- Task 1：雙入口 production build exit 0，dist 同時含 index.html／water.html；發佈順序改為 assets→其他 HTML→index。初次 build 因 sandbox 子程序 EPERM 失敗，宿主 escalation 後成功；未改系統設定。
- Task 2：先執行測試得到缺少 WaterFeature 的 RED，再實作；3 項設定／時間／品質替換／dispose 測試通過。新增 2 項統計／六段採樣／取消測試後 5/5 通過。
- Task 3：production boot 與控制、WebGL 資源循環可用，typecheck／82/82 全套測試／build exit 0。inline 發現效果 off 仍計算雜訊，修正成靜態 early return；固定比較鏡頭停止 Orbit 慣性並同步選單。取消前一段不完整比較，不納入最終數據。
- 最終 release 再跑 82/82 tests、TypeScript／Vite build exit 0；既有 >500kB advisory 保留，非失敗。
- 本次新增來源的 TODO／FIXME／TBD／HACK／XXX 與 hardcoded secret pattern scan 無命中。

## WebGL／視覺
使用實際 production 與 Release 頁面（不是 dev server）。預覽 localhost:4175 為本次 dist，Release localhost:4174 為先前已啟動程序；執行 preview-release 回報 port already in use，未停止或取代既有 preview，直接沿用並確認新 HTML／hashed JS 可載入。

觀察到青綠池面、柔和反光、多方向細波、落點環形波與白色泡沫；瀑布程序紋理向下流，邊緣變動。全景、落點近景、低側角未見泡沫裂縫／共面閃爍或錯誤透明遮擋。瀑布為雙面片狀效果，正側面會變薄；不是體積流體或即時反射。

10 次 create→render→切換 quality→render→dispose→render：每輪都回到 28 geometries／3 textures／2 programs；與無 WaterFeature baseline 相同，shaderErrors=0。最終 Release 再驗一次同樣 PASS，見 [resource-check.json](resource-check.json)。Three.js memory 不是 GPU byte 數，不將數量視為完整 GPU memory profiler。

Release 根入口重新載入成功：Rigged man Ready、Caster／Target 可見、WebGL2 ready；未重寫既有街道操作或宣稱全功能重驗。正常水景 console warn/error 空。

最終 UI 檢查：暫停前後 t=18.85s 保持不變；波浪／流速以鍵盤 End 改為 2.0／3.0，再 Home／ArrowRight 還原 1.0；quality 切換及遠景可用。開始額外比較後改變 viewport，顯示「已取消：視窗尺寸或 DPR 改變」，結果 completedAt 空，未算成正式比較。手動取消可用。390×844 窄版為上下排列，scrollWidth375≤innerWidth390，未出現橫向溢出；不是手機實機。

IAB 新開 about:blank 沒有觸發真正 document.hidden，因此未宣稱實際背景降頻／切頁事件已驗；visibilitychange→cancel 的 handler 依程式審閱、sampler 中止測試及實際 resize 取消作證，實際背景情境保留待驗。
截圖在忽略目錄 `.local/water-validation/release-overview.png`／`mobile-layout.png`；resize 取消報告在同目錄，正式結果另外保存不被 UI 後續檢查覆蓋。

## 正式效能
標準及低品質均已完成，原始逐段統計見 [benchmark-standard.json](benchmark-standard.json)、[benchmark-low.json](benchmark-low.json)。共 12 段有效 60 秒採樣，每段另有 5 秒暖機；取消的額外檢查不計入。

固定環境：Windows 10、Chrome 156、ANGLE／NVIDIA GeForce GTX 1060 6GB／Direct3D11；canvas 960×600、DPR 1、camera [6.7,5.3,7.4]、target [0,.65,0]、PCF 1024 shadows on、ACES exposure 1.3。每品質各 3 輪 off/on，逐段 5 秒暖機＋60 秒採樣，控制及 Orbit 鎖定。RAF 間隔含慢幀，FPS=frames/elapsed、median、nearest-rank P95；不是 GPU timestamp，也不是關閉 VSync 的 throughput。

標準品質各段皆 4,499 frames／約 60.010 秒；三輪 off/on 平均 FPS 均 74.970（四捨五入）、median 13.3ms、P95 13.4ms。off 為 57 calls／14,560 triangles；on 為 58／15,328。各段 min=max：30 geometries／3 textures／4 programs。達成本機固定條件下接近 60 FPS 的目標，但約 75 Hz 呈現上限會掩蓋較小 GPU 成本差異，不能據此說效果零成本，也不能推論主街道整合後 FPS。

| 品質／效果 | 三輪 FPS 範圍 | 各輪 median／P95 ms | calls | triangles | geometries／textures／programs |
|---|---:|---|---:|---:|---|
| 標準 off | 74.970338–74.970463 | 13.3／13.4 | 57 | 14,560 | 30／3／4 |
| 標準 on | 74.970463–74.970588 | 13.3／13.4 | 58 | 15,328 | 30／3／4 |
| 低 off | 74.970214–74.970588 | 13.3／13.4 | 57 | 2,272 | 30／3／4 |
| 低 on | 74.970463–74.970463 | 13.3／13.4 | 58 | 3,040 | 30／3／4 |

各段所有資源統計 min=max，shaderErrors=0；低品質為同一桌面 GPU，不能替代手機 30 FPS 驗收。

## Integration Validation Report
- DECISION: GO（本機獨立原型技術範圍；待使用者風格／效能確認，非跨平台或街道整合核准）。
- MECHANICAL_RESULTS: 82/82 tests PASS、TypeScript／production build exit0、TODO／secret pattern CLEAN、雙入口 smoke PASS。
- INTEGRATION: DOM→WaterPrototype→WaterFeature／WaterBenchmark 契約一致；單一 RAF，設定鎖定及取消後還原、quality buffer 釋放、pagehide 清理／shadow target dispose 已審閱；無共享街道狀態。
- COVERAGE: 3/3 sections、12/12 criteria 均映射到設計及任務，mechanical ID scan 無遺漏。1.1–1.4→shader／近遠側視圖；2.1–2.4→單測＋UI＋資源循環；3.1–3.2→兩品質完整 A/B＋取消測試／resize；3.3–3.4→限制紀錄＋Release 雙入口。
- DESIGN: 新增檔案符合 File Structure Plan，沒有 dependency direction 或 boundary violation；保留既有主 runtime 修改。Shader off early-return 為本次 inline 修正，已同步 design。
- OWNERSHIP: LOCAL；UPSTREAM_SPEC: N/A；BLOCKED_TASKS: none。
- VERIFICATION STATUS: VERIFIED（本機技術範圍）；task-local／integration review mode inline，未假稱獨立審查。手機、其他 GPU／瀏覽器及實際背景降頻標為未驗，不能外推。

## Release
2026-10-30T23:27:28.9580215+08:00，首次 release Added8／Updated1／Skipped8；17 檔 SHA256 與 dist mismatch0。
inline 修正後 2026-10-30T23:28:58.0874678+08:00 再次 release Added1／Updated1／Skipped15。目的地 `D:\Work_Mine\Testing\3D Character Walk Viewer\Release`；只必要建置檔，保留陌生檔案／舊 hash，不複製 source 或機密。
最終 runtime 的 17 檔 SHA256 再比對 mismatch0；兩入口已實際由 localhost:4174 載入。正式採樣直接來自 Release。

## 限制與 rollback
手機真機／LAN、其他 GPU、其他瀏覽器及 screen reader 未驗；桌面標準接近 60 FPS、手機低品質穩定 30 FPS 是目標，不作未測平台承諾。localhost 不代表手機 LAN 驗收。原型風格／效能仍待使用者確認，街道整合未授權。

Rollback 僅移除新增 water entry／src/water*／測試／Vite config，還原本次 release 排序與兩份計畫前置註記；保留先前 main／style／ViewerApp／README 及其他未提交內容。不執行 git reset，不刪除目的地舊產物。

## 索引
正式測量結束後才執行 codebase_update，避免 embedding 與測量爭用 GPU。2026-10-30 23:46（Asia/Taipei）完成：掃描 94 個可索引檔，新增9／更新1／移除0，33 個新 chunks；codebase_status 確認 green、Incremental update completed、總計264 chunks、graph76 files／137 edges。watcher disabled。無錯誤，沿用既有服務，未安裝／下載／重建／刪除索引。範圍為遵守 .gitignore／.socraticodeignore 的本專案可索引檔，不含外部 Release、忽略的 .local 截圖、public/assets 或所有 Markdown 的 embedding 保證。文件補入後再次 update／status 確認。

## Token 用量
完整階段 token 用量：無法取得精確值。原規劃 chat 缺少起點與精確統計；本 chat 起初可見工具僅提供帳號額度，後續找到本機官方 rollout 的 token_count。首個可確認檢查點為 2026-10-30T15:17:39.879Z（23:17:39，Asia/Taipei），input 24,823／output 179／total 25,002；cached input 13,184 已含 input。以此為可確認區間基準，收尾取最新檢查點差額；不含首點以前、原規劃 chat 及末點後回覆。未讀寫設定或資料庫、不估算、不填 0、不重複加總其他 chat。

末檢查點 2026-10-30T15:46:00.575Z（23:46:00），累計 input9,468,850／output40,051／total9,508,901。可確認區間差額：input **9,444,027**／output **39,872**／total **9,483,899**；cached input差額9,333,376已含 input、reasoning差額7,351已含 output，不另加總。這是本機官方逐次請求 token_count 累計差，包含重複與 cached input，不是單次 context 大小或帳號額度。僅此區間列入本次紀錄，不涵蓋前述缺漏及末點後的文件／索引／最終回覆。
