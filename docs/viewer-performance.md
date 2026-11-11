# Viewer 效能與相容性驗證

2026-11-10，PERF-01／[viewer-performance](../.kiro/specs/viewer-performance/)。Chrome為主、Edge為輔；iPhone Safari必要支援，Android Chrome／Edge／Firefox列入規劃。此為M6相關有限追加，不新增第七里程碑；既有SCENE-04/05/FOLD未驗項不自動完成。

## 支援下限與能力

目前產品要求WebGL2，可建立context才開始場景，失敗沿用既有錯誤提示；沒有WebGL1／WebGPU fallback。`powerPreference: high-performance`只是偏好，實際renderer及硬體加速需另核對，不能指定「GPU 1」或合併兩GPU。renderer資訊受限時記錄unknown，不規避隱私限制。

[WebKit Safari 15開始提供WebGL2](https://webkit.org/blog/11989/new-webkit-features-in-safari-15/)，但不能據此宣稱Safari15可執行整個應用。[Vite文件](https://vite.dev/guide/build.html)所述預設目標會依版本變動；本repo實際安裝Vite8.3.4（node_modules/vite/dist/node/chunks/node.js的ESBUILD_BASELINE_WIDELY_AVAILABLE_TARGET）為Chrome111、Edge111、Firefox114、Safari16.4、iOS16.4。這是目前候選建置下限，非實測支援保證，亦不是Android OS或機型下限；本次不改target／polyfill／依賴。

| 平台／瀏覽器 | 候選建置下限 | 真機驗收狀態／條件 |
| --- | --- | --- |
| Windows Chrome（主要） | Chrome111 | 本機隔離測試版號與renderer見本spec validation；使用中前景瀏覽器／Intel與NVIDIA各自仍需證據 |
| Windows Edge（輔助） | Edge111 | 同條件隔離測試與限制見validation；不能由Chrome結果推定通過 |
| iPhone Safari（必要） | iOS／Safari16.4 | 真機版本、機型與效能尚未取得，保留待驗；需WebGL2、可用記憶體及本頁流程全數通過 |
| Android Chrome | Chrome111 | Android OS／機型／browser版號未取得，保留待驗 |
| Android Edge | Edge111 | 同上；不推定與Chrome相同 |
| Android Firefox | Firefox114 | 同上；不以桌面Firefox或Chromium模擬替代 |

OS／機型支援下限必須由上述能力檢查與實機測試共同決定，現階段不虛構最低機型。真機驗收至少記錄一台可取得的代表機型／OS／瀏覽器版號，若使用者不提供則保留unknown及證據限制，不重複催問。

## 所有平台共用驗證矩陣

下列每項對上表六個平台／瀏覽器組合分別執行與記錄，不跨平台複製PASS。

| 項目 | 操作／證據 | 通過條件 |
| --- | --- | --- |
| WebGL能力／renderer | 記錄WebGL2建立、gl.VERSION／renderer（可讀時unmasked）、drawingBuffer、DPR、context attributes、瀏覽器硬體加速；Windows可核對GPU engine | 正常就緒、資訊如實；軟體renderer只算軟體測試，不算硬體GPU通過 |
| 一般街道 | 日間、overview、靜止角色；影子／水景預設 | 角色／場景可見，UI就緒、無非預期console／shader錯誤 |
| 夜間水景 | 夜間、瀑布入鏡；Standard及Low分開，靠近檢查噴霧／鏡頭水滴，再離開 | 光照／水景／水霧正常，無持續資源增加；記錄實際構圖 |
| 魚眼 | 160° fisheye，橫直向各一次；切回overview | 構圖／標籤／控制與resize正確，無黑屏 |
| Xray | 第4遮擋模式，角色被建物遮住後移出；另驗魚眼＋Xray | 只凸顯遮住的角色像素、水／粒子排除，退出正常 |
| 互動 | 桌面WASD／Run／Jump／Stop、Orbit／Follow；手機單指hold／drag、點地跑步、雙指pinch／pan、取消 | 操作狀態與UI一致、無誤觸Run或卡鍵，既有行為維持 |
| 旋轉／resize | portrait↔landscape、瀏覽器工具列伸縮、容器尺寸改變；記錄CSS及drawingBuffer | aspect／overlay／觸控座標正確，不裁切必要控制、無持續資源增加 |
| 背景返回 | 前景量測後切背景至少10秒再返回，與螢幕鎖定／恢復分開記錄 | 無跳時造成的角色瞬移／水景爆量、控制仍可用；回來重新暖機採樣 |
| context恢復 | 可用時WEBGL_lose_context注入loss／restore，真實OS GPU重設另記 | loss提示、停止導航／效果，恢復就緒／互動／resize，無殘影或錯誤 |

## 畫質與效能條件

- 不因桌面GPU型號推斷手機品質。產品仍採既有DPR cap2；先記錄裝置原生DPR與實際drawingBuffer。桌面A/B固定DPR1與相同1280×800視窗，畫布由相同UI布局決定；這是可重複基準，不是手機預設。
- 手機先測既有Standard，再明確切Low並分別記錄。街道的Low只調整水景成本，不會自動降低整個街道DPR；獨立water.html已有Low的DPR cap1.25。低品質30 FPS、桌面標準60 FPS沿用既有水景目標，僅作驗收目標，未測組合不承諾。若街道實際DPR2成本過高，記錄證據後再決定品質／DPR改動，不偷偷降畫質。
- 每場景暖機至少3秒，穩定後三輪各15秒（可用腳本預設30秒延長）；記錄FPS=間隔數／經過時間、nearest-rank median／P95及draw calls、triangles、geometries／textures。另記CPU RAF callback時間，包含模擬、render提交與DOM，不是GPU執行時間。
- Headless受排程與VSync影響；~60 FPS可能是呈現上限。比較時不關幀同步、不刻意把利用率燒到100%。背景測試後重新暖機；其他app／電源／溫度或GPU負載變動必須註明，不宣稱FPS差異必然來自修改。
- 只有三輪改善超過前後波動且其他場景無明顯退步，才能宣稱該條件下有FPS改善。否則僅報實際減少的呼叫／工作，不作增幅承諾。

## 隔離自動化量測

使用已存在的Playwright與Chrome／Edge，不安裝、不連到使用者profile。先依README啟動自己的localhost dev伺服器（範例5176，不停止其他preview），再於PowerShell設定：

```powershell
$env:PLAYWRIGHT_MODULE = '實際既有Playwright的index.mjs絕對路徑'
$env:VIEWER_URL = 'http://127.0.0.1:5176/'
$env:BROWSER_CHANNEL = 'chrome' # Edge使用msedge
$env:SAMPLE_SECONDS = '15'
node scripts/viewer-benchmark.mjs .local/viewer-before.json
```

同一伺服器／視窗／DPR／腳本／瀏覽器的修改前後各存一份，版本與renderer取自結果。腳本對真main頁操作一般街道、夜間水景（overview固定構圖）、魚眼、Xray，每場景三輪，並記錄操作說明DOM重建次數及reduced-motion的matchMedia次數／耗時；CPU計時精度受瀏覽器限制，零不等於零成本。overview的水景量測不能代替瀑布近景／濕鏡頭壓力驗收。

此腳本可對production頁量測，不依賴dev私有API；production smoke另驗。結果只存本機指定JSON，無雲端傳輸。桌面窄視窗、觸控emulation與headless不是iPhone Safari／Android真機證據。localhost驗證不是LAN或手機驗收。

相同環境變數下可執行`node scripts/viewer-smoke.mjs .local/viewer-smoke.json`，驗證query重用、即時reduced-motion、三角色、鏡頭／Follow／遮擋、移動停止、resize與原生context恢復。腳本須對修改後頁面執行；`RED_ONLY=1`只供修改前失敗證據，平常不要設定。資源數量不是GPU記憶體byte數，亦不是完整VRAM profiler。

## 交付與回復

比較與smoke完成後執行`./scripts/project.ps1 release`（tests→build→sync），再`preview-release`驗證localhost:4174；不停止既有preview，不改防火牆。外部Release寫入依sandbox核准，不mirror／刪陌生檔。發佈後再執行既有本機索引增量更新並查status，避免embedding干擾效能量測。任何失敗均在validation記錄，不把背景啟動當完成。

回復僅撤本次相關修改、重新tests／build／增量發佈，不碰`.codex/config.toml`既有使用者修改，不commit／push。
