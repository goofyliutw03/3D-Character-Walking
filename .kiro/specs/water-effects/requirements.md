# Requirements Document

## Project Description (Input)
使用者希望先觀察水景風格與成本，目前主街道尚無水景。本次建立獨立水池／瀑布原型，測量效果開關與兩種品質的成本，確認後才另行授權街道整合。核准輸入沿用原 chat「OK please go on」及本 chat 交接；不是第七里程碑，M6／SCENE-05 不變。

## Introduction
以可操作、可重現測量的水景，提供使用者判斷風格與效能的依據。

## Boundary Context
- In scope：獨立 production 測試入口、約 4×3 公尺池面、2 公尺瀑布及可見操作／效能報告。
- Out of scope：街道整合、涉水／游泳、真流體、即時場景反射、下載素材、角色及鏡頭功能變更。
- Adjacent expectations：原街道入口與功能維持；手機真機及 M6／SCENE-05 驗收獨立保留。

## Requirements

### Requirement 1: 獨立水景
**Objective:** As a 使用者, I want 獨立觀察水池與瀑布, so that 我能確認風格。
#### Acceptance Criteria
1. When 使用者開啟水景入口，原型 shall 顯示約 4×3 公尺池面與落差 2 公尺的小瀑布，呈現柔和青綠水色、柔和反光與白色泡沫。
2. While 效果開啟且未暫停，原型 shall 顯示多方向細波、輕微池面起伏及落點持續環形波紋。
3. While 效果開啟且未暫停，原型 shall 顯示向下流動的瀑布紋理、變動邊緣與落點泡沫。
4. When 使用者調整近／遠／斜角觀察，原型 shall 維持水面與瀑布接合可讀，避免可見泡沫裂縫及錯誤前後遮擋。

### Requirement 2: 可操作與可釋放
**Objective:** As a 使用者, I want 控制效果與品質, so that 我能比較外觀和成本。
#### Acceptance Criteria
1. When 使用者關閉效果，原型 shall 保留靜態水池與場景；當重新開啟時恢復動態水景。
2. While 使用者暫停，原型 shall 凍結全部水景動畫並保留鏡頭操作；恢復後不得突然跳進背景經過的時間。
3. When 使用者調整波浪強度、流速或低／標準品質，原型 shall 套用設定並顯示目前值。
4. When 原型被重複建立與釋放，原型 shall 釋放其持有資源且不持續累積；無效設定不得破壞既有設定。

### Requirement 3: 證據與發佈
**Objective:** As a 評估者, I want 可重現測量與可開啟的產物, so that 我能判斷是否適合整合。
#### Acceptance Criteria
1. When 執行正式效能比較，原型 shall 在固定鏡頭／解析度／DPR／陰影及暖機後，各測效果關閉／開啟 60 秒、三輪，記錄平均 FPS、幀時間中位數／P95、draw calls／triangles／資源數與環境。
2. If 測量期間分頁隱藏或設定／畫面改變，原型 shall 中止該次比較，避免產生不可比較結果。
3. When 完成驗證，交付紀錄 shall 區分測試／build、production 視覺、shader 錯誤、資源釋放與未驗真機；桌面標準接近 60 FPS、手機低品質穩定 30 FPS 為目標，不宣稱未測平台達標。
4. When 建置及增量發佈成功，production 與 Release shall 同時保留街道與水景入口，並可由本機 Release 預覽開啟。

## Requirements Review Gate
2026-10-30，inline PASS：3 區／12 條件均有 numeric IDs 與 EARS trigger、可觀察結果；核准輸入、排除及人工待驗範圍一致。依使用者授權自動審閱通過，非逐份人工核准。
