# Requirements Document

## Project Description (Input)
使用者希望將已確認的獨立水景放入街道，已核准 [1P-1] 街尾植栽島替換方案，並要求 Shader 功能設計為可供未來使用的 Module／API。現況為獨立原型，本次加入街道位置、碰撞、相機相容與既有面板控制，兩入口共用可重用水景模組。

## Introduction
以單一街尾水景延續原型風格，維持城市通行、相機與控制能力；開發者可從公開入口重用水景或只使用 Shader 材質。

## Boundary Context
- In scope：街尾植栽島替換、水景模組／API、靜態障礙、三種遮擋相容、場景功能樹控制與兩入口回歸。
- Out of scope：游泳／涉水、NPC、物理引擎、即時反射、WebGPU、素材下載及通用特效框架。
- Adjacent expectations：維持 M6／SCENE-05 人工待驗，既有陰影／DPR 由主場景掌管。非第七里程碑。

## Requirements
### Requirement 1: 街尾水景與通行
**Objective:** As a 使用者, I want 在街尾觀察水景, so that 我能在既有街道探索。
#### Acceptance Criteria
1. When 開啟街道，系統 shall 以中心約 (0,-24.6)、池面約 4×3 公尺及約 2 公尺落差的水景取代中央街尾植栽島，保留兩側道路與人行道通行。
2. While 角色手動走／跑／跳或自動導航，系統 shall 將完整池岸／水池／石牆占地視為不可走的靜態障礙，不允許穿越。
3. When 點選池面／池岸／石牆，系統 shall 拒絕作為目的地；點選旁邊可走地面仍可繞行。

### Requirement 2: 控制與相機相容
**Objective:** As a 使用者, I want 調整水景並切換相機, so that 我能比較外觀且不破壞既有操作。
#### Acceptance Criteria
1. When 展開 Scene display 的 Water feature，系統 shall 提供效果、暫停、標準／低品質、波浪 0–2 與流速 0–3 控制；初始效果開、未暫停、標準品質及強度／速度 1。
2. While 效果關閉，系統 shall 保留靜態池面、池岸及碰撞並隱藏瀑布；While 暫停，系統 shall 凍結水景但允許角色及相機操作；恢復時不得補算背景時間。
3. When 切換 Auto zoom、Transparent blockers 或 Wireframe，系統 shall 讓實體池岸／石牆參與遮擋、薄片水景不觸發推近，透明遮擋水景的可見 alpha 乘以 0.25，線框涵蓋水景，動畫與控制仍同步且切回完整還原。
4. When 切換既有相機、First person、日夜、陰影或調整面板／視窗，系統 shall 維持相機眼位規則、場景尺寸及控制可用；水景品質不得改變整個街道的 DPR 或陰影品質。

### Requirement 3: 可重用 Shader API 與生命週期
**Objective:** As a 開發者, I want 透過公開模組重用水景 Shader, so that 其他場景不必複製原型應用。
#### Acceptance Criteria
1. When 匯入公開水景模組，開發者 shall 能取得具型別的設定、Shader 材質模組及完整水景；材質模組可套用至自有網格而不依賴 DOM、renderer、街道或應用迴圈，並有使用範例及所有權文件。
2. When 建立多個實例、複製材質作外觀覆寫、更新或釋放，模組 shall 保持獨立實例設定，覆寫材質與所屬實例時間同步，且只釋放自己持有的資源，dispose 可重複呼叫。
3. If 設定或時間輸入無效，模組 shall 拒絕無效設定且保留原狀；When 切換品質或重複建立／釋放，模組 shall 釋放替換資源且不累積。

### Requirement 4: 證據與交付
**Objective:** As a 評估者, I want 可比較的街道測量與回歸證據, so that 我能確認整合品質。
#### Acceptance Criteria
1. When 執行整合驗證，交付紀錄 shall 包含碰撞／導航、三種遮擋、近遠斜角、控制、窄版、Shader 錯誤、資源循環及兩 production 入口回歸，並區分未驗真機。
2. When 執行街道效能比較，系統 shall 於固定鏡頭／解析度／DPR／陰影／角色條件下，標準及低品質各 off/on 60 秒×3 輪、每段暖機 5 秒，記錄平均 FPS、median／P95 幀時間、calls／triangles／資源與環境；背景或尺寸變動使當次結果無效。
3. When 測試／建置與發佈成功，交付 shall 同時保留街道與獨立原型，記錄 Release 與索引完成證據；不以原型 FPS 或 localhost 代替街道／手機 LAN 驗收。

## Requirements Review Gate
inline PASS：4 區／13 criteria，EARS trigger、邊界、數值與核准計畫一致。新增 Shader API 為使用者明確要求。依本次範圍授權自動審閱通過，非逐份人工核准。
