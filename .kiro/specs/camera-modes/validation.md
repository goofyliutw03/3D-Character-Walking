# camera-modes 驗證紀錄

模式：依使用者里程碑確認，自動 inline 審閱；非獨立 reviewer，未切換模型。保留既有未提交第一／第三人稱成果，沒有 stage／commit／push。

## 規劃
Requirements、design、task graph inline PASS；15個驗收條件完整對應。無新套件、資產或外部服務。第一人稱固定眼位；其他構圖Follow獨立開關。

## 任務 1.1
- RED：先建camera-modes.test，CameraController不存在而ERR_MODULE_NOT_FOUND，exit 1。
- GREEN：前方／人物俯視／低角度、角色高度、Follow freeze／resume、static位置追蹤、球面轉場、reduced-motion與lens還原通過。
- 瀏覽器發現低角度關Follow被原Orbit限制抬高；新增真正OrbitControls測試重現（5 pass/1 fail），調整低角度maxPolarAngle後6/6通過。
- Review Verdict: APPROVED。控制器不依DOM／ViewerApp，Follow公開constrain只重用既有遮擋責任；未修改人物運動。
- Verification Result: VERIFIED（TASK）。

## 任務 1.2
- RED：先建fisheye.test，FisheyePass不存在而ERR_MODULE_NOT_FOUND，exit 1。
- GREEN：square160°capture、aspectuniform、renderer target還原（含throw）、dispose一次均通過。
- 瀏覽器初版中心偏糊，RT提升兩倍取樣且限制1536–2048；只魚眼使用額外capture與全螢幕pass。
- Review Verdict: APPROVED。無新增renderer／套件，render target以finally還原，資源釋放明確。
- Verification Result: VERIFIED（TASK）；GPU視覺仍由最終browser驗收補足。

## 任務 2.1
- ViewerApp委派相機協調至CameraController，單一loop與camera保留；SceneRenderer只有fisheye時走lazy pass。
- UI以cameraView為權威，Follow不再強制第三人稱；第一人稱Follow checked／disabled並提示固定眼位。
- 完整測試25/25 PASS，exit 0；`./scripts/project.ps1 build` TypeScript／Vite PASS，exit 0。
- build JS589.29kB／gzip149.08kB，原有500kB advisory保留，不擴大拆包範圍。
- Review Verdict: APPROVED，Verification Result: VERIFIED（TASK）；實際runtime驗收持續記錄於後。

## 任務 2.2 / 最終驗證
- 最終完整測試25/25 PASS、exit 0；production build PASS、exit 0，JS589.39kB／gzip149.11kB。無新增依賴，lockfile不變。
- Production preview（http://127.0.0.1:4173/）到達WebGL2 ready。實測Front可看見人物正面、Character overhead可看見人物頂部、Low angle向上看；低角度關Follow後構圖不再抬高。
- Follow on/off保留選取構圖、提示與footer同步；Overview開Follow仍為Overview，不切第三人稱。第一人稱checked/disabled提示固定眼位，第三人稱恢復人物，三個靜態預設與Reset路徑保留。
- GPU真實魚眼：可見圓形邊界與周邊建築彎曲、日光／黃昏及陰影開關有效。離開至第一人稱／普通透視後無殘留魚眼，console error/warn為空。魚眼黑底的場景標題已加背景確保可讀。
- 390×844：canvas375×506，scrollWidth375≤innerWidth390，圓形未被拉伸，無水平溢出。測後已reset viewport。角色切成child、Run／Stop／Jump已在新相機整合中實測。

## Review Verdict
- VERDICT: APPROVED
- TASK: 2.2
- MECHANICAL_RESULTS: Tests PASS（25/25）、Build PASS；placeholder／secret檢查CLEAN；Boundary WITHIN。
- FINDINGS: 低角度凍結／魚眼取樣修正已測試；無未解阻擋缺陷。實作審閱為inline，未冒稱獨立reviewer。

## Validation Report
- DECISION: GO
- MECHANICAL_RESULTS: Full tests PASS、build PASS、production smoke PASS、GPU shader PASS；既有chunk advisory不視為失敗。
- INTEGRATION: 單一camera與loop，CameraController統一view／Follow；SceneRenderer僅按fisheye旗標選渲染路徑，UI不操作Three objects。Follow.constrain被重用，無運動／場景權責外溢。
- COVERAGE: 4/4 sections、15/15 criteria已對應；角度／追蹤／轉場／資源以單元驗證，shader／resize／操作以真實瀏覽器補足。
- DESIGN: 檔案、契約及依賴方向一致；RT1536–2048與low-angle Orbit限制已同步design／research。上游FirstPerson／Follow測試仍通過。下游表情需依cameraView與魚眼投影正確定位，尚未開始實作。
- OWNERSHIP: LOCAL
- UPSTREAM_SPEC: N/A
- BLOCKED_TASKS: 無。

## Verification Result
- STATUS: VERIFIED
- CLAIM_TYPE: FEATURE_GO
- CLAIM: 里程碑4的新鏡頭、平滑切換、獨立跟隨及160°魚眼可供使用者確認。
- EVIDENCE: 25項全套測試、production build與runtime、實際各視角與GPU shader、15條需求覆蓋、inline審閱。
- GAPS: 未做跨GPU／跨瀏覽器、實體觸控效能或故意context-loss；無half-float支援的fallback尚未在真實GPU驗證。魚眼RT增加記憶體與一個fullscreen pass；本機畫面FPS不是效能承諾。不新增180°、mouse-look或表情宣稱。
- NOTES: 未stage／commit／push；保留里程碑3既有未提交內容。等待里程碑結束確認，不開始里程碑5。
