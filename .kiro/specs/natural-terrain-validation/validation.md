# 1Y-12 審閱與驗證

## 授權與基準
來源 chat 已交接停止修改。本階段接續「OK please go on」的地表授權；保留 b2daa13 上所有相機／UI／Profiles dirty。無 commit／push／模型切換／委派。
Token 用量：無法取得精確值；來源及本 chat 均缺官方起始計量，不重複計入其他 chat 累計。

## 規格審閱
- requirements gate inline PASS：12 條數字 ID，EARS、場景／貼地／選點／陰影／品質／資源與錯誤均可驗證；實作細節放 design。依使用者授權自動核准。
- design gate inline PASS：12 條均有映射；所有元件有實際路徑、可選能力與舊 Profile 相容規則。修正草案：objectNormal 必須固定朝上，片段法線從置換面導出，避免內建置換沿斜面推移。依使用者授權自動核准。
- task graph sanity inline PASS：1→2→3→4，明列跨界整合、Profiles validator 隱含前提與 Shader runtime 驗證；無平行標記。依使用者授權自動核准，沒有獨立 reviewer。

## 實作證據
1. 依任務 1→2→3，先寫失敗測試再實作。任務1包含160個非格網點的三角面／射線比較、普通與魚眼選點、量化頂點及角色跑步貼地；任務2包含品質不改高度、非法設定原子拒絕、風動凍結、樹幹障礙、跳躍落地與資源 dispose 事件／冪等。任務3包含 terrain00 roundtrip 與舊 city 設定相容。
2. Inline 整合審閱發現 X-ray 自訂深度未複製 displacementMap，先以實際 TerrainScene 加入失敗回歸，再複製 map／scale／bias。grass 排除相機／X-ray 遮擋，主光照與 customDepth 共用風動時間及公式；地表材質 clone 保留置換。
3. `node --experimental-transform-types --test --test-isolation=none tests/character-xray.test.mjs tests/terrain.test.mjs tests/panel-profiles.test.mjs` 12/12 PASS，exit0。先前完整181/181 PASS、typecheck PASS；補正後完整測試以最終 release 為準。
4. sandbox build 在 Vite externalize-deps 發生 spawn EPERM，未 sync；不得算已發佈。

## 新增邊界（來源 chat steering）
`docs/scene-runtime-collision-mask-spec.md` v0.1 待使用者確認。本次沿用既有 WalkableWorld／XZ 障礙及 bounds；未實作其 World Query、三維膠囊、Range Policy、遮罩 debug 或固定步長契約，亦未修改該草案。

## 最終整合審閱
kiro-validate-impl／kiro-verify-completion 採 inline，無獨立 reviewer。1.1–1.3 對應地表選單／能力／既有switch與新增過期資源測試；2.1–2.3 對應量化三角面／代理射線／角色跑跳及邊界樹幹拒絕；3.1–3.3 對應平面up normals＋flatShading、shadow displacement、草木depth同公式、品質drawRange與風動時鐘；4.1–4.3 對應 dispose事件、Profiles新舊JSON與兩管線正式瀏覽器。12項均有覆蓋，無新增依賴、素材下載、TODO／FIXME或機密。git diff --check PASS，僅原有LF→CRLF提示。

地表基底 geometry 保持 y=0，GPU 讀取65×65 unsigned-byte RedFormat紋理，scale=2；CPU代理與groundHeight使用同一byte樣本和對角線。160個內點 raycast誤差 <1e-5m、普通／魚眼點選 <1mm，所有抽樣face normal.y >= .9。這是CPU三角面／紋理來源與GPU程式路徑的一致性驗證，沒有逐像素讀回GPU頂點位置作硬體誤差量測。坡度刻意溫和，沿用現有點選坡度政策。草為裝飾，排除相機／X-ray遮擋及環境材質覆寫；樹幹有既有XZ矩形代理，沒有宣稱完整樹冠或角色三維膠囊碰撞。

## 正式測試與發佈
- 最終 `./scripts/project.ps1 release` exit0，183/183 tests PASS、TypeScript與Vite build PASS，保留既有大chunk advisory。
- 初次成功同步為2026-11-10 08:17:55 +08，Added12／Updated2／Skipped17。
- 截圖發現標題對比不足後沿用底板修正，最終同步2026-11-10 08:21:41 +08，Added10／Updated1／Skipped20。目的地 `D:/Work_Mine/Testing/3D Character Walk Viewer/Release`，增量資產先、入口最後，沒有刪舊hashed資產或陌生檔案。
- preview-release在sandbox遇spawn EPERM；宿主執行確認4174已被既有服務使用，未停止該服務。HTTP入口與Release/index.html逐文字比對一致。

## Production browser
`.local/terrain-smoke.mjs` exit0，Chrome headless／SwiftShader，Needle與明示legacy均通過：地表切換、三個XYZ貼地位置、樹幹拒絕、Standard→Low／風動關閉、terrain00 Save及Restore、四種遮擋、魚眼／第一人稱、cave→city→terrain→city→terrain、日夜、reduced-motion與390×844尺寸。設定跨場景返回仍為Low／wind off，最後另外測開風動；同一canvas數量不增加、持續繪圖，兩路getError=0、Runtime／WebGL errors空。舊城市水景及洞穴仍由全套回歸與往返涵蓋，沒有重做所有歷史像素或人工操作驗收。

`.local/terrain-final-smoke.mjs`修正harness文字預期後exit0：兩路新增WebGL context loss／restore後繼續繪圖，再切X-ray／魚眼並檢查標題底色。最初harness錯把恢復狀態當初始ready文字，已觀察實際connection restored與draws增加後修正；不是產品恢復失敗。最終兩路errors空、getError=0、contextRestored=true，標題背景rgba(247,249,239,0.92)。截圖已目視Needle桌面／手機與魚眼；行動截圖含切換過渡畫面，未當轉場完成時點量測。

原始數據／截圖在忽略的 `.local/terrain-validation/`、`.local/terrain-final-validation/`，release logs亦在.local。此為本機軟體渲染與模擬尺寸，不是手機LAN、真實GPU／跨瀏覽器或正式效能驗收；既有SCENE-04、ACCEPT-01與讀屏待驗維持原狀。

## 索引與交付
SocratiCode增量已掃描172個可索引檔，新增4／更新13／移除0、129新chunks，code graph142 files／353 edges。遵守.gitignore與.socraticodeignore，排除.local、public/assets、blender、機密及外部Release；不重建或刪除索引。收尾文件落盤後再次增量及status確認，以本chat最終工具時間為準。

STATUS: VERIFIED（本次程式與本機Release）；DECISION: GO；OWNERSHIP: LOCAL。操作感受與地表交付等待使用者結束確認；不啟動飛行／水域／太空，不把新碰撞規範視為已核准。branch codex/v02-particle-system，HEAD b2daa13，原dirty保留，未stage／commit／push。

Token用量：無法取得精確值。統計範圍為來源交接後本chat地表規格／實作／驗證／收尾；無官方起終基準，未以帳號百分比、context用量或估算替代。
