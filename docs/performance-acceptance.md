# ACCEPT-01 本機效能驗收（1Q-4）

狀態：本機工程樣本完成，正式驗收 PARTIAL；正式門檻尚未核准。範圍為既有 M6／ACCEPT-01，NORMAL，建議均衡能力／中推理，未切換模型、未委派、未開展新功能。交付可重現方法、逐項工程樣本與限制；不以單機樣本關閉跨裝置驗收。

## 測試基準與方法

- 分支 `codex/v02-particle-system`，HEAD `2825627f80622563e80ed08b64f9f60f85ba168a`，開始時 checkout 乾淨。已包含交通與 Solar；不是 NavMesh 加入前的基準，不回退產品。
- 固定現有 Release，Solar validation 記錄最終發佈時間 2026-11-01 22:08:26+08:00。入口 `index-BK_nZCEP.js`、`ViewerApp-DKTmU_id.js`、`WetLensEffect-s7gznFPv.js`；17 個現行 dist 檔案與 Release SHA256 全相同。量測前未重新發佈。
- 忽略的 `.local/accept-01/` 包含 harness、逐幀原始 `report.json`、`baseline-hashes.json`、`environment.json`。既有 Chrome headless、專用 profile、localhost:4187，只讀 Release 產物；不安裝工具、不變更全域／安全／防火牆設定，不停止原 preview。
- production ViewerApp chunk 共用 main 入口：等待其 bootstrap，透過既有 pagehide 清理，再確認其 canvas 已移除；測量每輪只建立一個 ViewerApp，輪末 dispose。沒有同時 iframe／第二測試場景。harness 僅使用公開 API、公開 callbacks、標準 DOM／WebGL，不加入產品 debug exports。
- 畫布 1280×720，DPR 1，實測 document.hidden=false、reduced-motion=false。每輪等待 Caster／Target 真 GLB ready，暖機 10 秒，再測 30 秒，每項 3 輪。每輪重建場景，排除載入／首次 shader 編譯；並非載入效能測試。
- 交通 enabled=false，Solar enabled=false，保留水景 standard 預設與全域陰影；路燈自動偵測 off。一般樣本為白天，夜間樣本保持相同 Street 鏡頭，只變路燈投影候選 0／[2]／[1–6]。
- Walk／Run：Street 固定鏡頭，每 2 秒交替 W／S 的合成鍵盤事件，Run toggle 分開，保留真動畫／移動更新；不是人工鍵盤驗收。Fisheye＋X-ray：公開相機／遮擋 API，角色靜止。
- 粒子：Street，預設粒子設定（含 lightEnabled=true、最多8個粒子光槽），每 200ms 發射一次，不與魚眼／夜間陰影混測。
- 水霧：First person，以 Run＋W 接近池岸 10 秒後 stop，再暖機；dry／wet 只變鏡頭效果開關，水景／飛濺持續。使用公開控制而非傳送相機；實際濕潤啟用證據與限制隨結果記錄。
- FPS = RAF interval 數／實際累計時間；median／P95 為每輪 RAF timestamp 差的 nearest-rank 百分位。這是排程／CPU wall-clock 幀間隔，不是 GPU timestamp 或 GPU elapsed。draws／triangles 為既有每秒 metrics callback 的全 pass 計數，記錄範圍，非每幀統計。
- 無經核准的正式 FPS 門檻。不事後依結果設定 PASS 門檻；約75Hz刷新率／RAF上限會遮蔽剩餘效能餘裕。headless／無完整控制面板的工程 fixture 不等於真實前景瀏覽器／手機操作測量。
- 量測期間不執行 RAG embedding；開始時 watcher disabled、Ollama `/api/ps` 空，既有服務保留。其他使用者程序未停止，無法保證整台主機完全無背景負載。

## 環境與資產

2026-11-01 23:14+08:00 唯讀取得：Windows 10 build19045；Chrome 安裝檔 ProductVersion 156.0.8078.80（headless UA 為156.0.0.0）；WebGL2 實際 renderer `ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB (0x00001C03) Direct3D11 vs_5_0 ps_5_0, D3D11)`；nvidia-smi 驅動582.78；EXT_color_buffer_float=true。這不涵蓋原生 half-float 不可用環境。

17 個現行產物合計 3,571,468 bytes（未壓縮磁碟大小）；man.glb 886,940、woman.glb 946,952、child.glb 888,628 bytes，三者合計2,722,520 bytes。runtime 預設載入 man Caster／Target，不代表三個角色皆同時載入；不把磁碟總量當網路傳輸量。

## 結果

2026-11-01 23:13:45–23:33:35（Asia/Taipei），9組×3輪，共27輪完成。各欄為三輪的範圍；draws／triangles為每秒取樣的最小至最大值。每輪median均13.3ms，未取得GPU elapsed。

| 場景 | FPS範圍 | P95 ms | draws | triangles | 最長幀 ms | >33.333ms幀數（三輪合計） |
|---|---:|---:|---:|---:|---:|---:|
| Walk | 74.97–74.97 | 13.4–13.5 | 621 | 49,144 | 17.3 | 0 |
| Run | 74.94–74.97 | 13.4–13.5 | 621 | 49,144 | 26.8 | 0 |
| Fisheye＋X-ray | 74.94–74.97 | 13.4–13.5 | 830 | 57,928 | 26.6 | 0 |
| 粒子（每秒5次發射） | 74.87–74.97 | 13.5 | 632–640 | 50,024–50,664 | 26.7 | 0 |
| 近岸水景／鏡頭水霧off | 74.97–74.97 | 13.4–13.5 | 267 | 25,676 | 16.6 | 0 |
| 近岸水景／鏡頭水霧on | 74.94–74.97 | 13.5 | 268 | 25,678 | 26.6 | 0 |
| Night／0路燈投影 | 74.97–74.97 | 13.4–13.5 | 621 | 49,144 | 14.8 | 0 |
| Night／1路燈投影（ID2） | 74.94–74.97 | 13.4–13.5 | 904 | 71,066 | 26.7 | 0 |
| Night／6路燈投影 | 74.70–74.84 | 13.5 | 1,945 | 104,310 | 40.1 | 1 |

六燈三輪FPS依序74.70395／74.73727／74.83673；只有第一輪有40.1ms長幀，其餘兩輪最大26.8ms。未定位長幀原因，不能歸因GPU或宣稱產品卡頓缺陷。0→6燈draws約3.13倍、triangles約2.12倍，FPS接近75Hz RAF上限；沒有足夠資料推算GPU餘裕或更多角色容量，也未測最大粒子／交通壓力。

所有27輪結尾 `gl.getError()=0`，全程捕捉的JS error／unhandledrejection／console.error清單為空。這不是GPU timer或完整視覺／所有shader診斷通過的替代。Walk／Run回呼全程分別保持walk／run；水景測量回呼為idle。粒子實際active範圍4–5，設定容量32；不能視為容量上限測試。所有traffic快照enabled=false。

水霧on比off固定增加1 draw／2 triangles；依WetLensEffect只有state.visible才render全螢幕quad的接線，這支持實際啟用鏡頭合成pass（inline程式與計數比對），非只切開關。未讀取私有相機／水霧狀態，未取得精確相機座標、霧濃度／水滴數或本輪截圖；接近位置由既有碰撞與輸入路徑決定，保留此重現精度限制。

重現：在原repo執行 `node .local/accept-01/server.mjs`，以既有Chrome headless、獨立profile、`--window-size=1280,720 --force-device-scale-factor=1`開啟localhost:4187。harness自動依表序列完成並POST至本機report.json；每次重跑覆寫該報告，應先保留既有證據。不可同時開其他驗收場景或embedding工作；原始intervals、每輪結果與錯誤保留在忽略目錄，不進索引／commit。harness綁定此Release hash，產品版本更新後須重新辨識入口，不能混用舊結果。

## 審閱、限制與收尾

必要外部缺口：正式目標裝置／FPS與frame-time門檻尚未核准、跨GPU／瀏覽器及手機效能未量測。既有手機完整操作／IME Done、摺疊專項取消與讀屏待辦維持。舊1R-4同時iframe的0／1／6燈58.3／67.0／46.7FPS不納入本次比較。

修改範圍僅驗收文件及忽略harness；不優化／重構產品、不commit／push。Rollback僅移除本次文件追加與忽略fixture，不reset使用者版本、不刪Release舊hashed資產。文件完成後依序 release（tests→build→sync），再增量索引與status確認；此收尾不改寫量測前的基準證據。

token 用量：無法取得精確值；交接前段及本chat沒有可用的官方階段起點／input-output-total差額，工具只提供額度或context亦不能替代；未估算、未修改設定／資料庫。

Inline審閱：已檢查27輪完整性、固定尺寸／DPR、真GLB ready等待、每輪唯一canvas／dispose、公開API與統計回呼、交通off、RAF算法、原始intervals及全pass計數定義；未將75Hz受限樣本判作GPU餘裕或正式跨裝置PASS。Ollama開始／中段／結束查詢皆無載入模型，未執行索引直到測量完成。沒有必要產品修正；正式門檻／跨裝置輸入仍是外部缺口。

收尾release：首次sandbox 123 tests與tsc通過、Vite spawn EPERM未同步；宿主原流程重跑成功，123/123 tests、tsc／Vite68 modules PASS，2026-11-01 23:35:51+08 Added0／Updated0／Skipped17，既有500kB advisory保留。後續授權與checkpoint見docs/continuation-checkpoint.md；最終增量索引/status以工具確認為準，未完成前不標chat完成。
