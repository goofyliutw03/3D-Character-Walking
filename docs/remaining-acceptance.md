# 剩餘驗收盤點（1Q-1，2026-10-31）

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
