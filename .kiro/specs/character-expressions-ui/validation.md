# character-expressions-ui 驗證紀錄

## 授權與基線
2026-10-26 使用者「核准,請繼續」確認里程碑 4 結束及開始 5。依 AGENTS.md 自動 inline 審閱，非逐份人工核准、非獨立 reviewer。不委派、不切換模型、不 stage／commit／push。
基線 main / af73f11fe44c406ec784aeb9e496a710b2c6c939；既有里程碑 3／4 修改及未追蹤項保留。

## Requirements review gate
- PASS：5 區、20 個 numeric acceptance criteria；EARS、可觀察行為，範圍包含投影／輸入及下游載入呈現界線。
- 草稿審閱補上既有鎖定移動、組合輸入及不承諾建築遮擋，無必要外部輸入。
- 依使用者授權自動 inline 審閱通過。

## Design review gate
- PASS：20/20 條件映射、責任邊界／out-of-boundary／allowed dependencies／revalidation triggers 與具體 file plan 完整。
- 審閱發現 render 前相機 matrix inverse 可能為上一幀，設計補明 updateMatrixWorld；泡泡靠頂端採向下排與 clamp。
- 契約無 loader／movement／camera 權威漂移，無新依賴；依使用者授權自動 inline 通過。

## Task plan review gate
- PASS（inline，依AGENTS.md不委派）：6個子任務、20/20條件覆蓋。順序 state→projection→presentation→input→integration→validation，無隱藏設定或安裝前提。
- Task-graph sanity PASS（inline）：2.1只涵蓋DOM presentation，3.1明示跨邊界整合；共用檔案依序，無平行標記。依使用者授權自動審閱通過。

## Task 1.1
- RED_PHASE_OUTPUT：暫時 EXPRESSIONS_ENABLED=false，2 tests皆失敗（none != happy、0 !=160），exit1。移除flag後全套27/27 PASS，exit0。
- Review Verdict: APPROVED（inline）；直接讀新檔，snapshot隔離、未知值保護與Unicode上限符合design。無placeholder／secret／boundary spillover。git diff --check PASS。
- Verification Result: VERIFIED（TASK）；此時不宣稱UI完成。

## Task 1.2
- RED_PHASE_OUTPUT：PROJECTION_ENABLED=false，兩項投影測試皆失敗（null != center），exit1。移除flag後全套29/29 PASS，typecheck PASS，exit0。
- Review Verdict: APPROVED（inline）；直接讀新檔，角度映射與shader inverse、CSS最短邊半徑一致，camera matrix同幀更新且無相機權威改動。無placeholder／secret。
- Verification Result: VERIFIED（TASK）；真實GPU與DOM仍待整合驗收。

## Task 2.1
- RED_PHASE_OUTPUT：presentation／feedback flags OFF，兩項測試失敗（hidden true !=false、文字空白），exit1；移除flag後31/31 PASS、typecheck PASS（exit0）。placeholder／secret掃描無符合（rg exit1為無匹配）。
- Review Verdict: APPROVED（inline）；直接讀新檔，DOM純文字／空白／null隱藏、clamp、dispose與LoadingState union符合設計，無loader或假進度。
- Verification Result: VERIFIED（TASK）；真實DOM尺寸留browser驗收。
- Design refinement：Overlay setContent增加icon參數，由ViewerApp按同一emotion對照表傳入，避免DOM presentation依賴runtime state module；無行為變更。

## Task 2.2
- RED_PHASE_OUTPUT：新增focusin測試先失敗，仍有x1/z-1/run/jump，exit1；加入focusin／isComposing後全套32/32 PASS、typecheck PASS。
- Review發現button focus不應清除Run，selector排除button並補回歸；affected4/4 PASS、typecheck PASS，exit0。
- Review Verdict: APPROVED（inline）；actual diff已讀，無placeholder／secret，AbortController清理不變。
- Verification Result: VERIFIED（TASK）。

## Task 3.1
- RED_PHASE_OUTPUT：production建置暫停EXPRESSION_UI_ENABLED，browser選Happy／輸入Hello後仍0/160、空白及hidden=true；移除flag後29/160、多行文字與emoji可見。
- Review修正：文字blur補commit，IME事件處理抽為SpeechEditor以實際composition事件測試驗證；composition draft不截字／不播報，結束才160上限，AbortSignal清理。
- Design refinement：src/ui/SpeechEditor.ts為main原本事件組裝的具體模組，仍屬同一integration邊界；增加對應tests/speech-editor.test.mjs，未擴大功能。Overlay的icon參數由ViewerApp傳入。
- Review Verdict: APPROVED（inline）；actual diff及新檔直接讀取，main只用public API，ViewerApp在camera更新後定位，無新loop／renderer／shader改動。placeholder／secret掃描CLEAN。
- Tests：33/33 PASS，exit0。Production build PASS，exit0；595.77kB JS／150.97kB gzip，既有500kB advisory保留。
- Runtime：4174 production預覽到達WebGL2 ready，表情、多行、純文字HTML children=0、29/160、第一人稱hidden=true與切回可見、child保留😮與文字均實查。選方向鎖定後為Walk，切入textarea輸入w／Space後Idle且文字保留。
- Verification Result: VERIFIED（TASK）。

## Task 3.2 / 最終production驗收
- 全套測試33/33 PASS、exit0；./scripts/project.ps1 build PASS、exit0（595.77kB JS／150.97kB gzip）。git diff --check PASS；新邊界placeholder／secret掃描CLEAN。
- Production http://127.0.0.1:4174/：WebGL2 ready、實際shader顯示，console warn/error=[]。非dev-only驗收。
- 普通Front、Character overhead、Low angle及160°Fisheye均有非空overlay；First person立即hidden=true，切Third person恢復；child保留情緒與文字，Man可切回。
- UI：Happy／Surprised及None、清除保留情緒／無內容整體hidden、HTML literal且children=0、多行、161emoji截到160 code points、字數同步、鍵盤Enter／Tab焦點outline solid均實查。
- 方向鍵盤鎖定後Walk，進入textarea按w及Space變Idle而文字新增；Run／Jump可觸發，Follow暫停保留Fisheye view；光影可切黃昏及關閉，再恢復日光與陰影。
- 390×844：scrollWidth375≤innerWidth390；scene375×506.39，160emoji泡泡240×354.09，四邊均在scene內。測後viewport override已reset，預設innerWidth810。無水平溢出。
- Browser automation曾因mobile隱藏small導致locator名稱改變，重新讀DOM後使用當前名稱完成。一次native click因側欄捲動選到鄰近鏡頭，改用keyboard Enter並以camera-status核實；非產品缺陷。文字blur播報已補與重驗。

## Requirements coverage
| ID | 實作與驗證證據 |
|---|---|
| 1.1 | ExpressionManager情緒表、原生Mood select、browser圖示／狀態 |
| 1.2 | 單一會話state不在setCharacter重置；child／man實查 |
| 1.3 | Manager預設測試、reload預設None／0/160、無storage |
| 2.1 | 160 code-point單元與161emoji browser截短 |
| 2.2 | whitespace單元、Clear speech及None browser hidden |
| 2.3 | textContent、children=0、換行／長字串與手機layout |
| 2.4 | focusin／IME／latch單元、browser Walk→editor Idle／w及Space |
| 3.1 | 同幀motion+height anchor→camera→project；child、Jump與切鏡頭browser |
| 3.2 | shader inverse數學roundtrip、portrait／landscape、真實魚眼browser |
| 3.3 | 背面／near／far／NDC／圓外單元；null overlay測試 |
| 3.4 | First person browser hidden與Third person恢復 |
| 3.5 | pointer-events:none、overlay無tabstop與場景canvas事件保留；不含建築遮擋 |
| 4.1 | LoadingState契約busy=true、初始main loading與viewport busy |
| 4.2 | prototype ready browser文字、busy=false；未聲稱GLB ready |
| 4.3 | error presentation契約literal／alert／復原文；main初始化catch接線審閱 |
| 5.1 | native label／select／textarea／button、Enter／Tab與focus outline實查 |
| 5.2 | SpeechEditor composition／quiet input／commit／abort測試、browser完整文字狀態；不逐幀live region |
| 5.3 | 390×844實際bubble四邊within、無水平溢出 |
| 5.4 | 新overlay無transition／animation；上游reduced-motion測試持續通過 |
| 5.5 | 上游25項仍通過，browser角色／Run／Jump／Follow／光影回歸、AbortSignal及dispose測試 |

## Review Verdict
- VERDICT: APPROVED
- TASK: 3.2
- MECHANICAL_RESULTS: Tests33/33 PASS、Build PASS、Diff check PASS、placeholder／secret CLEAN、Boundary WITHIN、RED phase VERIFIED（3.1 production flag證據）。
- FINDINGS: 無未解阻擋缺陷。審閱為主agent inline，非獨立reviewer。
- REMEDIATION: 無。
- SUMMARY: 20/20條件已對應實作、契約測試及必要production browser證據。

## Validation Report
- DECISION: GO
- MECHANICAL_RESULTS: Full suite33/33 PASS、build PASS、production smoke boot PASS、console warn/error空；既有chunk advisory保留。
- INTEGRATION: main→ViewerApp→ExpressionManager／Overlay契約一致，camera更新後映射，純投影不改camera權威；SpeechEditor處理IME時序，InputManager處理輸入意圖清除；LoadingFeedback不擁有loader。
- COVERAGE: 5/5區、20/20條件有實作及驗證，design／tasks mechanical mapping無遺漏。
- DESIGN: file plan與依賴方向一致，SpeechEditor拆分與icon參數已同步design；無新依賴、shader／physics／GLB範圍漂移。
- OWNERSHIP: LOCAL
- UPSTREAM_SPEC: N/A
- BLOCKED_TASKS: 無。

## Verification Result
- STATUS: VERIFIED
- CLAIM_TYPE: FEATURE_GO
- CLAIM: 里程碑5情緒圖示、對話泡泡、控制、載入回饋呈現與無障礙改善可供使用者結束確認。
- EVIDENCE: fresh全套測試、production build／runtime、上方需求映射、integration／design／boundary inline審閱。
- GAPS: 真實GLB loading/error與動畫須里程碑6驗收；此處loading/error為契約測試加接線審閱，不冒稱真實資產流程。IME為composition事件測試，未用實體中文IME；ARIA／鍵盤已檢查，未用實體螢幕閱讀器。未驗跨瀏覽器／GPU、實機觸控效能、故意context-loss、建築遮擋；無FPS承諾。既有500kB advisory未拆包。
- NOTES: 無stage／commit／push；HEAD及既有未提交內容保留。等待里程碑5結束確認，不自動開始6。

## 收尾觀察／相鄰功能限制
- 在Follow暫停的魚眼下以Run向右移動、切換child／man等操作後切Front，曾出現整個場景被藍色幾何遮住，overlay hidden=true；重新載入回起點後Front與泡泡恢復正常（hidden=false）。未取得精確位置或完整最小重現，不宣稱根因已確定。
- Ownership候選：camera-modes／FollowCamera.constrain。程式審閱顯示其遮擋約束允許target距離低至0.4，可能使近距離幾何遮擋；這是推論，尚待獨立重現。本里程碑未改相機構圖／遮擋策略，也未把此觀察當作已修復。
- 此觀察不阻擋表達模組依實際camera裁切正確隱藏的驗收；但限制整體鏡頭品質宣稱，交由使用者決定是否另行調查。上方「無阻擋缺陷」限里程碑5範圍，不代表上游所有位置皆驗收完成。
- 最後preview已reload，恢復起點man、日光、陰影、Happy、中英文多行及Front，泡泡可見；viewport override已reset。未stage／commit／push，staged diff為空。

## 2026-10-31 IME 追加驗收（1Q-2）
既有 SpeechEditor／InputManager／ExpressionManager 測試8/8 PASS，屬合成事件與狀態契約證據。main focus／Clear 與 inspector isComposing Enter 接線已 inline 審閱，未修改產品。Windows Computer Use 因無法可靠辨識 Chrome URL 停止，未取得真實中文組字證據；不以 paste／fill／合成事件冒稱真實 IME。結論 MANUAL_VERIFY_REQUIRED／ToDo；六項原生組字待驗步驟及工具限制見 [remaining-acceptance](../../../docs/remaining-acceptance.md#ime-驗收進度1q-22026-10-31)。本次不關閉其他人工驗收、不 commit／push。Token 用量：無法取得精確值，缺少官方起點。

2026-10-31 1Q-2人工回報追加：使用者於中文組字、Enter／Space選字、Escape取消、Clear及角色不誤移動／跳躍的操作請求後回覆「OK No problem, please go on」，此組基本操作依使用者回報PASS，非工具實測。組字草稿／blur特定時序、160字邊界、inspector及未單獨確認細節仍ToDo／MANUAL_VERIFY_REQUIRED；詳見docs/remaining-acceptance.md的1Q-2使用者人工驗收追加。無runtime變更、commit或push。

2026-10-31 1Q-2最終裁定：使用者對組字中blur後返回、160字上限組字、inspector候選Enter隔離三組明確操作回覆「三項皆正常」。結合基本IME操作先前回報，本階段記Done／USER_REPORTED_PASS，取代歷史IME待驗狀態；為使用者人工驗收，非工具直接實測或所有輸入法／平台相容承諾。詳細範圍與限制見docs/remaining-acceptance.md的1Q-2最終裁定。其他跨GPU／效能／讀屏待辦不變。無runtime修改、commit／push。
