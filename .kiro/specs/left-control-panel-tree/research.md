# Research & Design Decisions

## Summary
2026-10-30，integration-focused light discovery；讀取development-plan、roadmap、product／tech／structure、main、style、SpeechEditor及SceneRenderer。無外部依賴研究需求。

## Research Log
- main原本將五個section寫於aside；控制由ID綁定，非section關係，可抽出模板而保留契約。
- CSS既有850px／coarse媒體規則將場景放前，必須同步於寬度控制，不覆寫移動區。
- SceneRenderer已有ResizeObserver，不需新增window resize workaround或公開API。
- 載入時main停用所有表單控制；layout控制須排除，錯誤畫面也能收合。

## Architecture Pattern Evaluation / Design Decisions
- Generalization：同一FunctionNode處理分類與子群組，content保留現有表單；不建立通用form schema或plugin系統。
- Build vs adopt：原生details提供鍵盤與隱藏語意，避免自行實作ARIA tree選取／方向鍵契約；Pointer Events作單一resize互動，不加依賴。
- Simplification：只保留本頁狀態，不加localStorage、URL設定、寬度動畫或多面板管理器。
- 使用kiro init／requirements／design／tasks規則；依AGENTS本次核准自動inline審閱，不委派、不commit。

## Risks & Mitigations
DOM重新生成會遺失草稿→只初始化一次；drag離開把手→capture與cancel；resize影響canvas→依既有observer實測；共用main／style→粒子chat已completed才開始。
