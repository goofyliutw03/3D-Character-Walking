# Review record

## Requirements — inline PASS
依既有使用者自動續作授權審閱及核准，非逐份人工核准。數字ID 1.1–3.3、EARS、失敗／生命週期／草稿／資產來源邊界已檢查。合理預設：原創八棟混合街景、Y上限地表+10m、手動walk速度與Run分開。無外部必要輸入。

## Source checklist
| 項目 | 來源 | 分類／動作 | 標籤 | 依賴 |
|---|---|---|---|---|
| Blender街區／貼地／XYZ速度 | docs/initial-design-plan.md:79,81–84；roadmap:78 | a，本spec | LATER-02 | CityScene／ViewerApp／main，必須依序不可平行 |
| 既有巡迴 | path-navigation/spec.json、tasks.md | implementation-complete，3/3，不重做 | LATER-01 | 控制權回歸 |
| 交通模擬 | city-traffic-simulation/spec.json、tasks.md | implementation-complete，5/5，後續只核對缺口 | LATER-03 | 共用檔順序 |
| WebGPU | roadmap:75 | c，後續新chat評估 | RENDER-01 | renderer |
| 舊人工驗收 | docs/remaining-acceptance.md | b，維持最新裁定 | SCENE-04／ACCEPT-01 | 不概括通過 |

Git基準2825627，codex/v02-particle-system；保留交接dirty，無stage／commit。活動chat盤點僅本chat active。Blender --version實測5.2.2 LTS成功。token用量：無法取得精確值，未提供官方session起點及input/output工具。

## Design — inline PASS
完整11項需求ID映射、四個boundary、具體檔案、晚到釋放與速度權威已檢查。首輪修正：導航明確傳入4避免walkSpeed汙染巡迴；建築八個roots保持透明遮擋粒度。依使用者授權自動審閱核准。

## Task1.1 — inline APPROVED
RED：3tests失敗（relocate不存在／walkSpeed undefined），GREEN：3/3及全套131/131 PASS。實讀controller diff，無placeholder／機密或反向依賴。高處落地／radius／越界／原子拒絕／Run與override測試通過。

## Task2.1 — inline APPROVED
RED：實際GLB ENOENT；GREEN：4/4tests。既有Blender離線生成.blend121796bytes及GLB244916bytes，八棟bounds／meter／Y-up、無外部URI、SHA256均PASS。第二次生成hash一致5e023ef5fef827b6309e9e4f04bc0885d0b10f008fc9cfe020640261bc585bc2。關閉file_preview_type後無縮圖寫入錯誤；Blender內建brush相對路徑warning及6.0 use_nodes deprecation保留，不影響自含GLB，未更動使用者設定。實讀腳本與成品，無外部輸入。

## Task3.1 — inline APPROVED
RED：CityBuildings module不存在2tests fail；GREEN：6/6及全134/134tests，tsc PASS。實讀新增loader及CityScene／ViewerApp diff，八棟root驗證、失敗重試、單pending、晚到釋放通過。導航override修正為原有intent.run?4:1.8（低速tour倍率仍成立），未受手動walk設定影響。相機／外觀仍走既有environment。

## Task4.1 — inline APPROVED
RED：CharacterEditor module不存在、草稿保留測試fail；GREEN：7/7、全135/135tests與tsc PASS。實讀ViewerApp／main／UI diff及新檔，草稿不被每幀覆蓋；position經controller驗證成功才stop及採納motion，隱藏／contextLost／dispose拒絕。既有InputManager focusin stop及按鍵隔離完整沿用。無placeholder／機密，無第二animation loop。正式UI留task5.1實測。


## Task5.1 / validate-impl — inline GO
11項需求覆蓋：1.1–1.3由真GLB／manifest／授權與browser fallback+Retry；2.1由草稿保留test及browser讀數；2.2–2.4由controller與真街道UI；2.5由API guard及原生context loss UI；3.1–3.3由速度／Run／tour隔離與編輯鍵盤UI。實讀整合diff與新增模組；依賴UI→App→controller／assets，無Boundary Violations。無新增placeholder、機密或安裝依賴。無委派／commit／push。

- 全套135/135tests、tsc、Vite72modules PASS。首次sandbox build spawn EPERM（未sync），require_escalated宿主審批重跑成功。
- Release 2026-11-02T00:01:48.7157174+08:00：Added5 Updated1 Skipped14、exit0。index-BXgJqy7E.js／ViewerApp-Cf1bJHYr.js；500kB advisory維持。
- 正式Release本機UI 2026-11-02 00:05:36–40+08：28/28 PASS，JS errors[]、CDP runtime exceptions[]。刻意404建築→保留場景→Retry真GLB；XYZ／草稿／樹障礙／界限／空值／Y上下限／自然落地、.5與3m/s、Shift4、tour .5與walk4隔離、Apply／focus取消tour、三鏡頭及四遮擋模式、原生context loss拒絕提交／恢復不續tour。
- 測試工具修正：0.075m.toFixed(2)顯示0.07，改以顯示精度容差；原生loseContext後等待150ms再restore（原立即restore未恢復，harness未完成；不是產品PASS）。上述最終完整重跑PASS。
- desktop.png目視PASS：八棟建築、道路／水景、主角及editor皆可見。390×844無橫向溢出，新增mobile-editor.png檢查編輯按鈕可見；是模擬viewport，非實機／讀屏／效能驗收。
- 原創混合街景與既有解析貼地，非歷史第三方城市原檔或任意網格地形。Blender最終重建無縮圖／brush路徑錯誤；只留use_nodes於6.0移除deprecation，不影響5.2.2。GLB hash保持一致。
- harness／report／screenshots位於忽略.local/city-editor-validation；Browser.close已關閉本次headless，原4174preview保留。測試server收尾依工具結果。

## Token
本階段token用量：無法取得精確值。從本chat開始未提供官方input/output/total基準或可拆分用量工具；不估算、不填0。精確reset時間未知。1Q-4／1V-0前段同樣缺官方起點，不重複計入累計。

最終Release 2026-11-02T00:07:48.6456650+08:00 exit0：135/135tests、tsc／Vite PASS，Added0 Updated0 Skipped20；20個dist檔與Release逐檔SHA256零差異。mobile-editor.png目視PASS，Apply位於viewport內（x156 y406），無橫向溢出。4189server已Ctrl-C停止（exit1為停止），本次headless Browser.close，原4174不動。Git diff --check PASS，HEAD未變。

## Index — completed
2026-11-02約00:08+08：codebase_update同步完成 Added4 Updated9 Removed0，139 indexable files，新90chunks；後續codebase_status green435chunks、Last operation Incremental update completed、graph112files231edges、watcher off，無錯誤。遵守既有ignore／dot:false，.kiro不在實際索引範圍，不宣稱spec全文已索引。此補記位於既有排除scope，不影響已完成索引的source狀態。
