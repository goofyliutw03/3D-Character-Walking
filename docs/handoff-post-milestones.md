# 里程碑6後續交接卡（尚未授權新範圍）

建議下一chat標題：`[1F-0] Plan remaining acceptance and camera review`。不自行建立chat、commit或啟動後續工作；先規劃，等核准。不是自動增加第7里程碑。

## Current goal / authorization
里程碑5已由使用者確認；6本機三骨架GLB、四動畫、真實loader／error／retry與文件已完成驗證，待結束確認。已授權下載免費來源，優先專用資產，不合適者可明示衍生角色／動畫，允許既有Blender5.2。不得自行安裝工具／外部付費服務、切換模型、委派或push；commit仍需另行核准。新範圍先提出七項規劃。

## Repo / Git
`D:/Work_Mine/AI-Projects/3D Character Walk Viewer`，一般共用checkout，非worktree。最後main / af73f11fe44c406ec784aeb9e496a710b2c6c939；下一chat先重查AGENTS／status／HEAD／git log -20。
里程碑3第一／第三人稱、4鏡頭、5表情與6資產均含未提交內容；.codex／.vscode等既有未追蹤內容保留，不reset／清理／git add -A。未stage／commit／push，commit若獲准需逐檔diff且只stage核准範圍。同一批ViewerApp／main／spec檔案不可平行改寫。

## Key decisions / locations
- Specs `.kiro/specs/rigged-character-assets/`：implementation-complete，approvals為依里程碑授權自動inline通過，非逐份人工核准。
- `src/character/CharacterAssets.ts`：services注入load/create/release與callbacks，select AssetDefinition，token latest-wins，過時data釋放、error／retry；不持有DOM或motion。
- `RiggedCharacter.ts`：真實GLB驗證、feet／height normalization、4 AnimationMixer actions、0.18s crossfade、舊action stop、unique資源釋放。
- ViewerApp單一loop，MotionSnapshot仍擁有world transform；camera更新後才project overlay，First person隱藏active及fallback；CameraController仍為camera權威。
- 本機`public/assets/characters/`三GLB，均<1MB；ATTRIBUTION與asset-manifest含CC0作者來源／修改／SHA。child比例與Jump為專案衍生，UI明示。
- `tools/assets/source/`保存兩個原始CC0 GLB；`tools/assets/prepare_characters.py`用已裝Blender5.2.2LTS離線重建，無add-on／新依賴。指令與操作見`docs/asset-pipeline.md`。Blender使用.local profile，不修改使用者設定。
- 官方Drive配額滿，從作者同名PolyPizza包下載個別CC0候選；其它女性包項目有CC-BY，不可宣稱全部CC0。舊2019Jump骨架不相容，未假稱retarget成功。
- SceneRenderer以info.autoReset=false／每幀reset統計capture+screen等pass，ViewerApp每秒回報；無第二loop。

## Verification evidence / limits
`.kiro/specs/rigged-character-assets/validation.md`：39/39全套tests PASS、build PASS（main654.02kB／gzip166.22；loader45.18kB按需chunk），19條覆蓋、inline review／GO，SHA readback PASS。
Production4174已驗三角色、代表性Idle／Walk／Run／Jump、First person／魚眼／泡泡、390×844、真實缺檔fallback及還原Retry。9次切換後geometry16／texture5同值。乾淨最終分頁warn/error空。故意失敗測試的dist child已還原；不要留下或重用假成功模式。
資產測試因不存在先RED；normalization flag OFF亦FAIL，loader OFF競態FAIL。browser啟動時序錯誤及Jump交叉手修正已重驗。Jump回歸測試檢查mid-pose wrists不跨torso。
未驗跨GPU／瀏覽器／實機觸控效能、實體IME／螢幕閱讀器、故意context-loss；本機75FPS顯示樣本不是benchmark承諾。500kB advisory仍在。

## Remaining work / proposed next scope
- 原`camera-modes` Front近距幾何遮擋觀察未定位／未修復；先唯讀重現與歸屬，不默默修改。
- 依roadmap保留SCENE-02～05與ACCEPT-01人工／環境驗收，需先決定裝置／瀏覽器／量測基準。
- 使用者若要commit，另核准並逐檔檢查；沒有push授權。
- WebGPU、path、NPC／NavMesh／車輛仍延後；不因6結束擴大。
- 建議下一階段COMPLEX（若重現camera遮擋）、高能力／高推理；未切換。集中新chat可隔離範圍，但由使用者選擇。

不得將金鑰、憑證或機密寫入任何spec、文件、程式或commit。先規劃，等核准。
