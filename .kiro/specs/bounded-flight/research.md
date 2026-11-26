# 1Y-15 Research and decisions

2026-11-10開始，2026-11-18接續。HEAD8284cd1，codex/v02-particle-system；開始乾淨，恢復時另有相機、地表導航、desktop/release文件修改，保留且不stage／commit／push。無委派、安裝、外部資產或模型切換。

- 讀取AGENTS、development-plan、roadmap、scene-runtime-collision-mask-spec、world-query-range-policy及ground-volume-world-query全部spec／validation、steering及kiro init/requirements/design/tasks/impl/review/validate-impl/verify-completion技能。採manual選號與inline審閱，覆寫第三方自動委派／commit，依使用者授權同批繼續。
- ground-volume現有連續直立膠囊對有限AABB可重用；flight query組合既有query，禁入為另列有限盒、裝飾雲不加入。未引入剛體引擎。
- ground控制器保留；FlightController選擇唯一分支提交位置，著陸明確、≤2m及45°／淨空。高空尺寸變更不得先透過ground的10m編輯上限，故flight持有自己的capsule、合法著陸才重建ground狀態。
- 原Viewer將所有delta截為.05，本批只對FlightController送原frame delta、固定1/60最多4步。背景／失焦／context清空速度與accumulator；超過3600秒視為非法時間，避免極大有限值除step溢位，正常低幀過量時間有累計。
- Profiles保持v1，增加flight枚舉與命名，舊資料不migration。只保存場景與設定，不新增位置／速度欄位。
- 2026-11-18 Context恢復實測出現1282。最小隔離CDP追蹤指出shadow render target、魚眼曾啟用後的離屏資源。恢復後才dispose仍產生錯誤，改在context-lost時釋放GPU targets與保留城市shadow，恢復後setRenderTarget(null)／resize／CPU合法性檢查。此為multi-scene-foundation恢復責任，修正與證據回記上游，而非飛行query繞過。

無手機／真GPU效能推定。測試使用既有Chrome headless／SwiftShader與Node，無新增套件。
