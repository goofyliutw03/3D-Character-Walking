# path-navigation 驗證（1V-0）

## 授權與審閱
來源chat 01a1973a-d998-7d62-8048-bd56664b3275明確要求自動完成延後候選，由1Q-4交接。本chat 01a197c3-5ad1-70c0-921f-2967266c1b46依序init→requirements→design→tasks→單項實作，inline審閱，自動核准非逐份人工核准。無委派、安裝、外部資產、commit或push。保留交接dirty。

Task1.1：先測試缺PathTour的red，再實作；7項導航／巡迴測試PASS。Task2.1：UI／ViewerApp接線、typecheck及正式UI檢查PASS。首輪示範第四點(6.4,12)實際位於障礙，修正為(-6.4,16)，新增讀取實際出貨UI預設路線、真CityScene／CharacterController全程繞障測試；修正驗證PASS。

## 新鮮證據
- `./scripts/project.ps1 release`：2026-11-01T23:46:43+08 exit0，128/128 tests、tsc、Vite70modules PASS；Added2 Updated1 Skipped14。首次sandbox build EPERM，未同步；經宿主審批重跑成功。500kB advisory維持。
- 正式Release資產：index-BDRYFgku.js、ViewerApp-CVT3s1HY.js。測試頁只注入檢查script，產品main、UI、模型、WebGL均為正式產物。
- 正式UI 23:47:09–23:47:13+08：16checks PASS、errors[]，初始off、walk、Pause／Resume、manual、Stop、editing、blur、非法route、完成、loop、First／Fisheye／Third及native context loss／恢復不續行。
- 修正後demo在正式UI呈現moving waypoint2/4，1280x900視窗截圖目視通過；390x844模擬窄版document無橫向overflow、Start可用，截圖目視維持原responsive排列。點地取消巡迴並回到既有導航，該次點選地點被既有picker拒絕，沒有把它記為成功到點。
- 原始report、extra.json、release-tour.png、mobile-tour.png與測試harness位於忽略的`.local/tour-validation/`。獨立headless Chrome已用Browser.close關閉，測試server4188於收尾停止；原4174preview保留。
- 真控制器測試涵蓋0.5／1.8／4速度、障礙、loop、同點有界、pause／resume、取消、非法值／超限／stalled及出貨demo全部點抵達。既有123tests維持PASS。
- `git diff --check`在新增檔尾空行修正後重新檢查；新feature範圍TBD／TODO／FIXME／HACK與secret pattern無匹配。

## Integration validation / completion gate
DECISION：GO（本機工程交付；收尾索引與metadata以最後工具結果為準）。requirements三章／10條件全部映射；PathTour→專屬DestinationNavigation→intent→CharacterController權威位置→既有角色與camera，資料與控制權一致。manual callback取消兩個導航，Start先input.stop再啟動，Pause不呼叫stop，resume重規劃清除stalled；route／snapshot防外部修改。無孤立元件、反向依賴、邊界擴張或新增runtime前置。需求3.3角色切換沿用同一motion；未改camera或assets權威。blocked tasks無，檢查結果inline，非獨立審閱。kiro-validate-impl／verify-completion已依本階段新鮮tests/build/runtime/coverage/boundary證據執行。

## 限制與rollback
路線只在記憶體；1–32點、平面XZ、靜態避障及既有地形貼地，不含持久化／視覺拖曳／多層城市。編輯loop／speed同樣依既有focusin取消後重新Start。未新增主角動態避碰。桌面headless與模擬窄版不等於手機真機或跨GPU驗收，不重開手機／IME、取消的摺疊專項或概括關閉SCENE-04／ACCEPT-01／讀屏。

Rollback只移除PathTour、TourControls、tests與本次接線／文件增量，還原DestinationNavigation可選speed預設；不可reset或覆蓋其他dirty。回退仍走release。

## 收尾
增量codebase_update及status待最後工具確認，結果由本chat交付／交接補充；不把背景啟動算完成。token用量：無法取得精確值，本chat與前段均無官方input/output/total起點；不估算，未改設定／資料庫。

收尾首次增量索引已完成：135 indexable files，Added3 Updated7 Removed0、69 chunks重建；status green418chunks、graph108files221edges、watcher off，無錯誤。忽略規則維持；本次spec位於既有.kiro排除範圍，未為索引修改ignore。task3.1與metadata收尾後依序再release並增量確認，最終精確結果以交付工具為準。
