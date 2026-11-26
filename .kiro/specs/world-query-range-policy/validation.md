# 1Y-13 審閱與驗證

## 授權與 Git 基線
使用者確認 scene-runtime-collision-mask-spec v0.1 並核准第一批共用查詢／城市相容適配。本 chat 初始查核 main47f5e68 有另一工作 dirty；等待交接後，M6 原 chat 已提交209f9ca且idle、工作目錄乾淨，依使用者接續授權切回 codex/v02-particle-system / e30c6f5。未重複提交 M6、未合併 main、未 stash、未建立 worktree，未委派／切換模型。此批程式尚未 commit／push。

本批複雜度 ARCHITECTURE，建議高能力／高推理；未改模型設定。修改範圍限 query/range、controller/navigation/city、測試與規格／授權連結。無新依賴、第三方資產或安裝。

## 規格與實作審閱
requirements → design → tasks依授權循序自動 inline 審閱；11/11條件映射，task graph sanity PASS（inline），非逐份人工核准，沒有獨立 reviewer。

Task1先建立測試，module不存在而ERR_MODULE_NOT_FOUND（不是assertion RED）；建立契約與適配後6/6及tsc通過。Task2三項測試實際 assertion RED：非法意圖污染NaN、城市無query、消費端未使用query；整合後PASS。收尾補正容差內離開障礙與沿邊切線，加入1500段固定seed連續高速sweep結果有效性檢查。

本批 query提供sweep、overlap、surfaceSample、regionSample、水平有限線段raycast；結果區分ok/no-hit與invalid-input/unavailable/unsupported。代理資料即時讀取，無障礙快照過期問題；缺失允許區及無效尺寸／表面拒絕。城市持有共享adapter，其餘既有世界經WeakMap相容resolver。

Controller先X後Z、原跳躍與時間上限不變，query失敗回退整幀狀態，包含velocityY/jumpHeld。relocate全部查詢通過才提交。Navigation以同query檢查頂點與線段；PathTour／auto-run／XYZ既有入口繼承。交通NavMesh、車流與相機遮擋類別未改。

## 機械驗證
- 基準183/183 PASS；新增10項query／整合測試後，最終 `./scripts/project.ps1 release` 完整193/193 PASS，無skip／fail；TypeScript及Vite109 modules PASS，exit0。
- sandbox build曾在Vite externalize-deps遇spawn EPERM，當時未sync；宿主既有build／release成功。pnpm只在程序環境停用verify_deps_before_run與update_notifier，以既有node_modules執行，不安裝、不改設定。
- 新測試涵蓋缺省拒絕、非法資料／尺寸、邊界接觸與切線、100m位移、不同半徑／高度、unsupported垂直raycast、缺失與throwing地面、mutable代理、四流程一致及顯式query權威。
- `.local/world-query-compare.mjs` 對原始HEAD控制器與新版逐步比較6000組固定seed輸入，dt包含.05／1/60／1/120、步跑跳混合：位置／速度／朝向差<1e-7，action／grounded完全相同，exit0。附帶Node計時與軟體渲染並行，不能作正式效能或前後速度比較。
- git diff --check PASS；本批產品／測試無新增TODO、FIXME、placeholder或硬編碼機密。依賴方向：類型→policy→adapter→controller/navigation→Viewer既有入口；無DOM/GPU進入查詢模組。File Structure Plan與實際變更一致。

## Release
最終2026-11-10T21:06:40.0332488+08:00，`./scripts/project.ps1 release` exit0，Added9／Updated1／Skipped21。目的地 D:/Work_Mine/Testing/3D Character Walk Viewer/Release，31個現行dist檔案SHA256全部相同。未刪舊hashed／陌生檔案、未複製source或node_modules。localhost4174既有preview HTTP200，未停止／重設該preview或防火牆。大chunk advisory為既有Needle依賴，未順便拆包。

## Production smoke
使用既有CDP測試腳本模式，隔離Chrome headless profile／SwiftShader，操作正式Release完整頁面；不新增產品debug API、不操作使用者分頁、不保存Profiles。腳本 `.local/world-query-smoke.mjs` 與結果／截圖 `.local/world-query-validation/` 均忽略。

首輪在返回城市時測試預期City ready，實際City street ready，等待逾時（errors空）；修正harness文字預期後重跑，不能把首輪逾時當產品成功或場景失敗。

最終 `node .local/world-query-smoke.mjs` exit0，needle PASS、legacy PASS。各測man／woman／child合法XYZ、外圈與池岸拒絕、非法巡迴拒絕與合法巡迴完成，自動跑步維持4m/s且座標有限；cave→city→terrain→city後XYZ貼地可用；X-ray／魚眼返回原鏡頭持續繪圖。最後Needle draw count20214、legacy19451，各自GLerror0／errors空且canvas數量未增加。測試專用Chrome由finally關閉，沒有停止既有preview。這是完整頁面production功能smoke，沒有量測正式FPS或比較兩runtime效能。

## Validation Report
- DECISION: GO（限第一批planar共用契約與城市相容交付）。
- MECHANICAL_RESULTS: 最終193/193、tsc／Vite、兩runtime smoke、31檔hash與diff check PASS；新增產品／測試無placeholder或機密。
- INTEGRATION: 四種控制流程共用query，無效狀態原子拒絕；保留時鐘／重力、交通與相機政策，query無DOM/GPU依賴。boundary audit PASS。
- COVERAGE: 1.1–1.3 query能力／資料、2.1–2.3尺寸／sweep／容差、3.1–3.3四流程／183既有回歸／原子拒絕、4.1–4.2永久測試與production／release證據，11/11條件對應。
- DESIGN: File Structure Plan符合，無新依賴或未授權場景擴張。capability明列限制；完整v0.1分批驗收不在本次GO之內。
- OWNERSHIP: LOCAL；UPSTREAM_SPEC: N/A；BLOCKED_TASKS: 本批無；後續三維場景另行確認。
- Verification Result: VERIFIED（FEATURE_GO功能範圍）；kiro-validate-impl／kiro-verify-completion inline，無獨立reviewer。

## 限制與後續
本批為planar-extrusion能力；角色用直立膠囊型別／尺寸，但城市碰撞使用保守XZ envelope沿Y無限延伸，非精確圓弧膠囊／3D三角面solver。單一矩形允許區減矩形代理，未交付多允許區union、洞頂／多層、三維體積遮罩、區域混合、固定時鐘、debug UI或飛行／水域／太空。raycast垂直位移明確unsupported；原GroundPicker的視覺幾何射線不改。height在城市只作合法尺寸驗證，不宣稱實作洞頂淨空。三維場景下一批須另行確認與重驗。

本機production／Node證據不是手機LAN、真實GPU／跨瀏覽器或正式FPS驗收；保留M6／SCENE-04/05及其他既有人工待辦。rollback只還原本批相關檔再依序release，不動main M6 commit。

## Token範圍
完整本階段缺來源與本chat起點，token用量：無法取得精確值。可核算子區間起點為本chat官方session JSONL中途total_token_usage：input1661848／output8463／total1670311（cached input1547264、reasoning1362已含上層）。僅計其後至收尾檢查點，不把此前或M6其他chat累計當本批用量；不改設定／資料庫。

終點2026-11-10T13:08:10.440Z（21:08:10 Asia/Taipei）input5038931／output31497／total5070428；子區間差額input3377083／output23034／total3400117。cached input／reasoning已含上層不重加；排除起點前與此終點後索引／文件／回覆，不是完整chat或完整本階段。

## 索引
2026-11-10 21:10（Asia/Taipei）SocratiCode增量codebase_update同步完成（66.1秒），掃描176可索引檔，Added57／Updated36／Removed1、427新chunks；codebase_status green、Incremental update completed、625chunks，graph146files369edges、watcher disabled。更新數量包含從main M6切回較新多場景分支的差異，不代表本批改了93個檔案。遵守.gitignore／.socraticodeignore與工具可索引類型，排除.local、public/assets及外部Release／機密；沒有重建／刪除collection、安裝或下載模型，既有服務已在運行。本次無錯誤。此段與task/spec metadata收尾後再次增量確認最終狀態。
