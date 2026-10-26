# Research / Design Decisions
2026-10-26 integration-focused discovery。使用本機kiro init、requirements、design、tasks、impl、validate-impl及verify-completion；依專案與使用者授權inline執行，不委派或換模型。

- 現有LoadingFeedback只有loading/ready/error，footer為live region；viewport有aria-busy。維持footer避免busy祖先延後公告。
- 已讀本機node_modules/three/src/loaders/Loader.js、FileLoader.js及examples/jsm/loaders/GLTFLoader.js：loadAsync接onProgress；FileLoader以Content-Length產生loaded/total與lengthComputable，不可用itemsLoaded假裝byte百分比。
- 原始main靜態import ViewerApp會等engine chunk下載後才建立DOM；改type-only import與try內dynamic import，DOM可先呈現。純模組下載未知進度，保持indeterminate。
- Generalization：同一狀態支援初始化與後續角色載入，不另造第二個loader；初次完成後panel compact。
- Build vs adopt：採原生progress提供已知／未知語意，CSS多層文字提供立體厚度及旋轉；無字型、TextGeometry、canvas bitmap、新renderer或依賴。
- Simplification：無固定百分比權重、timer進度、最短展示時間或新事件bus。請求隔離沿既有version，加settled避免load resolve後殘留進度。
- 風險：同步scene/parse階段不保證每個中間狀態都有視覺frame；不能為動畫偽造耗時。fatal reload與角色retry分開，舊fallback可用。
