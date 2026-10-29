# 手機控制與點地導航驗證

2026-10-29，範圍為使用者核准的 1J-0 七項計畫。實作及本機驗證完成，待結束確認；不是第七里程碑，也不結束里程碑6或替代人工驗收。requirements → design → tasks → implementation 依序執行，4項task完成；依使用者授權自動 inline 審閱通過，沒有獨立代理或逐份人工核准。

## 可重現驗證

- `node --experimental-transform-types --test --test-isolation=none tests/*.test.mjs`：2026-10-29 exit0，54 tests／54 pass／0 fail。
- `./scripts/project.ps1 build`：exit0，TypeScript及Vite通過，36 modules。ViewerApp產物645.13kB；既有超過500kB建議仍保留，非建置失敗。
- `git diff --check`：exit0；CRLF提示不影響結果。新導航／手勢／反投影未留臨時console.debug、flag或TODO。
- 正式產物以 `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort` 啟動。10/29重新觀察 Rigged man Ready、WebGL2 ready，點canvas後 Man Run／Running to destination，Stop後 Man Idle／預設提示。warn/error logs為空。
- 10/26 production互動已觀察普通及魚眼導航→抵達、目的地標記、Stop隱藏標記、Jump取消、魚眼圓外拒絕。這是先前同階段證據，非10/29全數重測。
- 10/26桌面IAB viewport：390×844、375×667、844×390、320×320均見場景與完整操作列；操作按鈕至少44 CSS px。10/29再次量測390寬按鈕至少45.3×44，並確認844×390橫向完整配置。截圖 `.local/mobile-navigation-final.jpg`（忽略、不入版控）。viewport override已重設。
- 舊IAB分頁停留服務離線錯誤頁，工具拒讀其data URL；重新開啟正常localhost URL後成功。沒有變更安全設定。舊LAN地址本日未重驗，不宣稱手機可連。

## 需求覆蓋

| 條件 | 證據與界線 |
|---|---|
| 1.1 | main唯一控制列移到scene-workspace下；production畫面確認 |
| 1.2 | 四種viewport、svh／safe-area CSS；真機安全區待驗 |
| 1.3 | DOM唯一控制與44px量測；InputManager既有鍵盤測試 |
| 2.1 | 實際canvas點選啟動Run；screen-ray／ground-picker tests |
| 2.2 | tap-gesture tests：拖回、長按、多指、離開、取消；保留Orbit事件，不攔截預設；真實多指待驗 |
| 2.3 | 實際CityScene測試路面／人行道／標線，拒絕樹、椅、草地、遮擋與邊界 |
| 2.4 | 160°等距screen-ray roundtrip及圓外拒絕；魚眼production互動 |
| 3.1 | 原CharacterController驅動，不直接寫transform；production Run |
| 3.2 | navigation tests以實際城市／矩形障礙驗證連續繞行及碰撞 |
| 3.3 | 真實移動抵達0.08m內測試；production Destination reached |
| 3.4 | 無路、無效點、1.5秒卡住停止測試 |
| 3.5 | 新目標取代舊路徑測試 |
| 4.1 | InputManager通知測試；production Stop／Jump；Run切換也取消 |
| 4.2 | blur／hidden／編輯通知測試；切角色與context loss接線審查；新導航context-loss實際故障注入未驗 |
| 4.3 | marker及狀態production觀察；既有鏡頭／表情／資產全套回歸 |
| 4.4 | TapGesture abort/dispose測試；ViewerApp事件、marker與既有資源釋放審查 |
| 5.1 | 54 tests、build、正式產物啟動通過 |
| 5.2 | 下列真機清單明確保留 |

## 審閱與限制

檢查導航僅產生movement intent、共用既有radius、靜態AABB visibility graph、首命中面拾取、魚眼反投影、手動優先、事件釋放與唯一控制DOM。沒有新增依賴／資產／NavMesh／巡迴／NPC。既有Front修正、角色資產及文件修改均保留，未commit／push。可局部回退本feature新增模組及接線；不得整檔回退含原有修改的共用檔。

SCENE-05真機待驗：iPhone Safari、Chrome、Edge均未取得本功能實機結果；需記錄裝置／iOS／瀏覽器版本，測直橫向、動態網址列、瀏海與底部安全區、真實tap／drag／pinch、背景返回、軟鍵盤、切角色與圖形恢復後不續跑。桌面IAB與合成事件不代表這些驗收通過。先前10/26 context recovery證據屬既有功能，不能當成本次導航中斷驗證。原Front已接受的近側構圖、封閉空間及轉場限制與M6未結事項不變。

## Token統計範圍

## 索引收尾

2026-10-29 21:59（Asia/Taipei）查 codebase_status：green，Incremental update completed，175 chunks；本次掃描70個可索引檔，新增8／更新11／刪除0，變更19檔產生71 chunks；code graph 53檔94 edges，watcher維持disabled。索引為專案可索引原始碼範圍，不宣稱所有Markdown或資產皆有embedding；遵守.gitignore／.socraticodeignore（含.local、public/assets、docs/imported與機密排除）。首次更新因本機Qdrant未啟動失敗；依授權執行既有scripts/rag.ps1 start後健康檢查三項true，重試成功。未安裝、下載模型、使用雲端或重建／刪除索引。HEAD仍fab6fd7，無commit／push。

### 統計明細

完整階段 token 用量：無法取得精確值，缺少最初規劃起點及來源chat可歸屬區間。以下僅為本chat已記錄基準到檢查點之累計差，不是完整功能成本，不重複加總cached／reasoning。

- 基準2026-10-26T12:16:56.076Z：input203613、output962、total204575。
- 檢查點2026-10-29T13:55:45.129Z：input14206322、output39298、total14245620。
- 可確認區間差額：input14002709、output38336、total14041045；cached input差額13387392已含於input，reasoning差額8478已含於output。
- 來源為本chat本機rollout的token_count.total_token_usage；不含基準前規劃、其他chat及檢查點後文件／索引／最後回覆。
