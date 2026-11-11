# Research Log

## Summary
2026-11-10；NORMAL，既有WebGL2棕地功能，輕量調查。採主context依序執行，無平行委派。使用kiro-spec-init／requirements／design／tasks與impl（指定任務、inline）、review／validate-impl／verify-completion；AGENTS的同範圍授權及不自動commit優先。

## 調查與來源
| 項目 | 來源（初始行號） | 分類／建議動作 | 標籤／依賴 |
| --- | --- | --- | --- |
| 本機效能與M6 | docs/development-plan.md:29、docs/remaining-acceptance.md:10 | a／本spec建立固定量測與局部優化 | PERF-01；ViewerApp、main必須依序進行，不可平行 |
| 跨GPU／手機 | .kiro/steering/roadmap.md:95、docs/remaining-acceptance.md:10 | b／維持實機待驗，不把模擬勾為完成 | SCENE-04/05、ACCEPT-01 |
| 摺疊手機 | .kiro/steering/roadmap.md:93 | c／既有延期待辦，不擴張本次裝置驗收 | SCENE-05-FOLD |
| 每幀相同操作說明候選 | src/main.ts:114、src/engine/ViewerApp.ts:176 | d／實測穩態0重建，已有去重，排除本次修改 | PERF-01；同共用檔依序 |
| WebGPU | .kiro/steering/roadmap.md:71 | c／維持延後 | RENDER-01 |

kiro-spec-status直接讀取15個spec.json及tasks：皆implementation-complete；此狀態不代表跨GPU或真機效能完成。本spec不重開既有功能實作。既有character-movement、camera-modes、rigged-character-assets、scene-object-inspector等為上游，對它們的互動／載入／context恢復執行回歸。

WebGLRenderer已有powerPreference high-performance、antialias true與DPR cap2。powerPreference是hint，不能保證NVIDIA，也不會將兩GPU合併。初讀曾懷疑characterReport重建相同innerHTML，但補讀main.ts:113起確認有key去重；實測四場景穩態guideChanges=0，修正原判斷，不新增CharacterStatus比較或移動型別。particleReport亦比較字串後才寫入。inspector每250ms sync，無證據前保持頻率。

## 官方與本機依據
- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer)：WebGL2及context選項；本機實際版本以pnpm-lock.yaml與安裝包為準，不升級。
- [CSSOM View MediaQueryList](https://drafts.csswg.org/cssom-view/#dom-mediaquerylist-matches)：matches回報目前媒體查詢結果，不需要每幀重建物件；本次以同一物件即時切換整合測試佐證。
- [WebKit Safari 15](https://webkit.org/blog/11989/new-webkit-features-in-safari-15/)：WebGL2支援起點，不能用來推定整個應用的JS／CSS下限。
- [Vite build](https://vite.dev/guide/build.html)、[Vite 8 build options](https://v8.vite.dev/config/build-options)：網路文件描述預設Baseline；本機Vite8.3.4的dist/node/chunks/node.js:720起實值為Chrome111／Edge111／Firefox114／Safari16.4／iOS16.4，與目前網路文件不同，採本機建置為準。其為候選建置下限，非已測支援承諾。
- 原生WebGL2、ResizeObserver、Pointer Events、matchMedia change及AbortController沿用既有能力，不加polyfill或新套件。Android OS／機型下限不能從瀏覽器版號推導，待真機確認。

## Design Decisions
採既有Playwright隔離測試（不安裝、不使用使用者profile），測真main UI並以RAF包裝記錄CPU callback耗時；不是GPU timestamp。DOM MutationObserver記錄interaction-guide重建次數。既有去重保持原樣；待query計數確認後只重用MediaQueryList，不做自動DPR降級、不改預設畫質、不改inspector頻率。畫質／GPU瓶頸若未確定，保留後續量測。瀏覽器隱私限制renderer資訊時明示未知，不規避。

## 風險與限制
自動化headless與前景Chrome不等價；RAF受VSync、背景排程與其他程式影響。網路sandbox需核准的localhost測試程序；既有CUA網址辨識失敗，不繞過安全檢查。GPU使用率不是目標；不停止其他app或RAG服務以美化成績。token無可用精確基準，不估算。
