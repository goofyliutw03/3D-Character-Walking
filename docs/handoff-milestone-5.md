# 下一里程碑建議卡片（尚未啟動）

建議 chat 標題：`[1D-0] Implement character-expressions-ui milestone 5`。目前 chat 為 `[1C-0] Implement camera-modes milestone 4`；不要將它改名為下一里程碑或在未確認前開始5。

## 目標與授權
里程碑5：情緒／emoji、角色上方可編輯對話泡泡、可見控制、載入回饋呈現及無障礙。先規劃，等待使用者確認開始；已確認里程碑內自動審閱requirements／design／tasks、實作及驗證，結束再等待確認。commit另行核准、不push、不擅自切換模型或委派。

建議COMPLEX、高能力模型／高推理，原因是輸入編輯隔離、人物anchor、相機投影與DOM overlay跨模組；尚未切換。新chat適合隔離鏡頭與表情的審閱範圍，但由使用者決定，不自行建立。

## Checkout 與 Git
- 路徑：`D:/Work_Mine/AI-Projects/3D Character Walk Viewer`，一般共用checkout，非worktree。
- 收尾實查分支：`main`；HEAD：`af73f11fe44c406ec784aeb9e496a710b2c6c939`。先前曾為codex/add-cc-sdd，不假設分支維持；本次未執行切換或提交，下一次先重查status／HEAD／AGENTS.md。
- HEAD已含移動基礎；目前有里程碑3第一／第三人稱及里程碑4未提交修改。README、docs、steering、character-movement／camera-modes specs、角色eye anchors、engine／camera／UI及tests皆有本次／既有內容，保留，不重設。
- `.codex/`、`.vscode/` 仍為既有未追蹤項，不順便stage、清理或讀取機密。不使用git add -A；若獲准commit須逐檔重看diff且只stage核准部分。

## 關鍵契約與檔案
- 需求來源：`docs/development-plan.md`；進度與延後項：`.kiro/steering/roadmap.md`。
- `.kiro/specs/character-movement/`、`.kiro/specs/camera-modes/` 已實作完成；各validation.md保存證據，approvals是授權自動inline審閱，非逐份人工核准。
- `.kiro/specs/character-expressions-ui/spec.json` 仍initialized，approvals false；requirements.md只有輸入描述，未開始下一階段。
- `src/character/Character.ts` 管原型root／height／eyeHeight／eyeForward；`CharacterController` 的MotionSnapshot是運動權威。UI只呼叫ViewerApp，不直接改Three objects。
- `src/camera/CameraController.ts` 統一cameraView／Follow，外部構圖可暫停而不改模式；First person固定眼位且自身隱藏。`FollowCamera.constrain`提供既有遮擋保護。
- `src/engine/FisheyePass.ts` 是160°圓形等距魚眼，非180°。DOM泡泡不能只用普通PerspectiveCamera.project後的座標；須在設計階段處理魚眼映射與圓外／背面隱藏，不能在未投影的位置顯示漂浮文字。
- `src/main.ts`以CharacterStatus.cameraView同步卡片／Follow／footer。InputManager已忽略表單／contenteditable，編輯文字必須回歸測試，避免WASD／Space觸發移動。
- 真實GLB載入由里程碑6負責；5擁有回饋呈現，不提前做loader。程序化人物仍為prototype，不能稱骨架動畫驗收完成。

## 驗證證據與限制
全套 `node --experimental-transform-types --test --test-isolation=none tests/*.test.mjs`：25/25 PASS；`./scripts/project.ps1 build` PASS（TypeScript／Vite），589.39kB JS／149.11kB gzip，既有500kB advisory保留。

Production preview `http://127.0.0.1:4173/` 已實測Front、人物俯視、Low angle、魚眼、第一／第三人稱、靜態預設、Follow暫停／恢復、角色切換、跑跳、光影與390×844 resize。console error／warn為空；viewport override已reset。

未做跨GPU／跨瀏覽器、實體觸控效能或故意context-loss。低角度Freeze抬高問題與魚眼初版中心模糊已修正；GPU fallback尚未在無half-float裝置實測。魚眼有lazy RT1536–2048與額外fullscreen pass成本，不提供跨平台FPS承諾。實際OS失焦未驗收，input blur／hidden邏輯由EventTarget測試覆蓋。

## 剩餘事項與不在範圍
目前先等待里程碑4結束確認，再開始5。里程碑6免費授權rigged GLB／動畫、WebGPU、path／NPC／NavMesh／車輛等延後項不在5範圍。不安裝Blender、不啟動RAG、不使用付費／外部服務；不把金鑰、憑證或機密寫入spec、文件或commit。
