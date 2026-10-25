# 產品方向

更新日期：2026-10-24。狀態：使用者已核准 steering 內容；本次補充較新驗證紀錄與 cc-sdd 導入連結。

## 目的與使用情境

建立可在本機瀏覽器操作的城市街道人物檢視器，用於觀察人物移動、動畫、鏡頭構圖與表情互動。產品需求與里程碑以 [開發計畫](../../docs/development-plan.md) 為來源，核准流程依 [AGENTS.md](../../AGENTS.md)。

## 核心能力方向

- 在城市街景中切換男、女、小孩角色，操作停止、走、跑、跳。
- 以觀察、跟隨及不同構圖鏡頭檢視角色行為；魚眼視角屬後續需求。
- 透過情緒圖示與可編輯對話泡泡呈現人物表達。
- 使用免費工具與授權清楚的資產，維持本機操作能力，不依賴必要的付費 API 或雲端服務。

## 現況與驗收界線

程式碼已有程序化街道、光影控制、OrbitControls 與 overview／street／overhead 鏡頭預設。[Stage 1.2 紀錄](../../docs/stage-1.2.md) 記載 TypeScript／production build，以及場景、鏡頭切換、orbit／zoom、光影、桌面與模擬手機尺寸的瀏覽器驗證。本 steering 階段未重跑上述驗證；pan、GPU context 故障、unsupported browser 與實機觸控效能仍待驗收。

目前尚無角色、移動／跳躍、骨架動畫或表情模組的實作證據。程序化人物若作為原型，必須明確標示，不能視為最終 rigged GLB 動畫驗收的替代品。

development-plan 與 setup-validation 的舊文字仍將場景列為下一階段；README 已有 Stage 1.2 完成說明。任務分析須核對較新實作與驗收證據，不直接重做或宣稱全部驗收完成。來源計畫保留原文，新增導入註記；完整規劃對應見 [roadmap](roadmap.md)。
