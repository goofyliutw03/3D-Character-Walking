# 剩餘驗收盤點（1Q-1，2026-10-31）

## 最新使用者裁定（2026-10-31）
本節優先於下方歷史盤點及各舊validation中的待驗文字；僅更新狀態，不回填未執行的工具測試或裝置細節。

| 項目 | 狀態／標籤 | 依據與後續 |
|---|---|---|
| 手機完整操作驗收 | Done／SCENE-05操作 | 使用者明確回報「手機完整操作驗收 = Done」，以使用者驗收完成記錄；不額外要求機型或版本資訊 |
| 跨GPU／瀏覽器相容性 | PARTIAL／SCENE-04 | RTX2050 4GB／Chrome156.0.8078.74舊版操作USER_REPORTED_PASS；新路燈陰影、其餘矩陣及原生half-float fallback仍待驗 |
| 雙摺／三摺螢幕專項 | 取消／SCENE-05-FOLD | 使用者決定由Browser負責相容問題，取消專項驗收範圍；不是測試通過證據，亦不關閉跨GPU／瀏覽器相容性待辦 |
| IME輸入法 | Done／M5、M6人工驗收 | 基本組字操作已有使用者通過回報；補充的blur、160字邊界與inspector組字三組操作亦回覆「三項皆正常」。依使用者人工驗收結案，非工具直接實測；詳見1Q-2最終裁定 |
| 效能門檻與實測 | ToDo／ACCEPT-01 | 本次未變更，維持原待辦 |
| 螢幕閱讀器 | ToDo／M5、M6人工驗收 | 與IME分列；本次未變更，維持原待辦 |

此次為SIMPLE文件狀態更新，沿用模型／推理；未擴充功能，未commit／push。token用量：無法取得精確值，缺少本次更新的官方起點基準。

## SCENE-04 相容性驗收（1Q-3，2026-10-31）

### 最新跨GPU使用者回報（2026-10-31，優先於下方歷史等待資訊）
使用者回報「其他電腦操作OK」，環境為GeForce RTX2050、4GB VRAM，Chrome156.0.8078.74（Official Build，64-bit）。記錄為舊版一般操作的USER_REPORTED_PASS，補上不同於本機GTX1060的實際GPU操作證據；不是工具直接觀察。未回報OS／driver、實際WebGL renderer、extension或逐項COMPAT-01–04結果，不補造資料。

此次回報不涵蓋1R-2新路燈陰影，亦不能推定原生不支援half-float環境已走UnsignedByte fallback；SCENE-04整體維持PARTIAL，未全數勾選矩陣。新陰影的本機GTX1060 production檢查見night-object-lighting/validation.md，與這次外機舊版回報分開。效能／讀屏待辦及摺疊專項取消維持。此為順序交接後文件補登，不再索取已提供的GPU／browser資訊。



狀態：PARTIAL／MANUAL_VERIFY_REQUIRED，跨 GPU／瀏覽器整體仍 ToDo。接續既有驗收，非第七里程碑；未重開 IME、手機操作或已取消的摺疊屏專項。分支 codex/v02-particle-system、HEAD a1dc0d9，保留既有六份文件修改；無產品修改、委派、commit／push。

### 本次環境與觀察

| 範圍 | 本次取得證據 | 判定／限制 |
|---|---|---|
| OS 顯示卡清單 | Win32_VideoController 唯讀查詢：NVIDIA GeForce GTX 1060 6GB、驅動32.0.15.8278、Status OK；只回傳此卡 | sandbox 首次 Access denied，經宿主 escalation 後查詢成功。這是 OS 清單，不證明每個瀏覽器實際選用此卡 |
| Chrome 安裝版本 | chrome.exe ProductVersion 156.0.8078.74 | 檔案版本，不冒稱由瀏覽器 About 頁讀取 |
| Chrome Release 啟動 | 原生 AX 讀到 http://127.0.0.1:4174/、WebGL2 ready、Rigged man Ready、443 draws／46.3k triangles | 僅既有分頁啟動狀態觀察；不是完整視覺、動畫、console 或跨 GPU PASS |
| Edge 安裝版本 | msedge.exe ProductVersion 156.0.4314.50；已啟動並取得視窗 | 網址欄可 set_value，但 Return 後 document 仍是原頁；Release 尚未實際載入，不能記 PASS |
| 自動化可用性 | 此 chat 瀏覽器 inventory 空，取得 iab 回報 Browser is not available；Chrome Ctrl+T 未見新分頁，New Tab click 回報 coordinate input geometry is unavailable | 原生輸入不可靠，停止依賴該操作；未變更瀏覽器安全／GPU／OS設定，未安裝工具 |
| Release HTTP | localhost:4174 HTTP200 | 不等於 WebGL shader／硬體相容或手機 LAN 通過 |

本次未取得當前頁面的 unmasked renderer、EXT_color_buffer_float、framebuffer completeness 或 gl.getError；既有 water／xray／wet lens 的 ANGLE D3D11 GTX1060 證據仍屬歷史測試，不倒填本次結果。Firefox 常見預設路徑未找到執行檔，且 app inventory 未列出；不據此斷言所有位置皆未安裝。

### 待補驗收矩陣

| 編號 | 環境／操作 | 完成證據 |
|---|---|---|
| COMPAT-01 | 本機 Chrome 與 Edge 分別載入 Release 根入口及 water.html | 記錄實際 browser／OS／renderer／driver；兩入口就緒，無 shader error／黑屏；三角色切換與動畫正常 |
| COMPAT-02 | 各可用環境：普通鏡頭→魚眼→X-ray→魚眼＋X-ray；水景 low／standard、霧滴開關與近遠退場；夜間光源；resize 後切回 | 畫面與遮擋輪廓對齊、魚眼黑邊無濕潤污染、無殘留／shader錯誤；記錄設定與可重現結果，不含效能門檻 |
| COMPAT-03 | 另一種實際 GPU／驅動環境重複01–02 | 明確記錄 GPU 與瀏覽器；同 GPU 的 Chrome／Edge 不算跨 GPU。既有手機操作 Done 不推定本組特效相容通過 |
| COMPAT-04 | 真實 EXT_color_buffer_float 不可用的環境，驗證魚眼／X-ray UnsignedByte render target fallback | 記錄原生 extension 結果與 framebuffer／畫面結果；forced false 或合成注入只能算路徑測試，不能關閉此實機缺口 |

Inline 審閱確認 SceneRenderer 依 EXT_color_buffer_float 選擇 FisheyePass／CharacterXrayPass 的 HalfFloatType 或 UnsignedByteType；這是程式接線證據，不是原生 fallback 通過。現無可確認產品契約 bug，故不新增 runtime 或鏡像測試。效能 ACCEPT-01 與 screen reader 保留；不調整 GPU、安全或防火牆設定以取得測試結果。

使用者回覆「有其他 GPU 電腦，稍後提供」；外部環境未提供前保留03–04，不重複催促。Rollback 僅移除此節與本次 roadmap 追加，保留既有修改。Token 用量：無法取得精確值，本 chat 起點未取得官方 input／output／total 用量基準；不以估算或舊 chat 累計替代。

1Q-3 收尾驗證：2026-10-31 22:24:12+08:00 `./scripts/project.ps1 release` exit0，112/112 tests、tsc與Vite build PASS，Added0／Updated0／Skipped17；既有500kB advisory保留。git diff --check PASS。僅文件更新，這些檢查不替代上述相容性實機驗收。

## IME 驗收進度（1Q-2，2026-10-31）

狀態：MANUAL_VERIFY_REQUIRED／ToDo。沿用既有 M5／M6，不新增里程碑。HEAD a1dc0d9；保留原有四份文件修改，無產品變更、委派、commit 或 push。

- 既有測試 `node --experimental-transform-types --test --test-isolation=none tests/speech-editor.test.mjs tests/input.test.mjs tests/expressions.test.mjs`：8/8 PASS。涵蓋合成 composition 草稿不提交／不截短／不播報、compositionend 正規化、blur 提交、普通中英混合 input、160 Unicode code points、focusin 清除移動／Run／Jump，以及 composing Space 不觸發 Jump。
- Inline 接線審閱：SpeechEditor 以 composing 狀態及 input.isComposing 暫緩更新；main 的 focus 停止角色，Clear 清空後重新聚焦；InputManager 忽略表單與 composing 按鍵。Inspector regex／range 的 Enter 只在 isComposing=false 時套用。以上是程式與事件測試證據，不等於原生候選字流程通過。
- Windows computer-use 技能已讀取並初始化；Chrome 視窗先回報 minimized，依工具建議恢復後，安全檢查因無法可靠辨識目前 browser URL 而停止該回合。未取得真實組字證據，未以貼上、fill 或合成事件替代；未變更 OS 語言、安裝工具或語言包。這是 Computer Use 網址辨識限制，非 sandbox 自動核准拒絕。

真實 IME 待驗清單（可在既有 Release 預覽 http://127.0.0.1:4174 操作）：

| 編號 | 操作 | 完成條件 |
|---|---|---|
| IME-01 | 啟動走／跑後聚焦 Speech，以既有中文 IME 組字 | 角色停止；未確定草稿不更新泡泡或播報 |
| IME-02 | 用 Enter／Space 選候選字，方向鍵選字，再確定 | 保留 IME 行為；不移動、不跳躍；確定文字與字數同步 |
| IME-03 | 組字中 Escape 取消、點其他控制觸發 blur，再返回編輯 | 取消草稿不殘留；確定內容無遺失、重複或編輯鎖死 |
| IME-04 | 中英、emoji、換行混輸，於第159／160個 code point 附近組字超過上限 | 草稿不中途截斷；確定後最多160 code points，無破損字元 |
| IME-05 | 組字中及確定後按 Clear speech | 清空且泡泡隱藏、情緒保留；後續組字正常，舊草稿不意外恢復 |
| IME-06 | Inspector regex 欄位中文選字並按候選 Enter，再以普通 Enter 套用 | 候選 Enter 不提早套用；普通 Enter 套用；角色不受按鍵驅動 |

上述六項尚未實測，不勾完成。未發現足以確認的契約 bug，因此未修改產品或增加鏡像測試；取消／blur／Clear 的原生事件順序仍須實測。Rollback 僅移除本次文件追加，不回退既有 dirty。跨 GPU、效能與讀屏本階段不展開。

Token 用量：無法取得精確值；本階段缺少官方用量起點，未使用估算或 chat 累計代替。

## 1Q-2 使用者人工驗收追加（2026-10-31）

使用者在被請求於 Chrome Speech 操作中文組字、Enter／Space 選字、Escape 取消、Clear 清除，並確認角色不移動／跳躍後，回覆「OK No problem, please go on」。據此將這組基本操作記為使用者人工回報通過，非工具直接觀察或自動測試。未取得輸入法名稱／版本，不補造環境資料。

- IME-02 基本候選字 Enter／Space 與角色按鍵隔離：使用者回報 PASS；方向鍵選字未單獨確認。
- IME-03 的 Escape 取消、IME-05 的 Clear 基本操作：使用者回報 PASS；組字中 blur／Clear 的特定時序仍未單獨確認。
- IME-01 組字草稿不更新／不播報與先走跑再聚焦、IME-04 的159／160邊界／emoji／換行、IME-06 inspector及上述未確認細節：仍 ToDo，不從一般「正常」回報概括通過。
- 工具後續以無截圖模式讀到正確 Release URL／WebGL2 ready，但畫面擷取逾時、click geometry unavailable，焦點資訊與使用者操作不符，因此未送出組字按鍵。未更動安全設定；不把不可靠工具焦點判為產品缺陷。

整體狀態仍 MANUAL_VERIFY_REQUIRED，基本操作已有使用者證據；無產品修正、無commit／push，不跨入其他驗收。歷史「尚未實測」僅代表當時時點，以本追加所列範圍為準。Token用量：無法取得精確值，缺少官方起點基準。

## 1Q-2 最終裁定（2026-10-31）

使用者對下列明確提供的三組操作回覆「三項皆正常」：

1. 中文組字中離開文字框再返回：無文字遺失、重複或無法繼續輸入。
2. 接近160字再以中文組字超過上限：草稿不中途截斷，確定後最多160字且無破損字元。
3. Inspector regex欄位中文選字：候選Enter不提早套用，完成組字後普通Enter可套用，角色不移動／跳躍。

結合前次基本中文組字、Enter／Space、Escape與Clear回報，本階段IME使用者人工驗收記為Done／USER_REPORTED_PASS，取代上述歷史ToDo／MANUAL_VERIFY_REQUIRED狀態。證據來源為使用者操作回報，不宣稱工具觀察到原生組字、所有輸入法／OS／瀏覽器全面相容，亦未額外實測逐項草稿播報、emoji／換行及每種組字中Clear時序。未回報缺陷，無產品修改；跨GPU／瀏覽器、效能與讀屏維持待辦，摺疊屏專項維持取消。

Inline審閱：最新表格及M5／M6 validation、roadmap與本裁定一致，歷史證據保留，不擴張功能或人工測試宣稱。未commit／push，保留既有dirty。Token用量：無法取得精確值，缺少本階段官方起點基準。

## 歷史盤點（以下狀態以最新裁定為準）

範圍：既有六里程碑驗證；NORMAL，維持模型，無委派／新增功能／commit／push。所有12個現有spec.json均為implementation-complete，approvals皆true；tasks.md未找到未勾項。這是檔案狀態盤點，非另行執行kiro-spec-status技能或使用者重新核准。

| 項目 | 來源（盤點時行號） | 分類／標籤 | 結果與下一步 | 共用檔案 |
|---|---|---|---|---|
| pan | docs/stage-1.2.md:21；camera-obstruction-modes/validation.md:25 | b／SCENE-02 | 舊真正OrbitControls測試已有pan證據；此次真ViewerApp合成右鍵drag確認target改變 | ViewerApp／相機；必須依序進行，不可平行 |
| context loss／恢復 | docs/stage-1.2.md:21；mobile-touch-navigation/validation.md:42 | b／SCENE-03 | 最新整合版故障注入12項PASS，見下文；跨GPU保留 | ViewerApp／SceneRenderer；同上 |
| 初始化失敗 | character-expressions-ui/validation.md:78；initialization-loading-progress/validation.md:25 | b／SCENE-04 | 舊engine503／Reload已有證據；本次新增WebGL context不可建立的真main catch驗證 | main／SceneRenderer；同上 |
| 真實相容性／效能 | rigged-character-assets/validation.md:107；camera-modes/validation.md:119 | b,c／SCENE-04、05、ACCEPT-01 | iOS與Galaxy S25+操作OK；OS/browser版號、跨GPU、效能門檻及half-float fallback真機仍未驗 | 實機環境；不重複催問略過資訊 |
| 雙摺／三摺 | camera-modes/validation.md 1Q-1追加段 | b,c／SCENE-05-FOLD | 已依使用者要求列TODO；不阻擋本階段 | 實機；外屏／展開／resize／scale／手勢／背景返回 |
| IME／讀屏 | character-expressions-ui/validation.md:108；rigged-character-assets/validation.md:107 | b／M5、M6人工驗收 | 事件／ARIA測試不等同真實輔助技術，保留 | 實體IME／screen reader |
| 延後功能 | roadmap LATER-01～03、RENDER-01 | c | 不啟動巡迴、NPC AI、WebGPU等；未新增第七里程碑 | 另需具體授權 |

## 本機可重現證據
Chrome網址辨識先前失敗；使用者開啟5173後，重新啟用原最小化視窗，成功讀到http://127.0.0.1:5173/、WebGL2 ready與Rigged man Ready。後續原生鍵盤未開新分頁、點擊回報geometry unavailable；改用現已可用的內建瀏覽器隔離分頁，未更動Chrome安全設定、使用者分頁或既有伺服器。以下屬內建瀏覽器／dev來源，不冒稱Chrome或Release測試。

忽略頁 `.local/acceptance-validation/index.html` 使用真ViewerApp、GLB、renderer與loop，12/12 PASS：ready、WEBGL_lose_context可用、導航running、loss回報、導航取消、loss期間座標凍結、restore回報、實際context恢復、不自動續跑、drawCalls恢復、gl.NO_ERROR、右鍵pan改變target。先進入fisheye與xray，呼叫原生extension的loseContext／restoreContext，非只dispatch假的context事件。console warn/error空。pan是合成PointerEvent，capture僅在pan段以harness替身，不冒稱實體滑鼠手感或真觸控。

忽略頁 `.local/acceptance-validation/failure.html` 僅在該頁將canvas WebGL getContext回傳null，再import真main；看到WebGL2提示、Scene unavailable、errorVisible=true、Reload page enabled。讀到錯誤後還原prototype。此為初始化故障注入，不代表真實不支援瀏覽器／GPU已驗；預期console初始化錯誤不當正常頁失敗。未改產品程式。

Inline審閱：本次只追加證據／TODO及本文件，保留歷史原文，未概括關閉SCENE-05或倒填人工驗收。Rollback只移除本次文件追加及忽略harness，不reset既有dirty。剩餘工作是上述人工環境驗收；新功能仍待使用者指定。

Token用量：無法取得精確值；本階段無官方token_count起點，未將交接chat累計、context或估算當實際用量。

## 收尾驗證
2026-10-31 06:59:03+08:00 `./scripts/project.ps1 release` exit0：95/95 tests、tsc、Vite build PASS；Release Added0／Updated0／Skipped17。僅文件更新，建置產物SHA256相同未重寫；既有500kB advisory保留。沒有停止既有preview或改防火牆。

## 1Q-2 收尾檢查（2026-10-31）
首次release：112/112 tests及tsc通過，Vite於sandbox遭spawn EPERM，未同步。經宿主核准後循序重跑成功：112/112 tests、tsc與Vite build PASS，20:38:06+08:00 Release Added0／Updated0／Skipped17；既有500kB advisory保留。git diff --check PASS。僅驗收文件變更，無runtime改動。

2026-10-31 20:49:07+08:00 人工回報追加後release exit0：112/112 tests、tsc／Vite build PASS；Added0／Updated0／Skipped17，既有500kB advisory保留。文件inline審閱與diff check通過，未概括關閉IME。

2026-10-31 20:56:11+08:00 IME最終裁定後release exit0：112/112 tests、tsc及Vite build PASS；Added0／Updated0／Skipped17。diff check PASS；既有500kB advisory保留。
