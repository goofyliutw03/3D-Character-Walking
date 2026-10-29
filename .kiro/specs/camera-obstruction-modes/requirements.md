# Requirements Document

## Project Description (Input)
使用者在城市人物檢視器遇到場景遮住主角，目前只有部分人物鏡頭的立即縮距。使用者確認 1M-0 規劃：新增 Camera objects block mode 選擇，預設平滑拉近／退回原構圖，另可選遮擋物 75% 透明或全場景線框；主角保持正常。First person 保持眼位，不縮距／透明化，線框仍適用。目前沒有 NPC，不新增 NPC。保留魚眼、Follow、角色中心 Orbit 與點地 Run。

## Requirements

## Boundary Context
本次為既有六里程碑的追加需求，不結束 M6／SCENE-05 人工驗收；不新增 NPC、資產、套件、巡迴或移動規則。所有外部視角皆適用，First person 例外依 4.1；透明與線框模式不再使用遮擋縮距或 Front 避障選角。

### Requirement 1: 模式與介面
**Objective:** 使用者能選擇處理遮擋的方法。
1. The Viewer shall 在 Camera 區提供 Auto zoom、Transparent blockers、Wireframe scene 三選一，首次載入預設 Auto zoom。（1.1）
2. When 使用者切換鏡頭或 Follow, the Viewer shall 保留遮擋模式並同步選取狀態與提示。（1.2）

### Requirement 2: 平滑拉近與回復
**Objective:** 使用者能在遮擋解除後恢復原本的觀察距離。
1. While Auto zoom 下場景擋住主角, the Viewer shall 平滑縮短鏡頭到主角的距離以露出主角。（2.1）
2. When 遮擋消失或角色遠離, the Viewer shall 平滑返回未受遮擋時的原構圖；持續遮擋後仍能回復，不將縮距位置當作原位置。（2.2）
3. While 使用者旋轉、縮放或跟隨移動, the Viewer shall 以當前操作構圖為回復目標，不覆寫手動操作；偏好減少動態效果時直接到位。（2.3）

### Requirement 3: 透明與線框
**Objective:** 使用者能保留觀察位置並看清主角。
1. While Transparent blockers 下場景遮擋主角, the Viewer shall 將該遮擋物顯示為 75% 透明，保留原鏡頭構圖且不透明化未遮擋的同色物件。（3.1）
2. When 遮擋解除或離開透明模式, the Viewer shall 恢復物件原本顯示，包含先前透明度與材質設定。（3.2）
3. While Wireframe scene 啟用, the Viewer shall 將所有場景物件顯示為線框，主角維持正常；離開時恢復場景原顯示。（3.3）

### Requirement 4: 相容與資源
**Objective:** 新模式能與現有操作共存且可完整釋放。
1. While First person 啟用, the Viewer shall 保持固定眼位與自身隱藏，不自動拉近或透明化，Wireframe scene 仍適用；切回外部視角恢復所選策略。（4.1）
2. The Viewer shall 保留魚眼、Follow on/off、角色中心 Orbit、點地 Run、角色切換、跑跳與光影控制。（4.2）
3. When 連續切換模式或釋放檢視器, the Viewer shall 還原場景狀態並釋放新增材質，不釋放共用原材質／貼圖、不累積重複資源。（4.3）
4. The Viewer shall 通過全套 tests、production build 及實際 production 瀏覽器啟動與三模式操作驗證。（4.4）

## 自動審閱
Requirements Review Gate inline PASS：12 條驗收條件與使用者核准範圍一致，75% 透明及 First person 例外明確；不存在 NPC 擴建或跨里程碑授權。依使用者本階段授權自動審閱，非逐份人工核准。
