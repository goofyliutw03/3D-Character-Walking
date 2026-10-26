# 下一里程碑建議卡片（尚未啟動）

建議標題：`[1E-0] Plan rigged-character-assets milestone 6`。本chat為`[1D-0] Implement character-expressions-ui milestone 5`，不自行建立新chat或開始6。

## 目標與授權
先讀AGENTS.md、docs/development-plan.md、.kiro/steering/roadmap.md與specs／validation，規劃免費授權rigged GLB、loader與錯誤事件、clip映射／動畫轉場、效能及本機操作文件。先規劃，等核准；目前里程碑5待結束確認，6尚未核准開始。
已確認里程碑內自動依序完成requirements→design→tasks→實作→審閱→驗證，不逐項等確認；結束才提示確認。commit另行核准，不push，不自行切換模型或委派。建議COMPLEX、高能力模型／高推理，未切換。

## Checkout／Git
- Repo：D:/Work_Mine/AI-Projects/3D Character Walk Viewer，共用checkout，非worktree。
- 最後實查main，HEAD af73f11fe44c406ec784aeb9e496a710b2c6c939；下一chat須重查。
- 里程碑3第一／第三人稱、4鏡頭及5表情皆有未提交內容。完整git status為準，保留所有修改及.codex／.vscode等既有未追蹤項，不reset／清理／順便stage。
- 未stage／commit／push。若後續獲准commit，先重查HEAD、逐檔diff，僅stage核准範圍，不git add -A。

## 決策與契約
- character-expressions-ui/spec.json implementation-complete；approvals為依使用者授權自動inline審閱，非逐份人工核准。
- ExpressionManager持有頁面會話情緒與160 Unicode code-point純文字，角色切換保留，reload重置。ExpressionOverlay只管DOM，以textContent，不攔截pointer。
- ViewerApp仍組裝單一loop與相機，camera更新後使用AnchorProjection。普通projection與160°等距魚眼不同；依現有shader inverse angle映射，near／far／背面／圓外隱藏。First person隱藏自身overlay。
- InputManager在編輯focusin清舊keys／latch／run／jump，button focus不清Run；SpeechEditor在IME compositionend才正規化及播報，input不逐字live announce，change／blur commit。
- src/ui/LoadingFeedback.ts：LoadingState discriminated union phase loading／ready／error，後者含recovery；presentLoading以文字／busy／status或alert呈現。5只擁有呈現，6擁有真實loader。現況明示prototype ready，未假造真實資產載入或百分比。
- GLB整合需維持height／eye anchors／motion與camera契約，重新驗證expression anchor、role切換及First person。

## 驗證與限制
- 全套node --experimental-transform-types --test --test-isolation=none tests/*.test.mjs：33/33 PASS，exit0。
- ./scripts/project.ps1 build PASS（TypeScript＋Vite），JS595.77kB／gzip150.97kB；既有500kB advisory保留。
- 4174 production preview到達WebGL2 ready，console warn/error空。普通／魚眼／First person、child保留內容、純文字／多行／160emoji上限／清除、編輯停止移動、Run／Jump／Follow／光影與390×844已驗。
- 證據：.kiro/specs/character-expressions-ui/validation.md，含20項需求映射、RED／GREEN、inline審閱及最後狀態。
- loading/error為契約與接線驗證，6需真實GLB驗收。未驗實體中文IME／螢幕閱讀器、跨GPU／瀏覽器、實機觸控效能或故意context-loss。無建築遮擋overlay或FPS承諾。
- 收尾觀察：人物移動後Front曾被藍色幾何遮住、overlay裁切隱藏，reload回起點恢復。可能為既有camera-modes／FollowCamera近距遮擋策略，未定位根因／未修復；詳validation收尾段。須使用者決定是否另行調查，不默默擴張6或繞過相機。

## 外部輸入與不在範圍
資產來源／授權／attribution、clip與root motion方案尚待6規劃釐清；引入前記錄免費授權，不自行下載未知資產、安裝Blender、啟動RAG或使用外部／付費服務。WebGPU、路徑／NPC／NavMesh／車輛仍延後。
不得將金鑰、憑證或機密寫入spec、文件、程式或commit。不同chat不可平行寫同批共用檔案。
