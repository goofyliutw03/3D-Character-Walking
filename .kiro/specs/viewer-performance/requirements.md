# 效能最佳化需求

## Project Description (Input)
使用者需要接續 M6 效能最佳化；交接所稱原 viewer-performance 規格未能取得，2026-11-10 明確授權依目前 main 重建規格並續作。起點 main / 47f5e68，現有 Inspector 定期完整重建索引列及序列化比較，造成可避免的 CPU 與物件配置成本。依實測改善此局部成本，維持可見行為及既有人工驗收界線。

## Boundary Context
- 範圍：Inspector 場景索引同步的 CPU 成本、重用未變資料、可重現前後量測、回歸與正式發佈；追加PC Chrome／Edge production四負載工程量測。
- 排除：降低畫質、改變同步頻率、場景／角色／動畫／相機／Shader 改造、其他分支整合、跨裝置驗收結案。
- 鄰接期待：沿用現有編號、篩選、世界標籤及動態場景同步；全套測試及建置仍為必要門檻。
- 目標平台（使用者 2026-11-10 指定）：PC Chrome／Edge；Android Chrome／Edge／Firefox；iPhone Safari。OS／瀏覽器版本與效能門檻尚未指定；記錄實測版本，不擅自推定數字門檻。

## Requirements

### Requirement 1: 可重現效能證據
1. The viewer project shall 記錄固定版本、節點數、暖機、重複次數與每次同步耗時的前後樣本。
2. When 比較最佳化前後結果, the viewer project shall 使用同一場景及量測方式，僅宣稱量到的同步 CPU 成本，不推定 FPS 或 GPU／跨裝置收益。

### Requirement 2: 同步效率與行為相容
1. While 場景物件及索引內容未改變, the Inspector shall 保持編號、順序、checkbox 及篩選結果一致，避免重建未變的索引資料。
2. When 物件新增、移除、重新加入、重新掛載、排序或改名, the Inspector shall 在下一次同步回報變化並產生正確路徑與父子關係，保留仍存活物件的編號。
3. When 使用者修改 checkbox 或篩選, the Inspector shall 保留既有篩選交集、祖先保留與錯誤輸入原子性，維持同步變化通知語意。
4. When 索引釋放後再次使用, the Inspector shall 清除舊資料及比較狀態，正確重新發現場景。

### Requirement 3: 交付與限制
1. The viewer project shall 通過索引回歸、完整測試、型別檢查、production build 與實際瀏覽器啟動及 Inspector 操作驗證。
2. The viewer project shall 記錄 Release 與增量索引結果，保留 M6／跨裝置與人工驗收待辦，不 commit／push。
3. The viewer project shall 分別記錄 PC Chrome／Edge、Android Chrome／Edge／Firefox、iPhone Safari 的效能驗證狀態與環境，未實測平台保留待驗，不以 Node 或桌面結果代替。

## 需求審閱
PASS（inline）：3 區共 9 條條件具數字 ID、EARS、可觀察結果與明確邊界；不加入 FPS 門檻或未授權視覺改動。平台追加已同步設計／驗證任務。依使用者同里程碑授權自動審閱，非逐份人工核准。

## PC 工程量測續作（2026-11-10）
### Requirement 4: PC 幀時間樣本
1. The viewer project shall 以同一 production build、固定 stage／DPR／畫質／暖機與測量長度，依序取得 Chrome／Edge 的走跑、魚眼加 xray、粒子水景與夜間樣本。
2. The viewer project shall 記錄真實 RAF wall-clock FPS、中位／P95 幀間隔、draw calls／triangles、瀏覽器與 GPU 環境及錯誤；不將 RAF 當 GPU elapsed 或正式門檻。
3. When 樣本顯示可處理瓶頸, the viewer project shall 先保存證據，再做同設定 A/B 與功能回歸；未有可靠證據不為修改而修改。
審閱 PASS（inline）：使用者「手機平台部分列 ToDo，先進行其他部分」之同 M6 續作，無畫質或 API 變更。
