# 初始化載入進度驗證
2026-10-26。使用者先授權commit既有成果，再繼續本需求；基準commit為29bc5b4。初次驗證時新增功能未stage／commit，未push、換模型或委派。本需求不是第七里程碑，不變更里程碑6結束／人工驗收狀態。

## 提交前複驗
使用者於同日明確核准提交本功能。重新逐檔檢查差異與HEAD，完整43/43 tests及production build再次通過（exit0），git diff --check通過；原有500kB advisory保留。本次只提交本功能程式、測試、spec與計畫對應，.codex／.vscode本機設定不納入，無push。

## Planning / Review
- Requirements：13條件EARS及範圍inline PASS，依本需求授權自動審閱，非逐份使用者人工核准。
- Design：真實byte量與未知總量、stage、latest-wins、fatal reload、初次／compact與單一live公告責任明確，inline PASS。
- Task plan：4項依序任務，13條件完整對應，inline sanity PASS，無獨立reviewer。

## Task evidence
1. RED：缺describeDownload export與loader stage，兩項失敗。GREEN：相關5 tests通過，真實progress到prepare／ready順序，100%仍loading；舊請求、settled、dispose及Retry邊界通過。inline APPROVED／VERIFIED。
2. RED：LoadingPanel module不存在而失敗。GREEN：7相關tests通過，原生progress value移除／設定、錯誤停止、Retry／完成隱藏／compact及live文字僅改寫一次通過。inline APPROVED／VERIFIED；視覺由任務4補足。
3. 全套43/43 PASS，build PASS。首次build因.ts匯入TS5097失敗，noEmit基線下啟用allowImportingTsExtensions後通過；未升級依賴。code review補上pagehide/HMR abort guard及引擎未就緒時disabled，避免非同步啟動遺漏控制操作。inline APPROVED／VERIFIED。
4. 最終全套43/43 PASS、無skip、exit0；project.ps1 build PASS、exit0；git diff --check PASS。初始entry18.45kB/gzip6.24、ViewerApp638.17kB/gzip161.23；既有500kB advisory仍在。inline APPROVED／VERIFIED。

## Production browser
正常預覽127.0.0.1:4173，另以忽略的.local臨時伺服器4174供應同一dist，僅綁localhost；未改dist／GLB，無production模擬開關。
- 實際引擎chunk延後送達：畫面已呈現立體文字、Working與Preparing the viewer，canvas尚不存在；控制disabled，成功後恢復。
- 實際GLB分段傳輸且有Content-Length：讀到Download 22%、progress value22、viewport busy=true；兩次matrix3d明顯不同，截圖顯示13層文字厚度／旋轉側面。
- 省略Content-Length：實際下載中value=null、Working，未假造比例。390×844畫面panel343px、scrollWidth375<=innerWidth390，無水平溢出。
- 角色準備完成：panel hidden=true、busy=false、RIGGED GLB；後續Woman切換compact=true、立體視覺display none、bottom76px。Child可完成，Jump操作回歸通過。
- 真實GLB 503：error、busy=false、progress hidden、animation none、Retry enabled；恢復檔案供應後Enter鍵Retry成功，panel隱藏。
- 真實engine chunk503：Scene unavailable、Reload page enabled、其他controls disabled；恢復引擎供應後Enter可reload並重新啟動。
- reduced-motion：工具無OS偏好模擬能力。臨時伺服器只在送出的CSS副本把同一prefers-reduced-motion條件改為all，以驗證規則內容；computed wordAnimation=none、靜態matrix3d仍有角度，progressAnimation=none。首次harness未匹配Vite輸出空白而仍旋轉，修正harness匹配後通過，未改正式CSS。此證據不等同實體OS偏好或讀屏驗收。
- 故意503的console錯誤為預期；最終乾淨production分頁另查warn/error。所有字型／依賴沿用，lockfile無變更。

## Coverage
| Requirements | Evidence |
|---|---|
| 1.1, 1.2 | 真實engine等待、loader階段、13層CSS及旋轉matrix |
| 1.3, 1.4 | byte有效性測試、實際已知22%及未知value移除 |
| 1.5 | prepare/ready事件順序測試、真正ready才隱藏 |
| 2.1, 2.2 | GLB/engine503、動畫停止、Enter Retry/Reload |
| 2.3 | 過時／settled／dispose回呼測試 |
| 2.4 | Woman compact、Child ready與原有rigged回歸 |
| 3.1 | CSS規則內容browser測試；OS偏好偵測另保留人工驗收 |
| 3.2 | 原生progress、單一live region、byte事件不反覆公告測試 |
| 3.3 | 390px無溢出與鍵盤Enter恢復 |
| 3.4 | 無新依賴／資產、lockfile無修改 |

## Validation Report / Verification Result
- DECISION: GO（本機實作／驗證範圍）
- STATUS: VERIFIED
- CLAIM_TYPE: FEATURE_GO
- MECHANICAL_RESULTS: Tests43/43 PASS、build PASS、diff check PASS、production boot PASS；無本功能TODO或secret。
- INTEGRATION: GLTFLoader→CharacterAssets版本隔離→main→panel／live status；單一renderer loop，沒有timer假進度。CSS動畫不持有JS資源。
- COVERAGE: 3/3 sections、13/13條件已對應；實體OS偏好、實際讀屏與跨GPU不在本機驗證宣稱內。
- DESIGN: 檔案與依賴符合，tsconfig相容修正已記入design。無鏡頭／運動／GLB變更。
- OWNERSHIP: LOCAL
- UPSTREAM_SPEC: N/A
- BLOCKED_TASKS: 無程式阻擋。
- GAPS: 同步scene／parse可能短暫阻塞旋轉；高速cache可能很快隱藏，未加人工延遲。實際讀屏、OS reduced-motion切換及跨GPU／實機仍需人工環境驗收；不宣稱完成。既有Front遮擋未動。
