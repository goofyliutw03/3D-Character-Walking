# 1Y-10 驗證與交付

2026-11-09；分支codex/v02-particle-system，HEAD b2daa13。依來源chat完整提案與「OK please go on」授權，requirements→design→tasks→逐項實作→inline審閱→驗證。無獨立reviewer／委派，無commit／push。保留既有docs/development-reference.md與未追蹤docs/3d-knowledge-architecture.md。

## 實作與需求覆蓋
|需求|實作／證據|
|---|---|
|1.1–1.3|ViewerSettings權威runtime、各場景快取、草稿與layout；browser驗洞穴32光源／頭燈跨場景及reload、混合runtime、粒子Apply分離、XYZ草稿不瞬移、暫態排除。|
|2.1–2.4|ProfileHistory／UI工具列；unit十筆淘汰與99循環、乾淨profile不覆寫temp；browser儲存、temp優先reload、Reset與layout還原。|
|3.1–3.4|ProfileStorage OPFS／IDB；真實非安全HTTP origin使用IDB，reload與transaction abort可見錯誤；損壞JSON不自動覆寫，明確Reset復原。|
|控制12.1–12.5|相對mousemove、pending／late／dispose／Esc／hidden／blur／mode清理，四倍率及界限unit；既有觸控／Ctrl/F1/Y/F5/wheel回歸。native headless回覆denied且如實顯示。|

## 審閱
Task1.1、1.2、2.1、2.2、3.1及控制11.1／11.2逐項inline APPROVED。核對實際diff、型別／入口驗證、引用型別、資源清理、序列化寫入／場景操作與不恢復暫態。無新增依賴或外部資產。採非exclusive autosave，避免打斷編輯焦點；profile切換／Reset才暫時阻止面板操作。新增placeholder／機密檢查無發現。

曾發現並修正：洞穴光源ID驗證上限、立即Save的temp同步、動態物件樹誤判dirty、pending lock卸載後晚到、手動接管未釋放鎖定。Release第一次在tests停止，原因為預設上限改算造成2.22e-16差異；保留原式後全套通過，未弱化既有斷言。最初Vite遭sandbox spawn EPERM，經宿主審批正常建置，未改工具設定。

## Fresh 證據
- 最終 `./scripts/project.ps1 release`：175 tests／175pass／0fail，TypeScript與Vite build exit0；既有大chunk advisory仍在。
- 2026-11-09 08:30:55 +08：指定Release增量同步Added8／Updated1／Skipped21。前次08:28:36為Added9／Updated1／Skipped20；最後只更新保存提示文字與文件。未mirror、未刪除陌生／舊hashed產物。
- `preview-release`偵測4174占用而停止；保留既有服務，以HTTP200及入口與dist完全一致確認後沿用。未停止4173或改防火牆。
- 正式Release Chrome headless／SwiftShader 22項檢查全過，zero captured Runtime exception／console error。資料：忽略的 `.local/profiles-validation/results.json`、panel.png；harness `.local/profiles-release-smoke.mjs`。
- 非安全HTTP `http://profiles.test:4180` 僅透過Chrome host resolver映射本機127.0.0.1，靜態server僅綁loopback。isSecureContext=false，真實IndexedDB fallback／temp reload／拒寫顯示3項pass，無Runtime例外；`.local/profiles-fallback-validation/results.json`。此為桌面browser工程測試，非手機LAN實機驗收。
- 預設Needle Release boot確認 `Needle Engine · WebGL2 ready`；最初焦點harness未展開Expression分類，不能聚焦隱藏speech，不視為產品失敗；展開後重驗結果見收尾補記。
- `git diff --check` exit0，既有CRLF提示保留。

## 限制與rollback
原生Pointer Lock在headless回覆denied；成功／相對位移／清理路徑以合成生命週期測試驗證，真人PC鎖定與手感仍待確認。不宣稱手機、跨GPU、讀屏、效能、M6或其他既有人工驗收完成。第一人稱倍率用於既有滾輪進入的inspection，未擴張直接第一人稱模式原有控制政策。
不同origin／port／瀏覽器分開保存，清網站資料會遺失；跨分頁同時寫入最後完成者勝出，不提供合併或外部備份。物件path依階層，數字篩選依當次頁面ID。自動保存120ms debounce，剛輸入便關閉分頁不保證尚未完成的寫入；明確Save完成訊息才代表持久化成功。
Rollback僅移除本輪settings／profiles、鎖定及相關接線／規格／測試變更，保留進場兩份文件；已發佈產物無自動整版備份，不承諾整版自動rollback。

## Token用量
**token 用量：無法取得精確值**。來源規劃區間與本chat缺少可取得官方input／output／total起訖基準；未將累計context、帳號百分比或估算當實際用量，未修改設定或資料庫。本記錄涵蓋來源提案交接至本輪交付，沒有計入任何捏造數值。

## 收尾補記
最終預設Needle正式Release追加4checks全過：boot、autosave焦點保留、Save及temp reload；zero captured exceptions，證據`.local/profiles-final-validation/results.json`及needle-release.png。kiro-validate-impl工程整合結果GO：requirements覆蓋、設計邊界、跨task設定流與fresh tests/build/runtime boot均通過；真人Pointer Lock及既有實機驗收仍明確排除，未假造成功。
