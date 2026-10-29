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

## 2026-10-26 Front 近距修正（1G-0）
- 授權：使用者對先重現定位、最小修正、完整驗證回答「OK go on please」。非新交付里程碑，不宣稱里程碑6人工驗收通過；未 commit／push／切換模型／委派。
- 根因：Front 原6m frame 經胸部中心射線避障後可能壓至0.4m（x=8.02,z=-7,heading=π/2）／約0.75m（x=6.1,z=1,heading=π/2），只剩軀幹、頭腳超出視野。真實 CityScene + ViewerApp 固定姿態瀏覽器重現，測試先RED：projected foot y=-4.439。不是資產載入、motion或renderer權威問題。
- 修正：只修改 CameraController；原構圖可讀時保留，否則前半圓±30／60／85°候選先用同一Follow.constrain探測，並確認頭腳視線清楚。實際鏡頭仍經球面平滑與既有避障；無場景透明化、無新render loop或依賴。
- 第二輪實際畫面發現30°候選雖胸部清楚但樹冠仍遮頭，新增頭腳視線檢查及測試後再跑全套。左右牆／樹、三高度、portrait／landscape、freeze、First person進出、轉場收斂與靜止不振盪均PASS。
- 最新機械驗證：`node --experimental-transform-types --test --test-isolation=none tests/*.test.mjs` exit0，45/45 PASS；`./scripts/project.ps1 build` exit0，包含tsc。ViewerApp638.84kB／gzip161.46kB，原500kB advisory保留。
- 正式 production 127.0.0.1:4173：重新載入最新build，透過正式Move right鍵盤鎖定→Stop到右側街邊，男／女／小孩Front均頭腳可見；First person隱藏自身、回Front恢復，Follow off/on、魚眼圓形shader及回Third person透視實際驗證；console warn/error空。
- 窄畫面：能力初次套到另一測試分頁，並未冒稱390px通過；關閉該分頁後重新套用正式頁，DOM確認innerWidth390／innerHeight844，Front小孩頭腳可見。結束恢復viewport。
- 本機忽略的`.local/front-debug/index.html`為固定姿態診斷頁，使用真實ViewerApp、CityScene及本機GLB，不納入正式產品。照片證據位於同目錄front-wall-production.png與front-390-production.png（忽略、未commit）。曾嘗試直接從production chunk匯入ViewerApp，但chunk依賴入口會產生Application root was not found；此診斷失敗未作成功證據，dist臨時頁已移除，正式root分頁保持正常。近牆正式驗證改用真實UI完成。

### Inline review / 整合驗證
- DECISION: GO（本次局部修正範圍）；主agent inline審閱，非獨立reviewer。
- MECHANICAL_RESULTS: 45/45 tests、build、正式root smoke PASS；本次程式及測試無新增TODO／FIXME或硬編碼秘密，diff check PASS。
- COVERAGE: 既有15條條件維持映射；此次主要重驗1.1／1.4構圖、2.1／2.3／2.5跟隨轉場避障、4.1／4.3回歸。3.1–3.3魚眼沿用既有測試並補實際切換；4.2資源測試維持通過。
- INTEGRATION / DESIGN: UI→ViewerApp→CameraController→Follow.constrain依賴不變；motion、角色latest-wins／Retry／dispose、單一loop契約未修改。探測camera未加入scene，不持有GPU資源；設計追加記錄候選與限制。
- OWNERSHIP: LOCAL（camera-modes）；無跨界修改，無必要外部輸入阻擋。
- LIMITS: 貼牆可採85°近側面構圖；全部候選都受阻仍保留避障結果，不能保證封閉空間內全身可見。球面切換過程可短暫被景物遮住，此修正保證的是已驗姿態穩定構圖，並非完整鏡頭路徑規劃。跨GPU／跨瀏覽器／實機觸控、讀屏／IME及context-loss仍未驗；不將本機FPS當benchmark。
- ROLLBACK: 只撤回本次CameraController及新測試／文件差異，不重設既有checkout。

### Verification Result
- STATUS: VERIFIED
- CLAIM_TYPE: FIX
- CLAIM: 已重現的Front近牆／樹旁避障壓縮裁切，在已驗座標、三高度及畫面尺寸下修復，既有鏡頭／載入／角色測試維持通過。
- EVIDENCE: 原始browser與RED，修正後單元投影／視線測試、45/45全套、tsc＋production build及正式UI近牆／三角色／390px回歸。
- GAPS: 上述封閉場景、轉場路徑及人工環境限制保留；未stage／commit／push。

### 索引與用量檢查點（2026-10-26）
SocratiCode增量更新已完成，status green：62個indexable檔案範圍，151 chunks，graph45 files／72 edges；新增1、更新3、移除0，依.gitignore／.socraticodeignore及工具預設排除。完成約14:30:55–14:31:08 Asia/Taipei，未重建／刪除索引、未啟動watcher。最後文件落盤後再執行增量確認；無索引錯誤。

本chat官方session JSONL的token_count：基準2026-10-26 14:18:58.393+08:00為input34,603／output257／total34,860；結束統計檢查點14:30:55.155+08:00為input5,867,537／output13,894／total5,881,431。可核對區間差額input5,832,934／output13,637／total5,846,571 tokens；其中cached input差額5,743,360已含input，reasoning output差額3,786已含output，不重複加總。來源只讀本chat rollout，未計入原交接chat，未更改設定／資料庫。
全階段token用量：無法取得精確值。以上為明確檢查點間實際差額，未含基準前初始回覆及檢查點後的最後文件／索引／回覆；不得把此部分區間冒稱完整階段總量。

## 2026-10-29 角色中心 Orbit（1L-0）
- 授權：使用者核准上述規劃；4.1→4.2→4.3依序執行，無委派／模型切換／commit／push。
- 實作：mouse左鍵hold >350ms或drag >8px啟動，capture階段取消原Tap候選；只允許Orbit的模式生效。角色height*0.65為中心，0.8秒smoothstep增量同量平移camera／target，保留當前Orbit旋轉、縮放與阻尼。正常放開後完成剩餘置中；取消／切換／Stop／dispose重設，專用Follow與First person不啟動，減少動態效果直接置中。
- 新增3個測試，使用真正OrbitControls驗證非瞬移、中心收斂、手動改變的旋轉offset不被還原、正常放開停止額外追蹤、按住追蹤角色／高度、cancel／模式切換／魚眼／減少動態效果與mouse分流。既有tap、導航、First person、Follow、Front遮擋等全套57/57 PASS。
- `./scripts/project.ps1 release`：第一次tests／tsc／Vite通過，sync受sandbox外部寫入拒絕，未視為發佈成功；宿主升權重試成功exit0，57/57、build PASS，Added3／Updated1／Skipped8，完成於2026-10-29 22:23:15+08:00。原有>500kB chunk advisory保留。
- 正式Release production http://127.0.0.1:4174/：新頁達WebGL2 ready／Rigged man Ready；真實左鍵drag可旋轉並漸移角色至場景中心，600ms hold未觸發Run、角色Idle；console warn/error為空。未將本機操作當作跨GPU／iPhone三瀏覽器實機驗收，既有M6及SCENE-05限制保留。
- kiro-validate-impl + kiro-verify-completion：inline review PASS；新增5.1→gesture+controller+實際drag；5.2→真正OrbitControls平移／offset測試；5.3→gesture取消／模式測試、既有tap回歸及ViewerApp生命週期審閱。原1–4需求全套回歸，魚眼投影與First person機械驗證通過，本次瀏覽器未重做全部歷史視角人工驗收。
- Integration／Design／Boundary：ViewerApp組裝input callback→CameraController，單一loop，手勢不依Three或導航；CameraController不依DOM；無新依賴或資產，無邊界外溢，未解阻擋無。非靜態鏡頭仍可因遮擋縮短距離，不宣稱任意路徑避障或所有構圖全身可見。
- STATUS: VERIFIED（本次追加行為及本機Release）；DECISION: GO；OWNERSHIP: LOCAL。Rollback只撤回本次差異，依既有release流程重建發佈，不reset checkout。
- token用量：無法取得精確值；本chat無官方每回合token計量基準，未將前階段累計或帳號額度當成本階段用量。
