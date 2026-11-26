# Research Log
## Summary
2026-11-10，本批是已存在移動系統的契約擴充。以本機程式作權威來源，無新函式庫、外部服務或授權資產；不需查詢外部 SDK。依序使用 kiro-spec-init／requirements／design／tasks／impl／validate-impl；未委派，審閱皆 inline。

## Investigations
- CharacterController：每幀上限 .05 秒，內部分步，先 X 後 Z；障礙為沿 Y 無限延伸的 XZ 擴張矩形。不能把它冒稱為真實膠囊／三角面 sweep。
- DestinationNavigation：isWalkable 與 segmentClear 自行重複半徑／矩形規則，容差 1e-8。PathTour 重用該模組；自動跑步重用 CharacterController。
- CityScene：矩形 bounds、可變 obstacles 陣列及 groundHeight；地表／洞穴也實作 WalkableWorld。適配必須讀取當前資料，不能永久複製 obstacle 快照。
- ViewerApp：場景切換建立 controller/navigation；tour 只在 cityFeatures 啟用。XYZ 仍由 controller.relocate 提交。相機與 NPC 交通是獨立政策，本批不改。
- assetCatalog 三角色高度為 1.8／1.68／1.15m，既有碰撞半徑皆 .28m。城市延伸代理與高度無關，但契約須驗證高度，未來三維適配不可忽略。

## Design Decisions
將重複問題歸納為位置有效性與線段最早接觸。提供三維座標／直立膠囊形狀契約，但初始 capability 明列 planar-extrusion，raycast 僅支援水平代理線段；非水平回傳 unsupported。不引入剛體套件，沿用城市既有保守擴張代理，以避免更動通行邊界。

初始 Range Policy 僅實作城市的一個矩形允許區扣除矩形禁入／實體代理；不先實作未使用的體積聯集、多層、多邊形、轉換區或環境混合。完整 v0.1 這些能力待後續場景批次。缺省允許區拒絕，允許區與形狀尺寸皆驗證。

不更換模擬時鐘／步進、相機或交通求解器。以同一個 adapter 提供全部既有呼叫的判定，錯誤結果採 discriminated union；非法輸入／無效高度不提交角色狀態。

## Risks
改寫 segment 邊界可能影響導航拐角；保留 1e-8m 接觸容差並測試接觸後離開、沿牆滑動及大位移。queries 每次讀取 mutable world；未建立尚無必要的空間索引，效能僅記錄本機上限，不宣稱手機通過。
