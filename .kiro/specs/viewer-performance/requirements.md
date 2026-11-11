# Requirements Document

## Introduction
桌面與手機使用者需要流暢且可驗證的3D Viewer。目前已有WebGL2、高效能偏好、DPR上限2與FPS，但缺少本工作站固定條件的比較及手機矩陣。本次依2026-11-10使用者「OK please go on」核准，先量測再作局部優化；Chrome主、Edge輔，iPhone Safari必要支援，Android Chrome／Edge／Firefox列入規劃。不是第七里程碑。

## Boundary Context
包含固定條件效能量測、依證據去除重複工作、相容性／畫質驗證方案、Release及索引。不含WebGPU、雙GPU合併渲染、瀏覽器／OS設定修改、依賴升級或安裝、NPC／新視覺效果。既有M6／SCENE-04/05/FOLD未驗項保留，桌面模擬不等同真機。

## Requirements
### Requirement 1: 可重複的效能證據
**Objective:** As a 維護者, I want 同條件的實測, so that 優化取捨有證據。
#### Acceptance Criteria
1. The Viewer 驗證流程 shall 記錄瀏覽器／平台、實際renderer（不可讀則明示未知）、視窗／canvas尺寸、DPR、場景與量測方式。
2. When 執行效能比較, the Viewer 驗證流程 shall 對一般街道、夜間水景、魚眼及Xray各暖機後三輪取樣，記錄FPS、幀間隔median／P95、draw calls／triangles及資源數量。
3. The Viewer 驗證流程 shall 區分幀間隔、CPU提交時間、GPU時間，且不把利用率或FPS當作雙GPU同時工作證據。

### Requirement 2: 保持互動與畫質的局部優化
**Objective:** As a 使用者, I want 保持操作結果與畫質, so that 減少成本不造成退步。
#### Acceptance Criteria
1. When 重複的可見狀態沒有改變, the Viewer shall 保留既有去重以避免反覆重建相同操作說明，仍在角色、動作、Follow、鏡頭、導航與遮擋狀態改變時更新；不因未量得的成本重寫既有機制。
2. When prefers-reduced-motion偏好在執行中改變, the Viewer shall 於後續更新遵循目前偏好，並在銷毀後釋放監聽資源。
3. The Viewer shall 保持既有畫質、陰影、水景設定、觸控、相機與角色行為；僅對實測支持的成本進行局部修改。
4. If 前後比較未超出量測波動, the Viewer 交付紀錄 shall 明示未證實FPS增幅，而不將較少DOM更新宣稱為已量得FPS改善。

### Requirement 3: 跨平台驗證與交付界線
**Objective:** As a 桌面與手機使用者, I want 清楚的相容性界線, so that 可判斷使用條件。
#### Acceptance Criteria
1. The Viewer 驗證方案 shall 包含Windows Chrome／Edge、iPhone Safari、Android Chrome／Edge／Firefox；列出能力與建置下限的依據及實機版本／機型尚未取得的限制。
2. The Viewer 驗證方案 shall 對各組合涵蓋WebGL2／renderer、DPR與適合裝置的品質、觸控、旋轉／resize、背景返回與context恢復，以及1.2的代表場景。
3. While 缺乏真機或跨GPU證據, the Viewer 交付紀錄 shall 保留待驗項，區分headless、桌面尺寸模擬及真機，不自動完成M6／SCENE-05。
4. When 修改通過適當本機驗證, the Viewer 交付流程 shall 依序執行tests→build→增量Release並更新本機索引；失敗明示，不冒稱發佈或索引完成。
