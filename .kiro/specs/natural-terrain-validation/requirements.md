# 自然地表驗證區

## Project Description
檢視器使用者目前可切換城市與洞穴，但尚無自然地表驗證共用高度與 Shader 置換。本階段新增可操作地表，驗證角色、點選、光影與資源一致性，作為既有多場景規劃的下一項交付。

## 1. 場景與操作
1.1 When 使用者選擇自然地表, the Viewer shall 顯示具有丘陵、草木與可操作角色的獨立驗證區。
1.2 When 使用者往返城市、洞穴與地表, the Viewer shall 保留角色、鏡頭與面板偏好並重設位置與移動暫態。
1.3 If 場景準備失敗或請求過期, the Viewer shall 保留當前可用場景並釋放過期結果。

## 2. 通行一致性
2.1 While 角色在地表行走、跑步或落地, the Viewer shall 使腳底與可見三角面高度的差異低於 1mm。
2.2 When 使用者點選地表或相機查詢遮擋, the Viewer shall 對可見地表求交，點選誤差低於 1mm。
2.3 When 角色抵達邊界或樹幹, the Viewer shall 阻止穿越並維持既有停止、跳躍及手動接管行為。

## 3. 光影與品質
3.1 While 地表顯示, the Viewer shall 依置換後的表面法線照明並將陰影投射於可見高度。
3.2 When 使用者調整地表品質或風動, the Viewer shall 改變裝飾草木預算或動態效果並保持通行高度不變。
3.3 While 系統偏好減少動態效果, the Viewer shall 凍結草木風動。

## 4. 整合與生命週期
4.1 When 使用者切換或重載地表, the Viewer shall 釋放卸載場景的幾何、材質與高度紋理，並可重新進入。
4.2 When 使用者儲存或載入 Profiles, the Viewer shall 支援地表偏好並繼續接受既有城市與洞穴設定檔。
4.3 The Viewer shall 在 Needle 與明示 legacy 保持地表及既有城市、洞穴、水景、魚眼、X-ray 行為。

## 範圍
僅靜態自然地表與裝飾風動。無新依賴、下載或第三方素材。飛行、水域、太空、地震、可破壞地形及完整洞穴入口串接不在本次交付。既有實機、GPU 相容與效能人工待驗不概括關閉。
