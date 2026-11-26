# 設計與審閱

採單一來源的 EnvironmentLight 控制契約，每個來源回傳設定副本，configure 先驗證再同步渲染。Environment 可選 lights，現有空間政策及城市保持相容，未依場景 ID 分支判斷面板。

CaveLighting 為全部 30 處建立固定容量的核心、粒子及 PointLight，隨機只決定初始 enabled。動畫讀取每燈強度倍率、色彩、effects 和 reduced motion。獨立 tint 防止同類燈彼此改色。光源關閉保留可重新開啟的資源，卸載統一釋放。

Skylight 的太陽幾何可見性與手動 enabled／effects 組合，設定更新重新計算光線，不將太陽變化寫回手動狀態。光束也使用使用者色彩。

EnvironmentLightControls 透過 ViewerApp 讀取快照、更新當前來源。切換成功重建面板，DOM 移除釋放舊事件。頭燈沿用同一頁面中的 HeadlampControls，沒有第二份頭燈設定。元件採原生 fieldset／label／details；面板內焦點沿用 CameraInputManager 的 UI 排除規則。

為避免透明／線框材質替換凍結光源 uniform，只對動態發光 Mesh 加 preserveLightMaterial。水景原有材質複製仍保留。

風險為 30 盞局部光源的 GPU 成本，先測 Needle／legacy 正式入口並標示量測環境。回退只撤本功能的來源契約、UI 與接線，保留工作區既有變更。

依使用者授權自動 inline 審閱通過，無獨立 agent 審查。未引入資產、依賴、全域設定或提交。
